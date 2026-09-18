# Cause A A3 — Vehicle Validation Gate

Branch: `debug/cause-a-v2-ceoff-bypass`

Do not begin vehicle testing until the A3 CI syntax, predicate, targeted unit-test,
and device-build gates are green.

## Test profile

Use the same longitudinal profile as the 2026-09-17 diagnostic corpus:

- Experimental Mode: OFF
- Conditional Experimental: OFF
- Conditional Chill: OFF
- CE Stop Lights: OFF
- CE Open Road: OFF
- CE Model Stop Time: 0
- Force Stops: OFF
- Alpha Longitudinal: ON

Do not change unrelated longitudinal tuning between baseline and A3 validation.

## Stage 1 — low-risk no-lead validation

Use a controlled/private road or similarly low-risk environment with no nearby lead vehicle.

1. Engage longitudinal control at a stable speed above the low-speed throttle-gate range.
2. Set cruise at least 10 km/h above current ego speed.
3. Reproduce normal acceleration/recovery situations that previously produced the unwanted
   coast event.
4. Do not deliberately create a stop-light, obstacle, or lead-conflict scenario.
5. Disengage immediately if acceleration is unexpected or control behavior is abnormal.

PASS:
- no unexplained `allowThrottle=False -> aTarget ~= estimatedCoastAccel` event while
  materially below set speed in clean context;
- ordinary acceleration remains smooth;
- driver brake/disengagement behavior is unchanged.

## Stage 2 — passive protection validation

During ordinary driving only, collect examples where these contexts naturally occur:

- lead present;
- driver brake;
- model `shouldStop`;
- StarPilot explicit `disableThrottle`;
- Force Stop / stop-sign context only if the corresponding feature is intentionally enabled
  for a separate controlled test.

Do not manufacture a close-following or emergency-braking scenario on public roads.

PASS:
- A3 does not bypass the throttle gate on any protected frame;
- lead/brake/stop behavior remains at least as conservative as baseline.

## Required post-drive evidence

Extract the new route with the existing `extract_rlog.py` pipeline, then run the current
`cause_a_regression.py`/throttle scanner against the new segment timelines.

The final vehicle gate is PASS only if:

1. Cause-A false-coast does not recur in clean CE-off positive-demand context.
2. `hard_protected_bypass_frames_total == 0`.
3. No new actuator/planner mismatch appears.
4. No unexpected acceleration event is observed.
5. Driver brake, lead following, and stop protections remain intact.

Do not merge A3 into `StarPilot` until this gate is reviewed.
