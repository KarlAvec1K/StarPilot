---
type: architecture
title: Runtime Processes and Messaging
description: Manager-supervised daemons communicate through cereal service schemas and PubMaster/SubMaster, with loggerd and selfdrived providing important lifecycle boundaries.
tags: [runtime, messaging, manager, cereal]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-5b5c46200db62cc4a75f9282
    resource: repo://cereal/log.capnp
  - id: openwiki-source-c1aceb06dd138b3bf15ef8f1
    resource: repo://cereal/services.py
  - id: openwiki-source-aa11bf1d74cb09662ed6656a
    resource: repo://selfdrive/controls/controlsd.py
  - id: openwiki-source-6cd84c5b429b6274ee48d0eb
    resource: repo://selfdrive/selfdrived/selfdrived.py
  - id: openwiki-source-19c1f8c61e8e92124f04e596
    resource: repo://system/loggerd/loggerd.cc
  - id: openwiki-source-b8a030a70deb9a08ccf93101
    resource: repo://system/manager/manager.py
  - id: openwiki-source-5413c4ab7fd181402ae46997
    resource: repo://system/manager/process_config.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Runtime Processes and Messaging

## Process lifecycle

The manager reads process configuration, applies enablement and environment rules, starts eligible daemons, observes their health, and performs cleanup during transitions. Process modules expose ordinary Python or native entrypoints; manager owns when they run and how they are restarted or stopped.

`selfdrived` owns the high-level onroad/offroad state machine and publishes events consumed by UI and control processes. Loggerd subscribes to configured services and persists message streams for later replay and diagnosis.

## Message contract

Cereal defines service names and Cap'n Proto payloads. `PubMaster` publishes typed messages and `SubMaster` tracks updates, validity, and timing for consumers. Control, UI, logging, replay, WebRTC, and StarPilot features therefore share explicit service contracts instead of importing each other's runtime state.

StarPilot adds services and fields for planner, vehicle, and lateral telemetry. Consumers must handle missing, stale, or invalid data at the boundary; message presence alone does not prove that a producer is active in a particular runtime or log.

## Failure behavior

Manager health and process transitions handle crashes and lifecycle changes. Consumers use message validity/update state and Params-backed state to decide whether to continue, reset, or present an alert. Loggerd and replay preserve a useful separation between recorded evidence and live runtime behavior.

## Related pages

- [[/openwiki/architecture/overview]]
- [[/openwiki/architecture/controls-and-vehicles]]
- [[/openwiki/architecture/navigation-and-media]]
- [[/openwiki/testing/strategy]]
