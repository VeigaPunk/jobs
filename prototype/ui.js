import {
  STALE_MS,
  sanitizeFrame,
  deterministicSteeringLimitScenario,
  scenarioFrameFromStep,
  confidenceClassFromScore,
  riskCursorPosition,
  steeringHeadroomFromTorque,
} from "./prototype_engine.js";

const ids = {
  confidence: {
    rail: document.getElementById("confidence"),
    fill: document.getElementById("confidenceFill"),
    label: document.getElementById("confidenceLabel"),
  },
  urgency: {
    bar: document.getElementById("urgency"),
    fill: document.getElementById("urgencyFill"),
    text: document.getElementById("urgencyText"),
  },
  reserves: {
    steer: document.getElementById("steer").querySelector(".rail-fill"),
    brake: document.getElementById("brake").querySelector(".rail-fill"),
    accel: document.getElementById("accel").querySelector(".rail-fill"),
  },
  state: document.getElementById("reserveState"),
  confidenceInput: document.getElementById("confidenceInput"),
  confidenceOutput: document.getElementById("confidenceOutput"),
  steerReqInput: document.getElementById("steerRequestInput"),
  steerReqOutput: document.getElementById("steerReqOutput"),
  steerHeadOutput: document.getElementById("steerHeadOutput"),
  brakeInput: document.getElementById("brakeInput"),
  brakeOutput: document.getElementById("brakeOutput"),
  accelInput: document.getElementById("accelInput"),
  accelOutput: document.getElementById("accelOutput"),
  urgencyInput: document.getElementById("urgencyInput"),
  urgencyOutput: document.getElementById("urgencyOutput"),
  steerAvail: document.getElementById("steerAvail"),
  brakeAvail: document.getElementById("brakeAvail"),
  accelAvail: document.getElementById("accelAvail"),
  longControlActive: document.getElementById("longControlActive"),
  steerSat: document.getElementById("steerSat"),
  steerPressed: document.getElementById("steerPressed"),
  dataFresh: document.getElementById("dataFresh"),
  ageInput: document.getElementById("ageInput"),
  ageOutput: document.getElementById("ageOutput"),
  urgencyHint: document.getElementById("urgencyHint"),
  runScenario: document.getElementById("runScenario"),
  seedScenario: document.getElementById("seedScenario"),
  scenarioState: document.getElementById("scenarioState"),
};

const reserveCards = {
  steer: document.getElementById("steer"),
  brake: document.getElementById("brake"),
  accel: document.getElementById("accel"),
};

const setFillState = (el, pct, available, marker) => {
  el.style.width = `${Math.round((pct || 0) * 100)}%`;
  el.parentElement.classList.toggle("unavailable-state", !available);
  const label = marker ? marker.querySelector(".rail-meta") : null;
  if (label) {
    if (!available) {
      label.textContent = "data unavailable";
    } else {
      label.textContent = `reserve ${(pct * 100).toFixed(0)}%`;
    }
  }
  marker.setAttribute("aria-valuetext", available ? `${Math.round(pct * 100)} percent reserve` : "unavailable");
  if (available) marker.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
  else marker.removeAttribute("aria-valuenow");
};

const deriveUiFrameFromInputs = () => {
  const age = Number(ids.ageInput.value);
  const timestamp = Number.isFinite(age) ? Date.now() - age : Date.now();
  return {
    confidenceScore: Number(ids.confidenceInput.value),
    steeringHeadroom: steeringHeadroomFromTorque(Number(ids.steerReqInput.value), ids.steerSat.checked),
    steeringAvailable: ids.steerAvail.checked,
    steeringSaturated: ids.steerSat.checked,
    brakeHeadroom: Number(ids.brakeInput.value),
    brakeAvailable: ids.brakeAvail.checked,
    brakeSaturated: false,
    accelHeadroom: Number(ids.accelInput.value),
    accelAvailable: ids.accelAvail.checked,
    accelSaturated: false,
    openpilotLongitudinalControl: ids.longControlActive.checked,
    longActive: ids.longControlActive.checked,
    interventionUrgency: Number(ids.urgencyInput.value),
    steeringPressed: ids.steerPressed.checked,
    timestampMs: ids.dataFresh.checked ? timestamp : NaN,
  };
};

const confidenceValueToAria = (cls) => {
  if (cls === "IMMINENT") return "3";
  if (cls === "RISING") return "2";
  if (cls === "LOW") return "1";
  return "0";
};

