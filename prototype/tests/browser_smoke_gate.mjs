#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "browser_smoke.mjs");

const EXPECTED_LINKS = Object.freeze([
  "https://github.com/VeigaPunk/jobs/tree/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype",
  "https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype/index.html",
  "https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype/ui.js",
  "https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype/tests/browser_smoke.mjs",
  "https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/evidence/r1/m004-public-probe.md",
  "https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/docs/reports/comma-design-challenge-r3-2026-07-19.md",
]);

const runSmoke = async (mode) => new Promise((resolve) => {
  const args = [script, `--mode=${mode}`];
  const child = spawn(process.execPath, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString("utf8");
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
  });

  child.on("exit", (code) => {
    resolve({ code: code ?? 1, stdout, stderr, mode: mode });
  });
});

const gateImmutableLinks = async () => {
  for (const url of EXPECTED_LINKS) {
    const response = await fetch(url, { redirect: "manual" });
    assert.equal(response.status, 200, `immutable link ${url} expected 200 got ${response.status}`);
  }

  const officialForm = "https://forms.gle/US88Hg7UR6bBuW3BA";
  const formResponse = await fetch(officialForm, { redirect: "manual" });
  assert.ok([301, 302, 303, 307, 308, 401, 403, 404, 410, 451].includes(formResponse.status),
    `official intake link expected auth/restricted marker got ${formResponse.status}`);
};

const run = async () => {
  await gateImmutableLinks();

  const [smokeOne, smokeTwo] = await Promise.all([
    runSmoke("normal"),
    runSmoke("normal"),
  ]);

  assert.equal(smokeOne.code, 0, `normal smoke instance one exit ${smokeOne.code}`);
  assert.equal(smokeTwo.code, 0, `normal smoke instance two exit ${smokeTwo.code}`);

  const consoleMode = await runSmoke("console-error");
  const uncaughtMode = await runSmoke("uncaught-exception");
  assert.ok(consoleMode.code !== 0, `console-error mode expected nonzero got ${consoleMode.code}`);
  assert.ok(uncaughtMode.code !== 0, `uncaught-exception mode expected nonzero got ${uncaughtMode.code}`);

  console.log("prototype/browser smoke gate: pass");
  process.stdout.write(smokeOne.stdout);
  process.stdout.write(smokeTwo.stdout);
};

run().catch((error) => {
  console.error(`prototype/browser smoke gate: fail - ${error.message}`);
  process.exit(1);
});
