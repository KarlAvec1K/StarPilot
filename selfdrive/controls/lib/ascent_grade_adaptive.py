from dataclasses import dataclass
import hashlib
import json
import math
from datetime import UTC, datetime


GRAVITY_MPS2 = 9.81
MAX_ABS_PITCH_RAD = 0.27
MAX_BODY_ACCEL_MPS2 = 1.0
PITCH_FILTER_TAU_S = 2.0
PITCH_STABLE_TOLERANCE_RAD = 0.02
PITCH_STABLE_TIME_S = 1.5
MAX_UPDATE_DT_S = 0.2
CATCHUP_MIN_SPEED_ERROR_MPS = 1.0
CLOSE_LEAD_GAP_MARGIN_M = 4.0
CLOSE_LEAD_MIN_CLOSING_SPEED_MPS = 0.5
CLOSE_LEAD_MAX_TTC_S = 6.0
LEARNING_PARAMS_KEY = "AscentGradeLearning"
LEARNING_ENABLED_PARAMS_KEY = "AscentGradeLearningEnabled"
LEARNING_SCHEMA = 1
LEARNING_MAX_RESIDUAL_MPS2 = 0.25
LEARNING_STEP_MPS2 = 0.01
LEARNING_MIN_DEFICIT_MPS = 0.5
LEARNING_DEFICIT_HOLD_S = 10.0
LEARNING_DECAY_INTERVAL_S = 24 * 60 * 60
LEARNING_MAX_DECAY_STEPS = 365
LEARNING_MAX_CELLS = 64


def _wall_clock_s() -> float:
  return datetime.now(UTC).timestamp()


@dataclass(frozen=True)
class GradeEstimate:
  pitch_rad: float
  grade_accel_mps2: float
  valid: bool
  reason: str


@dataclass(frozen=True)
class LearnResult:
  eligible: bool
  reason: str
  learned_residual_mps2: float
  sample_count: int


def _learning_identity(vehicle_fingerprint: str, device_id: str) -> str:
  raw_identity = f"{device_id.strip()}|{vehicle_fingerprint.strip()}"
  return hashlib.sha256(raw_identity.encode("utf-8")).hexdigest()


