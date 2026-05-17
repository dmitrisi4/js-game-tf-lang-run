# Tenerife City Streaming Epic

Status: In progress, paused behind `TASKS/puerto-real-terrain-city/` CNIG/IGN DTM replacement.

Source documents:

- `docs/tenerife-city-streaming-plan.md`
- `docs/tenerife-city-streaming-tasks.md`

Priority note:

Streaming optimization should continue after the Puerto terrain city pipeline replaces the current procedural fallback DEM with the selected CNIG/IGN DTM. The first runtime pass now produces a larger city asset set:

- `public/models/environment/puerto-de-la-cruz-terrain.glb`
- `public/textures/tenerife/puerto-city-albedo.png`
- `data/tenerife/generated/roads/puerto-roads-runtime.json`
- `data/tenerife/generated/buildings/puerto-building-footprints.json`

Chunking work should account for terrain GLB, baked texture, generated road layers, and generated building footprints as separate streaming candidates.
