# AGENTS.md Compliance QA Report

Date: 2026-05-16

## Summary

`AGENTS.md` mostly satisfies the requirement: it is compact, points to detailed reference docs, and explicitly says agents must read task-relevant references before implementing, modifying, reviewing, or validating tasks.

Score: 8.5 / 10

Main strength: the required reference-use rule is direct and appears before orientation, coding rules, planning, and validation.

Main weakness found during initial testing: compliance depends on the agent selecting the correct references from a list. This was mitigated by adding an audit rule requiring non-trivial tasks to record which references were used in task notes, session logs, or the final response.

## Structural Checks

- `AGENTS.md` line count: 80, below the 150-line target.
- `CLAUDE.md`, `CODEX.md`, and `GEMINI.md` are symlinks to `AGENTS.md`.
- All listed `docs/reference/*.md` files exist.
- Long rules were successfully moved out of `AGENTS.md` while preserving coverage.

## Scenario Tests

### 1. Add a new inventory crafting rule

Prompt: "Add a rule where crafting a valid word grants XP and unlocks a gate."

Expected reference reads:
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/tech-stack-validation.md`
- `docs/llm-wiki/index.md`

Expected behavior:
- Use `TASKS/` planning because this is feature implementation.
- Keep durable XP, inventory, and progression in Zustand, not the event bus.
- Add focused tests for pure gameplay logic.
- Run relevant `bun` validation.

Result: Pass. `AGENTS.md` points to the needed references and planning flow.

### 2. Add player movement input for mobile parity

Prompt: "Add mobile joystick input for the player."

Expected reference reads:
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/llm-wiki/index.md`

Expected behavior:
- Normalize input into semantic commands before movement consumes it.
- Keep movement authority in the physics capsule.
- Do not put camera or player logic directly into `MainScene.tsx`.

Result: Pass. The reference list covers all required constraints.

### 3. Add a decorative GLB building pack

Prompt: "Import a new AI-generated building pack into the world."

Expected reference reads:
- `docs/reference/asset-pipeline.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md` if colliders are involved
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`

Expected behavior:
- Do not import AI-generated assets directly into runtime without Blender cleanup.
- Use `glb`.
- Record source/license, scale, pivot, texture budget, material maps, collider strategy, and validation status.
- Update asset templates when needed.

Result: Pass. `AGENTS.md` clearly routes asset work to the right references.

### 4. Add dynamic enemy projectiles

Prompt: "Enemies should shoot fast projectiles at the player."

Expected reference reads:
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/llm-wiki/index.md`

Expected behavior:
- Evaluate pooling before repeated create/destroy.
- Document collision body, collider shape, layer, mask, mass, damping, restitution, sleeping, and CCD policy.
- Avoid per-frame expensive reachability checks unless measured.

Result: Pass. The physics and gameplay references contain the needed constraints.

### 5. Fix a one-line typo in HUD text

Prompt: "Fix this typo in the HUD label."

Expected reference reads:
- `docs/reference/runtime-architecture.md` if touching React UI.
- `docs/reference/tech-stack-validation.md` for validation if any command is run.

Expected behavior:
- User can explicitly skip planning for tiny one-line fixes.
- Without explicit skip, `AGENTS.md` says all implementation requests go through the task manager.

Result: Partial pass. The rule is strict, but may be too heavy for truly trivial fixes unless the user says to skip planning.

### 6. Review a PR for architecture regressions

Prompt: "Review this change for issues."

Expected reference reads:
- References matching touched areas.
- `docs/reference/runtime-architecture.md` for general architecture review.
- `docs/reference/tech-stack-validation.md` for validation expectations.

Expected behavior:
- Review should check modularity, ownership boundaries, tests, validation, and source-of-truth state rules.

Result: Pass. `AGENTS.md` explicitly includes reviewing in the required reference-use rule.

### 7. Run validation after dependency changes

Prompt: "Check whether the project still validates after package updates."

Expected reference reads:
- `docs/reference/tech-stack-validation.md`

Expected behavior:
- Use `bun run check`, `bun run test`, `bun run test:ci`, or `bun run build` as relevant.
- Report exact failures and separate baseline issues from introduced issues.

Result: Pass. Validation guidance is clear and duplicated in compact form in `AGENTS.md`.

### 8. Add an NPC with autonomous behavior

Prompt: "Add an NPC that patrols and reacts to pickups."

Expected reference reads:
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`

Expected behavior:
- Separate sensing, durable decision state, and scene action.
- Avoid turning the event bus into durable state.
- Use or update `docs/templates/behavior-agent.md`.

Result: Pass.

### 9. Update only documentation

Prompt: "Move these project rules into a new doc."

Expected reference reads:
- `docs/reference/documentation-maintenance.md`
- `docs/reference/tech-stack-validation.md` if validation commands are considered.

Expected behavior:
- Update affected docs.
- Add session log for meaningful documentation sessions.
- No runtime tests required unless source behavior changes.

Result: Pass.

### 10. Add static trees to world scenery

Prompt: "Add more trees near the road."

Expected reference reads:
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md` if new models/textures are introduced
- `docs/reference/physics-collision.md` if collisions are introduced
- `docs/llm-wiki/index.md`

Expected behavior:
- Inspect `WorldScenery.tsx`, `worldData.ts`, and relevant model path.
- Keep static world placement data separate.
- Avoid scanning unrelated generated output.

Result: Pass.

### 11. Change camera follow behavior

Prompt: "Make the follow camera smoother."

Expected reference reads:
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/tech-stack-validation.md`
- `docs/llm-wiki/index.md`

Expected behavior:
- Keep camera logic isolated in controller modules.
- Keep Babylon responsible for camera rig behavior.
- Validate scene integration as relevant.

Result: Pass.

### 12. Add texture compression policy

Prompt: "Define policy for world texture compression."

Expected reference reads:
- `docs/reference/asset-pipeline.md`
- `docs/reference/documentation-maintenance.md`

Expected behavior:
- Preserve explicit budget fields: max resolution, mipmap policy, compression target, color/data classification, and loading expectation.
- Update workflow docs if conventions change.

Result: Pass.

## Requirement Evaluation

Requirement: agents must use references for tasks.

Observed support:
- Strong wording: "must read the task-relevant reference docs".
- Broad trigger scope: implementing, modifying, reviewing, or validating.
- Clear mapping from task type to reference doc.
- `docs/llm-wiki/index.md` is required before broad implementation searches.

Observed gaps:
- Tiny fixes still require task planning unless the user explicitly says to skip it. This is consistent with the protocol, but may feel heavy.

Fixed during QA:
- Added a non-trivial-task audit rule to `AGENTS.md` so reference use is recorded.
- Updated `docs/llm-wiki/index.md` to name `AGENTS.md` instead of `GEMINI.md`.
- Appended the wiki change to `docs/llm-wiki/log.md`.

## Recommendations

1. Consider allowing agents to skip `TASKS/` planning for obvious documentation-only maintenance under a small threshold, if desired.
