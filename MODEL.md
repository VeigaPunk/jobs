# MODEL — bounded implementation recommendation

## Data contract

Add a compact control-owned UI contract rather than teaching rendering code every car/controller:

```text
modelV2.confidenceScore: Float32          # existing classifier score, before R/Y/G thresholds

controlsState.capability:
  steeringHeadroom: Float32              # [0,1]
  brakeHeadroom: Float32                 # [0,1]
  accelHeadroom: Float32                 # [0,1]
  steeringAvailable: Bool
  brakeAvailable: Bool
  accelAvailable: Bool
```

Producer rules:

1. `modeld/fill_model_msg.py` publishes its already-computed `score` and continues publishing the existing class unchanged.
2. `controlsd.py` computes capability after obtaining car-specific limits and after the lateral controller update.
3. For normalized torque/PID steering: `steeringHeadroom = clip(1 - abs(requested_torque), 0, 1)`. Force it to `0` when the selected lateral state's sustained `saturated` flag is true. For angle/curvature controllers, compute normalization inside that controller from its applicable dynamic limit; until implemented, publish `steeringAvailable=false` rather than inventing a denominator.
4. Given `(accel_min, accel_max)` and command `a`:
   - `accelHeadroom = clip(1 - max(a,0)/max(accel_max,epsilon), 0, 1)`
   - `brakeHeadroom = clip(1 - max(-a,0)/max(-accel_min,epsilon), 0, 1)`
5. Longitudinal values are available only when `CarParams.openpilotLongitudinalControl` and `carControl.longActive` are true. Do not imply knowledge of stock ACC reserve.
6. UI must reject stale/invalid messages and render capability as unavailable, not full.

FINDING: Producer-side normalization gives every renderer one stable `[0,1]` contract while preserving car-specific control semantics.
SOURCE: reconstructed from `controlsd.py`, controller union behavior, and per-interface acceleration limits
CONFIDENCE: high
IMPLICATION: Rendering stays simple and replay logs carry exactly what the driver saw.

## UI patch surface

Create `openpilot/selfdrive/ui/onroad/capability_renderer.py` as a `Widget`, then instantiate and render it at the documented custom-overlay point in `AugmentedRoadView._render()`.

Flat implementation:

- Confidence: a thin, persistent top rail with continuous fill from a monotonic display mapping of `confidenceScore`; pin its hue/category to canonical `modelV2.confidence` so the analog treatment never contradicts red/yellow/green classification.
- Capability: three short edge rails labeled with steering-wheel, brake, and accelerator glyphs. Filled length is remaining headroom, not current demand. Empty rail means exhausted; dashed/muted rail means unavailable.
- Escalation: no text or sound during ordinary fluctuation. At low headroom, increase rail contrast; at sustained steering saturation, reuse the existing alert system rather than adding a competing alarm.
- Filtering: asymmetric first-order display filter—depletion follows quickly, recovery slowly—to suppress flicker without delaying bad news. Keep raw values in logs/tests.
- Accessibility: shape/fill and labels carry meaning independently of color.

This uses only rectangles, lines, text/icons, and existing `Widget`/`pyray` calls. A historical Qt port is mechanically equivalent with `QPainter::drawRect/drawLine/drawText`; no shader, blur, 3-D transform, or custom scene graph is required.

## First reproducible slice

Overfit one steering-limit trace before generalizing:

1. Replay or fixture `carControl.actuators.torque`: `0.20 → 0.55 → 0.90 → 1.00`.
2. Expected raw headroom: `0.80 → 0.45 → 0.10 → 0.00`.
3. Hold controller `saturated=true`; expected displayed headroom remains `0.00` regardless of a transient command reduction.
4. Set `carState.steeringPressed=true` without saturation; expected UI indicates driver override through existing state and does **not** claim exhausted steering capability.
5. Mark source stale; expected rail becomes unavailable, never 100%.

Then add longitudinal boundary fixtures using each fixture's published `accel_min/max`, followed by one angle-control and one curvature-control fixture.

## Acceptance checks

- Exact class agreement with current `modelV2.confidence` at both thresholds.
- Headroom always finite and in `[0,1]` when available.
- No longitudinal capability shown for stock-ACC-only cars.
- No full-capability display from stale/default data.
- Existing speed, alert, driver-state, camera, and model-path render order remains unobstructed.
- Tests pin the upstream commit and record the controller type and accel bounds with each fixture.

## Rejected alternative

Reject treating `carOutput.actuatorsOutput.gas/brake` directly as universal remaining capability. They are post-controller actuator outputs, while the meaningful dynamic acceleration bounds are selected earlier by each car interface; the values answer “what was sent,” not reliably “how much controllable reserve remains.”

evidence: none — reverse-engineering artifact
