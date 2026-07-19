import assert from "node:assert/strict";
import {
  sanitizeFrame,
  scenarioFrameFromStep,
  deterministicSteeringLimitScenario,
  confidenceClassFromScore,
  riskCursorPosition,
  steeringHeadroomFromTorque,
} from "../prototype_engine.js";
import { evaluateArtifact } from "../non_official_proxy_evaluator.js";

assert.equal(confidenceClassFromScore(0.01164), "LOW", "score just below low threshold maps to LOW");
assert.equal(confidenceClassFromScore(0.01165), "RISING", "low threshold boundary maps to RISING");
assert.equal(confidenceClassFromScore(0.06156), "RISING", "score below rising threshold maps to RISING");
assert.equal(confidenceClassFromScore(0.06157), "IMMINENT", "rising threshold boundary maps to IMMINENT");
assert.equal(riskCursorPosition(0.01164), 1, "LOW risk stays on the LOW cursor stop");
assert.equal(riskCursorPosition(0.01165), 2, "threshold transition moves to RISING cursor stop");
assert.equal(riskCursorPosition(0.06157), 3, "upper threshold moves to IMMINENT cursor stop");

const staleBaseMs = 5000;
const staleFrame = sanitizeFrame({ confidenceScore: 0.6, timestampMs: 0 }, staleBaseMs);
assert.equal(staleFrame.stale, true, "stale data is detected");
assert.equal(staleFrame.validTimestamp, true, "stale has finite timestamp");
assert.equal(staleFrame.steering.available, false, "stale means reserve unavailable");
assert.equal(staleFrame.brake.available, false, "stale means brake unavailable");
assert.equal(staleFrame.accel.available, false, "stale means accel unavailable");
assert.equal(staleFrame.confidenceScore, null, "stale confidence is unavailable, not historical");
assert.equal(staleFrame.interventionUrgency, null, "stale urgency is unavailable, not historical");

const futureFrame = sanitizeFrame({ confidenceScore: 0.6, steeringHeadroom: 0.6, steeringAvailable: true, timestampMs: staleBaseMs + 1000 }, staleBaseMs);
assert.equal(futureFrame.validTimestamp, false, "future timestamp is rejected");
assert.equal(futureFrame.invalidInput, true, "future timestamp is explicitly invalid");
assert.equal(futureFrame.confidenceScore, null, "future timestamp makes confidence unavailable");
assert.equal(futureFrame.steering.available, false, "future timestamp blocks steering reserve");

const noTimestampFrame = sanitizeFrame({ confidenceScore: 0.2 }, staleBaseMs);
assert.equal(noTimestampFrame.validTimestamp, false, "absent timestamp is rejected");
assert.equal(noTimestampFrame.invalidInput, true, "absent timestamp flagged invalid");

for (const timestampMs of [NaN, Infinity, -Infinity]) {
  const invalid = sanitizeFrame({ timestampMs, steeringHeadroom: 0.5, steeringAvailable: true }, staleBaseMs);
  assert.equal(invalid.validTimestamp, false, "nonfinite timestamp is rejected");
  assert.equal(invalid.steering.available, false, "nonfinite timestamp cannot expose reserve");
}

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
    openpilotLongitudinalControl: true,
    longActive: true,
    interventionUrgency: 0.25,
    timestampMs: 3000,
  },
  3000,
);
assert.equal(frame.confidenceClass, "IMMINENT", "high intervention risk maps to IMMINENT");
assert.equal(frame.steering.available, true, "available steering keeps display");
assert.equal(frame.brake.available, false, "unavailable channel remains unavailable");
assert.equal(frame.accel.displayValue, 0.2, "accel headroom maps directly to display");
assert.equal(frame.steering.displayValue, 0.7, "steering headroom maps directly to display when unsaturated");

for (const steeringHeadroom of [0, 1]) {
  const boundaryFrame = sanitizeFrame({
    confidenceScore: 0.005,
    steeringHeadroom,
    steeringAvailable: true,
    timestampMs: 0,
  }, 0);
  assert.equal(boundaryFrame.steering.available, true, `headroom boundary ${steeringHeadroom} is accepted`);
  assert.equal(boundaryFrame.steering.value, steeringHeadroom, `headroom boundary ${steeringHeadroom} is preserved`);
}
for (const steeringHeadroom of [-0.01, 1.01]) {
  const outOfRangeFrame = sanitizeFrame({ steeringHeadroom, steeringAvailable: true, timestampMs: 0 }, 0);
  assert.equal(outOfRangeFrame.steering.available, false, `out-of-range headroom ${steeringHeadroom} is rejected`);
}

const staleBoundary = sanitizeFrame(
  {
    confidenceScore: 0.3,
    steeringHeadroom: 0.5,
    steeringAvailable: true,
    timestampMs: 1000,
  },
  2201,
);
assert.equal(staleBoundary.stale, true, "fresh timestamp can become stale across time");
assert.equal(staleBoundary.confidenceScore, null, "stale transition hides confidence");

