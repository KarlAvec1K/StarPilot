"""Vehicle-specific baselines for the Subaru Ascent longitudinal controls."""
from __future__ import annotations

ASCENT_FINGERPRINT = "SUBARU_ASCENT"
ASCENT_FOLLOW_DEFAULTS_MIGRATION_KEY = "AscentGalaxyFollowDefaultsMigrated"

ASCENT_FOLLOW_OLD_DEFAULTS = {
  "AggressiveFollow": 1.25,
  "AggressiveFollowHigh": 1.0,
  "StandardFollow": 1.45,
  "StandardFollowHigh": 1.2,
  "RelaxedFollow": 1.6,
  "RelaxedFollowHigh": 1.4,
}

ASCENT_FOLLOW_DEFAULTS = {
  "AggressiveFollow": 1.25,
  "AggressiveFollowHigh": 0.5,
  "StandardFollow": 1.45,
  "StandardFollowHigh": 0.84,
  "RelaxedFollow": 1.75,
  "RelaxedFollowHigh": 1.75,
}

ASCENT_TRAFFIC_FOLLOW_HIGH_BASELINE = 1.6
ASCENT_TRAFFIC_FOLLOW_HIGH_RELAXED_BASELINE = ASCENT_FOLLOW_DEFAULTS["RelaxedFollow"]

ASCENT_AGGRESSIVE_FOLLOW_BP = (30.0 / 3.6, 70.0 / 3.6, 80.0 / 3.6, 120.0 / 3.6)
ASCENT_AGGRESSIVE_FOLLOW_VALUES = (1.25, 0.625, 0.5, 0.5)
ASCENT_FOLLOWING_SPEEDS_MPH = tuple(range(0, 91, 10))
_MPH_TO_MS = 0.44704


def _interp(value: float, breakpoints, values) -> float:
  if value <= breakpoints[0]:
    return float(values[0])
  if value >= breakpoints[-1]:
    return float(values[-1])
  for index in range(len(breakpoints) - 1):
    if value <= breakpoints[index + 1]:
      ratio = (value - breakpoints[index]) / (breakpoints[index + 1] - breakpoints[index])
      return float(values[index] + ratio * (values[index + 1] - values[index]))
  return float(values[-1])


def is_ascent_fingerprint(fingerprint: object) -> bool:
  return isinstance(fingerprint, str) and fingerprint.upper() == ASCENT_FINGERPRINT


def effective_ascent_follow_value(key: str, raw_value, migrated: bool) -> float:
  """Use the new baseline immediately, even before an offroad write is possible."""
  if key not in ASCENT_FOLLOW_DEFAULTS:
    raise KeyError(key)
  if raw_value is None:
    return ASCENT_FOLLOW_DEFAULTS[key]
  try:
    value = float(raw_value)
  except (TypeError, ValueError):
    value = ASCENT_FOLLOW_OLD_DEFAULTS[key]
  if not migrated:
    value = ASCENT_FOLLOW_DEFAULTS[key] + value - ASCENT_FOLLOW_OLD_DEFAULTS[key]
  return value


def ascent_following_curve(profile_id: str, values_by_key: dict[str, float], speeds_mph=ASCENT_FOLLOWING_SPEEDS_MPH) -> list[float]:
  """Resolve Galaxy's effective Ascent follow curve from current slider values."""
  if profile_id == "traffic":
    traffic_high = ASCENT_TRAFFIC_FOLLOW_HIGH_BASELINE + (
      values_by_key["RelaxedFollow"] - ASCENT_TRAFFIC_FOLLOW_HIGH_RELAXED_BASELINE
    )
    return [
      round(_interp(speed * _MPH_TO_MS, (0.0, 25.0), (values_by_key["TrafficFollow"], traffic_high)), 4)
      for speed in speeds_mph
    ]

  if profile_id == "aggressive":
    result = []
    for speed in speeds_mph:
      speed_ms = speed * _MPH_TO_MS
      baseline = _interp(speed_ms, ASCENT_AGGRESSIVE_FOLLOW_BP, ASCENT_AGGRESSIVE_FOLLOW_VALUES)
      delta = _interp(
        speed,
        (45.0, 70.0),
        (
          values_by_key["AggressiveFollow"] - ASCENT_FOLLOW_DEFAULTS["AggressiveFollow"],
          values_by_key["AggressiveFollowHigh"] - ASCENT_FOLLOW_DEFAULTS["AggressiveFollowHigh"],
        ),
      )
      result.append(round(baseline + delta, 4))
    return result

  if profile_id in ("standard", "relaxed"):
    prefix = profile_id.capitalize()
    return [
      round(_interp(speed, (45.0, 70.0), (values_by_key[f"{prefix}Follow"], values_by_key[f"{prefix}FollowHigh"])), 4)
      for speed in speeds_mph
    ]

  raise ValueError(f"Unknown personality: {profile_id}")


def migrate_ascent_follow_defaults(fingerprint: object, is_offroad: bool, params) -> bool:
  """Rebase stored generic follow settings once while preserving user deltas."""
  if not is_ascent_fingerprint(fingerprint) or not is_offroad or params.get_bool(ASCENT_FOLLOW_DEFAULTS_MIGRATION_KEY):
    return False

  for key, old_default in ASCENT_FOLLOW_OLD_DEFAULTS.items():
    raw_value = params.get(key)
    try:
      value = float(raw_value) if raw_value is not None else old_default
    except (TypeError, ValueError):
      value = old_default
    params.put_float(key, ASCENT_FOLLOW_DEFAULTS[key] + value - old_default)

  params.put_bool(ASCENT_FOLLOW_DEFAULTS_MIGRATION_KEY, True)
  return True
