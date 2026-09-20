from types import SimpleNamespace

import pytest

from cereal import car, custom, log
from opendbc.car.hyundai.values import CAR as HYUNDAI_CAR
from opendbc.car.subaru.values import CAR as SUBARU_CAR
from opendbc.car.car_helpers import interfaces
from opendbc.car.vehicle_model import VehicleModel
from openpilot.common.realtime import DT_CTRL
import openpilot.starpilot.controls.lib.neural_network_feedforward as nnff

from openpilot.starpilot.controls.lib.neural_network_feedforward import (
  DEFAULT_NNFF_LAT_JERK_FRICTION_FACTOR,
  PALISADE_NNFF_LAT_JERK_FRICTION_FACTOR,
  get_nnff_lat_jerk_friction_factor,
)


def _build_nnff_controller(monkeypatch):
  monkeypatch.setattr(nnff, "get_nn_model", lambda *_args: None)
  car_interface = interfaces[SUBARU_CAR.SUBARU_ASCENT]
  cp = car_interface.get_non_essential_params(SUBARU_CAR.SUBARU_ASCENT)
  torque_tuning = cp.lateralTuning.init("torque")
  torque_tuning.latAccelFactor = 1.0
  torque_tuning.friction = 0.1
  torque_tuning.steeringAngleDeadzoneDeg = 0.0
  ci = car_interface(cp, custom.StarPilotCarParams.new_message())
  return nnff.LatControlNNFF(cp.as_reader(), ci, DT_CTRL), cp, VehicleModel(cp)


def _build_update_inputs(cp):
  cs = car.CarState.new_message(vEgo=22.0, steeringAngleDeg=1.0, steeringPressed=False)
  params = log.LiveParametersData.new_message(steerRatio=cp.steerRatio, stiffnessFactor=1.0, roll=0.0, angleOffsetDeg=0.0)
  toggles = SimpleNamespace(nnff=True, nnff_lite=False)
  return cs, params, toggles


def test_palisade_nnff_jerk_friction_factor_is_damped_for_bumps():
  assert get_nnff_lat_jerk_friction_factor(HYUNDAI_CAR.HYUNDAI_PALISADE_2023) == PALISADE_NNFF_LAT_JERK_FRICTION_FACTOR
  assert PALISADE_NNFF_LAT_JERK_FRICTION_FACTOR < DEFAULT_NNFF_LAT_JERK_FRICTION_FACTOR


def test_other_nnff_cars_keep_default_jerk_friction_factor():
  assert get_nnff_lat_jerk_friction_factor(HYUNDAI_CAR.HYUNDAI_SONATA) == DEFAULT_NNFF_LAT_JERK_FRICTION_FACTOR
  assert get_nnff_lat_jerk_friction_factor(HYUNDAI_CAR.HYUNDAI_PALISADE) == DEFAULT_NNFF_LAT_JERK_FRICTION_FACTOR


@pytest.mark.parametrize(
  ("pid_output", "expected_shadow", "expected_excess", "expected_saturated"),
  [
    (0.5, -0.5, 0.0, False),
    (1.0, -1.0, 0.0, False),
    (1.2, -1.2, 0.2, True),
    (-1.2, 1.2, 0.2, True),
  ],
)
def test_nnff_shadow_metrics_use_actuator_sign_and_final_clamp(pid_output, expected_shadow, expected_excess, expected_saturated):
  metrics = nnff._compute_nnff_shadow_metrics(0.75, pid_output, 1.0)

  assert metrics.commanded_torque_norm == pytest.approx(-0.75)
  assert metrics.shadow_torque_norm == pytest.approx(expected_shadow)
  assert metrics.shadow_excess_norm == pytest.approx(expected_excess)
  assert metrics.shadow_saturated is expected_saturated


def test_nnff_shadow_state_has_torque_fields_and_serializes(monkeypatch):
  controller, _, _ = _build_nnff_controller(monkeypatch)

  assert hasattr(controller, "starpilot_lateral_state")
  controller.starpilot_lateral_state.pidOutputTorqueClipped = 0.75
  controller.starpilot_lateral_state.pidOutputTorqueUnclipped = 1.2
  with custom.StarPilotLateralState.from_bytes(controller.starpilot_lateral_state.to_bytes()) as restored:
    assert restored.pidOutputTorqueClipped == pytest.approx(0.75)
    assert restored.pidOutputTorqueUnclipped == pytest.approx(1.2)


