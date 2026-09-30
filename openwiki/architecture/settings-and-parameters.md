---
type: subsystem
title: Settings, Parameters, and Feature State
description: StarPilot settings flow from registered parameter keys and UI metadata through typed persistence, migrations, Galaxy APIs, and runtime toggle snapshots.
tags: [settings, parameters, persistence, starpilot]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-73cd161c7a4379fbfe459d19
    resource: repo://common/params_keys.h
  - id: openwiki-source-aa11bf1d74cb09662ed6656a
    resource: repo://selfdrive/controls/controlsd.py
  - id: openwiki-source-969a07ee6b26b527081b1498
    resource: repo://selfdrive/ui/layouts/settings/starpilot/main_panel.py
  - id: openwiki-source-6f16306c3aaf583100e8bc3b
    resource: repo://starpilot/common/assets/device_settings_layout.json
  - id: openwiki-source-24c1764d5b303dbdc420b0e3
    resource: repo://starpilot/common/starpilot_functions.py
  - id: openwiki-source-265b43c5fb5f1bcc9a00509b
    resource: repo://starpilot/common/starpilot_variables.py
  - id: openwiki-source-c21af47abd4770168a13b588
    resource: repo://starpilot/common/tests/test_screen_settings_transactions.py
  - id: openwiki-source-cbfb2d8ebd346b9bdf164423
    resource: repo://starpilot/common/tests/test_starpilot_functions.py
  - id: openwiki-source-8a03a679018482055e5abef0
    resource: repo://starpilot/common/tests/test_starpilot_variables.py
  - id: openwiki-source-581da3dff7c11c7b4a697ff8
    resource: repo://starpilot/controls/starpilot_planner.py
  - id: openwiki-source-f38790ccbfefcbeb57ab809f
    resource: repo://starpilot/system/the_galaxy/tests/test_device_settings_layout.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Settings, Parameters, and Feature State

## Declaration and persistence

Parameter keys are declared in the shared key registry and consumed through the common Params interface. StarPilot adds typed toggle/default/migration helpers in `starpilot/common`, keeping legacy names and persisted values compatible while exposing a normalized runtime toggle snapshot.

The device-settings layout describes the user-facing hierarchy, types, defaults, visibility, dependencies, and capability gates. Desktop/classic UI settings and Galaxy use that metadata plus their own presentation components; the persistent key remains the shared contract.

## Runtime flow

At process startup, migration helpers reconcile renamed or removed keys and seed required defaults. Runtime consumers read a stable toggle object rather than duplicating raw key parsing. Planner, controls, UI, and Galaxy then make feature decisions from the same persisted state, with capability and vehicle checks applied at the consumer boundary.

Some state is intentionally separate from ordinary settings: memory Params are used for transient process/UI coordination, while files or structured values back profiles, testing grounds, recovery, and other larger state. Writes are guarded where a setting can conflict with onroad/runtime conditions.

## Verification

Tests cover key registration, migrations, default parity, profile retention, safe mode, screen-setting transactions, Galaxy settings payloads, device-layout structure, and feature-specific capability behavior. These tests verify schema and persistence contracts; they do not replace device or vehicle validation.

## Related pages

- [[/openwiki/architecture/controls-and-vehicles]]
- [[/openwiki/architecture/galaxy]]
- [[/openwiki/architecture/overview]]
