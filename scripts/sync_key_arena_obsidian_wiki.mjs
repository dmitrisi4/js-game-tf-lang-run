import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const vaultProjectRoot =
	'/Users/dmytrosichkar/Documents/project/2026/brainAI/brainAI/PROJECTS/key-arena';
const wikiRoot = path.join(vaultProjectRoot, 'wiki');
const date = '2026-05-08';

const readProjectFile = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');

const writeWikiPage = (filename, content) =>
	writeFile(path.join(wikiRoot, filename), `${content.trim()}\n`);

const upsertIndexEntry = (indexContent, sectionName, entry) => {
	if (indexContent.includes(entry)) {
		return indexContent;
	}

	const sectionHeading = `## ${sectionName}`;
	const sectionStart = indexContent.indexOf(sectionHeading);

	if (sectionStart === -1) {
		return `${indexContent.trim()}\n\n${sectionHeading}\n${entry}\n`;
	}

	const nextSectionStart = indexContent.indexOf('\n## ', sectionStart + sectionHeading.length);
	const sectionEnd = nextSectionStart === -1 ? indexContent.length : nextSectionStart;
	const beforeSection = indexContent.slice(0, sectionStart);
	const section = indexContent.slice(sectionStart, sectionEnd);
	const afterSection = indexContent.slice(sectionEnd);
	const cleanedSection = section
		.replace(/\n_\(empty\)_\n?/, '\n')
		.replace(/\n_\(no sources yet\)_\n?/, '\n');

	return `${beforeSection}${cleanedSection.trimEnd()}\n${entry}\n${afterSection}`;
};

const appendLogEntry = (logContent, entry) => {
	const normalizedEntry = entry.trim();
	const entryHeader = normalizedEntry.split('\n')[0];

	if (logContent.includes(entryHeader)) {
		return logContent;
	}

	return `${logContent.trim()}\n\n${normalizedEntry}\n`;
};

await mkdir(wikiRoot, { recursive: true });

const realismPipeline = await readProjectFile('docs/realism_implementation_pipeline.md');
const technicalPipeline = await readProjectFile('docs/technical_implementation_pipeline.md');
const mapForestPipeline = await readProjectFile('docs/map_forest_expansion_pipeline.md');

await writeWikiPage(
	'project-overview.md',
	`
# Key Arena Project Overview

## Summary

Key Arena is a React + Vite + Babylon.js RPG prototype focused on a discovery loop: a controllable player explores a 3D world, collects letter crystals, crafts words, gains XP, and advances through authored waves.

## Current Technical Shape

- Runtime: React, Vite, Babylon.js, react-babylonjs.
- Physics: Havok via Babylon physics v2.
- State: Zustand store for player stats, inventory, crafting, and UI state.
- Core scene: \`src/scenes/MainScene.tsx\`.
- Player: \`src/scenes/player/Player.tsx\` and \`AssetPlayerVisual.tsx\`.
- Environment: \`src/scenes/environment/Environment.tsx\`, \`Ground.tsx\`, \`WorldScenery.tsx\`, \`worldData.ts\`, \`worldZones.ts\`.
- Discovery loop: \`src/scenes/discovery/discoveryWaves.ts\`, \`discoveryRecipes.ts\`, collectible components.
- UI: \`src/ui/GameHud.tsx\`, \`InventoryOverlay.tsx\`.

## Implemented RPG Expansion

- Expanded map from 48x48 to 96x96, then to 144x144.
- Added data-driven world object definitions.
- Added trees, rocks, props, NPC placeholders, and ambient creatures.
- Increased tree population to 64 through deterministic forest clusters.
- Added the \`grove\` discovery wave and \`GROVE\` recipe progression.
- Added world-zone metadata and current-zone HUD reporting.
- Added outer zones: \`northern-woods\` and \`southern-wilds\`.
- Replaced the flat ground with a deterministic zone-aware procedural terrain mesh.
- Added tests for world bounds and expanded discovery data.

## Current Direction

The next major direction is realism: zones, terrain, lighting, foliage density, NPC interaction, creature behavior, sound, animation polish, interactable props, persistence, and performance work.

## Related Pages

- [[realism-implementation-pipeline]]
- [[technical-implementation-pipeline]]
- [[map-forest-expansion-pipeline]]
- [[project-request-log]]
- [[llm-working-memory]]
`,
);

