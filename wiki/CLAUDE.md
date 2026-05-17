# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when maintaining the nested `wiki/` project knowledge base.

## Project Type

This directory is a persistent, LLM-maintained project wiki embedded inside the `keyArena` code repository. The wiki work is reading the live project, optional files in `raw/`, and existing project docs, then writing concise markdown reference pages under `wiki/`.

The surrounding repository is a real codebase. For keyArena standards, read the root `../GEMINI.md` first. This file only defines how the nested wiki should be maintained.

## Wiki Schema

You (the LLM) own the nested `wiki/` layer: you write it, update it, and keep it consistent. The user owns the live project source, `raw/`, and the questions asked.

## Layers

1. **Project root (`../`)** - the live keyArena project: code, docs, config, tests, and runtime assets. Read this as the primary source when building the project wiki. Do not change project source during wiki-only tasks.
2. **`raw/`** - optional immutable external resources: articles, papers, notes, transcripts, screenshots, data. Read-only for wiki work. Never modify, rename, or delete files here.
3. **`wiki/`** - LLM-generated markdown: project maps, architecture notes, feature notes, source summaries, decisions, comparisons, open questions, and maintenance logs. Owned by the LLM.
4. **This file (`CLAUDE.md`)** - the schema. Co-evolves with the user as workflows are refined.

## Wiki Conventions

- One topic per page. Filenames are kebab-case: `scene-architecture.md`, `asset-pipeline.md`.
- Every page links to related pages with `[[wiki-link]]` style where relevant.
- Every project claim cites a project file path, for example `(source: ../src/scenes/MainScene.tsx)` or `(source: ../GEMINI.md)`.
- Every external claim cites the raw file, for example `(source: ../raw/filename.md)` from generated wiki pages, or a link to that source's summary page.
- When live code, project docs, and raw resources contradict each other, do not silently overwrite. Prefer live code for current behavior, prefer `../GEMINI.md` for intended standards, flag the contradiction on the affected page, and note both sources and dates.
- Prefer updating existing pages over creating duplicates. Search the wiki and `index.md` before creating a new page.
- Keep pages short and navigational. Link to canonical source files instead of copying large code or doc sections.

## Navigation Files

- **`wiki/index.md`** - content catalog. Every wiki page appears once with a one-line summary, grouped by category. Update on every project scan, external ingest, or material wiki edit.
  **Read this file at the start of every session, before any other wiki operation.** Re-read it after any change to `raw/` or `wiki/`.
- **`wiki/log.md`** - append-only chronological record. Each entry header has a consistent prefix so it can be parsed with `grep "^## \[" wiki/log.md`:
  ```text
  ## [YYYY-MM-DD] project-scan | <scope>
  ## [YYYY-MM-DD] ingest | <raw source title>
  ## [YYYY-MM-DD] query | <short question>
  ## [YYYY-MM-DD] lint | <scope>
  ```

## Operations

### Project Scan

Use this when the user asks to "update the wiki", "analyze the project", "write project wiki", or similar.

1. Read `../GEMINI.md` first, then `wiki/index.md`.
2. Inspect only task-relevant project files. For a broad refresh, start with:
   - `../package.json`
   - `../src/main.tsx`
   - `../src/App.tsx`
   - `../src/scenes/MainScene.tsx`
   - `../src/scenes/environment/`
   - `../src/scenes/player/`
   - `../src/scenes/discovery/`
   - `../src/store/`
   - `../src/ui/`
   - `../docs/llm-wiki/index.md`
3. Avoid broad scans of `../node_modules`, `../dist`, generated output, and large model/texture folders unless the task explicitly requires assets.
4. Create or update focused wiki pages under `wiki/`.
5. Cite project files inline for factual claims.
6. Update `wiki/index.md`.
7. Append a `## [date] project-scan | <scope>` entry to `wiki/log.md` listing pages created and modified.
8. Report a short summary to the user.

### Ingest External Source

Use this when the user drops external resources into `raw/` and asks to integrate them.

1. Read the source in `raw/`.
2. Extract key takeaways: title, thesis, claims with citations, entities, concepts, contradictions vs. existing wiki and current project files.
3. Create a summary page in `wiki/` for this source.
4. Update `index.md` and revise summaries of pages that changed.
5. Update every project, concept, feature, comparison, or synthesis page that this source touches.
6. If the new source contradicts existing claims or live code, flag the contradiction on the affected page; do not silently overwrite.
7. Append a `## [date] ingest | <title>` entry to `log.md` listing the pages created and modified.
8. Report a short diff summary to the user: created, modified, contradictions.

### Query

1. Read `index.md` first to find candidate pages.
2. Drill into the relevant pages and, when needed, their cited project files; cite both in the answer.
3. If the answer has lasting value, offer to file it back into the wiki as a new page.

### Lint

1. **Audit** - cross-reference cited project files and `raw/` files against the wiki; identify missing files, stale references, orphan pages, missing concept pages, and uncited claims. Report findings and ask for confirmation before writing cleanup changes.
2. **Cleanup** - after confirmation, remove stale references from wiki pages and `index.md`; flag unsupported claims visibly rather than deleting silently; append a `## [date] lint | cleanup: <scope>` entry to `log.md`.

## Style

- Markdown only. Use headings, lists, tables, and callouts.
- Be concise. The wiki is a reference, not an essay collection.
- Cite sources inline. A page with no citations is suspect.
- Date contested or time-sensitive claims, for example `as of 2026-05`.
- Prefer current project facts over historical notes. Use historical logs to explain why a decision happened, not to override current code.

## What You Do Not Do

- Do not modify files in `raw/`.
- Do not change project source during wiki-only tasks.
- Do not invent facts to fill gaps. If a source does not say something, say so. Mark unknowns explicitly.
- Do not delete wiki pages without asking. Stale pages can be marked deprecated and linked from a successor page instead.
- Do not treat this nested wiki as a replacement for root `GEMINI.md`; it is an orientation and memory layer.
