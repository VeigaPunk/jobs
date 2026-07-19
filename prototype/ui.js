import {
  STALE_MS,
  sanitizeFrame,
  deterministicSteeringLimitScenario,
  scenarioFrameFromStep,
} from "./prototype_engine.js";

const ids = {
  confidence: {
    rail: document.getElementById("confidence"),
    fill: document.getElementById("confidenceFill"),
    text: document.getElementById("confidenceFillText"),
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
  steerHeadInput: document.getElementById("steerHeadInput"),
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
  return {
    confidenceScore: Number(ids.confidenceInput.value),
    steeringHeadroom: Number(ids.steerHeadInput.value),
    steeringAvailable: ids.steerAvail.checked,
    steeringSaturated: ids.steerSat.checked,
    brakeHeadroom: Number(ids.brakeInput.value),
    brakeAvailable: ids.brakeAvail.checked,
    brakeSaturated: false,
    accelHeadroom: Number(ids.accelInput.value),
    accelAvailable: ids.accelAvail.checked,
    accelSaturated: false,
    interventionUrgency: Number(ids.urgencyInput.value),
    steeringPressed: ids.steerPressed.checked,
    timestampMs: ids.dataFresh.checked ? Date.now() - age : Date.now() - 5000,
  };
};

const paint = (frame) => {
  const d = sanitizeFrame(frame);

  ids.confidence.label.textContent = d.confidenceClass;
  ids.confidence.text.textContent = d.confidenceScore === null ? "n/a" : `${Math.round(d.confidenceScore * 100)}%`;
  ids.confidence.fill.style.width = `${Math.round((d.confidenceScore || 0) * 100)}%`;
  ids.confidence.rail.setAttribute("aria-valuetext", d.confidenceScore === null ? "unavailable" : `${Math.round(d.confidenceScore * 100)} percent`);
  if (d.confidenceScore === null) ids.confidence.rail.removeAttribute("aria-valuenow");
  else ids.confidence.rail.setAttribute("aria-valuenow", String(Math.round(d.confidenceScore * 100)));
  ids.confidence.rail.className = "rail";
  ids.confidence.rail.classList.add(d.confidenceClass);

  setFillState(ids.reserves.steer, d.steering.displayValue, d.steering.available, reserveCards.steer);
  setFillState(ids.reserves.brake, d.brake.displayValue, d.brake.available, reserveCards.brake);
  setFillState(ids.reserves.accel, d.accel.displayValue, d.accel.available, reserveCards.accel);

  const urgencyAvailable = d.interventionUrgency !== null;
  ids.urgency.fill.style.width = `${Math.round((d.interventionUrgency || 0) * 100)}%`;
  ids.urgency.text.textContent = urgencyAvailable ? `${Math.round(d.interventionUrgency * 100)}%` : "n/a";
  ids.urgency.classList.toggle("unavailable-state", !urgencyAvailable);
  ids.urgency.setAttribute("aria-valuetext", urgencyAvailable ? `${Math.round(d.interventionUrgency * 100)} percent` : "unavailable");
  if (urgencyAvailable) ids.urgency.setAttribute("aria-valuenow", String(Math.round(d.interventionUrgency * 100)));
  else ids.urgency.removeAttribute("aria-valuenow");

  const states = [];
  if (d.stale) states.push(`stale > ${STALE_MS}ms`);
  if (!d.steering.available) states.push("steering unavailable");
  if (!d.brake.available) states.push("brake unavailable");
  if (!d.accel.available) states.push("accel unavailable");
  if (d.steeringPressed) states.push("driver steering override active");
  if (d.warning) states.push("planner warning active");
  ids.state.textContent = states.length ? `Explicit states: ${states.join(", ")}` : "All channels available";

  ids.urgencyHint.textContent = d.stale
    ? "Intervention urgency is independent but suppressed by staleness where applicable."
    : "Urgency channel is independent of confidence and actuator channels.";
};

function syncReadouts() {
  ids.confidenceOutput.textContent = ids.confidenceInput.value;
  ids.steerReqOutput.textContent = Number(ids.steerReqInput.value).toFixed(2);
  const req = Number(ids.steerReqInput.value);
  ids.steerHeadInput.value = (1 - req).toFixed(2);
  ids.steerHeadOutput.textContent = ids.steerHeadInput.value;
  ids.brakeOutput.textContent = ids.brakeInput.value;
  ids.accelOutput.textContent = ids.accelInput.value;
  ids.urgencyOutput.textContent = ids.urgencyInput.value;
  ids.ageOutput.textContent = ids.ageInput.value;
}

let scenarioHandle = null;

ids.steerReqInput.addEventListener("input", syncReadouts);
[ids.confidenceInput, ids.steerHeadInput, ids.brakeInput, ids.accelInput, ids.urgencyInput,
ids.steerAvail, ids.brakeAvail, ids.accelAvail, ids.steerSat, ids.steerPressed, ids.dataFresh, ids.ageInput].forEach((el) =>
  el.addEventListener("input", () => {
    syncReadouts();
    paint(deriveUiFrameFromInputs());
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
      accelHeadroom: Number(ids.accelInput.value),
      interventionUrgency: Number(ids.urgencyInput.value),
      steeringPressed: ids.steerPressed.checked,
      timestampMs: Date.now(),
    });
    ids.scenarioState.textContent = `Step ${index + 1} of ${deterministicSteeringLimitScenario.length}: ${step.label}`;
    ids.confidenceInput.value = String(next.confidenceScore);
    ids.steerHeadInput.value = String(next.steeringHeadroom.toFixed(2));
    ids.steerReqInput.value = String(step.steeringRequest.toFixed(2));
    ids.steerSat.checked = !!next.steeringSaturated;
    syncReadouts();
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
  ids.confidenceInput.value = "0.78";
  ids.steerReqInput.value = "0.20";
  ids.steerHeadInput.value = "0.80";
  ids.brakeInput.value = "0.62";
  ids.accelInput.value = "0.55";
  ids.urgencyInput.value = "0.40";
  ids.steerSat.checked = false;
  ids.scenarioState.textContent = "Manual exploration";
  syncReadouts();
  paint(deriveUiFrameFromInputs());
});

syncReadouts();
paint(deriveUiFrameFromInputs());