await writeWikiPage('realism-implementation-pipeline.md', realismPipeline);
await writeWikiPage('technical-implementation-pipeline.md', technicalPipeline);
await writeWikiPage('map-forest-expansion-pipeline.md', mapForestPipeline);

await writeWikiPage(
	'project-request-log.md',
	`
# Key Arena Project Request Log

This page summarizes user requests that should remain available as durable project context. Chronological execution details stay in [[log]].

## 2026-05-08 - RPG Expansion Request

User asked to analyze how to expand the prototype into a fuller RPG, enlarge the map, add trees and other world objects, and possibly add creatures and NPCs.

Outcome:

- Added a 96x96 map.
- Added trees, rocks, props, NPC placeholders, and ambient creatures.
- Added a data-driven world layer.
- Extended discovery progression with a grove objective.
- Added tests and documented a broader RPG expansion pipeline.

## 2026-05-08 - Realism Analysis Request

User asked what could be done to increase realism.

Key recommendations:

- Add semantic world zones.
- Replace flat ground with terrain.
- Improve lighting, shadows, and atmosphere.
- Add foliage and small props.
- Add NPC interaction and dialog.
- Add creature behavior states.
- Add sound and animation polish.
- Add interactable props and persistence.

## 2026-05-08 - Durable LLM Wiki Logging Request

User asked to locate the Obsidian vault \`brainAI\`, find \`PROJECTS/key-arena\`, follow the LLM wiki template, and log project information and user requests so future LLM sessions can refer to it.

Vault project path:

\`/Users/dmytrosichkar/Documents/project/2026/brainAI/brainAI/PROJECTS/key-arena\`

Durable pages created:

- [[project-overview]]
- [[realism-implementation-pipeline]]
- [[technical-implementation-pipeline]]
- [[project-request-log]]
- [[llm-working-memory]]

## 2026-05-08 - Technical Pipeline Implementation Request

User asked to write a technical implementation pipeline and implement it.

Outcome:

- Added \`docs/technical_implementation_pipeline.md\`.
- Implemented the first technical slice: world zones foundation.
- Added \`src/scenes/environment/worldZones.ts\`.
- Added current-zone tracking in \`MainScene\`.
- Added current-zone display in \`GameHud\`.
- Added tests for zone ids, bounds, position resolution, and discovery-wave bindings.

## 2026-05-08 - Terrain Implementation Request

User approved continuing with the next technical slice.

Outcome:

- Added \`src/scenes/environment/terrainData.ts\`.
- Added \`src/scenes/environment/TerrainGround.tsx\`.
- Replaced the old flat \`Ground\` mesh with procedural terrain.
- Added zone-colored vertex terrain materials.
- Added static Havok mesh physics for the terrain.
- Aligned world scenery, NPC placeholders, props, and ambient creatures to sampled terrain height.
- Added tests for terrain height range, zone material mapping, and relative zone height differences.

## 2026-05-08 - Larger Map and More Trees Request

User asked to make the map even larger and add more trees.

Outcome:

- Added \`docs/map_forest_expansion_pipeline.md\`.
- Increased \`WORLD_SIZE\` from \`96\` to \`144\`.
- Added outer zones \`northern-woods\` and \`southern-wilds\`.
- Expanded existing zone centers/radii for the larger map.
- Increased trees from 13 to 64 via deterministic forest clusters.
- Updated tests for tree density, zone resolution, and terrain material lookup.
`,
);

await writeWikiPage(
	'llm-working-memory.md',
	`
# LLM Working Memory

## Purpose

This page defines how future LLM sessions should use this Obsidian wiki for the Key Arena project.

## Start-of-Session Routine

1. Read \`wiki/index.md\` first.
2. Read [[project-overview]] for current architecture and direction.
3. Read [[project-request-log]] for durable user intent.
4. Read [[realism-implementation-pipeline]] when implementing realism/RPG-world work.
5. Read [[technical-implementation-pipeline]] when choosing the next engineering slice.
6. Append important completed work or project decisions to \`wiki/log.md\`.

## What To Log

Log information that will help future sessions avoid rediscovery:

- user requests and preferences;
- project architecture decisions;
- implemented gameplay systems;
- known constraints and tradeoffs;
- validation commands and recurring warnings;
- next-step plans that the user approved or requested.

## What Not To Log

- transient command output unless it explains a decision;
- secrets, API keys, credentials, or private tokens;
- raw source files copied from the repository unless the user explicitly asks;
- speculative facts without marking them as assumptions.

## Current Repo Path

\`/Users/dmytrosichkar/Documents/project/2026/keyArena\`

## Current Vault Project Path

\`/Users/dmytrosichkar/Documents/project/2026/brainAI/brainAI/PROJECTS/key-arena\`

## Current Validation Commands

- \`npm run check\`
- \`npm test\`
- \`npm run build\`

## Known Build Note

The production build currently passes but Vite reports a large chunk warning from Babylon.js assets/imports. Treat this as a tracked optimization issue, not a failing build.
`,
);

