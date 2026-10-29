import pytest

from openpilot.starpilot.common.ascent_longitudinal_defaults import (
  ASCENT_FOLLOW_DEFAULTS,
  ASCENT_FOLLOWING_SPEEDS_MPH,
  ascent_following_curve,
  default_human_lane_changes_enabled,
  effective_ascent_follow_value,
  migrate_ascent_follow_defaults,
)


class FakeParams:
  def __init__(self, floats=None):
    self.floats = dict(floats or {})

  def get(self, key):
    return self.floats.get(key)

  def put_float(self, key, value):
    self.floats[key] = float(value)


def test_ascent_follow_defaults_migration_rebases_old_values_and_keeps_user_deltas(tmp_path):
  params = FakeParams({
    "AggressiveFollow": 1.35,
    "AggressiveFollowHigh": 0.9,
    "StandardFollow": 1.55,
    "StandardFollowHigh": 1.3,
    "RelaxedFollow": 1.7,
    "RelaxedFollowHigh": 1.5,
  })

  marker = tmp_path / "migrations" / "ascent-follow-v1"
  assert migrate_ascent_follow_defaults("SUBARU_ASCENT", True, params, marker) is True
  assert params.floats == pytest.approx({
    "AggressiveFollow": 1.35,
    "AggressiveFollowHigh": 0.4,
    "StandardFollow": 1.55,
    "StandardFollowHigh": 0.94,
    "RelaxedFollow": 1.85,
    "RelaxedFollowHigh": 1.85,
  })
  assert marker.read_text(encoding="ascii").strip() == "1"
  assert migrate_ascent_follow_defaults("SUBARU_ASCENT", True, params, marker) is False


def test_ascent_follow_values_use_rebased_defaults_before_offroad_migration():
  assert effective_ascent_follow_value("AggressiveFollowHigh", 0.9, migrated=False) == pytest.approx(0.4)
  assert effective_ascent_follow_value("RelaxedFollow", 1.6, migrated=False) == pytest.approx(1.75)
  assert effective_ascent_follow_value("RelaxedFollow", 1.85, migrated=True) == pytest.approx(1.85)


def test_human_lane_changes_default_is_enabled_only_for_ascent():
  assert default_human_lane_changes_enabled("SUBARU_ASCENT") is True
  assert default_human_lane_changes_enabled("SUBARU_OUTBACK") is False
  assert default_human_lane_changes_enabled(None) is False


def test_ascent_galaxy_profile_defaults_match_current_follow_curves():
  values = {
    **ASCENT_FOLLOW_DEFAULTS,
    "TrafficFollow": 0.75,
  }

  aggressive = ascent_following_curve("aggressive", values)
  standard = ascent_following_curve("standard", values)
  relaxed = ascent_following_curve("relaxed", values)
  traffic = ascent_following_curve("traffic", values)

  assert aggressive[0] == pytest.approx(1.25)
  assert aggressive[5] == pytest.approx(0.5)
  assert standard[0] == pytest.approx(1.45)
  assert standard[-1] == pytest.approx(0.84)
  assert all(left >= right for left, right in zip(standard, standard[1:]))
  assert relaxed == pytest.approx([1.75] * len(ASCENT_FOLLOWING_SPEEDS_MPH))
  assert traffic[0] == pytest.approx(0.75)
  assert traffic[-1] == pytest.approx(1.6)


def test_ascent_galaxy_aggressive_slider_changes_apply_as_offsets():
  values = {**ASCENT_FOLLOW_DEFAULTS, "TrafficFollow": 0.75}
  values["AggressiveFollowHigh"] += 0.1

  curve = ascent_following_curve("aggressive", values)

  assert curve[7] == pytest.approx(0.6)
  assert curve[-1] == pytest.approx(0.6)


@pytest.mark.parametrize(("fingerprint", "is_offroad"), [("SUBARU_OUTBACK", True), ("SUBARU_ASCENT", False)])
def test_ascent_follow_defaults_migration_is_scoped_to_ascent_offroad(fingerprint, is_offroad, tmp_path):
  params = FakeParams({"RelaxedFollow": 1.8})
  marker = tmp_path / "migrations" / "ascent-follow-v1"

  assert migrate_ascent_follow_defaults(fingerprint, is_offroad, params, marker) is False
  assert params.floats == {"RelaxedFollow": 1.8}
  assert not marker.exists()
