# File Conventions For Three-Phase Remake

## Goal

This reference defines what each round should write and where that content belongs.

## Research Files

Write research documents as `research/<topic>.md`.

Recommended shape:

1. question or scope
2. files examined
3. findings
4. implications for re-org or Python migration
5. open questions

Use one topic per file. If a document grows too broad, split it.

Recommended topic categories:

- `behavior-*.md`
- `module-*.md`
- `runtime-*.md`
- `session-*.md`
- `tooling-*.md`
- `python-*.md`

## Phase 2 Tracking Files

Use `remake_todo_list.md` as the main execution ledger for `src_remake/`.

Each round should append or update:

- current migration slice
- newly created directories or modules
- validation status
- next planned slice

Use `src_remake/README.md` for the current shape of the remake project, not a round-by-round diary.

Use `src_remake/module-map.ts` for source-to-target mapping and migration ownership, not prose notes.

## Phase 3 Tracking Files

Use `python_remake_todo_list.md` as the main execution ledger for `src_python_remake/`.

Each round should record:

- TypeScript source boundary
- Python target module or package
- translated interfaces
- validation state
- unresolved gaps

Use `src_python_remake/README.md` for project structure, setup, and runtime strategy.

## Root-Level Files

Allow root-level markdown only for repo-wide coordination.

Good candidates:

- dual-runtime startup plan
- migration phase overview
- comparison checklist between legacy and remake implementations

Avoid root-level notes for local module details that belong inside `research/`, `src_remake/`, or `src_python_remake/`.

## Per-Round Minimum

At the end of each round, at least one markdown file must contain:

- round goal
- actual change made
- validation performed
- next concrete step