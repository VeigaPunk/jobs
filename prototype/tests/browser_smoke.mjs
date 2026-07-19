import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  process.env.CHROMIUM_BIN,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chrome",
];

const resolveBrowser = () => candidates.find((candidate) => candidate && existsSync(candidate));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startServer = () => {
  const server = createServer(async (req, res) => {
    const requestPath = decodeURIComponent((req.url || "/").split("?")[0] || "/");
    const cleaned = path.normalize(requestPath).replace(/^\/+/, "");
    const target = path.join(rootDir, cleaned || "index.html");
    if (!path.relative(rootDir, target).startsWith("..")) {
      try {
        const body = await readFile(target);
        const typeByExt = {
          ".html": "text/html;charset=utf-8",
          ".css": "text/css;charset=utf-8",
          ".js": "text/javascript;charset=utf-8",
        };
        res.writeHead(200, { "Content-Type": typeByExt[path.extname(target)] || "text/plain;charset=utf-8" });
        res.end(body);
        return;
      } catch (err) {
        // fallthrough to 404
      }
    }
    res.writeHead(404);
    res.end("not found");
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
};

const pickWsEndpoint = async (port) => {
  for (let i = 0; i < 60; i += 1) {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    }
    await sleep(100);
  }
  throw new Error("chromium ws endpoint unavailable");
};

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(wsUrl);

    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id) {
        const waiting = this.pending.get(msg.id);
        if (!waiting) return;
        this.pending.delete(msg.id);
        if (msg.error) return waiting.reject(new Error(msg.error.message || "cdp error"));
        return waiting.resolve(msg.result);
      }
      const callbacks = this.listeners.get(msg.method) || [];
      for (const cb of callbacks) cb(msg.params || {});
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`cdp timeout: ${method}`));
      }, 8000);
      this.pending.set(id, {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, callback) {
    const list = this.listeners.get(method) || [];
    list.push(callback);
    this.listeners.set(method, list);
    return () => {
      const current = this.listeners.get(method) || [];
      this.listeners.set(method, current.filter((cb) => cb !== callback));
    };
  }

  close() {
    this.socket.close();
    for (const [, pending] of this.pending) {
      pending.reject(new Error("cdp closed"));
    }
  }
}

const evaluate = async (cdp, expression) => {
  const out = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (out.exceptionDetails) {
    throw new Error(`runtime exception: ${out.exceptionDetails.text}`);
  }
  return out.result?.value;
};

const waitForReady = async (cdp) => {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const state = await evaluate(cdp, "document.readyState");
    if (state === "complete") return;
    await sleep(80);
  }
  throw new Error("page did not reach readyState=complete");
};

const parseColor = (value) => {
  const match = /rgba?\(([^)]+)\)/.exec(value || "");
  if (!match) return null;
  const parts = match[1].split(",").map((x) => Number.parseFloat(x.trim()));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2] };
};

const linearChannel = (value) => {
  const x = value / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
};

const contrast = (a, b) => {
  const aL = 0.2126 * linearChannel(a.r) + 0.7152 * linearChannel(a.g) + 0.0722 * linearChannel(a.b);
  const bL = 0.2126 * linearChannel(b.r) + 0.7152 * linearChannel(b.g) + 0.0722 * linearChannel(b.b);
  const hi = Math.max(aL, bL);
  const lo = Math.min(aL, bL);
  return (hi + 0.05) / (lo + 0.05);
};

