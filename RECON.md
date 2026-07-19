# RECON — current openpilot onroad UI and signal surface

Research snapshot: `commaai/openpilot` master commit `1c07e0075914b09685683ebb2cd9cb8138ea822f` and its `opendbc_repo` submodule commit `f95568e03cc5de650b7935c18ac56ee347caaae2` (public source observed 2026-07-19). No source was cloned or executed.

## Surface map

### Onroad UI flow

`openpilot/selfdrive/ui/ui.py`
→ creates `MainLayout` for the large display or `MiciMainLayout` for the small display
→ calls `ui_state.update()` once per render loop.

`openpilot/selfdrive/ui/layouts/main.py`
→ switches home/settings/onroad state
→ owns `AugmentedRoadView` as the car onroad layout.

`openpilot/selfdrive/ui/mici/layouts/main.py`
→ small-display navigation and delayed onroad transition
→ owns the mici-specific `AugmentedRoadView`.

`openpilot/selfdrive/ui/onroad/augmented_road_view.py`
→ camera frame
→ `ModelRenderer`
→ `HudRenderer`
→ `AlertRenderer`
→ `DriverStateRenderer`
→ state-colored perimeter border.

It contains an explicit custom-overlay extension point after the standard renderers. Coordinates are clipped to `_content_rect` and drawing uses `pyray` primitives.

`openpilot/selfdrive/ui/onroad/model_renderer.py`
→ projects `modelV2` position/lane/road-edge geometry
→ colors the path from predicted acceleration in experimental mode
→ reads `longitudinalPlan.allowThrottle` otherwise.

`openpilot/selfdrive/ui/onroad/hud_renderer.py`
→ current speed, set speed, experimental-mode button.

`openpilot/selfdrive/ui/ui_state.py`
→ one `messaging.SubMaster` already subscribes to all useful feeds: `modelV2`, `controlsState`, `selfdriveState`, `longitudinalPlan`, `carState`, `carControl`, `carOutput`, and `carParams`.

FINDING: Current master onroad UI is Python `pyray`/raylib widgets, not the older C++ Qt tree assumed by the challenge text.
SOURCE: `openpilot/selfdrive/ui/ui.py`; `openpilot/selfdrive/ui/onroad/augmented_road_view.py`; `openpilot/selfdrive/ui/SConscript`
CONFIDENCE: high
IMPLICATION: Implement against `Widget`/`pyray` on current master; the same design remains flat-Qt feasible with `QPainter`, but an `onroad.cc` patch would target an obsolete surface.

### Confidence signals

| Feed.field | Shape / semantics | Suitability |
|---|---|---|
| `modelV2.confidence` | enum `red/yellow/green` | Canonical three-class display, not continuous. |
| `modelV2.meta.disengagePredictions.{brakeDisengageProbs,gasDisengageProbs,steerOverrideProbs}` | five probabilities at 2, 4, 6, 8, 10 s | Concrete continuous ingredients. |
| `modelV2.meta.engagedProb` | scalar model output | Do not relabel as driving confidence; it is separately named and not used by the confidence classifier. |

The canonical classifier combines each horizon as
`1 - (1-brake)*(1-gas)*(1-steer)`, converts cumulative horizons to independent 2-second slices, maintains a rolling buffer, and thresholds its score at `0.01165` (green/yellow) and `0.06157` (yellow/red). The score itself is not published.

FINDING: The public message exposes both the final confidence class and its horizon probabilities, but not the continuous score used to assign the class.
SOURCE: `openpilot/cereal/log.capnp` (`ModelDataV2`); `openpilot/selfdrive/modeld/fill_model_msg.py`; `openpilot/selfdrive/modeld/constants.py`
CONFIDENCE: high
IMPLICATION: A faithful analog meter needs one small schema publication (`confidenceScore`) or must duplicate stateful classifier logic in the UI.

### Steering signals

