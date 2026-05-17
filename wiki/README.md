# keyArena LLM Wiki

A persistent, LLM-maintained project wiki for `keyArena`.

The wiki has two source streams:
- the project repository itself: code, docs, config, assets, and tests
- optional external resources dropped into `raw/`

The LLM reads those sources and maintains concise project knowledge in `wiki/`.

## Structure

| Layer | Owner | Purpose |
|-------|-------|---------|
| Project root | User/team | Live keyArena source of truth: code, docs, configs, runtime assets. Read-only unless the task asks for code changes. |
| `raw/` | User | Optional external resources for analysis: articles, specs, notes, screenshots, transcripts, data. Read-only for wiki work. |
| `wiki/` | LLM | Generated project pages: maps, architecture notes, feature notes, source summaries, decisions, open questions. |
| `CLAUDE.md` | Shared | Schema and workflow rules for maintaining this wiki. |

## Usage

- **Analyze the project** - ask the LLM to update the wiki from the current repository state.
- **Add an external source** - drop a file into `raw/`, then ask the LLM to ingest it into the project wiki.
- **Ask a question** - ask against `wiki/wiki/index.md`; the LLM should cite wiki pages and source files.
- **Health check** - ask the LLM to lint the wiki against the repo and `raw/`.

For full schema, conventions, and workflow details, see [CLAUDE.md](./CLAUDE.md).

## Inspiration

Inspired by a [gist by Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), adapted from a document-ingest wiki into a live project wiki.
