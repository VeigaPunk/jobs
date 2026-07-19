# comma design frontier - local evaluator manifest

## Status and independence

- This artifact is an **independent, local prototype** with no official affiliation to any external evaluator workflow.
- This prototype is **UNSUBMITTED** (not part of an official comma.ai intake or review).
- This repository branch records a local, non-authoritative effort only: it is explicit that there is **no official score, no placement claim, and no acceptance signal**.
- No submission form, work email, or intake portal is required to use this artifact.

## Immutable implementation anchor

- `M4A` commit: `6ea3505fe2b215d78ea60761fd517611e2a6cc59`
- `M4A` manifest link: https://github.com/VeigaPunk/jobs/commit/6ea3505fe2b215d78ea60761fd517611e2a6cc59
- Local artifact location: `prototype/index.html`
- Runtime module: `prototype/ui.js`
- Contract and checks: `prototype/tests/run-tests.mjs`

## Deterministic "Know when UI does not know" flow

1. Initial render shows populated ARIA state for confidence and urgency (`run`/start state).
2. Increase `Data age (ms)` above `STALE_MS` in the prototype controls.
3. After the next passive repaint cycle, confidence and urgency should become `unavailable`.
4. Reserve and status text should explicitly include a stale indicator.
5. Set invalid/overflow values for brake/accel control inputs to force explicit unavailability behavior without throwing runtime exceptions.

## Bound differentiation and integrity boundaries

- The page retains a persistent **Level-2 responsibility** statement and explicit **NON-OFFICIAL LOCAL PROXY EVALUATOR** boundary.
- It does not claim jointly feasible full-control behavior.
- Signal channels remain orthogonal: confidence class, reserves, and urgency.
- Confidence class is categorical (`LOW`, `RISING`, `IMMINENT`) rather than a percentage.
- This remains a **NON-OFFICIAL** evaluator implementation and does not represent an official submission.

## Execution and test workflow

From repository root:

```sh
cd prototype
python3 -m http.server 8080
```

Open `http://localhost:8080`.

From `prototype/`:

```sh
node tests/run-tests.mjs
```

Smoke checks are dependency-free at runtime because they use a local `system` Chromium binary and Node standard modules only.

## Evidence, checks, and limits

- Primary artifact checks: `prototype/tests/run-tests.mjs`
- UI defect fix and interaction regression evidence is enforced by the included browser smoke test.
- Known limits:
  - No WCAG or screen-reader matrix is treated as conclusive; contrast checks are optional (`CONTRAST_CHECK=1`).
  - No official evaluator output, official scoring, placement, or submission ranking is claimed or expected.
  - This branch has no external intake binding; work email / form evidence is intentionally not used.

## Reports and traceability

- Current round notes: `docs/reports/design-frontier-r3-2026-07-19.md`
- Audit artifacts in `evidence/`.
