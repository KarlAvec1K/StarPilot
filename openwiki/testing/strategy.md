---
type: testing
title: Testing and Verification Strategy
description: The repository uses pytest plus native/C++ and browser-facing checks, with focused StarPilot suites for parameters, controls, Galaxy, vehicles, replay, and safety boundaries.
tags: [testing, pytest, safety, verification]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-05ccef8d4cf1698187f20464
    resource: repo://pyproject.toml
  - id: openwiki-source-d46de3b5588b596661d16a2c
    resource: repo://selfdrive/car/tests/test_car_interfaces.py
  - id: openwiki-source-a621645fc2b4283d0936ad6a
    resource: repo://selfdrive/car/tests/test_fleet_safety_core.py
  - id: openwiki-source-0a064380e95bd2bf5cd499eb
    resource: repo://starpilot/car/ford/tests/test_lateral.py
  - id: openwiki-source-cbfb2d8ebd346b9bdf164423
    resource: repo://starpilot/common/tests/test_starpilot_functions.py
  - id: openwiki-source-df52fcd24ca048c8ad514d46
    resource: repo://starpilot/controls/tests/test_fleet_aol.py
  - id: openwiki-source-77f79ce00a844dd4581491d3
    resource: repo://starpilot/navigation/test_route_engine.py
  - id: openwiki-source-ed740fa24d8dab2f93225f65
    resource: repo://starpilot/system/the_galaxy/tests/test_version_install.py
  - id: openwiki-source-316ebc97302e73da52b41d60
    resource: repo://tools/replay/tests/test_onroad_config.py
  - id: openwiki-source-278fda1c83809aee467163f8
    resource: repo://tools/sim/tests/test_sim_bridge.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Testing and Verification Strategy

## Configuration

`pyproject.toml` configures pytest with strict markers, warnings-as-errors, parallel execution, selected test paths, and exclusions for vendored/sibling repositories. Python tests use `test_*.py`; C++ tests are discovered through the configured harness. Optional testing dependencies include pytest plugins, coverage, mypy, Ruff, and related tooling.

## Focused StarPilot coverage

The StarPilot suites cover parameter/default/migration contracts, safe mode and screen settings, model/assets, planner/card behavior, personality and acceleration profiles, Ford lateral behavior, navigation, and Galaxy API/frontend/update flows. Galaxy also includes JavaScript/CJS module and browser-oriented checks.

## Safety and integration boundaries

Vehicle tests cover interfaces, fingerprints, car-specific behavior, fleet safety, and actuator saturation. Replay and simulation tests exercise messaging and process consumers with synthetic or recorded inputs. These suites are valuable boundary checks, but they do not prove physical CAN safety, hardware timing, network availability, or on-road behavior.

## Practical verification

For a code change, run the narrowest relevant test module first, then expand to the owning subsystem and integration tests. Use the configured project command from the repository environment; avoid claiming a full suite result unless it was actually run. Separate static/source checks, replay, device tests, and physical validation in reports.

## Related pages

- [[/openwiki/architecture/controls-and-vehicles]]
- [[/openwiki/architecture/galaxy]]
- [[/openwiki/architecture/overview]]
- [[/openwiki/operations/build-update]]
