# Comma Design Challenge — Round 3

**Date:** 2026-07-19
**Status:** local submission audit recorded; blocking runtime defect; no official evaluation

## Boundary

This round remains a **non-official proxy exercise**. The comparison, clean-room review, adversarial wording, mutation result, evidence audit, and implementation candidates are not a comma.ai evaluation, score, acceptance signal, submission result, or leaderboard result. The prototype is **unsubmitted**. Its placement is **unknown**, and no rank or placement is inferred from accessible artifacts, inaccessible artifacts, local findings, or the absence of official feedback.

Official sources:

- <https://comma.ai/leaderboard#design_challenge>
- <https://raw.githubusercontent.com/commaai/jobs/refs/heads/master/design.md>

## Round 3 axes and roster

Axes: official-evidence fidelity; comparison neutrality; discoverability; clean-room comprehension; accessibility; non-intrusiveness; adversarial independence; mutation sensitivity; authentication integrity; proxy-boundary clarity; reproducibility; and scope compliance.

Cheap moves were considered in parallel and retained for review only when they improved at least one named axis without harming another.

The blinded roster was:

- **Official-entry scout:** compare only anonymously accessible material linked by the official challenge surface and record access failures without filling gaps.
- **Clean-room reader:** approach the repository and prototype without implementation context and report discoverability and first-read semantics.
- **Accessibility reviewer:** inspect non-color cues and keyboard exposure while separating observations from untested contrast and interaction claims.
- **Adversarial reviewer:** challenge independence, submission, official-status, score, rank, and joint-feasibility wording.
- **Mutation labrat:** apply four bounded mutations and report whether the local checks detect them.
- **Evidence auditor / Pareto reviewer:** blind provenance, classify evidence and spoof risk, and withhold verdicts pending review and authentication.

Roster labels describe local roles, not official reviewers or proof of independence.

## SOURCE_MAP

All five source prefixes are `ccs`. The role binding is:

| Move | Role | Source prefix |
|---|---|---|
| M001 | scout-competition | `ccs` |
| M002 | connector-package + reviewer-submission | `ccs` |
| M003 | labrat-cleanroom | `ccs` |
| M004 | critic-claims | `ccs` |
| M005 | mutation-evaluator | `ccs` |

`SOURCE_MAP: M001 scout-competition ccs; M002 connector-package + reviewer-submission ccs; M003 labrat-cleanroom ccs; M004 critic-claims ccs; M005 mutation-evaluator ccs`

The source map records provenance only; it is not evidence of correctness, official review, or submission.

## Official-entry comparison

The dated anonymous-access probe covered the six artifacts linked from the official design leaderboard. Four were accessible (`hyusap`, `salfolio`, `dahsmartgirl`, and `kalipeng`) and two were inaccessible (`davidcalifornia` was missing and `utkarshgill` was blocked). The accessible artifacts presented, respectively at a high level, an interactive limit gauge, confidence tiers with actuator gauges, a confidence ring with actuator bars, and a confidence halo/tempo treatment (`evidence/r1/m004-public-probe.md`).

This is an access and pattern comparison only. “Accessible” does not mean preferred, accepted, higher quality, or higher ranked; “inaccessible” does not mean rejected, lower quality, or lower ranked. No content is inferred for the inaccessible entries, access status may change, and no leaderboard placement is inferred for any entry or for this prototype.

## Discoverability and clean-room findings

- The root `README.md` is an upstream-only three-line file, reproduced exactly below. It does not point to the prototype, evaluator, local launch command, test command, evidence, or reports. A clean-room visitor must discover `prototype/README.md` by navigating the tree. This is a blocking package-discoverability defect.

```markdown
# Moved to [comma.ai/jobs](https://comma.ai/jobs)

![werehiring](https://github.com/commaai/jobs/assets/8762862/0b4e6a12-da48-4f1b-8780-a2422c598444)
```