| Feed.field | Semantics |
|---|---|
| `carControl.latActive` | lateral actuation currently active |
| `carControl.actuators.torque` | requested normalized steering command; controller scale is `[-1, 1]` |
| `carControl.actuators.steeringAngleDeg` / `.curvature` | requested command for angle/curvature cars; not normalized |
| `carOutput.actuatorsOutput.*` | car-controller output after car-specific limits/quirks; matches what is sent toward CAN |
| `controlsState.lateralControlState.*.output` | controller output, union-selected by controller type |
| `controlsState.lateralControlState.*.saturated` | sustained inability/limit state, filtered by `CarParams.steerLimitTimer` and context gates |
| `carState.steeringPressed` | driver steering override; must not be presented as actuator exhaustion |

`controlsd.py` also compares requested and `carOutput` commands to detect safety/car-controller limiting. Torque/PID controllers are normalized, but angle and curvature controllers use different physical units and saturation tests.

FINDING: A universal steering headroom scalar is directly computable only for normalized torque/PID control; angle and curvature cars require controller-owned normalization.
SOURCE: `openpilot/selfdrive/controls/lib/latcontrol.py`; `latcontrol_torque.py`; `latcontrol_angle.py`; `latcontrol_curvature.py`; `openpilot/selfdrive/controls/controlsd.py`
CONFIDENCE: high
IMPLICATION: Compute and publish headroom in controls, where controller type and limiting context are known; use `saturated` as the terminal state.

### Brake and acceleration signals

| Feed.field | Semantics |
|---|---|
| `carControl.longActive` | openpilot longitudinal actuation active |
| `carControl.actuators.accel` | requested acceleration in m/s² |
| `carOutput.actuatorsOutput.accel` | post-controller acceleration representation |
| `carOutput.actuatorsOutput.gas` / `.brake` | final car-controller values nominally in `[0,1]`, but actuator implementation detail |
| `longitudinalPlan.allowThrottle` / `.allowBrake` | planner permission, not remaining actuator capacity |
| `controlsState.longControlState` | off/PID/stopping/starting state |

`controlsd.py` obtains `(min_accel,max_accel)` from the selected car interface every control step. The generic opendbc defaults are `-3.5 m/s²` and `+2.0 m/s²`, but brands may override them dynamically. These live limits are not published.

FINDING: Exact longitudinal headroom exists transiently inside `controlsd`, but the current UI-visible schema carries the command without its dynamic denominator.
SOURCE: `openpilot/selfdrive/controls/controlsd.py`; `openpilot/selfdrive/controls/lib/longcontrol.py`; `opendbc/car/interfaces.py`; `opendbc/car/car.capnp`
CONFIDENCE: high
IMPLICATION: Publish current accel bounds/headrooms from `controlsd`; show unavailable when `openpilotLongitudinalControl` is false.

## Public source anchors

- https://github.com/commaai/openpilot/blob/1c07e0075914b09685683ebb2cd9cb8138ea822f/openpilot/selfdrive/ui/onroad/augmented_road_view.py
- https://github.com/commaai/openpilot/blob/1c07e0075914b09685683ebb2cd9cb8138ea822f/openpilot/selfdrive/ui/ui_state.py
- https://github.com/commaai/openpilot/blob/1c07e0075914b09685683ebb2cd9cb8138ea822f/openpilot/cereal/log.capnp
- https://github.com/commaai/openpilot/blob/1c07e0075914b09685683ebb2cd9cb8138ea822f/openpilot/selfdrive/modeld/fill_model_msg.py
- https://github.com/commaai/openpilot/blob/1c07e0075914b09685683ebb2cd9cb8138ea822f/openpilot/selfdrive/modeld/constants.py
- https://github.com/commaai/openpilot/blob/1c07e0075914b09685683ebb2cd9cb8138ea822f/openpilot/selfdrive/controls/controlsd.py
- https://github.com/commaai/openpilot/blob/1c07e0075914b09685683ebb2cd9cb8138ea822f/openpilot/selfdrive/controls/lib/latcontrol.py
- https://github.com/commaai/opendbc/blob/f95568e03cc5de650b7935c18ac56ee347caaae2/opendbc/car/car.capnp
- https://github.com/commaai/opendbc/blob/f95568e03cc5de650b7935c18ac56ee347caaae2/opendbc/car/interfaces.py

evidence: none — reverse-engineering artifact
