import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, css, readme, ui] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("README.md", root), "utf8"),
  readFile(new URL("ui.js", root), "utf8"),
]);

assert.match(html, /Level-2: you monitor the road and are ready to intervene\./);
assert.match(html, /independent signals—not a claim of jointly feasible control/);
assert.match(html, /NON-OFFICIAL LOCAL PROXY EVALUATOR/);
assert.match(html, /aria-live="polite"/);
assert.doesNotMatch(html, /id="steerHeadInput"/, "redundant steering-headroom control is removed");
assert.match(html, /LOW \/ RISING \/ IMMINENT/, "risk cursor uses categorical semantics");
assert.match(html, /Openpilot longitudinal control active/, "stock ACC availability is explicit");
assert.match(ui, /setInterval\(\(\) =>[\s\S]*paint\(activeFrame\)/, "passive repaint lets fresh state become visibly stale");
assert.match(
  ui,
  /scenarioFrameFromStep\(step,[\s\S]*brakeAvailable: ids\.brakeAvail\.checked,[\s\S]*accelAvailable: ids\.accelAvail\.checked,[\s\S]*openpilotLongitudinalControl: ids\.longControlActive\.checked,[\s\S]*longActive: ids\.longControlActive\.checked/,
  "scenario playback propagates explicit longitudinal authority and channel availability",
);
assert.doesNotMatch(css, /linear-gradient|radial-gradient|border-radius/, "visuals stay flat and primitive");
assert.match(readme, /node tests\/run-tests\.mjs/, "README gives the test command");
assert.match(readme, /python3 -m http\.server/, "README gives a local run command");

console.log("artifact contract tests: pass");
