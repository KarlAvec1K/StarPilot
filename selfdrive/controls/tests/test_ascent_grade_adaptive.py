import json
from types import SimpleNamespace

import pytest

from openpilot.selfdrive.controls.lib.ascent_grade_adaptive import (
  GradeLearner,
  GradeEstimator,
  is_close_lead,
  is_sample_eligible,
)


def steady_estimate(pitch):
  estimator = GradeEstimator()
  estimate = None
  for _ in range(40):
    estimate = estimator.update(pitch, 0.0, 0.05)
  return estimate


def test_grade_estimator_reports_no_uphill_load_on_flat_road():
  estimate = steady_estimate(0.0)

  assert estimate.valid
  assert estimate.grade_accel_mps2 == pytest.approx(0.0, abs=1e-6)


def test_grade_estimator_estimates_uphill_gravity_component():
  estimate = steady_estimate(0.10)

  assert estimate.valid
  assert estimate.grade_accel_mps2 == pytest.approx(9.81 * 0.10, abs=0.01)


def test_grade_estimator_reports_downhill_as_negative_grade_acceleration():
  estimate = steady_estimate(-0.10)

  assert estimate.valid
  assert estimate.grade_accel_mps2 < 0.0


@pytest.mark.parametrize("pitch", [float("nan"), float("inf"), 0.28])
def test_grade_estimator_rejects_nonfinite_or_implausible_pitch(pitch):
  estimate = GradeEstimator().update(pitch, 0.0, 0.05)

  assert not estimate.valid
  assert estimate.grade_accel_mps2 == 0.0


def test_grade_estimator_rejects_pitch_during_large_body_motion():
  estimate = GradeEstimator().update(0.10, 1.1, 0.05)

  assert not estimate.valid
  assert estimate.reason == "body_motion"
  assert estimate.grade_accel_mps2 == 0.0


def test_grade_estimator_filters_pitch_step_before_marking_it_stable():
  estimator = GradeEstimator(time_constant_s=2.0)

  estimate = estimator.update(0.10, 0.0, 0.05)

  assert not estimate.valid
  assert estimate.grade_accel_mps2 == 0.0


def test_close_lead_is_blocked_inside_desired_gap_guard():
  lead = SimpleNamespace(status=True, dRel=24.0, vLead=25.0)

  assert is_close_lead(lead, v_ego=25.0, desired_gap=20.0)


def test_close_lead_is_blocked_for_short_closing_ttc():
  lead = SimpleNamespace(status=True, dRel=40.0, vLead=15.0)

  assert is_close_lead(lead, v_ego=25.0, desired_gap=20.0)


def test_distant_nonclosing_lead_does_not_block_grade_candidate():
  lead = SimpleNamespace(status=True, dRel=50.0, vLead=25.0)

  assert not is_close_lead(lead, v_ego=25.0, desired_gap=20.0)


def test_missing_lead_does_not_block_grade_candidate():
  assert not is_close_lead(SimpleNamespace(status=False), v_ego=25.0, desired_gap=20.0)


@pytest.mark.parametrize(
  ("overrides", "reason"),
  [
    ({"is_ascent": False}, "not_ascent"),
    ({"longitudinal_active": False}, "longitudinal_inactive"),
    ({"grade_valid": False}, "grade_invalid"),
    ({"close_lead": True}, "close_lead"),
    ({"stop_active": True}, "stop"),
    ({"brake_pressed": True}, "brake"),
    ({"gas_pressed": True}, "driver_override"),
    ({"turn_limited": True}, "turn_limited"),
    ({"force_decel": True}, "force_decel"),
    ({"positive_accel_request": False}, "no_positive_accel"),
    ({"cruise_error_mps": 0.9}, "no_catchup_demand"),
  ],
)
def test_sample_eligibility_rejects_each_safety_veto(overrides, reason):
  inputs = dict(
    is_ascent=True,
    longitudinal_active=True,
    grade_valid=True,
    close_lead=False,
    stop_active=False,
    brake_pressed=False,
    gas_pressed=False,
    turn_limited=False,
    force_decel=False,
    positive_accel_request=True,
    cruise_error_mps=2.0,
  )
  inputs.update(overrides)

  eligible, rejection_reason = is_sample_eligible(**inputs)

  assert not eligible
  assert rejection_reason == reason


