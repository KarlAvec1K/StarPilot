---
type: architecture
title: Controls and Vehicle Integration
description: How StarPilot selects vehicle interfaces, plans longitudinal behavior, computes lateral control, and hands constrained actuator commands to vehicle-specific code.
tags: [controls, vehicles, safety, starpilot]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-676a449facf9a87d6d92c8cb
    resource: repo://opendbc_repo/opendbc/car/car_helpers.py
  - id: openwiki-source-a621645fc2b4283d0936ad6a
    resource: repo://selfdrive/car/tests/test_fleet_safety_core.py
  - id: openwiki-source-aa11bf1d74cb09662ed6656a
    resource: repo://selfdrive/controls/controlsd.py
  - id: openwiki-source-60783e21fd6c1586e5e7cb36
    resource: repo://selfdrive/controls/lib/latcontrol.py
  - id: openwiki-source-0a064380e95bd2bf5cd499eb
    resource: repo://starpilot/car/ford/tests/test_lateral.py
  - id: openwiki-source-581da3dff7c11c7b4a697ff8
    resource: repo://starpilot/controls/starpilot_planner.py
  - id: openwiki-source-df52fcd24ca048c8ad514d46
    resource: repo://starpilot/controls/tests/test_fleet_aol.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Controls and Vehicle Integration

## Responsibility

The control stack joins vehicle state, model/planner outputs, feature toggles, and vehicle-specific limits into `carControl` and `controlsState` messages. Vehicle interfaces own fingerprinting, `CarParams`, safety configuration, CAN parsing, and actuator encoding; `controlsd` owns the control-cycle orchestration and selects the lateral controller for the current `CarParams`.

## End-to-end flow

1. Vehicle discovery produces `CarParams` and StarPilot-specific parameters. `controlsd` waits for the serialized `CarParams` and `StarPilotCarParams`, then constructs the vehicle interface and longitudinal controller.
2. `controlsd` subscribes to vehicle state, model/planner data, `starpilotCarState`, and `starpilotPlan`. The StarPilot planner publishes feature decisions such as acceleration bounds, speed-limit state, lateral checks, and cruise targets on `starpilotPlan`.
3. Longitudinal control converts the requested target into acceleration, applying the vehicle interface's acceleration limits and StarPilot profile limits.
4. Lateral control is selected from angle, curvature, PID, torque, or StarPilot NNFF implementations. Curvature and actuator limits are applied before the result is sent to the vehicle interface.
5. The vehicle controller converts the constrained command into CAN messages and reports the applied actuator values. Safety-limited output is tracked separately from controller saturation so the control loop can avoid treating an external safety clamp as a controller defect.

## StarPilot extension points

`starpilot/controls/starpilot_planner.py` is the feature aggregation boundary. It serializes the outputs of following-distance, curve-speed, speed-limit, conditional-experimental, weather, and personality logic into `starpilotPlan`; downstream consumers use that message rather than reaching into those feature implementations.

`selfdrive/controls/controlsd.py` is the central integration boundary. It selects `LatControlNNFF` when the StarPilot NNFF mode is enabled, otherwise using the controller implied by the vehicle's steering type. The shared lateral base class records saturation only when the signal is not being limited by safety, driver steering input, or curvature limits.

Vehicle-specific behavior lives beside the common interface. For example, Ford lateral code applies its own state and steering-limit logic before returning a vehicle-facing result, while `opendbc` interfaces provide brand-specific safety configs, fingerprints, parsers, and CAN encoders.

## Verification boundary

Representative tests cover StarPilot planner/card behavior, longitudinal personality and acceleration profiles, Ford lateral behavior, car interface and safety behavior, and the shared controls path. These are source-level and synthetic/replay checks. They do not prove correct behavior on a physical vehicle or authorize an on-road test.

## Related pages

- [[/openwiki/architecture/runtime-and-messaging]]
- [[/openwiki/architecture/settings-and-parameters]]
- [[/openwiki/testing/strategy]]
