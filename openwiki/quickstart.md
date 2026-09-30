---
type: guide
title: StarPilot OpenWiki Quickstart
description: Start here to route architecture, controls, settings, Galaxy, operations, and testing questions to the relevant repository-grounded pages.
tags: [quickstart, starpilot, openwiki]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-515c3592e4bbff91da0c802f
    resource: repo://build
  - id: openwiki-source-05ccef8d4cf1698187f20464
    resource: repo://pyproject.toml
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-aa11bf1d74cb09662ed6656a
    resource: repo://selfdrive/controls/controlsd.py
  - id: openwiki-source-df52fcd24ca048c8ad514d46
    resource: repo://starpilot/controls/tests/test_fleet_aol.py
  - id: openwiki-source-e7c9935a5a86ff39486ec838
    resource: repo://starpilot/system/the_galaxy/the_galaxy.py
  - id: openwiki-source-b8a030a70deb9a08ccf93101
    resource: repo://system/manager/manager.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# StarPilot OpenWiki Quickstart

## What this repository is

StarPilot is an openpilot-derived driver-assistance system. The source tree combines the supervised runtime, cereal messaging, Params persistence, vehicle/CAN support, StarPilot controls and settings, navigation/media, UI, Galaxy, and development tools.

## Find the right page

- Runtime/process/message flow: [[/openwiki/architecture/overview]] and [[/openwiki/architecture/runtime-and-messaging]]
- Vehicle interfaces and controls: [[/openwiki/architecture/controls-and-vehicles]]
- Settings, toggles, migrations, and persistence: [[/openwiki/architecture/settings-and-parameters]]
- Galaxy API, frontends, routes, diagnostics, and updates: [[/openwiki/architecture/galaxy]]
- Navigation, replay, routes, and streaming: [[/openwiki/architecture/navigation-and-media]]
- Build and device update boundaries: [[/openwiki/operations/build-update]]
- Tests and verification limits: [[/openwiki/testing/strategy]]
- Repository layout and contributor conventions: [[/openwiki/development/contributing-and-layout]]

## First checks

Read `README.md` and `pyproject.toml`, confirm the Git checkout and working-tree scope, then inspect the owning subsystem and its focused tests. Run the narrowest relevant test first and expand only when the result warrants it.

This wiki is generated from current source and tests. Those are the authority for documented behavior. It is not a user-facing driving guide, and no hardware, live-device, CAN, or on-road validation is implied by these pages.

## Common entrypoints

- `build` — device-oriented build wrapper.
- `pyproject.toml` — dependencies, test discovery, lint/type-check configuration.
- `system/manager/manager.py` — process supervision.
- `selfdrive/controls/controlsd.py` — control-cycle integration.
- `starpilot/system/the_galaxy/the_galaxy.py` — Galaxy service.
