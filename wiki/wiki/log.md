# Log

Append-only chronological record. Each entry uses a consistent header so it can be parsed with `grep "^## \[" wiki/log.md`.

Entry types:
- `project-scan` - live repository files were processed and integrated into the wiki
- `ingest` - a source was processed and integrated into the wiki
- `query` - a question was asked against the wiki
- `lint` - a health check was run

Format:
```text
## [YYYY-MM-DD] <type> | <short title>
- pages touched: ...
- notes: ...
```

---

## [2026-05-06] init | wiki structure created
- pages touched: CLAUDE.md, wiki/index.md, wiki/log.md
- notes: empty raw/ and wiki/ created. Schema set. Ready for first ingest.

## [2026-05-13] project-scan | adapt schema for keyArena
- pages touched: README.md, CLAUDE.md, wiki/index.md, wiki/log.md
- notes: changed the template from raw-only document ingest into a project wiki workflow that can read the live keyArena repository plus optional raw resources.

## [2026-05-13] project-scan | seed keyArena project wiki
- pages touched: wiki/project-map.md, wiki/scene-architecture.md, wiki/gameplay-loop.md, wiki/asset-pipeline.md, wiki/validation.md, wiki/decisions.md, wiki/index.md, wiki/log.md
- notes: added initial project pages based on root standards, existing project docs, and current source-map conventions.

## [2026-05-13] project-scan | integrate wikibest practices
- pages touched: ../../GEMINI.md, ../../docs/templates/asset-intake.md, ../../docs/templates/texture-budget.md, ../../docs/templates/physics-object.md, ../../docs/templates/behavior-agent.md, wiki/asset-intake-template.md, wiki/texture-budget.md, wiki/physics-object-policy.md, wiki/collision-layers.md, wiki/behavior-ai-policy.md, wiki/world-streaming-performance.md, wiki/index.md, wiki/log.md, ../../src/scenes/physics/collisionLayers.ts, ../../src/scenes/physics/physicsMetadata.ts
- notes: promoted wikibest research into enforceable project rules, reusable templates, wiki guidance, and initial physics/collision metadata primitives.