def test_sample_eligibility_accepts_a_clean_ascent_uphill_sample():
  eligible, reason = is_sample_eligible(
    is_ascent=True,
    longitudinal_active=True,
    grade_valid=True,
    close_lead=False,
    stop_active=False,
    brake_pressed=False,
    gas_pressed=False,
    turn_limited=False,
    force_decel=False,
    positive_accel_request=True,
    cruise_error_mps=2.0,
  )

  assert eligible
  assert reason == "eligible"


class MemoryParams:
  def __init__(self, values=None):
    self.values = values or {}

  def get(self, key, encoding=None, default=None):
    value = self.values.get(key, default)
    if encoding is not None and isinstance(value, bytes):
      return value.decode(encoding)
    return value

  def put(self, key, value):
    self.values[key] = value

  def put_nonblocking(self, key, value):
    self.values[key] = value

  def get_bool(self, key, default=False):
    return bool(self.values.get(key, default))


def observe_clean_deficit(learner, seconds, now_s=1000.0):
  result = None
  for frame in range(int(seconds / 0.05)):
    result = learner.observe(
      speed_mps=25.0,
      grade_accel_mps2=1.0,
      speed_error_mps=2.0,
      eligible=True,
      reason="eligible",
      dt=0.05,
      now_s=now_s + frame * 0.05,
    )
  return result


def test_learner_updates_shadow_residual_only_after_repeated_clean_deficit():
  params = MemoryParams()
  learner = GradeLearner(params, "SUBARU_ASCENT", "comma-1")

  result = observe_clean_deficit(learner, 10.0)

  assert result.eligible
  assert result.learned_residual_mps2 > 0.0
  assert result.learned_residual_mps2 <= 0.01
  assert "AscentGradeLearning" in params.values


def test_learner_caps_residual_and_does_not_update_above_ceiling():
  params = MemoryParams()
  learner = GradeLearner(params, "SUBARU_ASCENT", "comma-1")
  observe_clean_deficit(learner, 10.0)

  result = observe_clean_deficit(learner, 300.0, now_s=1100.0)

  assert result.learned_residual_mps2 <= 0.25


def test_learner_rejected_sample_breaks_deficit_streak():
  params = MemoryParams()
  learner = GradeLearner(params, "SUBARU_ASCENT", "comma-1")
  observe_clean_deficit(learner, 5.0)

  result = learner.observe(25.0, 1.0, 2.0, False, "close_lead", 0.05, 1006.0)
  result = observe_clean_deficit(learner, 5.0, now_s=1007.0)

  assert result.learned_residual_mps2 == 0.0


def test_learner_slowly_decays_old_residual_when_evidence_is_absent():
  params = MemoryParams({"AscentGradeLearning": b'{"schema":1,"identity":"PLACEHOLDER","cells":{}}'})
  seed = GradeLearner(params, "SUBARU_ASCENT", "comma-1")
  identity = seed.identity
  params.values["AscentGradeLearning"] = json.dumps({
    "schema": 1,
    "identity": identity,
    "cells": {"5:2": {"residual_mps2": 0.05, "samples": 20, "last_evidence_s": 1000.0}},
  })

  learner = GradeLearner(params, "SUBARU_ASCENT", "comma-1", now_s=1000.0 + 48 * 3600)

  assert learner.get_residual(25.0, 1.0) == pytest.approx(0.03)


def test_learner_ignores_malformed_or_wrong_identity_state():
  malformed = MemoryParams({"AscentGradeLearning": "not-json"})
  wrong_identity = MemoryParams({
    "AscentGradeLearning": '{"schema":1,"identity":"wrong","cells":{"5:2":{"residual_mps2":0.2}}}',
  })

  assert GradeLearner(malformed, "SUBARU_ASCENT", "comma-1").get_residual(25.0, 1.0) == 0.0
  assert GradeLearner(wrong_identity, "SUBARU_ASCENT", "comma-1").get_residual(25.0, 1.0) == 0.0


def test_learner_live_application_gate_defaults_off():
  learner = GradeLearner(MemoryParams(), "SUBARU_ASCENT", "comma-1")

  assert not learner.application_enabled


def test_learner_requires_device_and_vehicle_identity_before_persisting():
  params = MemoryParams()
  learner = GradeLearner(params, "SUBARU_ASCENT", "")

  result = observe_clean_deficit(learner, 15.0)

  assert not result.eligible
  assert result.reason == "missing_identity"
  assert "AscentGradeLearning" not in params.values
