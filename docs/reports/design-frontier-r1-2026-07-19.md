# Design Frontier — Round 1

**Date:** 2026-07-19  
**Status:** research frontier; no official evaluation

## Boundary

Work was limited to the design challenge. The official leaderboard marked the challenge **ACTIVE** and linked the brief and common submission form. No numerical score, evaluator, rubric, or declared winner for design was observed on the leaderboard or brief. No external action is recorded in this repository.

Official sources:

- <https://comma.ai/leaderboard#design_challenge>
- <https://raw.githubusercontent.com/commaai/jobs/refs/heads/master/design.md>

## Axes

Official evidence; differentiation; comprehension; anticipation; non-intrusiveness/accessibility; technical feasibility; reproducibility; scope compliance.

## Tmux lanes

`design-research`, `design-build`, and `design-eval` were created in the existing tmux session, each rooted at this workspace.

## Blinded moves and verdicts

| Move | Claim | Required evidence form | Verdict |
|---|---|---|---|
| M001 | Treat the official intake as authoritative; do not optimize against an unpublished evaluator. | `none — research artifact` | Accept |
| M002 | Keep intervention confidence distinct from actuator headroom and demonstrate mixed states. | `none — research artifact` | Accept |
| M003 | Use a producer-side normalized confidence/headroom contract and flat primitive renderer. | `none — reverse-engineering artifact` | Accept conditionally; unsupported values render unavailable |
| M004 | Differentiate beyond recurring gauges, tiers, rings, bars, and halos. | `evidence/r1/m004-public-probe.md` HYPOTHESIS/METHOD/RESULT | Accept |
| M005 | Add a jointly feasible solid/dashed trajectory horizon. | `none — adversarial-design artifact` | Defer; no grounded joint-feasibility signal |
| M006 | Use orthogonal channels for confidence, actuator reserve, and urgency while responsibility remains invariant. | `none — cross-axis artifact` | Accept conditionally; mixed-state legibility requires testing |

The evidence gate counted the role-specific `none — … artifact` value as the required evidence form for exempt research/reconstruction/design roles. It did not represent executable proof.

EVIDENCE AUDIT: 6 moves with evidence, 0 moves without, 0 dropped, 0 spoof_flagged

## Contradiction

Independent headroom values do not establish a jointly feasible maneuver horizon. M005 was therefore withheld rather than allowing a visually useful idea to overstate current signal semantics.

## Reproducibility ledger

The exact move/source-prefix serialization, complete move manifest, artifact digests, and SHA-256 commands are recorded in `evidence/r1/ledger.json`. `RECON.md` records commit-pinned public-source anchors; `MODEL.md` records the bounded data-contract proposal. The M003 proposer self-reported `openai/gpt-5.6-sol`, consistent with the committed `cdx` lane prefix but not evidence of correctness.

`audit_hash: ffcf47a412e57b18276dae7085eac783319d7999ab94b54732a5fc84acb5ce30`

All judgments above are local and non-official. No external action is recorded locally.
