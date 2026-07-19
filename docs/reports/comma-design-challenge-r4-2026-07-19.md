# Comma Design Challenge — Round 4

**Date:** 2026-07-19
**Status:** shipping-safe local package verified; non-official, unsubmitted, and without placement

## Boundary

This round remains a **non-official proxy exercise**. The implementation, browser checks, clean-clone run, mutation controls, evidence audit, and provisional verdicts are not a comma.ai evaluation, score, acceptance signal, submission result, or leaderboard result. This concept is **unsubmitted**; the official form route was documented but not used, and no official acknowledgment was received. Its placement is therefore **unknown**, and no placement is inferred.

Official sources and observed intake route:

- <https://comma.ai/leaderboard#design_challenge>
- <https://raw.githubusercontent.com/commaai/jobs/refs/heads/master/design.md>
- <https://forms.gle/US88Hg7UR6bBuW3BA> — documented only; unused and unacknowledged

## Round 4 axes and roster

Axes: runtime correctness; browser-error sensitivity; negative-control proof; concurrent-run isolation; package discoverability; immutable-link integrity; clean-clone reproducibility; official-boundary clarity; audit completeness; and scope compliance.

Cheap moves were considered in parallel and retained only when they improved at least one named axis without harming another.

The blinded local roster was:

- **Runtime executor:** repair the Round 3 browser exception and preserve the existing UI semantics.
- **Package connector:** make the root README an evaluator-facing manifest with immutable links, launch steps, tests, limits, and intake status.
- **Adversarial validator:** challenge repository-root assumptions, links, ports, false-positive smoke behavior, and cleanup.
- **Mutation labrat:** apply four bounded mutations, record survivors, and require a killed-survivor rerun.
- **Clean-clone verifier:** exercise the package from a fresh clone rather than the working tree.
- **Evidence auditor / Pareto reviewer:** blind provenance, classify evidence and structural flags, and preserve provisional verdicts.

Roster labels identify local roles only. They do not imply comma.ai participation, institutional independence, or official review.

## SOURCE_MAP

The finalized source names are:

| Move | Source name |
|---|---|
| M001 | `ccs-executor-artifact` |
| M002 | `ccs-connector-r4` |
| M003 | `ccs-reviewer-final` |
| M004 | `ccs-labrat-final` |
| M005 | `ccs-mutation-final` |

The distiller's revealed role labels map respectively as `A → M001 ccs-executor-artifact`, `B → M002 ccs-connector-r4`, `C → M003 ccs-reviewer-final`, `D → M004 ccs-labrat-final`, and `E → M005 ccs-mutation-final`. This source map preserves provenance bookkeeping only; it does not imply model diversity or provide evidence of correctness.

## Initial implementation and validation blockers

Round 4 first landed the runtime/browser work in `6b7be1175a9d9cd3fdaa960b7fcca369ed16a13e` (`M4A: complete runtime and browser smoke verification`) and the evaluator-facing package in `bc09af50da34bcc656bf3060e1ef3d905a09532a` (`M4B: complete evaluator-facing package manifest`). The runtime repair removed the Round 3 `ids.urgency.classList.toggle` failure, and the package commit replaced the upstream-only root README.

Blocking validation did not accept those commits as shipping-safe:

1. README links and launch instructions incorrectly inserted a `design/` path prefix even though `design` is the repository root.
2. Chromium remote debugging used hard-coded port `9393`, so concurrent smoke runs could collide.
3. A successful smoke run did not prove that injected `console.error` and uncaught-exception controls would make the gate fail.

These were package-integrity blockers, not findings about official acceptance or placement.

## Repair history

Commit `7059522bf8cc73d505b07b54ee9aa9a98518f71f` corrected the bad `design/` paths, selected an ephemeral debugging port, introduced a wrapper gate, ran two normal smoke instances concurrently, and added two negative modes. It was a **deficient intermediate**, not the shipping result: its `console.error` control was not observed through the paired CDP console-API channel, its uncaught control could fail inside `Runtime.evaluate` rather than prove the page-event path, and its process/connection cleanup still had race exposure.

Commit `5bf14091d947bd790601f38c9fac4aaff0bcf5e7` was the validated package tip before this report commit and is the shipping-safe final repair. It:

