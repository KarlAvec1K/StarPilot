---
type: operations
title: Build, Packaging, and Device Operations
description: Build scripts, Python packaging, manager build support, and Galaxy update/recovery code define how StarPilot moves from source to device software.
tags: [build, updates, recovery, operations]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-515c3592e4bbff91da0c802f
    resource: repo://build
  - id: openwiki-source-05ccef8d4cf1698187f20464
    resource: repo://pyproject.toml
  - id: openwiki-source-e430b648b6b0d30178cba06b
    resource: repo://starpilot/system/the_galaxy/tests/test_update_recovery.py
  - id: openwiki-source-ed740fa24d8dab2f93225f65
    resource: repo://starpilot/system/the_galaxy/tests/test_version_install.py
  - id: openwiki-source-e7c9935a5a86ff39486ec838
    resource: repo://starpilot/system/the_galaxy/the_galaxy.py
  - id: openwiki-source-48e831e463f06d54e919cbb9
    resource: repo://starpilot/system/the_galaxy/update_recovery.py
  - id: openwiki-source-122360bd0f3930aa8871c379
    resource: repo://starpilot/system/the_galaxy/version_install.py
  - id: openwiki-source-7ac9ded249d289e95930b360
    resource: repo://system/manager/build.py
  - id: openwiki-source-24f908c019d3b701b605b90b
    resource: repo://system/updated/updated.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Build, Packaging, and Device Operations

## Build and packaging

The root `build` entrypoint is the developer-facing build wrapper for device-oriented artifacts. `pyproject.toml` defines the supported Python range, runtime dependencies, optional testing/docs/dev/tool groups, pytest discovery, Ruff, and mypy boundaries. `system/manager/build.py` provides manager-side build support and policy around generated/prebuilt artifacts.

The repository supports desktop development and cross-compilation workflows, but a successful local import or package install is not evidence that a device image, native extension, or hardware peripheral is available.

## Update lifecycle

`system/updated/updated.py` owns the lower-level updated process and parameter/state transitions. Galaxy adds higher-level status, branch/version selection, installation, rollback, recovery, and AGNOS compatibility checks. The update path records progress and interrupted state, validates Git targets, preserves rollback information, and handles submodules when required.

## Operational safety

Update and recovery operations can touch the checkout, device partitions, services, reboot state, or remote Git. They therefore have explicit failure and recovery paths and must be treated as device operations, not as ordinary test setup. Source tests rehearse these decisions with mocks/fixtures; they do not authorize or prove a live update.

## Related pages

- [[/openwiki/architecture/galaxy]]
- [[/openwiki/architecture/runtime-and-messaging]]
- [[/openwiki/testing/strategy]]
