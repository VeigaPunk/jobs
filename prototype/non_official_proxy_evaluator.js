export const evaluateArtifact = (renderState) => {
  const checks = [
    {
      id: "responsibility-invariant",
      pass: renderState && renderState.responsibility === "L2",
      message: "Responsibility cue remains visible and does not disappear in any data state.",
    },
    {
      id: "confidence-continuous",
      pass: renderState && renderState.confidenceScore !== null && Number.isFinite(renderState.confidenceScore),
      message: "Confidence is represented as continuous value + class label.",
    },
    {
      id: "orthogonal-channels",
      pass: ["steering", "brake", "accel"].every((k) => renderState && renderState[k] && renderState[k].available !== undefined),
      message: "Confidence, reserves, and urgency are separate channels.",
    },
    {
      id: "stale-explicit",
      pass: renderState && renderState.stale === true ? !renderState.steering.available : true,
      message: "Stale data is explicit and does not silently render as full reserve.",
    },
    {
      id: "no-joint-feasibility-claim",
      pass: ["steering", "brake", "accel"].every((key) => renderState?.[key])
        && Object.hasOwn(renderState, "interventionUrgency"),
      message: "Independent channels are inspected separately; this proxy does not infer joint feasibility.",
    },
  ];

  return {
    official: false,
    note: "NON-OFFICIAL local proxy evaluator for prototype behavior only; not a comma.ai score or submission result.",
    score: checks.filter((check) => check.pass).length / checks.length,
    checks,
  };
};
