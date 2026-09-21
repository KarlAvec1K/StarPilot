import math

import pytest

from openpilot.starpilot.common.accel_profile import (
  A_CRUISE_MAX_BP_CUSTOM,
  A_CRUISE_MAX_VALS_SPORT_TRUCK,
  get_accel_profile_curve_values,
  interpolate_accel_profile,
)


CURRENT = [6.00, 1.15, 0.75, 0.70, 0.60, 0.50, 0.40]
SPEEDS_KPH = (0, 20, 40, 50, 60, 70, 80, 100, 120)
EXPECTED_CAPS = (6.000000, 1.145387, 0.746179, 0.722292, 0.715802, 0.700346, 0.652398, 0.575283, 0.519669)
EXPECTED_DELTAS = (0.0, 0.0, 0.002292, 0.018471, 0.036790, 0.099193, 0.092066, 0.080000, 0.080000)


def cap(speed_kph):
  return interpolate_accel_profile(speed_kph / 3.6, A_CRUISE_MAX_VALS_SPORT_TRUCK)


def test_candidate_constants_and_breakpoints_are_exact():
  assert A_CRUISE_MAX_BP_CUSTOM == [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 40.0]
  assert A_CRUISE_MAX_VALS_SPORT_TRUCK == [6.00, 1.15, 0.75, 0.72, 0.70, 0.58, 0.48]
  assert get_accel_profile_curve_values(2, ev_tuning=False, truck_tuning=True) == A_CRUISE_MAX_VALS_SPORT_TRUCK


def test_candidate_caps_and_deltas_match_accepted_replay():
  for speed_kph, expected_cap, expected_delta in zip(SPEEDS_KPH, EXPECTED_CAPS, EXPECTED_DELTAS):
    actual = cap(speed_kph)
    current = interpolate_accel_profile(speed_kph / 3.6, CURRENT)
    assert actual == pytest.approx(expected_cap, abs=0.005)
    assert actual - current == pytest.approx(expected_delta, abs=0.005)


def test_candidate_preserves_low_speed_authority():
  deltas = [cap(speed) - interpolate_accel_profile(speed / 3.6, CURRENT) for speed in range(0, 51)]
  assert max(deltas) <= 0.02


def test_candidate_is_monotone_and_has_no_akima_overshoot():
  samples = [cap(speed * 3.6) for speed in [i / 100 for i in range(4001)]]
  assert all(next_value <= value + 1e-12 for value, next_value in zip(samples, samples[1:]))
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
