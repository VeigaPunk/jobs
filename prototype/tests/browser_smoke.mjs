import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createTcpServer } from "node:net";
import assert from "node:assert/strict";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MODE = "normal";
const MODES = Object.freeze(["normal", "console-error", "uncaught-exception"]);
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
    if (requestPath === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
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

const nextPort = async () => new Promise((resolve, reject) => {
  const server = createTcpServer();
  server.once("error", (error) => {
    server.close();
    reject(error);
  });
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "string" ? NaN : address?.port;
    server.close(() => resolve(port));
  });
});

const pickWsEndpoint = async (port) => {
  for (let i = 0; i < 60; i += 1) {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`).catch(() => null);
    if (res && res.ok) {
      const targets = await res.json();
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
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
    this.closing = null;
    this.socket = new WebSocket(wsUrl);
    this.connected = new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = () => reject(new Error("chromium websocket connection failed"));
    });

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
    return this.connected.then(() => new Promise((resolve, reject) => {
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
    }));
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
    if (this.closing) return this.closing;
    this.closing = new Promise((resolve) => {
      if (this.socket.readyState === this.socket.CLOSED) {
        resolve();
        return;
      }
      this.socket.onclose = () => resolve();
      this.socket.close();
    });
    for (const [, pending] of this.pending) {
      pending.reject(new Error("cdp closed"));
    }
    this.pending.clear();
    return this.closing;
  }
}

const evaluate = async (cdp, expression) => {
  const out = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (out.exceptionDetails) {
    throw new Error(`runtime exception: ${JSON.stringify(out.exceptionDetails)}`);
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

const runViewport = async (cdp, url, width, height, requireContrast, mode) => {
  const consoleErrors = [];
  const runtimeExceptions = [];

  const clearConsole = cdp.on("Log.entryAdded", (params) => {
    if (params.entry.level === "error") consoleErrors.push(params.entry.text);
  });
  const clearException = cdp.on("Runtime.exceptionThrown", (params) => {
    runtimeExceptions.push(
      params.exceptionDetails?.exception?.description ||
      [
        params.exceptionDetails?.text,
        params.exceptionDetails?.url,
        params.exceptionDetails?.lineNumber == null ? "" : `line ${params.exceptionDetails.lineNumber + 1}`,
        params.exceptionDetails?.columnNumber == null ? "" : `column ${params.exceptionDetails.columnNumber + 1}`,
      ].filter(Boolean).join(" at ") ||
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
      + "urgencyNow: document.getElementById('urgency').getAttribute('aria-valuenow'),"
      + "boundary: document.querySelector('.boundary').textContent || '',"
      + "state: document.getElementById('reserveState').textContent || ''"
      + "}))()",
  );
  assert.ok(typeof baseline.confidenceAria === "string" && baseline.confidenceAria.length > 0);
  assert.ok(typeof baseline.confidenceNow === "string");
  assert.match(baseline.urgencyAria, /^\d+ percent$/);
  assert.ok(typeof baseline.urgencyNow === "string");
  assert.ok(/independent/i.test(baseline.boundary));

  if (mode === "console-error") {
    await evaluate(
      cdp,
      "(() => { console.error('smoke control: console.error path'); return true; })()",
    );
  } else if (mode === "uncaught-exception") {
    await evaluate(
      cdp,
      "(() => { throw new Error('smoke control: uncaught exception'); })()",
    );
  }

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
      + "state: document.getElementById('reserveState').textContent || ''"
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
    "(() => { const el=document.getElementById('brakeAvail'); el.checked=false; el.dispatchEvent(new Event('input',{bubbles:true})); return true; })()",
  );
  await evaluate(
    cdp,
    "(() => { const el=document.getElementById('accelAvail'); el.checked=false; el.dispatchEvent(new Event('input',{bubbles:true})); return true; })()",
  );
  const unavailable = await evaluate(
    cdp,
    "(()=>({"
      + "brakeUnavailable: document.querySelector('#brake .rail-track').classList.contains('unavailable-state'),"
      + "accelUnavailable: document.querySelector('#accel .rail-track').classList.contains('unavailable-state')"
      + "}))()",
  );
  assert.equal(unavailable.brakeUnavailable, true);
  assert.equal(unavailable.accelUnavailable, true);

  const layout = await evaluate(
    cdp,
    "(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}))()",
  );
  assert.ok(
    layout.scrollWidth <= layout.clientWidth,
    `${width}x${height} horizontal overflow: ${layout.scrollWidth} > ${layout.clientWidth}`,
  );

  await evaluate(cdp, "document.getElementById('runScenario').click()");
  await sleep(220);
  const scenarioState = await evaluate(cdp, "document.getElementById('scenarioState').textContent");
  assert.match(scenarioState, /Step 1 of|Manual exploration|stability/);

  await evaluate(cdp, "document.querySelector('details').open=true; document.activeElement && document.activeElement.blur()");
  const focusSequence = [];
  for (let i = 0; i < 3; i += 1) {
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyDown", windowsVirtualKeyCode: 9, code: "Tab", key: "Tab",
    });
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyUp", windowsVirtualKeyCode: 9, code: "Tab", key: "Tab",
    });
    focusSequence.push(await evaluate(cdp, "document.activeElement && (document.activeElement.id || document.activeElement.tagName)"));
  }
  assert.equal(focusSequence.length, 3);
  assert.ok(focusSequence.every(Boolean));
  assert.equal(new Set(focusSequence).size, 3);

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

  if (mode === "console-error") {
    assert.equal(consoleErrors.length, 1);
    assert.equal(runtimeExceptions.length, 0);
    } else if (mode === "uncaught-exception") {
      return;
  } else {
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(runtimeExceptions, []);
  }

  clearConsole();
  clearException();
};

const parseMode = (argv) => {
  const provided = argv.find((arg) => arg.startsWith("--mode="));
  if (!provided) return DEFAULT_MODE;
  const value = provided.slice("--mode=".length);
  if (!MODES.includes(value)) {
    throw new Error(`unknown smoke mode: ${value}`);
  }
  return value;
};

const main = async () => {
  const browser = resolveBrowser();
  if (!browser) throw new Error("system-chromium not found");

  const server = await startServer();
  const serverPort = server.address().port;
  const url = `http://127.0.0.1:${serverPort}`;
  const debugPort = await nextPort();
  const userData = path.join(tmpdir(), `comma-ui-smoke-${Date.now()}`);
  mkdirSync(userData, { recursive: true });
  const mode = parseMode(process.argv.slice(2));

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
    await runViewport(
      cdp,
      url,
      390,
      844,
      process.env.CONTRAST_CHECK === "1",
      mode,
    );
    if (mode === "normal") {
      await runViewport(cdp, url, 1366, 768, false, mode);
    }
    await cdp.close();
    console.log("prototype/browser smoke: pass");
  } finally {
    const closeExit = async () => new Promise((resolve) => {
      child.once("close", () => resolve());
      child.kill("SIGTERM");
    });
    await Promise.allSettled([closeExit(), new Promise((resolve) => server.close(resolve))]);
    rmSync(userData, { recursive: true, force: true });
  }
};

main().catch((error) => {
  console.error(`prototype/browser smoke: fail - ${error.message}`);
  process.exit(1);
});