let indexContent = await readFile(path.join(wikiRoot, 'index.md'), 'utf8');
indexContent = upsertIndexEntry(
	indexContent,
	'Synthesis',
	'- [Key Arena Project Overview](project-overview.md) — durable project architecture, current state, and direction.',
);
indexContent = upsertIndexEntry(
	indexContent,
	'Synthesis',
	'- [Realism Implementation Pipeline](realism-implementation-pipeline.md) — phased plan for zones, terrain, lighting, foliage, NPCs, creatures, audio, persistence, and performance.',
);
indexContent = upsertIndexEntry(
	indexContent,
	'Synthesis',
	'- [Technical Implementation Pipeline](technical-implementation-pipeline.md) — engineering slices for implementing the RPG realism roadmap safely.',
);
indexContent = upsertIndexEntry(
	indexContent,
	'Synthesis',
	'- [Map Forest Expansion Pipeline](map-forest-expansion-pipeline.md) — larger-map and denser-forest implementation notes plus next performance steps.',
);
indexContent = upsertIndexEntry(
	indexContent,
	'Other',
	'- [Project Request Log](project-request-log.md) — durable summary of user requests and resulting project decisions.',
);
indexContent = upsertIndexEntry(
	indexContent,
	'Other',
	'- [LLM Working Memory](llm-working-memory.md) — operating rules for future LLM sessions working on Key Arena.',
);
await writeFile(path.join(wikiRoot, 'index.md'), `${indexContent.trim()}\n`);

let logContent = await readFile(path.join(wikiRoot, 'log.md'), 'utf8');
logContent = appendLogEntry(
	logContent,
	`
## [${date}] ingest | keyArena project memory and realism pipeline
- pages touched: wiki/project-overview.md, wiki/realism-implementation-pipeline.md, wiki/project-request-log.md, wiki/llm-working-memory.md, wiki/index.md, wiki/log.md
- notes: Captured current Key Arena architecture, recent RPG expansion work, user realism request, detailed realism implementation pipeline, and durable LLM logging routine.
`,
);
logContent = appendLogEntry(
	logContent,
	`
## [${date}] ingest | technical implementation pipeline and world zones
- pages touched: wiki/project-overview.md, wiki/technical-implementation-pipeline.md, wiki/project-request-log.md, wiki/llm-working-memory.md, wiki/index.md, wiki/log.md
- notes: Captured the user request to create and implement a technical pipeline. Logged the world-zones foundation slice as the first implemented step toward terrain, lighting, NPC, creature, prop, persistence, and performance systems.
`,
);
logContent = appendLogEntry(
	logContent,
	`
## [${date}] ingest | zone-aware terrain implementation
- pages touched: wiki/project-overview.md, wiki/technical-implementation-pipeline.md, wiki/project-request-log.md, wiki/log.md
- notes: Logged the terrain implementation slice: deterministic terrain data helpers, procedural Babylon terrain mesh with vertex colors, static Havok mesh physics, scenery height alignment, and terrain tests.
`,
);
logContent = appendLogEntry(
	logContent,
	`
## [${date}] ingest | larger map and forest expansion
- pages touched: wiki/project-overview.md, wiki/map-forest-expansion-pipeline.md, wiki/project-request-log.md, wiki/index.md, wiki/log.md
- notes: Logged the user request and implementation for a 144x144 map, outer forest zones, deterministic tree clusters, and the tree count increase from 13 to 64.
`,
);
await writeFile(path.join(wikiRoot, 'log.md'), `${logContent.trim()}\n`);

console.log(`Synced Key Arena wiki memory to ${vaultProjectRoot}`);
