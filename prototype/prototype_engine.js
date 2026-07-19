const STALE_MS = 1200;

const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

const confidenceClassFromScore = (score) => {
  if (score === null || score === undefined || !Number.isFinite(score)) return "unknown";
  const clamped = clamp01(score);
  if (clamped >= 0.7) return "green";
  if (clamped >= 0.35) return "yellow";
  return "red";
};

const sanitizeFrame = (frame = {}, nowMs = Date.now()) => {
  const ts = Number.isFinite(frame.timestampMs) ? frame.timestampMs : nowMs;
  const stale = nowMs - ts > STALE_MS;
  const confidenceScore = !stale && Number.isFinite(frame.confidenceScore) ? clamp01(frame.confidenceScore) : null;

  const buildCapability = (value, available, saturated) => {
    const hasData = Number.isFinite(value);
    const capabilityAvailable = !!available && !stale && hasData;
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
    timestampMs: ts,
    stale,
    responsibility: "L2",
    confidenceScore,
    confidenceClass: confidenceClassFromScore(confidenceScore),
    steering: buildCapability(frame.steeringHeadroom, frame.steeringAvailable, frame.steeringSaturated),
    brake: buildCapability(frame.brakeHeadroom, frame.brakeAvailable, frame.brakeSaturated),
    accel: buildCapability(frame.accelHeadroom, frame.accelAvailable, frame.accelSaturated),
    interventionUrgency: !stale && Number.isFinite(frame.interventionUrgency)
      ? clamp01(frame.interventionUrgency)
      : null,
    steeringPressed: !!frame.steeringPressed,
    warning: !!frame.warning,
  };
};

const deterministicSteeringLimitScenario = [
  { label: "steady-trust", durationMs: 1200, steeringRequest: 0.20, steeringSaturated: false },
  { label: "approaching", durationMs: 1200, steeringRequest: 0.55, steeringSaturated: false },
  { label: "near-limit", durationMs: 1200, steeringRequest: 0.90, steeringSaturated: false },
  { label: "hard-limit", durationMs: 1200, steeringSaturated: true, steeringRequest: 1.00 },
  { label: "override-latched", durationMs: 1200, steeringSaturated: true, steeringRequest: 0.85 },
  { label: "override-latched", durationMs: 1200, steeringSaturated: true, steeringRequest: 0.30 },
  { label: "release", durationMs: 1200, steeringSaturated: false, steeringRequest: 0.20, },
  { label: "recovered", durationMs: 1200, steeringSaturated: false, steeringRequest: 0.10 },
];

const scenarioFrameFromStep = (step, opts = {}) => {
  const request = Number.isFinite(step.steeringRequest) ? step.steeringRequest : 0;
  const requestHeadroom = 1 - Math.min(1, Math.max(0, request));
  return {
    confidenceScore: opts.confidenceScore ?? 0.78,
    steeringHeadroom: requestHeadroom,
    steeringAvailable: true,
    steeringSaturated: !!step.steeringSaturated,
    brakeHeadroom: opts.brakeHeadroom ?? 0.62,
    brakeAvailable: true,
    brakeSaturated: false,
    accelHeadroom: opts.accelHeadroom ?? 0.55,
    accelAvailable: true,
    accelSaturated: false,
    interventionUrgency: opts.interventionUrgency ?? 0.4,
    steeringPressed: !!opts.steeringPressed,
    timestampMs: opts.timestampMs ?? Date.now(),
  };
};

export { STALE_MS, clamp01, confidenceClassFromScore, sanitizeFrame, deterministicSteeringLimitScenario, scenarioFrameFromStep };
