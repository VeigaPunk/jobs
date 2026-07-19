# Private interactive prototype artifact

This folder contains a dependency-free prototype for the design frontier.

- `index.html` launches the interactive mock.
- `prototype_engine.js` contains the canonicalized state contract and deterministic scenario generation.
- `ui.js` renders flat primitive visuals and interactivity.
- `non_official_proxy_evaluator.js` is a clearly labeled local evaluator (not official).

## Run locally

From this directory:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. No package installation or network access is required.

## Test

From this directory:

```sh
node tests/run-tests.mjs
```

The proxy evaluator is **NON-OFFICIAL**. It is a local behavioral self-check only,
not a comma.ai evaluator, score, submission result, or acceptance signal. The
independent channels do not assert joint control feasibility.
