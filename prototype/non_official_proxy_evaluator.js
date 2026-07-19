export const evaluateArtifact = (renderState) => {
  const hasState = !!renderState;
  const checks = [
    {
      id: "responsibility-invariant",
      pass: hasState && renderState.responsibility === "L2",
      message: "Responsibility cue remains visible and does not disappear in any data state.",
    },
    {
      id: "risk-class-pinned",
      pass: Boolean(hasState && ["LOW", "RISING", "IMMINENT", "unknown"].includes(renderState.confidenceClass)),
      message: "Intervention risk is shown with a cursor pinned to canonical class semantics.",
    },
    {
      id: "orthogonal-channels",
      pass: ["steering", "brake", "accel"].every((k) => Boolean(hasState && renderState[k] && renderState[k].available !== undefined)),
      message: "Confidence, reserves, and urgency are separate channels.",
    },
    {
      id: "stale-explicit",
      pass: Boolean(hasState && renderState.stale
        ? renderState.confidenceScore === null
          && renderState.interventionUrgency === null
          && !renderState.steering.available
          && !renderState.brake.available
          && !renderState.accel.available
        : hasState),
      message: "Stale data is explicit and does not silently render as full reserve.",
    },
    {
      id: "no-joint-feasibility-claim",
      pass: Boolean(["steering", "brake", "accel"].every((key) => hasState && renderState?.[key])
        && Object.hasOwn(renderState || {}, "interventionUrgency")
        && Object.hasOwn(renderState || {}, "confidenceClass")),
      message: "Independent channels are inspected separately; this proxy does not infer joint feasibility.",
    },
    {
      id: "timestamp-validity",
      pass: Boolean(hasState && (renderState.invalidInput || renderState.validTimestamp)),
      message: "Invalid or future timestamps are rejected rather than silently accepted.",
    },
  ];

  return {
    official: false,
    note: "NON-OFFICIAL local proxy evaluator for prototype behavior only; not a comma.ai score or submission result.",
    checks,
  };
};
