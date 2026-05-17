# Decisions

## Active Standards

- `../../GEMINI.md` is the authoritative project standard. `CLAUDE.md` and `CODEX.md` should remain thin pointers to it. (source: ../../GEMINI.md)
- Use `type` instead of `interface`; component props should be named `PropsType`. (source: ../../GEMINI.md)
- Use tabs and Biome-compatible formatting. (source: ../../GEMINI.md)
- Use absolute aliases such as `@/...`. (source: ../../GEMINI.md)
- Add JSDoc for functions, hooks, and non-trivial components, explaining why rather than only what. (source: ../../GEMINI.md)
- Meaningful architecture or implementation sessions should be logged in `docs/history/logs/`. (source: ../../GEMINI.md)

## Runtime Boundaries

- Keep `MainScene.tsx` as a composition root. (source: ../../GEMINI.md)
- Player locomotion authority belongs to a physics capsule, not the visual mesh. (source: ../../GEMINI.md)
- Input must be normalized into semantic commands before player movement consumes it. (source: ../../GEMINI.md)
- World scale is fixed at `1 unit = 1 meter`. (source: ../../GEMINI.md)

## Related

- [[scene-architecture]]
- [[asset-pipeline]]
- [[validation]]