- Once opened, the prototype explicitly presents persistent Level-2 responsibility, categorical intervention risk, orthogonal actuator reserve, independent urgency, and the non-official evaluator boundary. Its text also denies a jointly feasible-control claim.
- The interface includes text labels and distinct symbols in addition to color, plus polite live regions for changing status. These structural observations are not a completed accessibility evaluation.
- The clean-room browser probe hit a blocking, repeating `TypeError` at `prototype/ui.js:127` from `ids.urgency.classList.toggle`; the browser probe exited `2`. Runtime interaction was therefore not successfully completed.
- Contrast ratios were not measured against WCAG thresholds, and browser/assistive-technology combinations were not tested. The runtime failure blocked completion; no contrast-conformance claim is made.
- A full keyboard `Tab` sequence, focus visibility, control operation, and focus retention during scenario updates were not completed. No keyboard-accessibility claim is made.

## Adversarial status wording

“Independent” means only that a local adversarial reader was separated from the implementation role; it does not mean independent certification, comma.ai review, or institutional affiliation. “Unsubmitted” means no official submission or acknowledgment is recorded for this prototype. These terms must not be shortened into language implying official review, acceptance, scoring, or placement.

## Five blinded moves and provisional verdicts

| Blinded move | Candidate move | Recorded evidence state | Provisional Pareto verdict |
|---|---|---|---|
| M001 | Preserve the six-entry accessible/inaccessible comparison with dated access qualifiers and explicit no-rank-inference language. | `evidence/r1/m004-public-probe.md` | **KEEP** |
| M002 | Treat the current root README and package as submission-discoverable. | `none — connector/reviewer artifact` | **DROP** |
| M003 | Treat the clean-room browser path as runtime-, contrast-, and keyboard-complete. | Browser probe: repeating `TypeError` at `prototype/ui.js:127`; exit `2` | **DROP** |
| M004 | Use adversarially narrow “independent” and “unsubmitted” wording and reject any implication of official status or placement. | `none — critic-claims artifact` | **KEEP** |
| M005 | Use the authenticated mutation evaluator result to establish local test sensitivity only. | Authenticated result: 4/4 mutations detected | **KEEP** |

Exact provisional verdicts as posted:

- M001 — KEEP
- M002 — DROP
- M003 — DROP
- M004 — KEEP
- M005 — KEEP

M002 and M003 express the same package-advancement failure from submission-review and clean-room-runtime perspectives; their DROP is counted once as a deduplicated drop. These remain local provisional verdicts, not official acceptance or rejection.

The mutation result is authenticated as **4/4 mutations detected**. It establishes only that the four bounded mutations were caught by the local mutation evaluator; it does not establish browser correctness, accessibility, official acceptance, score, rank, or placement.

Initial evidence audit: 3 moves with evidence, 2 moves without evidence, 1 dropped, and 3 spoof-flagged (`3/2/1/3`). The three initial flags and blocking-review outcomes are preserved:

1. **M001 competition-comparison provenance:** initially spoof-flagged; authenticated against the committed anonymous-access probe; resolved as supporting local comparison evidence.
2. **M003 clean-room browser-probe provenance:** initially spoof-flagged; authenticated with exit `2` and the repeating `TypeError` at `prototype/ui.js:127`; resolved as supporting defect evidence, not successful runtime evidence.
3. **M005 mutation-evaluator provenance:** initially spoof-flagged; the 4/4 result was authenticated; resolved as supporting local mutation-sensitivity evidence only.

M002 and M004 have role-appropriate exempt none-evidence forms. M002/M003 contribute one deduplicated DROP. No spoof flag remains unresolved.

FINAL EFFECTIVE EVIDENCE AUDIT: 3 evidence / 2 exempt none-evidence / 1 deduplicated drop / 0 unresolved spoof flags (`3/2/1/0 unresolved`).

`audit_hash: c17b90e9879dfc21298eae3b468c70826a93cd229cdae824719705d74877de24`

The posted Pareto verdicts remain provisional. They do not establish a comma.ai verdict or leaderboard placement.

## Round 4 implementation candidates

1. Fix the `prototype/ui.js:127` runtime failure before further browser evaluation.
2. Add a browser smoke regression that fails on uncaught page errors and proves the basic interaction path completes.
3. Replace the upstream-only root README with an evaluator manifest linking the prototype, run and test commands, evidence, reports, known limits, and submission status.
4. Make the local-independent and unsubmitted status safe on first impression rather than discoverable only after navigation or interaction.
5. Preserve the non-official boundary and the explicit unknown/no-placement boundary in every evaluator-facing entry point.

These are implementation candidates, not approved Round 4 scope or accepted verdicts.

`evidence: none — documentation axis`
