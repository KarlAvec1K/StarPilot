import math

import pytest

from openpilot.starpilot.common.accel_profile import (
  A_CRUISE_MAX_BP_CUSTOM,
  A_CRUISE_MAX_VALS_SPORT_TRUCK,
  A_CRUISE_MAX_VALS_SPORT_TRUCK_ASCENT,
  get_accel_profile_curve_values,
  interpolate_accel_profile,
)


CURRENT = [6.00, 1.15, 0.75, 0.75, 0.75, 0.70, 0.60]
SPEEDS_KPH = (0, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120)
EXPECTED_CAPS = (3.000000, 0.997117, 0.802469, 0.750000, 0.750000, 0.781481, 0.898270, 1.019006, 1.200000, 1.204717, 1.226762, 1.260331)
EXPECTED_DELTAS = (-3.000000, -0.148270, -0.031481, 0.000000, 0.000000, 0.031481, 0.148270, 0.288841, 0.500000, 0.509435, 0.553523, 0.620663)


def cap(speed_kph):
  return interpolate_accel_profile(speed_kph / 3.6, A_CRUISE_MAX_VALS_SPORT_TRUCK_ASCENT)


def test_candidate_constants_and_breakpoints_are_exact():
  assert A_CRUISE_MAX_BP_CUSTOM == [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 40.0]
  assert A_CRUISE_MAX_VALS_SPORT_TRUCK == [6.00, 1.15, 0.75, 0.75, 0.75, 0.70, 0.60]
  assert A_CRUISE_MAX_VALS_SPORT_TRUCK_ASCENT == [3.00, 1.00, 0.75, 0.75, 0.90, 1.20, 1.30]
  assert get_accel_profile_curve_values(2, ev_tuning=False, truck_tuning=True) == A_CRUISE_MAX_VALS_SPORT_TRUCK


def test_candidate_caps_and_deltas_match_rule_of_three_tune():
  for speed_kph, expected_cap, expected_delta in zip(SPEEDS_KPH, EXPECTED_CAPS, EXPECTED_DELTAS):
    actual = cap(speed_kph)
    current = interpolate_accel_profile(speed_kph / 3.6, CURRENT)
    assert actual == pytest.approx(expected_cap, abs=0.005)
    assert actual - current == pytest.approx(expected_delta, abs=0.005)


def test_candidate_preserves_zero_speed_breakpoint_and_physical_cap():
  assert A_CRUISE_MAX_VALS_SPORT_TRUCK_ASCENT[0] == 3.00
  samples = [cap(speed * 3.6) for speed in [i / 100 for i in range(1000, 4001)]]
  assert all(math.isfinite(value) and 0.0 <= value <= 2.0 for value in samples[1:])


def test_candidate_has_no_akima_overshoot_between_breakpoints():
  for left, right, left_value, right_value in zip(
    A_CRUISE_MAX_BP_CUSTOM,
    A_CRUISE_MAX_BP_CUSTOM[1:],
    A_CRUISE_MAX_VALS_SPORT_TRUCK_ASCENT,
    A_CRUISE_MAX_VALS_SPORT_TRUCK_ASCENT[1:],
  ):
    interval = [interpolate_accel_profile(left + (right - left) * i / 100, A_CRUISE_MAX_VALS_SPORT_TRUCK_ASCENT) for i in range(101)]
    assert min(left_value, right_value) - 1e-12 <= min(interval)
    assert max(interval) <= max(left_value, right_value) + 1e-12
    assert all(math.isfinite(value) for value in interval)
