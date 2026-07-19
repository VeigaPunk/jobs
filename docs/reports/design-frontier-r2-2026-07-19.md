# Design Frontier — Round 2

**Date:** 2026-07-19  
**Status:** local research frontier; M011 blocks advancement; no official evaluation

## Axes

Official-evidence fidelity; safety-semantic correctness; honest precision; fail-closed timestamp handling; passive-staleness visibility; proxy-check strength; reproducibility; and scope compliance.

Cheap moves were considered in parallel and retained only when they improved at least one axis without harming another. All checks, tests, verdicts, and findings in this report are **local and non-official**.

## xask roles

- **Proposer/builder:** produced the M007 prototype and its local test surface.
- **Falsifier:** treated reproduction as a way to expose unsupported design claims rather than as acceptance.
- **Reviewer:** assessed safety semantics, precision, timestamp behavior, passive staleness, and proxy strength.
- **Evidence auditor:** counted required evidence forms and bound the source map to the recorded audit hash.
- **Source spot-checker:** directly spot-checked the M011 source as `openai/gpt-5.6-sol`.

The source-map serialization is provenance bookkeeping, not evidence that a move is correct. Its recorded digest is:

`audit_hash: 6c794276de3b3e05d9ae3c0257a5791b4c89f4c25a6fd4959b138504636992fb`

## Moves and verdicts

| Move | Recorded move | Verdict | Evidence |
|---|---|---|---|
| M007 | Reproduce and review the existing interactive prototype and tests. The prototype exists and its tests reproduce, but the reviewer verdict is **FAIL**: confidence risk direction is reversed, false percentage precision is shown, timestamps fail open, passive staleness is absent, and proxy checks are weak. | **Accepted only as a falsification finding**; not accepted as a validated design. | `prototype/`; `prototype/tests/run-tests.mjs`; `evidence/r2/red-before-green.txt`; `evidence/r2/final-verification.txt` |
| M008 | Adopt a rectangular Comma Staff grammar with persistent L2 spine, non-color textures, explicit unavailable styling, and grounded history wake. | **Deferred**; texture legibility is untested and a wholesale rewrite is not yet non-regressive. | `none — cross-axis artifact` |
| M009 | Add eight bounded proxy designs for mixed states, ordering, stale boundaries, accessibility, urgency timing, non-intrusion, and responsibility invariance. | **Accepted** as falsification work only; human usability remains untested. | HYPOTHESIS/METHOD/RESULT probe specification recorded by the Round 2 labrat |
| M010 | Replace percentage-like confidence fill with a LOW/RISING/IMMINENT intervention-likelihood cursor that follows canonical risk direction. | **Accepted**. | `none — adversarial-design artifact` |
| M011 | Correct risk direction and boundaries, remove false percentage precision, reject invalid timestamps, add passive stale reevaluation, and strengthen proxy checks before advancement. | **Accepted — BLOCKING**. Source spot-check: `openai/gpt-5.6-sol`. | M007 reviewer verdict; `prototype/tests/prototype_engine.test.mjs`; `prototype/non_official_proxy_evaluator.js` |

EVIDENCE AUDIT: 5 moves with required evidence, 0 moves without, 0 dropped, 0 spoof-flagged (`5/0/0/0`).

## Reproducibility

Run from the repository root:

```bash
node prototype/tests/run-tests.mjs
```

The recorded local output is in `evidence/r2/final-verification.txt`; the prior red and subsequent green outputs are in `evidence/r2/red-before-green.txt`. Relevant evidence paths are:

- `evidence/r2/red-before-green.txt`
- `evidence/r2/final-verification.txt`
- `prototype/tests/run-tests.mjs`
- `prototype/tests/prototype_engine.test.mjs`
- `prototype/tests/artifact_contract.test.mjs`

These are reproducible **non-official local checks**, not a comma.ai evaluation, score, submission result, or acceptance signal.

## Boundary

M011 remains blocking. No external action is recorded. No official evaluator result is claimed, and no prototype result is promoted beyond the local falsification and evidence findings stated above.
