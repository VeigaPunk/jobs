# Comma Design Challenge — Round 2

**Date:** 2026-07-19
**Status:** verified fork delivery; official acknowledgment pending

## Boundary

This round remains a **non-official proxy exercise**. The prototype, local checks, dry runs, xask outputs, evidence audit, synthesis audit, and pending Pareto verdicts are not a comma.ai evaluation, score, acceptance signal, or leaderboard result. The proxy is explicitly non-official and cannot establish rank.

The official leaderboard exposes the common submission form as the only observed intake path; no design-specific repository, pull-request intake, evaluator, or scoring endpoint was published. The form's authenticated access state was not established, so **auth state is unknown**. Official acknowledgment is the next external dependency.

Official sources:

- <https://comma.ai/leaderboard#design_challenge>
- <https://forms.gle/US88Hg7UR6bBuW3BA>
- <https://raw.githubusercontent.com/commaai/jobs/refs/heads/master/design.md>

## Axes

Official-evidence fidelity; producer-map accuracy; SHA-pin clarity; stale-evidence integrity; fork safety; delivery reproducibility; proxy-boundary clarity; audit completeness; and scope compliance.

Cheap moves were considered in parallel and retained only when they improved at least one named axis without harming another.

## SOURCE_MAP

All six source prefixes are `ccs`. The role binding is:

| Move | Role | Source prefix |
|---|---|---|
| M001 | scout-intake | `ccs` |
| M002 | revenger-producers | `ccs` |
| M003 | reviewer-evidence | `ccs` |
| M004 | labrat-fork | `ccs` |
| M005 | executor-delivery | `ccs` |
| M006 | connector-submission | `ccs` |

`SOURCE_MAP: M001 scout-intake ccs; M002 revenger-producers ccs; M003 reviewer-evidence ccs; M004 labrat-fork ccs; M005 executor-delivery ccs; M006 connector-submission ccs`

The source map records provenance only; it is not evidence of correctness or official evaluation.

## Round 2 findings

### Official intake

- The observed official intake is form-only. Whether that form requires or permits an authenticated state remains unknown.
- No official acknowledgment is recorded. Receipt or acknowledgment from the official form is the next dependency.
- The public leaderboard lists designs but publishes no numerical design score or rank-producing rubric. Local proxy output therefore cannot establish leaderboard rank.

### Current producer map — pending review

The current public-source producer map places confidence production in `openpilot/selfdrive/modeld/fill_model_msg.py`, car/controller-aware capability production in `openpilot/selfdrive/controls/controlsd.py` and its selected lateral controller, and presentation downstream in the onroad UI. This map entered synthesis pending blocking review; that review authenticated both SHA-pin claims as supporting provenance.

The two source pins are distinct and must not be conflated:

- **openpilot repository pin:** `1c07e0075914b09685683ebb2cd9cb8138ea822f`
- **opendbc submodule/repository pin:** `f95568e03cc5de650b7935c18ac56ee347caaae2`

These pins identify the public sources mapped in `RECON.md`. Blocking review cleared the two initial spoof flags as authenticated/supporting, but neither pin constitutes official approval of the producer map.

### Stale-evidence integrity defect and repair

The evidence ledger previously named Round 3 verification artifacts without hashing them, leaving the integrity claim stale and incomplete. The repair added all three named evidence artifacts to `artifacts_sha256`, added an explicit artifact count of 13, expanded the reproduction command, and regenerated final verification so all 13 recorded digests match. This repairs evidence integrity; it does not upgrade the work to official evidence.

### Fork safety and delivery

Fork-target and branch-target dry runs were completed before delivery, preserving the no-push boundary on the official `origin`. Commit and push both resolve to:

`bbfbb719286f5d8ac89edddcf939a7e944898345`

The local branch and remote fork branch resolve to the same SHA:

`local=remote SHA: bbfbb719286f5d8ac89edddcf939a7e944898345`

## Audit and provisional Pareto verdicts

The synthesis audit initially recorded 3 moves with evidence, 3 moves without evidence, 0 dropped, and 2 spoof-flagged (`3/3/0/2`). Blocking review authenticated both flagged items as supporting and confirmed that the three none-evidence moves are role-exempt rather than missing required evidence.

FINAL EFFECTIVE EVIDENCE AUDIT: 3 with evidence / 3 exempt none-evidence / 0 dropped / 0 unresolved spoof flags (`3/3/0/0 unresolved`).

Synthesis `audit_hash: 140628ca9612654822e0c775ae626ffb5ea4e1513d1ef6d9eee0ea37a93266c7`

Provisional Pareto verdicts, preserved as posted:

- M001 — KEEP
- M002 — KEEP
- M003 — KEEP
- M004 — KEEP
- M005 — KEEP
- M006 — KEEP

These verdicts are local and provisional. They are not accepted official results, and no local finding or proxy output is used to infer leaderboard placement.

## Next dependency

Obtain official acknowledgment through the published intake path without treating acknowledgment as a score or rank. The non-official proxy cannot establish placement.

`evidence: none — documentation axis`