const runViewport = async (cdp, url, width, height, requireContrast) => {
  const consoleErrors = [];
  const runtimeExceptions = [];

  const clearConsole = cdp.on("Log.entryAdded", (params) => {
    if (params.entry.level === "error") consoleErrors.push(params.entry.text);
  });
  const clearException = cdp.on("Runtime.exceptionThrown", (params) => {
    runtimeExceptions.push(
      params.exceptionDetails?.exception?.description ||
      params.exceptionDetails?.text ||
      "runtime-exception",
    );
  });

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 460,
    screenOrientation: { type: "portraitPrimary", angle: 0 },
  });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Page.navigate", { url: `${url}/index.html` });
  await waitForReady(cdp);

  const baseline = await evaluate(
    cdp,
    "(() => ({"
      + "confidenceAria: document.getElementById('confidence').getAttribute('aria-valuetext'),"
      + "confidenceNow: document.getElementById('confidence').getAttribute('aria-valuenow'),"
      + "urgencyAria: document.getElementById('urgency').getAttribute('aria-valuetext'),"
      + "boundary: document.querySelector('.boundary').textContent || '',"
      + "state: document.getElementById('state').textContent || ''"
      + "}))()",
  );
  assert.ok(typeof baseline.confidenceAria === "string" && baseline.confidenceAria.length > 0);
  assert.ok(typeof baseline.confidenceNow === "string");
  assert.ok(/independent/i.test(baseline.boundary));

  await evaluate(
    cdp,
    "(() => { const age = document.getElementById('ageInput'); age.value='2500'; age.dispatchEvent(new Event('input',{bubbles:true})); return true; })()",
  );
  await sleep(120);
  const stale = await evaluate(
    cdp,
    "(() => ({"
      + "conf: document.getElementById('confidence').getAttribute('aria-valuetext'),"
      + "urg: document.getElementById('urgency').getAttribute('aria-valuetext'),"
      + "state: document.getElementById('state').textContent || ''"
      + "}))()",
  );
  assert.equal(stale.conf, "unavailable");
  assert.equal(stale.urg, "unavailable");
  assert.ok(/stale/.test(stale.state.toLowerCase()));

  await evaluate(
    cdp,
    "(() => { document.getElementById('ageInput').value='0'; document.getElementById('ageInput').dispatchEvent(new Event('input',{bubbles:true})); return true; })()",
  );

  await evaluate(
    cdp,
    "(() => { document.getElementById('brakeInput').value='1.4'; document.getElementById('brakeInput').dispatchEvent(new Event('input',{bubbles:true})); return true; })()",
  );
  await evaluate(
    cdp,
    "(() => { document.getElementById('accelInput').value='-0.4'; document.getElementById('accelInput').dispatchEvent(new Event('input',{bubbles:true})); return true; })()",
  );
  const overflow = await evaluate(
    cdp,
    "(()=>({"
      + "brakeUnavailable: document.getElementById('brake').className.includes('unavailable-state'),"
      + "accelUnavailable: document.getElementById('accel').className.includes('unavailable-state')"
      + "}))()",
  );
  assert.equal(overflow.brakeUnavailable, true);
  assert.equal(overflow.accelUnavailable, true);

  await evaluate(cdp, "document.getElementById('runScenario').click()");
  await sleep(220);
  const scenarioState = await evaluate(cdp, "document.getElementById('scenarioState').textContent");
  assert.match(scenarioState, /Step 1 of|Manual exploration|stability/);

  await evaluate(cdp, "document.body.focus()");
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    windowsVirtualKeyCode: 9,
    code: "Tab",
    key: "Tab",
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    windowsVirtualKeyCode: 9,
    code: "Tab",
    key: "Tab",
  });
  const focus = await evaluate(cdp, "document.activeElement && document.activeElement.id");
  assert.ok(!!focus);

  if (requireContrast) {
    const tokens = await evaluate(
      cdp,
      "(()=>({"
        + "fg: getComputedStyle(document.querySelector('.card')).color,"
        + "bg: getComputedStyle(document.querySelector('.card')).backgroundColor"
        + "}))()",
    );
    const fg = parseColor(tokens.fg);
    const bg = parseColor(tokens.bg);
    if (fg && bg) assert.ok(contrast(fg, bg) >= 3);
  }

  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(runtimeExceptions, []);

  clearConsole();
  clearException();
};

const main = async () => {
  const browser = resolveBrowser();
  if (!browser) throw new Error("system-chromium not found");

  const server = await startServer();
  const serverPort = server.address().port;
  const url = `http://127.0.0.1:${serverPort}`;
  const debugPort = 9393;
  const userData = path.join(tmpdir(), `comma-ui-smoke-${Date.now()}`);
  mkdirSync(userData, { recursive: true });

  const child = spawn(
    browser,
    [
      `--remote-debugging-port=${debugPort}`,
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${userData}`,
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "inherit"] },
  );

  try {
    const ws = await pickWsEndpoint(debugPort);
    const cdp = new CdpClient(ws);
    await runViewport(cdp, url, 390, 844, process.env.CONTRAST_CHECK === "1");
    await runViewport(cdp, url, 1366, 768, false);
    cdp.close();
    console.log("prototype/browser smoke: pass");
  } finally {
    child.kill("SIGTERM");
    await sleep(100);
    server.close();
    rmSync(userData, { recursive: true, force: true });
  }
};

main().catch((error) => {
  console.error(`prototype/browser smoke: fail - ${error.message}`);
  process.exit(1);
});
