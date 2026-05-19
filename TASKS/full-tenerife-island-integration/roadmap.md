# Roadmap

## Phase 0: Planning And Asset Audit

Gate: documentation records asset source, license, size, mesh budget, texture budget, and runtime risks.

Deliverables:
- Product plan, technical plan, asset intake, texture budget, physics plan, and task checklist.
- Confirmed model statistics from GLB metadata and Blender import.
- Decision on first runtime mode name and fallback behavior.

## Phase 1: Blender Normalization Pass

Gate: normalized GLB imports cleanly and has semantic mesh names.

Deliverables:
- Source asset remains untouched at `public/models/land/tenerife._islas_canarias.glb`.
- Create normalized output under `public/models/environment/`, for example `tenerife-full-island-normalized.glb`.
- Remove Sketchfab wrapper nodes where possible.
- Rename terrain visual meshes to a stable naming scheme.
- Apply transforms so Babylon does not need to interpret nested Sketchfab orientation matrices.
- Extract or downscale the embedded 8192 texture to a runtime budget.
- Record attribution and validation notes.

## Phase 2: Full-Island Runtime Mode

Gate: the full island loads in a separate URL mode without breaking existing Puerto mode.

Deliverables:
- Add a terrain mode such as `?tenerife=1&terrain=island-full`.
- Add a focused component such as `TenerifeFullIslandTerrain`.
- Keep `Environment.tsx` as the composition owner only.
- Expose the active terrain as `ground1` or provide a compatibility raycast target expected by player/reset/building code.
- Add config tests for the new terrain mode.

## Phase 3: Ocean And Safety Layer

Gate: ocean is visually present around the island and player reset behavior remains stable.

Deliverables:
- Replace the rectangular low-water look with an island-scale ocean surface for the full-island mode.
- Keep ocean visual separate from gameplay authority.
- Add seabed/deep-water reset bounds large enough for the normalized island.
- Tune water level against island terrain sea level.
- Browser-check coastal viewpoints near Puerto.

## Phase 4: Puerto Placement And Alignment

Gate: Puerto city patch can be aligned on the full island in a debug mode.

Deliverables:
- Compute or hand-calibrate Puerto transform:
	- island coordinate
	- city patch local anchor
	- scale
	- yaw
	- height offset
- Add a debug alignment overlay or markers for Puerto, Teide, and coastline.
- Add mode flag to render:
	- full island only
	- full island plus Puerto patch
	- existing Puerto patch only
- Avoid z-fighting between island terrain and city patch.

## Phase 5: Physics And Performance

Gate: player movement works on active gameplay terrain without using the full high-poly visual mesh as the only collision plan.

Deliverables:
- First pass may use static mesh collision only for a limited active region if performance is acceptable.
- Add simplified collider or sampled height proxy for broad island terrain.
- Keep detailed Puerto building collisions from the city patch.
- Measure load time, memory, and frame behavior.
- Decide whether to split the full island into LOD or streaming tiles.

## Phase 6: Browser QA And Polish

Gate: screenshots and browser checks prove the intended experience.

Deliverables:
- Desktop screenshot from Puerto coast showing ocean.
- Screenshot facing inland showing real mountainous island mass.
- Screenshot or route proving Teide is terrain, not a backdrop.
- Validation commands documented with exact pass/fail status.