@pytest.mark.parametrize(
  ("output_torque", "pid_output_torque"),
  [(0.75, 0.75), (1.0, 1.0), (1.0, 1.2), (-1.0, -1.2)],
)
def test_nnff_shadow_state_preserves_internal_and_actuator_signs(monkeypatch, output_torque, pid_output_torque):
  controller, _, _ = _build_nnff_controller(monkeypatch)

  controller._update_starpilot_lateral_state(output_torque, pid_output_torque)
  state = controller.starpilot_lateral_state

  assert state.active is True
  assert state.pidOutputTorqueClipped == pytest.approx(output_torque)
  assert state.pidOutputTorqueUnclipped == pytest.approx(pid_output_torque)
  assert state.commandedTorqueNorm == pytest.approx(-output_torque)
  assert state.shadowTorqueNorm == pytest.approx(-pid_output_torque)
  assert state.shadowExcessNorm == pytest.approx(max(abs(pid_output_torque) - 1.0, 0.0))
  assert state.shadowSaturated is (abs(pid_output_torque) > 1.0)


def test_nnff_instrumentation_does_not_change_output_or_pid_state(monkeypatch):
  instrumented, cp, vm = _build_nnff_controller(monkeypatch)
  baseline, _, _ = _build_nnff_controller(monkeypatch)
  baseline._update_starpilot_lateral_state = lambda *_args: None
  cs, params, toggles = _build_update_inputs(cp)

  instrumented_result = instrumented.update(True, cs, vm, params, False, 0.001, False, 0.2, None, None, toggles)
  baseline_result = baseline.update(True, cs, vm, params, False, 0.001, False, 0.2, None, None, toggles)

  assert instrumented_result[0] == pytest.approx(baseline_result[0])
  assert instrumented_result[1] == pytest.approx(baseline_result[1])
  assert instrumented_result[2].to_bytes() == baseline_result[2].to_bytes()
  assert instrumented.pid.p == pytest.approx(baseline.pid.p)
  assert instrumented.pid.i == pytest.approx(baseline.pid.i)
  assert instrumented.pid.d == pytest.approx(baseline.pid.d)
  assert instrumented.pid.f == pytest.approx(baseline.pid.f)
  assert instrumented.pid.control == pytest.approx(baseline.pid.control)
  assert instrumented.starpilot_lateral_state.commandedTorqueNorm == pytest.approx(instrumented_result[0])
  assert instrumented.starpilot_lateral_state.pidOutputTorqueClipped == pytest.approx(-instrumented_result[0])
  assert instrumented.starpilot_lateral_state.pidOutputTorqueUnclipped == pytest.approx(
    instrumented.pid.p + instrumented.pid.i + instrumented.pid.d + instrumented.pid.f
  )


def test_nnff_inactive_update_clears_shadow_state(monkeypatch):
  controller, cp, vm = _build_nnff_controller(monkeypatch)
  cs, params, toggles = _build_update_inputs(cp)
  controller.update(True, cs, vm, params, False, 0.001, False, 0.2, None, None, toggles)
  controller.update(False, cs, vm, params, False, 0.001, False, 0.2, None, None, toggles)

  state = controller.starpilot_lateral_state
  assert state.active is False
  assert state.commandedTorqueNorm == pytest.approx(0.0)
  assert state.shadowTorqueNorm == pytest.approx(0.0)
  assert state.shadowExcessNorm == pytest.approx(0.0)
  assert state.shadowSaturated is False
  assert state.pidOutputTorqueClipped == pytest.approx(0.0)
  assert state.pidOutputTorqueUnclipped == pytest.approx(0.0)


def test_nnff_invalid_shadow_values_clear_state(monkeypatch):
  controller, _, _ = _build_nnff_controller(monkeypatch)
  controller._update_starpilot_lateral_state(0.25, 0.5)
  controller._update_starpilot_lateral_state(float("nan"), 0.5)

  assert controller.starpilot_lateral_state.active is False
  assert controller.starpilot_lateral_state.commandedTorqueNorm == pytest.approx(0.0)
  assert controller.starpilot_lateral_state.shadowTorqueNorm == pytest.approx(0.0)
  assert controller.starpilot_lateral_state.shadowExcessNorm == pytest.approx(0.0)
  assert controller.starpilot_lateral_state.shadowSaturated is False
