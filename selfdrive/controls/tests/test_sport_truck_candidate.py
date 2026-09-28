import math

import pytest

from openpilot.starpilot.common.accel_profile import (
  A_CRUISE_MAX_BP_CUSTOM,
  A_CRUISE_MAX_VALS_SPORT_TRUCK,
  get_accel_profile_curve_values,
  interpolate_accel_profile,
)


CURRENT = [6.00, 1.15, 0.75, 1.35, 1.83, 1.83, 0.83]
SPEEDS_KPH = (0, 20, 40, 50, 60, 70, 80, 100, 120)
EXPECTED_CAPS = (6.000000, 1.999900, 1.999900, 1.999900, 1.999900, 1.999900, 1.999900, 1.999900, 1.999900)
EXPECTED_DELTAS = (0.0, 0.854513, 1.204053, 0.695747, 0.549159, 0.175436, 0.169900, 0.217073, 0.773213)


def cap(speed_kph):
  return interpolate_accel_profile(speed_kph / 3.6, A_CRUISE_MAX_VALS_SPORT_TRUCK)


def test_candidate_constants_and_breakpoints_are_exact():
  assert A_CRUISE_MAX_BP_CUSTOM == [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 40.0]
  assert A_CRUISE_MAX_VALS_SPORT_TRUCK == [6.00, 1.9999, 1.9999, 1.9999, 1.9999, 1.9999, 1.9999]
  assert get_accel_profile_curve_values(2, ev_tuning=False, truck_tuning=True) == A_CRUISE_MAX_VALS_SPORT_TRUCK


def test_candidate_caps_and_deltas_match_rule_of_three_tune():
  for speed_kph, expected_cap, expected_delta in zip(SPEEDS_KPH, EXPECTED_CAPS, EXPECTED_DELTAS):
    actual = cap(speed_kph)
    current = interpolate_accel_profile(speed_kph / 3.6, CURRENT)
    assert actual == pytest.approx(expected_cap, abs=0.005)
    assert actual - current == pytest.approx(expected_delta, abs=0.005)


def test_candidate_preserves_zero_speed_breakpoint_and_physical_cap():
  assert A_CRUISE_MAX_VALS_SPORT_TRUCK[0] == 6.00
  samples = [cap(speed * 3.6) for speed in [i / 100 for i in range(1000, 4001)]]
  assert all(math.isfinite(value) and 0.0 <= value <= 2.0 for value in samples[1:])


def test_candidate_has_no_akima_overshoot_between_breakpoints():
  for left, right, left_value, right_value in zip(
    A_CRUISE_MAX_BP_CUSTOM,
    A_CRUISE_MAX_BP_CUSTOM[1:],
    A_CRUISE_MAX_VALS_SPORT_TRUCK,
    A_CRUISE_MAX_VALS_SPORT_TRUCK[1:],
  ):
    interval = [interpolate_accel_profile(left + (right - left) * i / 100, A_CRUISE_MAX_VALS_SPORT_TRUCK) for i in range(101)]
    assert min(left_value, right_value) - 1e-12 <= min(interval)
    assert max(interval) <= max(left_value, right_value) + 1e-12
    assert all(math.isfinite(value) for value in interval)