const accUnavailable = sanitizeFrame({
  confidenceScore: 0.5,
  steeringHeadroom: 0.6,
  steeringAvailable: true,
  brakeHeadroom: 0.8,
  brakeAvailable: true,
  accelHeadroom: 0.2,
  accelAvailable: false,
  openpilotLongitudinalControl: false,
  longActive: false,
  timestampMs: 0,
}, 0);
assert.equal(accUnavailable.accel.available, false, "stock-ACC unavailable disables accel channel");
assert.equal(accUnavailable.brake.available, false, "stock-ACC unavailable disables brake channel");

const scenarioDefaultRaw = scenarioFrameFromStep(deterministicSteeringLimitScenario[0], { timestampMs: 0 });
assert.equal(scenarioDefaultRaw.openpilotLongitudinalControl, false, "scenario defaults openpilot longitudinal control off");
assert.equal(scenarioDefaultRaw.longActive, false, "scenario defaults longitudinal actuation off");
assert.equal(scenarioDefaultRaw.brakeAvailable, false, "scenario raw frame does not advertise brake reserve by default");
assert.equal(scenarioDefaultRaw.accelAvailable, false, "scenario raw frame does not advertise accel reserve by default");
const scenarioDefaultLongitudinal = sanitizeFrame(scenarioDefaultRaw, 0);
assert.equal(scenarioDefaultLongitudinal.brake.available, false, "scenario frame defaults stock-ACC controls off");
assert.equal(scenarioDefaultLongitudinal.accel.available, false, "scenario frame defaults stock-ACC controls off");

const scenarioExplicitLongitudinal = sanitizeFrame(scenarioFrameFromStep(deterministicSteeringLimitScenario[0], {
  openpilotLongitudinalControl: true,
  longActive: true,
  brakeAvailable: true,
  accelAvailable: true,
  timestampMs: 0,
}), 0);
assert.equal(scenarioExplicitLongitudinal.brake.available, true, "explicit openpilot longitudinal fixture enables brake reserve");
assert.equal(scenarioExplicitLongitudinal.accel.available, true, "explicit openpilot longitudinal fixture enables accel reserve");

assert.equal(steeringHeadroomFromTorque(-0.2, false), 0.8, "signed negative torque uses absolute demand");
assert.equal(steeringHeadroomFromTorque(-1.4, false), 0, "negative torque beyond normalized limit clamps headroom");
assert.equal(steeringHeadroomFromTorque(-0.2, true), 0, "saturation is terminal for either torque sign");
assert.equal(steeringHeadroomFromTorque(NaN, false), null, "nonfinite torque is unavailable");

const overrideFrame = sanitizeFrame({
  confidenceScore: 0.4,
  steeringHeadroom: 0.2,
  steeringAvailable: true,
  steeringSaturated: false,
  steeringPressed: true,
  timestampMs: 0,
}, 0);
assert.equal(overrideFrame.steering.available, false, "driver steering override suppresses steering reserve");
assert.equal(overrideFrame.steering.saturated, false, "driver override is not actuator saturation");

assert.equal(
  deterministicSteeringLimitScenario.some((step) => step.steeringPressed && step.steeringSaturated),
  false,
  "deterministic scenario never conflates driver override with saturation",
);
assert.ok(
  deterministicSteeringLimitScenario.some((step) => step.steeringPressed && !step.steeringSaturated),
  "deterministic scenario contains a distinct driver override step",
);

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
assert.equal(Object.hasOwn(proxy, "score"), false, "proxy exposes checks, never an aggregate score");
assert.match(proxy.note, /NON-OFFICIAL/, "proxy label is unambiguous");
assert.ok(proxy.checks.every((check) => typeof check.pass === "boolean"), "every proxy result is an explicit boolean check");
assert.ok(proxy.checks.every((check) => check.pass), "valid fixture passes each explicit proxy check");
const staleProxy = evaluateArtifact(staleFrame);
assert.equal(staleProxy.checks.find((check) => check.id === "stale-explicit")?.pass, true, "proxy explicitly verifies stale suppression");
const futureProxy = evaluateArtifact(futureFrame);
assert.equal(futureProxy.checks.find((check) => check.id === "timestamp-validity")?.pass, true, "proxy recognizes explicit future-skew rejection");
assert.ok(
  proxy.checks.some((check) => check.id === "no-joint-feasibility-claim" && check.pass),
  "proxy checks the independent-channel claim boundary",
);
assert.ok(
  proxy.checks.some((check) => check.id === "timestamp-validity" && check.pass),
  "proxy checks timestamp-rejection behavior explicitly",
);

console.log("prototype engine tests: pass");