def _cell_key(speed_mps: float, grade_accel_mps2: float) -> str:
  speed_band = int(float(speed_mps) // 5.0)
  grade_band = int(float(grade_accel_mps2) // 0.5)
  return f"{speed_band}:{grade_band}"


class GradeLearner:
  """Bounded per-device shadow learner; it never applies acceleration itself."""

  def __init__(self, params, vehicle_fingerprint: str, device_id: str, now_s: float | None = None):
    self.params = params
    vehicle_fingerprint = str(vehicle_fingerprint or "").strip()
    device_id = str(device_id or "").strip()
    self.identity = _learning_identity(vehicle_fingerprint, device_id) if vehicle_fingerprint and device_id else ""
    self.application_enabled = bool(params.get_bool(LEARNING_ENABLED_PARAMS_KEY, default=False))
    self.streak_by_cell: dict[str, float] = {}
    self.data = {"schema": LEARNING_SCHEMA, "identity": self.identity, "cells": {}}
    self.load_reason = "empty"
    self._load(now_s=_wall_clock_s() if now_s is None else float(now_s))

  def _load(self, now_s: float):
    if not self.identity:
      self.load_reason = "missing_identity"
      return
    try:
      encoded = self.params.get(LEARNING_PARAMS_KEY, encoding="utf-8") or "{}"
      loaded = json.loads(encoded)
      if not isinstance(loaded, dict) or loaded.get("schema") != LEARNING_SCHEMA:
        self.load_reason = "invalid_schema"
        return
      if loaded.get("identity") != self.identity:
        self.load_reason = "identity_mismatch"
        return
      cells = loaded.get("cells")
      if not isinstance(cells, dict) or len(cells) > LEARNING_MAX_CELLS:
        self.load_reason = "invalid_cells"
        return

      validated_cells = {}
      for key, cell in cells.items():
        if not isinstance(key, str) or not isinstance(cell, dict):
          continue
        residual = float(cell.get("residual_mps2", 0.0))
        samples = int(cell.get("samples", 0))
        last_evidence_s = float(cell.get("last_evidence_s", now_s))
        if not all(map(math.isfinite, (residual, last_evidence_s))) or samples < 0:
          continue
        residual = min(max(residual, 0.0), LEARNING_MAX_RESIDUAL_MPS2)
        if 0.0 <= now_s - last_evidence_s < 10 * 365 * 24 * 60 * 60:
          decay_steps = min(int((now_s - last_evidence_s) // LEARNING_DECAY_INTERVAL_S), LEARNING_MAX_DECAY_STEPS)
          residual = max(0.0, residual - decay_steps * LEARNING_STEP_MPS2)
        validated_cells[key] = {
          "residual_mps2": residual,
          "samples": samples,
          "last_evidence_s": last_evidence_s,
        }

      self.data = {"schema": LEARNING_SCHEMA, "identity": self.identity, "cells": validated_cells}
      self.load_reason = "loaded"
      if self.data != loaded:
        self._save()
    except (TypeError, ValueError, UnicodeDecodeError, json.JSONDecodeError):
      self.load_reason = "malformed"

  def _save(self):
    if not self.identity:
      return
    try:
      payload = json.dumps(self.data, separators=(",", ":"), sort_keys=True, allow_nan=False)
      self.params.put_nonblocking(LEARNING_PARAMS_KEY, payload)
    except (TypeError, ValueError, AttributeError):
      pass

  def _get_cell(self, speed_mps: float, grade_accel_mps2: float):
    key = _cell_key(speed_mps, grade_accel_mps2)
    return key, self.data["cells"].get(key)

  def get_residual(self, speed_mps: float, grade_accel_mps2: float) -> float:
    try:
      if not all(map(math.isfinite, (float(speed_mps), float(grade_accel_mps2)))):
        return 0.0
      if speed_mps < 0.0 or grade_accel_mps2 <= 0.0:
        return 0.0
      _, cell = self._get_cell(speed_mps, grade_accel_mps2)
      return float(cell["residual_mps2"]) if cell else 0.0
    except (TypeError, ValueError, KeyError):
      return 0.0

  def observe(self, speed_mps: float, grade_accel_mps2: float, speed_error_mps: float,
              eligible: bool, reason: str, dt: float, now_s: float | None = None) -> LearnResult:
    try:
      now_s = _wall_clock_s() if now_s is None else float(now_s)
      speed_mps, grade_accel_mps2, speed_error_mps, dt = map(
        float, (speed_mps, grade_accel_mps2, speed_error_mps, dt),
      )
    except (TypeError, ValueError):
      return LearnResult(False, "invalid_sample", 0.0, 0)
    values = (speed_mps, grade_accel_mps2, speed_error_mps, dt, now_s)
    if not all(map(math.isfinite, values)):
      eligible, reason = False, "invalid_sample"
    if not self.identity:
      return LearnResult(False, "missing_identity", 0.0, 0)

    if not eligible:
      key = _cell_key(max(speed_mps, 0.0), max(grade_accel_mps2, 0.0))
      self.streak_by_cell[key] = 0.0
      return LearnResult(False, reason, self.get_residual(speed_mps, grade_accel_mps2),
                         int(self.data["cells"].get(key, {}).get("samples", 0)))
    if speed_mps < 0.0 or grade_accel_mps2 <= 0.0 or speed_error_mps < LEARNING_MIN_DEFICIT_MPS:
      key = _cell_key(max(speed_mps, 0.0), max(grade_accel_mps2, 0.0))
      self.streak_by_cell[key] = 0.0
      return LearnResult(False, "no_persistent_deficit", self.get_residual(speed_mps, grade_accel_mps2),
                         int(self.data["cells"].get(key, {}).get("samples", 0)))
    if dt <= 0.0 or dt > MAX_UPDATE_DT_S or speed_mps > 50.0 or not self.identity:
      return LearnResult(False, "invalid_sample", self.get_residual(speed_mps, grade_accel_mps2), 0)

    key, cell = self._get_cell(speed_mps, grade_accel_mps2)
    if cell is None:
      if len(self.data["cells"]) >= LEARNING_MAX_CELLS:
        return LearnResult(False, "map_full", 0.0, 0)
      cell = {"residual_mps2": 0.0, "samples": 0, "last_evidence_s": now_s}
      self.data["cells"][key] = cell

    self.streak_by_cell[key] = self.streak_by_cell.get(key, 0.0) + dt
    cell["samples"] += 1
    cell["last_evidence_s"] = now_s
    updated = self.streak_by_cell[key] >= LEARNING_DEFICIT_HOLD_S
    if updated:
      cell["residual_mps2"] = min(
        LEARNING_MAX_RESIDUAL_MPS2,
        float(cell["residual_mps2"]) + LEARNING_STEP_MPS2,
      )
      self.streak_by_cell[key] = 0.0
      self._save()

    return LearnResult(True, "learned_step" if updated else "collecting", float(cell["residual_mps2"]),
                       int(cell["samples"]))


def invalid_grade(reason: str, pitch_rad: float = 0.0) -> GradeEstimate:
  return GradeEstimate(pitch_rad=pitch_rad, grade_accel_mps2=0.0, valid=False, reason=reason)


class GradeEstimator:
  def __init__(self, time_constant_s: float = PITCH_FILTER_TAU_S):
    self.time_constant_s = float(time_constant_s)
    self.filtered_pitch_rad = None
    self.stable_time_s = 0.0

  def reset(self):
    self.filtered_pitch_rad = None
    self.stable_time_s = 0.0

  def update(self, pitch_rad: float, longitudinal_accel_mps2: float, dt: float) -> GradeEstimate:
    try:
      pitch_rad = float(pitch_rad)
      longitudinal_accel_mps2 = float(longitudinal_accel_mps2)
      dt = float(dt)
    except (TypeError, ValueError):
      self.reset()
      return invalid_grade("invalid_input")

    if not all(map(math.isfinite, (pitch_rad, longitudinal_accel_mps2, dt))):
      self.reset()
      return invalid_grade("invalid_input")
    if dt <= 0.0 or dt > MAX_UPDATE_DT_S:
      self.stable_time_s = 0.0
      return invalid_grade("invalid_dt", self.filtered_pitch_rad or 0.0)
    if abs(pitch_rad) > MAX_ABS_PITCH_RAD:
      self.reset()
      return invalid_grade("implausible_pitch")
    if abs(longitudinal_accel_mps2) > MAX_BODY_ACCEL_MPS2:
      self.stable_time_s = 0.0
      return invalid_grade("body_motion", self.filtered_pitch_rad or 0.0)

    if self.filtered_pitch_rad is None:
      self.filtered_pitch_rad = pitch_rad
      self.stable_time_s = 0.0
    else:
      alpha = 1.0 - math.exp(-dt / max(self.time_constant_s, 1e-3))
      self.filtered_pitch_rad += alpha * (pitch_rad - self.filtered_pitch_rad)
      if abs(pitch_rad - self.filtered_pitch_rad) <= PITCH_STABLE_TOLERANCE_RAD:
        self.stable_time_s += dt
      else:
        self.stable_time_s = 0.0

    if self.stable_time_s < PITCH_STABLE_TIME_S:
      return invalid_grade("settling", self.filtered_pitch_rad)

    grade_accel_mps2 = GRAVITY_MPS2 * math.sin(self.filtered_pitch_rad)
    return GradeEstimate(
      pitch_rad=self.filtered_pitch_rad,
      grade_accel_mps2=grade_accel_mps2,
      valid=True,
      reason="valid",
    )


def is_close_lead(lead, v_ego: float, desired_gap: float) -> bool:
  if lead is None or not bool(getattr(lead, "status", False)):
    return False

  try:
    d_rel = float(lead.dRel)
    v_ego = float(v_ego)
    v_lead = float(lead.vLead)
    desired_gap = float(desired_gap)
  except (AttributeError, TypeError, ValueError):
    return True

  if not all(map(math.isfinite, (d_rel, v_ego, v_lead, desired_gap))):
    return True
  if d_rel <= desired_gap + CLOSE_LEAD_GAP_MARGIN_M:
    return True

  closing_speed = v_ego - v_lead
  if closing_speed <= CLOSE_LEAD_MIN_CLOSING_SPEED_MPS:
    return False

  return d_rel / closing_speed < CLOSE_LEAD_MAX_TTC_S


def is_sample_eligible(*, is_ascent: bool, longitudinal_active: bool, grade_valid: bool,
                        close_lead: bool, stop_active: bool, brake_pressed: bool,
                        gas_pressed: bool, turn_limited: bool, force_decel: bool,
                        positive_accel_request: bool,
                        cruise_error_mps: float) -> tuple[bool, str]:
  vetoes = (
    (not is_ascent, "not_ascent"),
    (not longitudinal_active, "longitudinal_inactive"),
    (not grade_valid, "grade_invalid"),
    (close_lead, "close_lead"),
    (stop_active, "stop"),
    (brake_pressed, "brake"),
    (gas_pressed, "driver_override"),
    (turn_limited, "turn_limited"),
    (force_decel, "force_decel"),
    (not positive_accel_request, "no_positive_accel"),
    (not math.isfinite(float(cruise_error_mps)) or cruise_error_mps < CATCHUP_MIN_SPEED_ERROR_MPS,
     "no_catchup_demand"),
  )
  for vetoed, reason in vetoes:
    if vetoed:
      return False, reason
  return True, "eligible"
