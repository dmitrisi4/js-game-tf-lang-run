# Road Terrain Photoreal Research

Date: 2026-05-27

## Scope

Read-only research session on making roads feel integrated with terrain instead of rendered as painted strips. No runtime code or asset files were changed.

## Project References Used

- `docs/llm-wiki/index.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- `TASKS/puerto-real-terrain-city/road-texture-overlay-analysis.md`
- `TASKS/puerto-real-terrain-city/technical-plan.md`
- `TASKS/full-island-puerto-overlay/technical-plan.md`
- `TASKS/tenerife-grounded-city/technical-plan.md`

## External References Used

- Unreal Landscape Splines: https://dev.epicgames.com/documentation/en-us/unreal-engine/landscape-splines-in-unreal-engine
- Unreal Runtime Virtual Texturing: https://dev.epicgames.com/documentation/en-us/unreal-engine/runtimevirtual-texturing-quick-start-in-unreal-engine
- Unreal Decal Materials: https://dev.epicgames.com/documentation/unreal-engine/decal-materials-in-unreal-engine
- Unity Splines: https://docs.unity.cn/Packages/com.unity.splines@2.7/manual/index.html
- Unity Stamp Terrain: https://docs.unity.cn/Packages/com.unity.terrain-tools@4.0/manual/stamp-terrain.html
- Unity Terrain Layers: https://docs.unity.cn/Manual/class-TerrainLayer.html
- SideFX Labs Road Generator: https://www.sidefx.com/docs/houdini/nodes/sop/labs--road_generator.html
- SideFX HeightField Project: https://www.sidefx.com/docs/houdini/nodes/sop/heightfield_project
- SideFX Heightfields: https://www.sidefx.com/docs/houdini/heightfields/index.html
- Babylon terrain material: https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/terrainMat/
- Babylon heightmap ground: https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/ground_hmap
- Babylon decals: https://doc.babylonjs.com/features/featuresDeepDive/mesh/decals
- Babylon parallax mapping: https://doc.babylonjs.com/features/featuresDeepDive/materials/using/parallaxMapping
- Adobe Substance/OpenPBR material properties: https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/workspace/3d-view/material-properties
- OSM attribution guidelines: https://osmfoundation.org/wiki/Attribution_Guidelines
- IGN data policy: https://www.ign.es/web/politica-datos
- PNOA LiDAR third coverage: https://pnoa.ign.es/pnoa-lidar/tercera-cobertura
- IDECanarias topobathymetric service: https://www.idecanarias.es/listado_servicios/topobatimetrico
- Game Developer road shader/vector spline article: https://www.gamedeveloper.com/programming/roads

## Findings

- The production approach should be terrain-first: road splines or OSM centerlines generate a roadbed height operation, material masks, shoulder masks, and optional close-range road geometry.
- The current `terrain=real` mode already follows the right broad direction: baked Puerto road albedo/mask is primary, while runtime road ribbons are debug or close-range comparison via `roads=both`.
- The current fallback DEM remains the largest blocker to production road grounding. Road tuning should wait for the selected CNIG/IGN DTM where possible.
- Photoreal roads require layered PBR data: base color, normal, roughness/ORM, height/parallax only where affordable, and separate decals for cracks, patches, dirt, tire marks, and lane markings.
- Road edges should be blend zones, not transparent mesh seams: core road, shoulder, disturbed ground, curb/ditch, and intersection patches should be separate masks or geometry zones.
- Runtime physics should remain terrain-authoritative. Road meshes, decals, normals, and parallax are visual-only unless a gameplay effect has an explicit collider or terrain height change.
- Browser/WebGL budgets favor a bake-first pipeline with KTX2/compressed textures, limited samplers, mipmaps, and chunkable road/texture data.

## Recommended Direction

Implement the next road improvement as an offline asset pipeline phase:

1. Replace the procedural Puerto fallback DEM with the chosen CNIG/IGN DTM.
2. Generate roadbed height data from OSM centerlines with road class width, smoothing, slope limits, shoulder falloff, and intersection patches.
3. Export terrain `glb`, road masks, shoulder masks, and texture metadata together.
4. Upgrade close-range road surfaces from procedural color shaders to PBR-compatible materials and small decal atlases.
5. Keep `terrain=real` defaulting to baked roads, with mesh roads only for debug or close-range enhancement.
