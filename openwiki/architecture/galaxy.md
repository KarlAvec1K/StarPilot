---
type: subsystem
title: Galaxy Device Management Service
description: Galaxy is StarPilot's Flask-based device-management service with classic and mobile frontends for settings, diagnostics, routes, notifications, and controlled update workflows.
tags: [galaxy, flask, frontend, operations]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-f38790ccbfefcbeb57ab809f
    resource: repo://starpilot/system/the_galaxy/tests/test_device_settings_layout.py
  - id: openwiki-source-704517f3e53bedeaf43402c5
    resource: repo://starpilot/system/the_galaxy/tests/test_frontend_module_graph.py
  - id: openwiki-source-185efb61791bd301f5e20ab3
    resource: repo://starpilot/system/the_galaxy/tests/test_navigation_params.py
  - id: openwiki-source-e430b648b6b0d30178cba06b
    resource: repo://starpilot/system/the_galaxy/tests/test_update_recovery.py
  - id: openwiki-source-ed740fa24d8dab2f93225f65
    resource: repo://starpilot/system/the_galaxy/tests/test_version_install.py
  - id: openwiki-source-e7c9935a5a86ff39486ec838
    resource: repo://starpilot/system/the_galaxy/the_galaxy.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Galaxy Device Management Service

## Responsibility and entrypoint

Galaxy is implemented in `starpilot/system/the_galaxy/the_galaxy.py` and serves static assets from the adjacent `assets` tree. `main()` creates the Flask application and starts the service; the repository README describes the service as usable on a comma device or a development computer through `start.sh`, with Docker as an alternative packaging path.

The service is deliberately self-contained: it imports Flask and related web dependencies lazily, adapts the device `Params` store, and exposes helpers for runtime defaults, feature capability snapshots, route media, notifications, diagnostics, and update state.

## Request and state flow

The browser frontends call JSON endpoints for settings, vehicle capabilities, navigation, logs/routes, plots, Sentry events, and version/update operations. Settings are normalized at the API boundary, read from the parameter store, and written through guarded helpers that preserve legacy key compatibility and typed defaults.

The classic frontend is a native-module application organized around a router and components. The mobile frontend has its own API/store/component layer, allowing device selection and settings management without requiring a bundler. Both frontends therefore depend on the API contract rather than directly sharing Python state.

Route and recording features scan device media, resolve route metadata and thumbnails, and may create remux/thumbnail work in background futures. Navigation reads the latest GPS/parameter state and writes the destination through the device integration boundary.

## Update and recovery boundary

Version operations are separated into status collection, branch/version selection, installation, rollback, and recovery helpers. The implementation tracks progress and interrupted-update state, validates branch/commit inputs, records rollback targets, and can defer or refuse operations when device/runtime conditions are unsafe. Update code may invoke Git, submodule handling, reboot, and AGNOS checks; it is operational code, not a pure HTTP adapter.

Remote control is consequently bounded by server-side checks: parameter writes, device capability checks, parked/offroad state, rate limits, and explicit recovery paths are part of the service contract. The source and tests do not establish that a live device or vehicle was operated successfully.

## Verification

Galaxy tests cover API payloads, device-settings layout, frontend module graphs, route/media helpers, navigation parameters, Sentry routing, update recovery and version installation, mode-transition guards, and browser-facing JavaScript/CJS modules. These tests verify repository behavior and mocked boundaries; live-device, network, and on-road validation remain separate.

## Related pages

- [[/openwiki/architecture/settings-and-parameters]]
- [[/openwiki/architecture/navigation-and-media]]
- [[/openwiki/operations/build-update]]
- [[/openwiki/testing/strategy]]