const paint = (frame) => {
  const d = sanitizeFrame(frame);

  ids.confidence.label.textContent = d.confidenceClass;
  const cursorPosition = riskCursorPosition(d.confidenceScore);
  ids.confidence.fill.style.left = cursorPosition ? `${(cursorPosition * 2 - 1) * 100 / 6}%` : "0";
  ids.confidence.fill.hidden = cursorPosition === 0;
  ids.confidence.rail.setAttribute("aria-valuemin", "1");
  ids.confidence.rail.setAttribute("aria-valuemax", "3");
  ids.confidence.rail.setAttribute("aria-valuetext", d.confidenceScore === null ? "unavailable" : `intervention risk ${d.confidenceClass}`);
  if (cursorPosition) ids.confidence.rail.setAttribute("aria-valuenow", confidenceValueToAria(d.confidenceClass));
  else ids.confidence.rail.removeAttribute("aria-valuenow");
  ids.confidence.rail.className = "rail";
  ids.confidence.rail.classList.add(d.confidenceClass);

  setFillState(ids.reserves.steer, d.steering.displayValue, d.steering.available, reserveCards.steer);
  setFillState(ids.reserves.brake, d.brake.displayValue, d.brake.available, reserveCards.brake);
  setFillState(ids.reserves.accel, d.accel.displayValue, d.accel.available, reserveCards.accel);

  const urgencyAvailable = d.interventionUrgency !== null;
  ids.urgency.fill.style.width = `${Math.round((d.interventionUrgency || 0) * 100)}%`;
  ids.urgency.text.textContent = urgencyAvailable ? `${Math.round(d.interventionUrgency * 100)}%` : "n/a";
  ids.urgency.bar.classList.toggle("unavailable-state", !urgencyAvailable);
  ids.urgency.bar.setAttribute("aria-valuetext", urgencyAvailable ? `${Math.round(d.interventionUrgency * 100)} percent` : "unavailable");
  if (urgencyAvailable) ids.urgency.bar.setAttribute("aria-valuenow", String(Math.round(d.interventionUrgency * 100)));
  else ids.urgency.bar.removeAttribute("aria-valuenow");

  const states = [];
  if (d.stale) states.push(`stale > ${STALE_MS}ms`);
  if (!d.steering.available) states.push("steering unavailable");
  if (!d.brake.available) states.push("brake unavailable");
  if (!d.accel.available) states.push("accel unavailable");
  if (d.steeringPressed) states.push("driver steering override active");
  if (d.warning) states.push("planner warning active");
  ids.state.textContent = states.length ? `Explicit states: ${states.join(", ")}` : "All channels available";

  ids.urgencyHint.textContent = d.stale
    ? "Intervention urgency is independent but suppressed by staleness and invalid timestamp handling where applicable."
    : "Urgency channel is independent of confidence and actuator channels.";
};

function syncReadouts() {
  ids.confidenceOutput.textContent = confidenceClassFromScore(Number(ids.confidenceInput.value));
  ids.steerReqOutput.textContent = Number(ids.steerReqInput.value).toFixed(2);
  const req = Number(ids.steerReqInput.value);
  const headroom = steeringHeadroomFromTorque(req, ids.steerSat.checked);
  ids.steerHeadOutput.textContent = headroom === null ? "unavailable" : headroom.toFixed(2);
  ids.brakeOutput.textContent = ids.brakeInput.value;
  ids.accelOutput.textContent = ids.accelInput.value;
  ids.urgencyOutput.textContent = ids.urgencyInput.value;
  ids.ageOutput.textContent = ids.ageInput.value;
}

let scenarioHandle = null;
let activeFrame = deriveUiFrameFromInputs();

ids.steerReqInput.addEventListener("input", syncReadouts);
[
  ids.confidenceInput,
  ids.brakeInput,
  ids.accelInput,
  ids.urgencyInput,
  ids.steerAvail,
  ids.brakeAvail,
  ids.accelAvail,
  ids.longControlActive,
  ids.steerSat,
  ids.steerPressed,
  ids.dataFresh,
  ids.ageInput,
].forEach((el) =>
  el.addEventListener("input", () => {
    syncReadouts();
    activeFrame = deriveUiFrameFromInputs();
    paint(activeFrame);
  })
);

ids.runScenario.addEventListener("click", () => {
  if (scenarioHandle) return;
  ids.runScenario.disabled = true;
  let index = 0;
  const runStep = () => {
    if (index >= deterministicSteeringLimitScenario.length) {
      clearInterval(scenarioHandle);
      scenarioHandle = null;
      ids.runScenario.disabled = false;
      return;
    }
    const step = deterministicSteeringLimitScenario[index];
    const next = scenarioFrameFromStep(step, {
      confidenceScore: Number(ids.confidenceInput.value),
      brakeHeadroom: Number(ids.brakeInput.value),
      brakeAvailable: ids.brakeAvail.checked,
      accelHeadroom: Number(ids.accelInput.value),
      accelAvailable: ids.accelAvail.checked,
      interventionUrgency: Number(ids.urgencyInput.value),
      steeringPressed: ids.steerPressed.checked,
      openpilotLongitudinalControl: ids.longControlActive.checked,
      longActive: ids.longControlActive.checked,
      timestampMs: Date.now(),
    });
    ids.scenarioState.textContent = `Step ${index + 1} of ${deterministicSteeringLimitScenario.length}: ${step.label}`;
    ids.confidenceInput.value = String(next.confidenceScore);
    ids.steerReqInput.value = String(step.steeringRequest.toFixed(2));
    ids.steerSat.checked = !!next.steeringSaturated;
    syncReadouts();
    activeFrame = next;
    paint(next);
    index += 1;
  };

  runStep();
  scenarioHandle = setInterval(runStep, deterministicSteeringLimitScenario[index - 1].durationMs);
});

ids.seedScenario.addEventListener("click", () => {
  if (scenarioHandle) {
    clearInterval(scenarioHandle);
    scenarioHandle = null;
    ids.runScenario.disabled = false;
  }
  ids.confidenceInput.value = "0.005";
  ids.steerReqInput.value = "0.20";
  ids.brakeInput.value = "0.62";
  ids.accelInput.value = "0.55";
  ids.urgencyInput.value = "0.40";
  ids.steerSat.checked = false;
  ids.scenarioState.textContent = "Manual exploration";
  syncReadouts();
  activeFrame = deriveUiFrameFromInputs();
  paint(activeFrame);
});

setInterval(() => {
  if (!activeFrame) return;
  paint(activeFrame);
}, 200);

syncReadouts();
paint(activeFrame);
