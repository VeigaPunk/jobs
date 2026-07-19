import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, css, readme] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("README.md", root), "utf8"),
]);

assert.match(html, /Level-2: you monitor the road and are ready to intervene\./);
assert.match(html, /independent signals—not a claim of jointly feasible control/);
assert.match(html, /NON-OFFICIAL LOCAL PROXY EVALUATOR/);
assert.match(html, /aria-live="polite"/);
assert.doesNotMatch(css, /linear-gradient|radial-gradient|border-radius/, "visuals stay flat and primitive");
assert.match(readme, /node tests\/run-tests\.mjs/, "README gives the test command");
assert.match(readme, /python3 -m http\.server/, "README gives a local run command");

console.log("artifact contract tests: pass");
