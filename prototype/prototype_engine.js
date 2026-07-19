const STALE_MS = 1200;
const INTERVENTION_LOW = 0.01165;
const INTERVENTION_RISING = 0.06157;
const INTERVENTION_CURSOR = {
  LOW: "LOW",
  RISING: "RISING",
  IMMINENT: "IMMINENT",
};

const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

const confidenceClassFromScore = (score) => {
  if (score === null || score === undefined || !Number.isFinite(score)) return "unknown";
  const clamped = clamp01(score);
  if (clamped >= INTERVENTION_RISING) return INTERVENTION_CURSOR.IMMINENT;
  if (clamped >= INTERVENTION_LOW) return INTERVENTION_CURSOR.RISING;
  return INTERVENTION_CURSOR.LOW;
};

const riskCursorPosition = (score) => {
  const riskClass = confidenceClassFromScore(score);
  if (riskClass === INTERVENTION_CURSOR.LOW) return 1;
  if (riskClass === INTERVENTION_CURSOR.RISING) return 2;
  if (riskClass === INTERVENTION_CURSOR.IMMINENT) return 3;
  return 0;
};

const steeringHeadroomFromTorque = (requestedTorque, saturated = false) => {
  if (!Number.isFinite(requestedTorque)) return null;
  return saturated ? 0 : clamp01(1 - Math.abs(requestedTorque));
};

const sanitizeFrame = (frame = {}, nowMs = Date.now()) => {
  const nowTime = Number.isFinite(nowMs) ? nowMs : Date.now();
  const ts = Number.isFinite(frame.timestampMs) ? frame.timestampMs : NaN;
  const validTimestamp = Number.isFinite(ts) && ts <= nowTime;
  const stale = validTimestamp ? (nowTime - ts > STALE_MS) : true;
  const usable = validTimestamp && !stale;
  const confidenceScore = usable && Number.isFinite(frame.confidenceScore) ? clamp01(frame.confidenceScore) : null;
  const interventionUrgency = usable && Number.isFinite(frame.interventionUrgency) ? clamp01(frame.interventionUrgency) : null;
  const steeringPressed = !!frame.steeringPressed;
  const hasFiniteSteer = Number.isFinite(frame.steeringHeadroom);
  const longitudinalAvailable = frame.openpilotLongitudinalControl === true && frame.longActive === true;

  const buildCapability = (value, available, saturated) => {
    const hasData = Number.isFinite(value) && value >= 0 && value <= 1;
    const capabilityAvailable = !!available && usable && hasData;
    if (!capabilityAvailable) {
      return { value: null, displayValue: null, available: false, saturated: !!saturated };
    }
    const clamped = clamp01(value);
    const finalValue = clamped;
    return {
      value: clamped,
      displayValue: saturated ? 0 : finalValue,
      available: true,
      saturated: !!saturated,
    };
  };

  return {
    timestampMs: validTimestamp ? ts : null,
    validTimestamp,
    stale,
    boundary: {
      validSteeringHeadroom: hasFiniteSteer && frame.steeringHeadroom >= 0 && frame.steeringHeadroom <= 1,
      validScore: frame.confidenceScore === undefined || Number.isFinite(frame.confidenceScore),
      longitudinalAvailable,
    },
    invalidInput: !validTimestamp,
    responsibility: "L2",
    confidenceScore,
    confidenceClass: confidenceClassFromScore(confidenceScore),
    steering: buildCapability(
      frame.steeringHeadroom,
      frame.steeringAvailable && !steeringPressed,
      frame.steeringSaturated && !steeringPressed,
    ),
    brake: buildCapability(frame.brakeHeadroom, frame.brakeAvailable && longitudinalAvailable, frame.brakeSaturated),
    accel: buildCapability(frame.accelHeadroom, frame.accelAvailable && longitudinalAvailable, frame.accelSaturated),
    interventionUrgency,
    steeringPressed,
    warning: !!frame.warning,
  };
};

const deterministicSteeringLimitScenario = [
  { label: "steady-trust", durationMs: 1200, steeringRequest: 0.20, steeringSaturated: false },
  { label: "approaching", durationMs: 1200, steeringRequest: 0.55, steeringSaturated: false },
  { label: "near-limit", durationMs: 1200, steeringRequest: 0.90, steeringSaturated: false },
  { label: "hard-limit", durationMs: 1200, steeringSaturated: true, steeringRequest: 1.00 },
  { label: "saturation-held", durationMs: 1200, steeringSaturated: true, steeringRequest: 0.85 },
  { label: "saturation-held", durationMs: 1200, steeringSaturated: true, steeringRequest: 0.30 },
  { label: "release", durationMs: 1200, steeringSaturated: false, steeringRequest: 0.20, },
  { label: "driver-override", durationMs: 1200, steeringSaturated: false, steeringPressed: true, steeringRequest: 0.20 },
  { label: "recovered", durationMs: 1200, steeringSaturated: false, steeringRequest: 0.10 },
];

const scenarioFrameFromStep = (step, opts = {}) => {
  const request = Number.isFinite(step.steeringRequest) ? step.steeringRequest : 0;
  const requestHeadroom = steeringHeadroomFromTorque(request, !!step.steeringSaturated);
  const openpilotLongitudinalControl = opts.openpilotLongitudinalControl === true;
  const longActive = opts.longActive === true;
  const longitudinalAvailable = openpilotLongitudinalControl && longActive;
  return {
    confidenceScore: opts.confidenceScore ?? 0.78,
    steeringHeadroom: requestHeadroom,
    steeringAvailable: true,
    steeringSaturated: !!step.steeringSaturated,
    brakeHeadroom: opts.brakeHeadroom ?? 0.62,
    brakeAvailable: longitudinalAvailable && opts.brakeAvailable === true,
    brakeSaturated: false,
    accelHeadroom: opts.accelHeadroom ?? 0.55,
    accelAvailable: longitudinalAvailable && opts.accelAvailable === true,
    accelSaturated: false,
    openpilotLongitudinalControl,
    longActive,
    interventionUrgency: opts.interventionUrgency ?? 0.4,
    steeringPressed: step.steeringPressed ?? !!opts.steeringPressed,
    timestampMs: opts.timestampMs ?? Date.now(),
  };
};

export {
  STALE_MS,
  INTERVENTION_LOW,
  INTERVENTION_RISING,
  clamp01,
  confidenceClassFromScore,
  riskCursorPosition,
  steeringHeadroomFromTorque,
  sanitizeFrame,
  deterministicSteeringLimitScenario,
  scenarioFrameFromStep,
};