- listens to both `Log.entryAdded` and `Runtime.consoleAPICalled`;
- injects the uncaught exception asynchronously so `Runtime.exceptionThrown` must observe it;
- makes browser profile paths process-unique;
- closes CDP, Chromium, and the HTTP server deterministically;
- prints immutable-link, official-route, concurrent-normal, and negative-control outcomes;
- pairs the browser guard with README commands and expected stable lines.

The README/browser pairing matters: the evaluator-facing instructions name the syntax check and executable wrapper, while the wrapper independently proves immutable links, concurrent success, and failure on both negative controls. Neither prose alone nor an unexercised smoke implementation is treated as proof.

The smoke server itself binds directly to port `0`. Chromium debugging still obtains a candidate ephemeral port by briefly binding and releasing a TCP socket before Chromium binds it. That leaves a **theoretical port-allocation TOCTOU race** between release and Chromium startup. It was not observed in the recorded concurrent or clean-clone runs, but this round does not claim the race is impossible.

## Exact final gates and clean-clone proof

The final repository-root gate sequence was:

```sh
node --check prototype/ui.js
node --check prototype/tests/browser_smoke.mjs
node --check prototype/tests/browser_smoke_gate.mjs
node prototype/tests/browser_smoke_gate.mjs
node prototype/tests/run-tests.mjs
git diff --check
```

The exact stable pass lines were:

```text
prototype engine tests: pass
artifact contract tests: pass
prototype/browser smoke: pass
prototype/browser smoke gate: pass
```

The wrapper additionally recorded six immutable artifact links at HTTP `200`, an allowed success/redirect/auth-gate response for the documented official form route, concurrent normal smoke exits `0, 0`, nonzero exits for both `console-error` and `uncaught-exception`, and two normal `prototype/browser smoke: pass` lines. Syntax checks and `git diff --check` are silent on success; environment-specific Chromium DevTools output is not a stable gate line.

Clean-clone validation checked out final commit `5bf14091d947bd790601f38c9fac4aaff0bcf5e7` into a fresh directory and ran the same repository-root sequence. It reproduced the final SHA, the four stable pass lines, six immutable-link `200` results, concurrent normal exits `0, 0`, and nonzero exits for both negative modes. This is local reproducibility proof only; it is not hosted-deployment, official-submission, or official-evaluation proof.

## Mutation story

The first bounded mutation pass detected **3/4** mutations. The survivor was the console-error path: listening only to the CDP log stream did not reliably turn the injected `console.error` into a failed smoke. The final repair added the console-API listener and reran the surviving mutation; the survivor was then killed. The resulting claim is deliberately narrow: the paired README/browser gate detects all four bounded mutations after repair. It does not establish exhaustive browser correctness, accessibility conformance, official acceptance, or placement.

## Effective evidence audit and provisional verdicts

The effective audit covers five local moves: 4 with required evidence, 1 role-exempt none-evidence item, 0 dropped, and 0 unresolved spoof flags (`4/1/0/0`). Independent validation cleared four initial structural flags: repository-root path correctness, debugging-port isolation, negative-control observability, and evaluator-facing gate/README consistency. Clearing a flag authenticates the bounded local claim only; it does not convert local evidence into official evidence.

The distiller audit hash is preserved without recalculation:

`audit_hash: db14d57ed17ee3954f6a59888cac617d85c3c014d8bdfa55d51456712f967ea2`

Provisional Pareto verdicts:

- **M001 — KEEP:** retain the `6b7be11` runtime fix and browser interaction coverage.
- **M002 — KEEP:** retain the `bc09af5` root evaluator manifest after path correction.
- **M003 — KEEP:** retain ephemeral-port concurrency and deterministic cleanup, with the theoretical TOCTOU limit disclosed.
- **M004 — KEEP:** retain the paired positive/negative browser gate after the 3/4 survivor was killed.
- **M005 — KEEP:** retain explicit non-official, unsubmitted, no-acknowledgment, and unknown-placement wording.

These verdicts are local and provisional. They are not comma.ai verdicts and do not establish score, rank, acceptance, submission, or leaderboard placement.

## Protocol boundary

The protocol cap was reached after the independent validation, repair, clean-clone, mutation-survivor rerun, and evidence audit. No further implementation round, official form submission, or external acknowledgment attempt is represented. The published form remains the documented official route, but it was unused and no acknowledgment was received.

`evidence: none — documentation axis`
