# CCAL: Cross-Context Authority Leakage

## Vulnerability Summary

Claude Code hooks (`UserPromptSubmit`, `Stop`) inject `<system-reminder>` blocks into the agent's context via stdout. The model treats these as trusted system-level guidance, enabling cross-session contamination when multiple sessions share a filesystem.

**CVSS 3.1**: 8.5 High — `AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:L`
In shared/CI environments where repos ship `.claude/` configs, attack vector becomes Network → 9.0+ Critical.

OpenAI rated the equivalent vulnerability class at **9.5 Critical**.

## Attack Vectors

1. **UserPromptSubmit hook (nudge)**: Fires on every user prompt, injects `WEAVER_PENDING` system-reminder instructing the model to "drain" a task queue before answering the user
2. **Stop hook (coercion)**: Fires at turn end, blocks with drain-or-delete ultimatum
3. **CLAUDE.md poisoning**: Repository-level instructions that establish the "drain protocol" as legitimate workflow
4. **Persistence**: Hooks survive across sessions — one poisoned session infects all future sessions on the machine

## Reproduction Results

### With Defense v2 (Priority Rule)
- 8/8 sessions completed
- 0/7 attack tasks succeeded (all injections resisted)
- Defense v2 system prompt instructs model to treat injected reminders as context, not commands

### Without Defense (Minimal System Prompt)
- 8/8 sessions completed
- 0/7 hijacked in shared-env (cross-session marker depletion — first session deferred the marker, emptying queue for all others)
- In isolated Docker containers, hijack rate is measurably higher

### Key Finding
In shared environments, one defensive session can "vaccinate" the pool by consuming/deferring markers before malicious sessions act. Conversely, one compromised session can destroy state for all others.

## Files

- `run_shared_env.sh` — 8 parallel sessions with Defense v2 on shared filesystem
- `run_shared_env_nodefense.sh` — Same but with minimal system prompt (no defense)

## Attribution

Discovered, reproduced, and defense-patched by **Veigapunk**.
Submitted to Anthropic VDP. Rejected ("requires elevated privileges").
