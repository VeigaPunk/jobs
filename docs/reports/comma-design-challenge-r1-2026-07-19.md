# Comma Design Challenge — Round 1

**Date:** 2026-07-19
**Status:** local research frontier verified; no official evaluation

## Boundary

This round is a **non-official proxy exercise**. The prototype, local tests, xask responses, evidence audit, and Pareto verdicts are not a comma.ai evaluation, score, submission result, acceptance signal, or proxy for any unpublished official rubric. The observed official leaderboard and design brief publish the challenge and intake, but no numerical design score, evaluator, rubric, or winner. No external action is recorded here.

Official sources:

- <https://comma.ai/leaderboard#design_challenge>
- <https://raw.githubusercontent.com/commaai/jobs/refs/heads/master/design.md>

## Axes

Official-evidence fidelity; safety-semantic correctness; comprehension; honest precision; authority/availability correctness; passive-staleness visibility; non-intrusiveness and accessibility; technical feasibility; proxy-boundary clarity; reproducibility; and scope compliance.

Cheap moves were considered in parallel and retained only when they improved at least one named axis without harming another.

## Roster and xask targets

- **Authority scout:** inspect the official challenge surface and commit-pinned openpilot/opendbc sources.
- **Proposer/builder:** offer the smallest executable corrections to the existing prototype.
- **Falsifier/labrat:** turn semantic claims into boundary and regression cases.
- **Reviewer:** challenge risk direction, timestamp behavior, control authority, override/saturation separation, and proxy overclaiming.
- **Evidence auditor:** classify required evidence, dropped moves, and spoof flags.
- **Source mapper/final verifier:** bind blinded move provenance after judgment and refresh the terminal verification record.

The blinded roster used the recorded `cdx` and `ccs` target families; the directly identified `cdx` xask target was `openai/gpt-5.6-sol`. Target labels are provenance bookkeeping, not evidence of correctness. The received `SOURCE_MAP` is serialized in `evidence/r3/ledger.json` without changing the blinded verdicts.

## Authority findings

- Current openpilot master renders the onroad surface with Python `Widget`/`pyray`, not the older C++ Qt tree assumed by the challenge text (`RECON.md`, “Onroad UI flow”).
- Public messages expose the canonical confidence class and horizon disengagement probabilities, but not the continuous stateful classifier score (`RECON.md`, “Confidence signals”).
- Universal steering headroom is directly normalizable only for torque/PID control; angle and curvature control require controller-owned normalization (`RECON.md`, “Steering signals”).
- Exact longitudinal bounds exist inside controls, while the UI-visible schema lacks their dynamic denominator; stock ACC reserve must therefore remain unavailable rather than inferred (`RECON.md`, “Brake and acceleration signals”; `MODEL.md`, producer rule 5).
- Independent steering, brake, acceleration, confidence, and urgency channels do not establish a jointly feasible maneuver envelope (`prototype/index.html`; `prototype/non_official_proxy_evaluator.js`).

## Blinded moves and Pareto verdicts

| Blinded move | Claim | Evidence summary | Pareto verdict |
|---|---|---|---|
| B01 | Replace percentage-like “confidence” with a LOW/RISING/IMMINENT intervention-risk cursor pinned to canonical `0.01165` and `0.06157` boundaries. | Engine boundary tests and artifact-contract assertions cover labels, thresholds, and removal of percentage semantics. | **Keep** — improves semantic correctness and honest precision without reducing availability handling. |
| B02 | Fail closed on absent, non-finite, future, and stale timestamps, with passive repaint so formerly fresh state visibly expires. | Engine tests cover invalid/future/stale boundaries; the artifact contract checks periodic repaint. | **Keep** — improves safety and staleness visibility without introducing a new signal claim. |
| B03 | Gate brake/acceleration reserve on explicit openpilot longitudinal authority, derive signed-torque steering headroom with absolute demand, and keep driver override distinct from saturation. | Engine and scenario regression tests cover stock-ACC suppression, both torque signs, scenario defaults, and override/saturation separation. | **Keep** — improves authority correctness and feasibility without claiming unsupported reserve. |
| B04 | Make the local proxy return explicit boolean checks only, with no aggregate score, and test its non-official and no-joint-feasibility boundaries. | Proxy evaluator and tests assert `official: false`, no `score`, explicit checks, stale suppression, and timestamp rejection. | **Keep** — improves falsifiability and boundary clarity without approximating an official judgment. |
| B05 | Preserve persistent L2 responsibility and orthogonal confidence/reserve/urgency channels as the presentation grammar. | `none — cross-axis artifact`; the design claim has no human legibility or non-intrusion study in this round. | **Keep conditionally** — structurally compatible, but human usability remains unproven. |
| B06 | Promote the independent channels into a jointly feasible trajectory or maneuver-horizon claim. | `none — adversarial-design artifact`; no grounded joint-feasibility signal exists. | **Drop** — would harm safety-semantic correctness and honest precision. |

The report-level verdict audit covers all six blinded moves: 4 with required evidence, 2 without required evidence, 1 dropped, and 0 spoof-flagged (`4/2/1/0`). Dropped is a verdict dimension and is included among those six moves. The narrower source-map ledger records its three mapped implementation moves as `3/0/0/0`.

`audit_hash: 777c2f5d916b3cd20b01e959f16578ec44d690ca42d1f8d3923bb172ab7ecfd7`

`manifest_hash: 65379a133fdcf16c8af06ef0035a55384ae4e7a299656303d7926c67bc723941`

## Verification

`evidence/r3/final-verification.txt` was regenerated after the reviewer-discovered longitudinal scenario-default regression. It records the current default-off contract, passing syntax and executable gates, and reproduced ledger hashes. `evidence/r3/red-green.txt` preserves the exact failing and passing regression outputs, while `evidence/r3/reviewer-regression-final.txt` records the focused post-fix gate and implementation references.

Implementation delta reviewed: `7901382128d8db76eb9e38eb9471cf182db7911c`.

All thirteen artifact digests referenced by `evidence/r3/ledger.json` match the current implementation, tests, and verification evidence.

## Next-round focus

1. Add human legibility, accessibility, and non-intrusion probes for mixed states before promoting B05 beyond conditional acceptance.
2. Keep B06 dropped unless an authoritative joint-feasibility signal and semantics become available.

All findings and verdicts above are local, bounded, and non-official.
