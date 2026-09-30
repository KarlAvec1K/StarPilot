---
type: subsystem
title: Navigation, Routes, and Media
description: Navigation state, route recordings, replay, and WebRTC media cross the messaging, device-storage, Galaxy API, and UI boundaries.
tags: [navigation, media, replay, webrtc]
verified:
  - by: openwiki/0.6.1
    at: 2026-09-30T03:59:26.745Z
sources:
  - id: openwiki-source-bbcb7e2e65cd975a89e800bf
    resource: repo://starpilot/navigation/test_destination_store.py
  - id: openwiki-source-e7c9935a5a86ff39486ec838
    resource: repo://starpilot/system/the_galaxy/the_galaxy.py
  - id: openwiki-source-088d88b06780515df73b49eb
    resource: repo://system/webrtc/tests/test_stream_session.py
  - id: openwiki-source-c26c0a26a5c966d73e85d08f
    resource: repo://system/webrtc/webrtcd.py
  - id: openwiki-source-47cb8078bccb818496515ff0
    resource: repo://tools/replay/fake_nav_demo.py
  - id: openwiki-source-316ebc97302e73da52b41d60
    resource: repo://tools/replay/tests/test_onroad_config.py
generated: { by: "codex", at: "2026-09-30T03:59:26.745Z" }
---

# Navigation, Routes, and Media

## Navigation

StarPilot navigation is split between navigation processes, persistent destination state, UI presentation, and Galaxy's remote API. The navigation helpers normalize destinations and expose them to the runtime/UI boundary; Galaxy reads and writes the corresponding parameter state rather than embedding navigation logic in the browser.

The UI consumes navigation messages and renders route/instruction cards. The navigation tests cover destination storage, route-engine behavior, navigationd, mapd wrapping, and UI structure, which keeps state normalization separate from rendering.

## Recorded routes and media

Galaxy route helpers discover recorded footage, associate segments with metadata, resolve thumbnails, and serve selected media. Thumbnail and remux work is cached or scheduled so an HTTP request does not need to perform every media transformation synchronously.

The replay tools provide local message playback and synthetic demos for navigation, CAN, UI, and StarPilot plans. Replay is an analysis/development boundary: it exercises message consumers with controlled inputs and is not a substitute for a live vehicle test.

## Live streaming

The WebRTC daemon subscribes to messaging services and manages dynamic publication of media streams. Its helpers and stream-session tests cover session setup, service selection, and failure handling. Galaxy exposes the management surface; the WebRTC process owns the streaming runtime.

## Verification boundary

Tests cover navigation state, route scanning and metadata, replay configuration, WebRTC helpers/session behavior, and UI consumers. They establish source and mocked-process contracts only; media-device availability, network reachability, and physical driving remain external validation conditions.

## Related pages

- [[/openwiki/architecture/galaxy]]
- [[/openwiki/architecture/runtime-and-messaging]]
- [[/openwiki/testing/strategy]]
