---
type: architecture
title: Runtime Architecture Overview
description: StarPilot extends openpilot's supervised process graph with vehicle, control, settings, UI, navigation, and Galaxy subsystems connected by cereal messaging and persistent Params.
tags: [architecture, openpilot, starpilot, runtime]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-5b5c46200db62cc4a75f9282
    resource: repo://cereal/log.capnp
  - id: openwiki-source-c1aceb06dd138b3bf15ef8f1
    resource: repo://cereal/services.py
  - id: openwiki-source-25e5b86b4629e9cf2772f03e
    resource: repo://common/params.py
  - id: openwiki-source-676a449facf9a87d6d92c8cb
    resource: repo://opendbc_repo/opendbc/car/car_helpers.py
  - id: openwiki-source-05ccef8d4cf1698187f20464
    resource: repo://pyproject.toml
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-aa11bf1d74cb09662ed6656a
    resource: repo://selfdrive/controls/controlsd.py
  - id: openwiki-source-581da3dff7c11c7b4a697ff8
    resource: repo://starpilot/controls/starpilot_planner.py
  - id: openwiki-source-b8a030a70deb9a08ccf93101
    resource: repo://system/manager/manager.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Runtime Architecture Overview

## System shape

StarPilot is a fork of openpilot. The repository combines core openpilot processes and libraries with StarPilot packages under `starpilot/`, modified `selfdrive/` and `system/` consumers, the `opendbc` vehicle layer, cereal schemas/services, and vendored or sibling repositories.

The runtime is process-oriented. Manager configuration declares processes, dependencies, environment, and start/stop behavior; individual daemons then communicate through cereal services instead of direct calls. Persistent configuration uses the Params store, while serialized Cap'n Proto messages carry fast-cycle state.

## Main data path

Sensors, vehicle interfaces, model processes, and state estimators publish messages. Planning and control consume those streams, apply feature and vehicle limits, and publish actuator/control state. Loggerd records selected services. UI, Galaxy, replay, and diagnostics consume the same contracts from different operational contexts.

StarPilot-specific planner state is carried through dedicated services such as `starpilotPlan`, `starpilotCarState`, and lateral telemetry. This lets features remain separate while giving shared control code a stable boundary.

## Persistence and lifecycle

Params is the durable state boundary for toggles, device identity, calibration, update state, and compatibility migrations. Manager startup and cleanup coordinate process transitions and parameter resets. Update/recovery code can modify the checkout or device state only through explicit operational flows.

## Boundaries

The architecture has four important boundaries: schema/message contracts in cereal; process supervision in manager; persistent configuration in Params; and vehicle safety/CAN handling in opendbc/panda. A source-level test or replay can validate a boundary contract without proving the complete physical system.

## Related pages

- [[/openwiki/architecture/runtime-and-messaging]]
- [[/openwiki/architecture/controls-and-vehicles]]
- [[/openwiki/architecture/settings-and-parameters]]
- [[/openwiki/operations/build-update]]
