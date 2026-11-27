# Ascent Grade Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ascent-only grade estimation and bounded between-trip learning in shadow mode, then deploy it to the Comma for data collection.

**Architecture:** A small controls helper filters pitch, applies eligibility and close-lead gates, and maintains a device/fingerprint-scoped bounded residual map. The longitudinal planner records the candidate correction and learner state in the existing `longitudinalPlan` stream but does not add the correction to the driving target in this rollout; live application remains disabled until shadow data has been reviewed. Existing planner arbitration and vehicle actuation remain untouched.

**Tech Stack:** Python, NumPy, cereal Cap'n Proto, persistent `Params`, pytest, Ruff.

**Spec:** `docs/superpowers/specs/2026-11-26-ascent-grade-adaptive-longitudinal-design.md`

## Global Constraints

- Ascent-only behavior; require `SUBARU_ASCENT` and openpilot longitudinal control.
- Invalid or low-confidence grade produces zero correction.
- No correction while a close lead, stop, brake, driver override, turn cap, force-decel, or inactive longitudinal control applies.
- The new correction is shadow-only for this rollout; no change to the applied acceleration target.
- The learned map is bounded and keyed by Comma device identity plus car fingerprint; do not persist VIN data.
- No source-code self-patching, automatic commit, Git push, or deployment from the runtime learner.

## Review Focus

- A close or closing lead must block the candidate even if the cruise speed is well above ego speed; cover distance and TTC gates in helper tests.
- Orientation pitch may reflect vehicle-body motion; invalid or implausible values must produce no candidate.
- A rejected sample must not modify persistent learner state; cover lead, brake, stop, override, and inactive cases.
- Corrupt or mismatched persisted data must fail closed to a zero residual without crashing planner startup.
- Shadow candidate must never change `aTarget`; assert planner output stays identical with the feature path enabled.

---

### Task 1: Grade estimator and eligibility gates

**Files:**
- Create: `selfdrive/controls/lib/ascent_grade_adaptive.py`
- Create: `selfdrive/controls/tests/test_ascent_grade_adaptive.py`

**Interfaces:**
- Produce `GradeEstimate` with filtered pitch, uphill acceleration estimate, confidence/validity, and rejection reason.
- Produce `is_close_lead(lead, v_ego, t_follow) -> bool` and `is_sample_eligible(...) -> tuple[bool, str]` as pure helpers.
- The planner and learner consume those helpers; no runtime persistence in this task.

- [x] Write tests for flat/uphill/downhill pitch, non-finite/out-of-range pitch, ramp filtering, close gap, closing TTC, far lead, missing lead, and each eligibility veto.
- [x] Run `pytest selfdrive/controls/tests/test_ascent_grade_adaptive.py -q`; confirm the tests fail because the new helpers are absent.
- [x] Implement minimal pure helpers using gravity `9.81 m/s²`, grade clamp `±0.27 rad`, close gap `desired_follow_distance + 4 m`, close TTC `< 6 s` only while closing faster than `0.5 m/s`, and catch-up headroom `v_cruise - v_ego >= 1.0 m/s`.
- [x] Run the focused pytest target and confirm it passes.
- [x] Run Ruff on the new module and test file.
- [x] Included with the persistent learner and planner telemetry in implementation commit `0c38be56bd`.

### Task 2: Persistent shadow learner

**Files:**
- Modify: `common/params_keys.h`
- Modify: `selfdrive/controls/lib/ascent_grade_adaptive.py`
- Modify: `selfdrive/controls/tests/test_ascent_grade_adaptive.py`

**Interfaces:**
- `GradeLearner(params, vehicle_fingerprint, device_id)` loads only a matching, validated map.
- `observe(speed_mps, grade_accel_mps2, speed_error_mps, eligible) -> LearnResult` updates bounded shadow statistics only for eligible data.
- `LearnResult` exposes the candidate residual, sample count, and eligibility/rejection reason.
- Persistent key `AscentGradeLearning` stores JSON; `AscentGradeLearningEnabled` defaults to `0` and is a future live-application gate.

- [x] Write tests for accepted repeated samples, bounds, update-rate limiting, decay/no evidence, disabled application, malformed JSON, fingerprint mismatch, device mismatch, and zeroed recovery.
- [x] Run the focused tests and confirm they fail for the missing learner.
- [x] Implement the validated persistent learner with a maximum residual of `0.25 m/s²`, a per-update step no greater than `0.01 m/s²`, and no use of rejected samples.
- [x] Run the focused tests and confirm they pass.
- [x] Run Ruff on the new module and test file.
- [x] Included with the estimator and planner telemetry in implementation commit `0c38be56bd`.

### Task 3: Planner shadow telemetry

**Files:**
- Modify: `cereal/log.capnp`
- Modify: `selfdrive/controls/lib/longitudinal_planner.py`
- Modify: `selfdrive/controls/tests/test_longitudinal_planner.py`

**Interfaces:**
- The planner constructs the estimator/learner only for `SUBARU_ASCENT` with openpilot longitudinal control.
- `longitudinalPlan` publishes grade estimate validity, estimated uphill acceleration, candidate feed-forward, learned residual, learner sample count, and close-lead block state.
- The planner records the candidate for shadow analysis but leaves final `aTarget` unchanged.

- [x] Write planner tests proving the published target remains unchanged and shadow telemetry is populated.
- [x] Run the new planner test and confirm failure before production edits.
- [x] Add sequential `LongitudinalPlan` fields, integrate shadow update after target arbitration, and preserve existing arbitration.
- [x] Run the new test and existing longitudinal planner target; confirm all pass.
- [x] Run Ruff on the new Python module/tests and validate Cap’n Proto schema loading through planner tests. Existing unrelated lint findings remain in `longitudinal_planner.py`.
- [x] Included with the estimator and learner in implementation commit `0c38be56bd`.

### Task 4: Branch and Comma verification/deployment

**Files:**
- No further source files unless a validation fix is required.

**Interfaces:**
- The feature branch contains the approved design, implementation plan, and combined implementation commit.
- The Comma install is allowed only after a read-only preflight confirms device identity, expected checkout/branch, clean or safely preservable worktree, `IsOffroad=1`, and `IsOnroad=0`.

- [x] Run the targeted controls tests and existing acceleration tests: `582 passed`; Ruff passes on the new helper and helper tests.
- [x] Review the feature scope and confirm the shadow path never modifies `aTarget`.
- [x] Pushed `codex/ascent-stopgo-118-20261119` to `origin` and verified remote SHA `0c38be56bd2aef52b2bca79c76f05610a2d4004a`.
- [ ] Repeat the Comma branch/status/offroad preflight for the repair before installing or rebooting. The previous installation confirmed `IsOffroad=1`, `IsOnroad=0`; verify the current state again.
- [ ] Install the verified commit, restart services/reboot only while offroad, then verify commit, active service, offroad/onroad state, and Panda loader completion.
- [ ] Record the deployed commit and explicit shadow-only validation boundary in the project note.

#### Post-deployment defect and repair

The first deployed build crashed `plannerd` because `SubMaster` implements indexed service access but has no `.get()` method. The resulting missing `longitudinalPlan` publisher raised communication alerts and prevented both longitudinal and lateral control from becoming available. The fix reads the already-subscribed `starpilotCarState` with `sm["starpilotCarState"]`; a regression test uses a SubMaster-shaped object with no `get()` method. The targeted controls tests pass at `582 passed` after this repair.
