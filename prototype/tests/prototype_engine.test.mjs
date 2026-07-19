import assert from "node:assert/strict";
import {
  sanitizeFrame,
  scenarioFrameFromStep,
  deterministicSteeringLimitScenario,
} from "../prototype_engine.js";
import { evaluateArtifact } from "../non_official_proxy_evaluator.js";

const staleFrame = sanitizeFrame({ confidenceScore: 0.6, timestampMs: 0 }, 5000);
assert.ok(staleFrame.stale, "stale data is detected");
assert.equal(staleFrame.steering.available, false, "stale means reserve unavailable");
assert.equal(staleFrame.confidenceScore, null, "stale confidence is unavailable, not historical");
assert.equal(staleFrame.interventionUrgency, null, "stale urgency is unavailable, not historical");

const frame = sanitizeFrame(
  {
    confidenceScore: 0.82,
    steeringHeadroom: 0.7,
    steeringAvailable: true,
    steeringSaturated: false,
    brakeHeadroom: 0.4,
    brakeAvailable: false,
    accelHeadroom: 0.2,
    accelAvailable: true,
    interventionUrgency: 0.25,
    timestampMs: 3000,
  },
  3000,
);
assert.equal(frame.confidenceClass, "green", "confidence class stays with continuous score");
assert.equal(frame.steering.available, true, "available steering keeps display");
assert.equal(frame.brake.available, false, "unavailable channel remains unavailable");
assert.equal(frame.accel.displayValue, 0.2, "accel headroom maps directly to display");
assert.equal(frame.steering.displayValue, 0.7, "steering headroom maps directly to display when unsaturated");

let t = Date.now();
const runSequence = deterministicSteeringLimitScenario.map((step) => {
  const candidate = scenarioFrameFromStep(step, {
    confidenceScore: 0.8,
    brakeHeadroom: 0.7,
    accelHeadroom: 0.6,
    interventionUrgency: 0.2,
  });
  const out = sanitizeFrame(candidate, t += 16);
  return out;
});

const latched = runSequence.find(
  (r, i, arr) => arr[i - 1]?.steering.saturated && r.steering.saturated && r.steering.displayValue === 0,
);
assert.ok(latched, "steering remains at zero while saturated");

const firstStepAtKnownTime = scenarioFrameFromStep(deterministicSteeringLimitScenario[0], {
  timestampMs: 4242,
});
assert.equal(firstStepAtKnownTime.timestampMs, 4242, "scenario accepts a deterministic clock");

const proxy = evaluateArtifact(frame);
assert.equal(proxy.official, false, "proxy cannot present itself as official");
assert.match(proxy.note, /NON-OFFICIAL/, "proxy label is unambiguous");
assert.ok(
  proxy.checks.some((check) => check.id === "no-joint-feasibility-claim" && check.pass),
  "proxy checks the independent-channel claim boundary",
);

console.log("prototype engine tests: pass");
