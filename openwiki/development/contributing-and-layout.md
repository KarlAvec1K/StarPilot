---
type: development
title: Repository Layout and Development Conventions
description: A contributor map for the openpilot-derived tree, StarPilot extensions, generated/vendor boundaries, Python tooling, and documentation entrypoints.
tags: [development, layout, python, documentation]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-ea70eb6c045047448e446296
    resource: repo://.gitignore
  - id: openwiki-source-05ccef8d4cf1698187f20464
    resource: repo://pyproject.toml
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Repository Layout and Development Conventions

## Layout

Core runtime code is organized across `selfdrive/`, `system/`, `common/`, `cereal/`, and `panda/`. StarPilot-specific additions live under `starpilot/`, while vehicle definitions and CAN support are maintained in `opendbc_repo/`. `tools/` contains replay, simulation, tuning, analysis, and device-development utilities.

The repository also carries sibling/vendor trees such as `msgq_repo`, `rednose_repo`, `tinygrad_repo`, and `teleoprtc_repo`. Their tests and style boundaries are intentionally separated by pytest and lint configuration.

## Python and imports

The project targets Python 3.11–3.12 and uses `pyproject.toml` for dependencies, pytest, Ruff, mypy, and optional docs/testing/dev groups. The Ruff configuration prefers package-qualified imports such as `openpilot.selfdrive` and bans ambiguous top-level imports from `selfdrive`, `common`, `system`, and `tools`.

## Generated and operational files

Build outputs, compiled extensions, device artifacts, models, caches, and local environment files are excluded or scoped by `.gitignore`. Do not treat generated state or vendored code as a safe place for hand edits; identify the source generator or owning subsystem first.

## Contributor workflow

Start from the relevant README and package tests, trace the owning process/message/parameter boundary, make the smallest source change, and run the narrowest focused test before broader checks. Keep hardware, device, network, and vehicle operations separate from ordinary source validation.

## Related pages

- [[/openwiki/quickstart]]
- [[/openwiki/testing/strategy]]
- [[/openwiki/operations/build-update]]
