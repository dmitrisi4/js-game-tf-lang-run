# Behavior And AI Policy

## Purpose

NPCs, enemies, creatures, and autonomous props need behavior that is modular, testable, and budgeted. (source: ../../wikibest/best-practices.md)

## Ownership Split

Separate:
- sensing: what the agent observes
- decision state: durable state or blackboard-like data
- scene action: movement, animation, attacks, interactions
- feedback: one-shot events and UI/HUD signals

Durable gameplay state belongs in Zustand when it outlives a frame. One-shot feedback belongs on the event bus. (source: ../../GEMINI.md)

## Behavior Model

- Use simple finite state machines for narrow deterministic props.
- Use behavior-tree-like decomposition when NPC logic grows into patrol/search/chase/attack/flee tasks.
- Keep expensive sensing/pathfinding on controlled intervals, not every frame.
- Add relevance ranges so distant agents can sleep or tick less often.

## Navigation Rules

- Path queries should run when goals change or on a bounded interval.
- Do not perform reachability checks every frame.
- Keep navigation geometry simpler than visual geometry.
- Define fallback behavior for unreachable targets.

Use `../../docs/templates/behavior-agent.md` for new NPCs/enemies.

## Related

- [[gameplay-loop]]
- [[collision-layers]]
- [[world-streaming-performance]]
