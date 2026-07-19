# Independent, unsubmitted concept — evaluator manifest

## Status and challenge goal

This is an **independent, unsubmitted concept**, not an official comma.ai artifact. It explores an L2 responsibility UI that separates intervention likelihood, actuator reserve, and intervention urgency while making stale or unavailable data explicit. It has **no official score, rank, placement, acknowledgment, acceptance, or affiliation**.

## Immutable M4A artifact

- Commit: [`6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e`](https://github.com/VeigaPunk/jobs/commit/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e)
- [Prototype tree](https://github.com/VeigaPunk/jobs/tree/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype)
- [`index.html`](https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype/index.html)
- [`ui.js`](https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype/ui.js)
- [Browser smoke test](https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/prototype/tests/browser_smoke.mjs)

No hosted live deployment is verified. Run the immutable tree locally:

```sh
git clone https://github.com/VeigaPunk/jobs.git
cd jobs
git checkout 6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e
cd prototype
python3 -m http.server 8080
```

Open <http://localhost:8080/>.

## Know When the UI Doesn't Know

1. On load, confirm confidence and urgency are populated and the persistent Level-2 and **NON-OFFICIAL** labels remain visible.
2. Expand **Prototype controls**.
3. Set **Data age (ms)** to `2500`.
4. Within one passive repaint interval, confidence and urgency become `unavailable`, and status reports `stale > 1500ms`.
5. Return age to `0`; clear **Brake available** or **Accel available** to see that channel's explicit unavailable state.
6. Select **Run deterministic steering-limit scenario** to replay the fixed sequence.

## Rationale and bounded differentiation

The dated public-artifact probe observed four accessible entries using, at a high level, an interactive limit gauge, confidence tiers with actuator gauges, a confidence ring with actuator bars, and a confidence halo/tempo treatment. Against only those observed patterns, this concept combines a categorical `LOW / RISING / IMMINENT` cursor, orthogonal reserve channels, an independent urgency channel, and fail-closed stale/unavailable states. This is a descriptive comparison, not evidence of superiority, completeness, rank, or preference.

- [Dated probe evidence](https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/evidence/r1/m004-public-probe.md)
- [Round 3 report](https://github.com/VeigaPunk/jobs/blob/6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e/docs/reports/comma-design-challenge-r3-2026-07-19.md)

## Tests and expected output

Requires Node.js and a system Chromium at a standard path, or `CHROMIUM_BIN=/path/to/chromium`. Chromium absence fails clearly; it is never treated as a pass.

```sh
node --check prototype/ui.js
node --check prototype/tests/browser_smoke.mjs
node --check prototype/tests/browser_smoke_gate.mjs
node prototype/tests/browser_smoke_gate.mjs
node prototype/tests/run-tests.mjs
git diff --check
```

Expected stable lines:

```text
prototype engine tests: pass
artifact contract tests: pass
prototype/browser smoke: pass
prototype/browser smoke gate: pass
```

The browser smoke captures console/runtime exceptions; checks no horizontal overflow at `390x844` and `1366x768`; verifies populated ARIA values, fresh-to-stale unavailability, and a basic Tab sequence. Chromium may also print an environment-specific DevTools line.

## Limitations and intake boundary

- No official score, rank, placement, acknowledgment, acceptance, or completed human study exists.
- The dated probe found **two** competitor entries inaccessible (one missing and one blocked); no content or quality is inferred from access status. A count of three is not supported by the repository evidence.
- Contrast conformance is **unverified**. `CONTRAST_CHECK=1` performs only an optional computed foreground/background token check, not a WCAG audit or assistive-technology matrix.
- The documented official route is the [common Google Form](https://forms.gle/US88Hg7UR6bBuW3BA). It **has not been used for this concept**, and no acknowledgment has been received.
- `work@comma.ai` is **not represented here as leaderboard intake**.
- The in-page proxy is a **NON-OFFICIAL LOCAL PROXY EVALUATOR**. It has no official score and cannot establish rank, submission, acceptance, or placement.
