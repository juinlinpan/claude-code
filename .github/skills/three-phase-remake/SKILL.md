---
name: three-phase-remake
description: 'Use when researching Claude Code source, reorganizing it into src_remake without changing code behavior, or planning a later Python backend migration into src_python_remake. Includes per-round workflow, markdown output rules, and completion checks for long-running multi-phase refactors.'
argument-hint: 'Current phase, round goal, and target module or document'
user-invocable: true
disable-model-invocation: false
---

# Three-Phase Remake Workflow

## Purpose

Use this skill when the work belongs to one of these three project phases:

1. Phase 1: research Claude Code source and write findings in `research/*.md`
2. Phase 2: reorganize the codebase into `src_remake/` without changing runtime logic
3. Phase 3: migrate backend responsibilities into Python under `src_python_remake/`

The goal is to let the project move forward in many small rounds while keeping every round auditable.

## Required Principles

- Work in small rounds. Each round should have one dominant goal.
- Preserve the original `src/` behavior unless the current round explicitly wires a new entrypoint.
- Prefer documentation and structure changes before large implementation moves.
- Every round must leave behind an updated markdown trail so the next round can continue without rediscovery.
- If a phase is blocked, write the blocker and the narrowest next step instead of broad speculation.

## Reform Rule Overlay

When this repository uses `research/reform.md` as the active Phase 2 migration plan, treat these as hard constraints for TypeScript re-org rounds:

- Do not modify original `src/` file contents during Phase 2. Re-org work should happen in `src_remake/` and related tracking docs.
- Do not change function bodies, runtime logic, type/interface names, field shapes, or formatting as part of a move.
- Allowed code edits are limited to copying or moving files, creating destination folders, and updating import/export/require paths caused by the move.
- Move one module or one tightly coupled dependency slice per round; do not mix broad architecture cleanup into the same round.
- If a file is still frontend/backend mixed, place it under `src_remake/unresolved-fullstack/` or record it as blocked instead of force-splitting it.
- Validation for a move round should include a diff check confirming there are no non-path content changes.

## Phase Selection

Choose the active phase before touching files.

### Phase 1: Research

Use when the round is about understanding existing behavior, ownership, layering, runtime boundaries, or source layout.

Primary outputs live in:

- `research/<topic>.md`
- `research/index.md` if a catalog or reading order is needed

### Phase 2: TypeScript Re-org

Use when the round is about creating or extending `src_remake/`, moving leaf modules, shaping directory structure, or defining dual-entrypoint strategy.

Primary outputs live in:

- `src_remake/**`
- `remake_todo_list.md`
- optional top-level orchestration docs when the root project needs to run both `src/` and `src_remake/`

### Phase 3: Python Backend Migration

Use when the round is about translating backend responsibilities from `src/` or `src_remake/` into Python and packaging them as a full project under `src_python_remake/`.

Primary outputs live in:

- `src_python_remake/**`
- `python_remake_todo_list.md`
- migration notes under `research/python-*.md` when design proof is needed before code moves

## Round Protocol

Every round follows this order.

1. Determine the active phase.
2. State one concrete round goal.
3. Identify the smallest owning files or modules.
4. Decide the markdown artifact that must be created or updated this round.
5. Implement only the smallest slice that advances the phase.
6. Run one focused validation.
7. Record what changed, what remains, and the exact next step.

Do not mix multiple large goals into one round unless the work is trivial and tightly coupled.

## Markdown Output Contract

Each round must update at least one markdown file. Use the file rules in [file conventions](./references/file-conventions.md).

### For Phase 1 rounds

Update one or more of these:

- `research/<topic>.md`: source findings, behavior maps, module ownership, dependency analysis
- `research/index.md`: add new documents, short summary, and suggested reading order if the set grows
- top-level temporary note only if research affects cross-phase sequencing

Each Phase 1 round should write:

- question investigated
- files or modules examined
- factual findings
- implications for Phase 2 or Phase 3
- exact next research question

### For Phase 2 rounds

Update one or more of these:

- `remake_todo_list.md`: phase progress, moved targets, pending slices, blockers
- `src_remake/README.md`: structure summary and current state of the remake workspace
- `src_remake/module-map.ts`: source-to-destination mapping and phase ownership
- module-local docs only if a new subproject boundary needs explanation
- root run doc if the round introduces code that boots either `src/` or `src_remake/`

Each Phase 2 round should write:

- active migration slice
- what was copied or reorganized
- whether imports still point to legacy `src/`
- what validation proved the move is safe
- next slice to migrate

Each Phase 2 round should also confirm, when `research/reform.md` governs the round:

- whether original `src/` files were left untouched
- whether the copied files remained byte-for-byte identical except for path updates, if any
- whether diff review showed no logic or formatting changes

### For Phase 3 rounds

Update one or more of these:

- `python_remake_todo_list.md`: migration queue, translated services, unresolved adapters
- `src_python_remake/README.md`: Python project layout and run strategy
- `research/python-<topic>.md`: design notes before translating a major backend subsystem
- module-level architecture notes if the Python service boundary changes

Each Phase 3 round should write:

- backend capability being translated
- source TypeScript ownership
- target Python package or module path
- interface compatibility assumptions
- validation status and remaining gaps

## File Placement Rules

Follow these defaults unless the round has a strong reason not to.

- Research goes in `research/*.md`
- Re-org execution tracking goes in `remake_todo_list.md`
- TypeScript remake code goes in `src_remake/**`
- Python remake execution tracking goes in `python_remake_todo_list.md`
- Python remake code goes in `src_python_remake/**`
- Cross-phase run or orchestration notes may live at repo root when they govern both implementations

Use [round summary template](./assets/round-summary-template.md) when a new tracker section is needed.

## Root-Level Code Rule

Root-level code is allowed only when needed to boot, compare, or coordinate `src/`, `src_remake/`, and later `src_python_remake/`.

Examples:

- a launcher that selects legacy vs remake runtime
- a shared dev script entrypoint
- comparison harnesses or migration drivers

Do not place domain logic at repo root just for convenience.

## Decision Rules

### If the round is mostly discovery

Stay in Phase 1, even if the findings inform later re-org work.

### If the round creates folders, maps, TODOs, or copies leaf modules without logic changes

Stay in Phase 2.

### If the round translates runtime responsibilities into Python

Stay in Phase 3.

### If a round touches multiple phases

Pick one dominant phase and record cross-phase consequences in markdown instead of trying to complete all phases at once.

## Completion Checks

A round is complete only if all are true:

- the active phase is explicit
- at least one markdown artifact was updated
- the code or document change is scoped to one narrow goal
- one validation step was run, or a concrete reason is recorded when validation was impossible
- the next round starts from a clearly named file, module, or question
- for Phase 2 rounds under `research/reform.md`, the result also preserves the no-legacy-edit and no-logic-change constraints

## Suggested Execution Style

- Start from the smallest viable anchor
- Prefer leaf modules before core loops
- Keep `src_remake/` runnable in principle as a full project, but do not force early wiring that obscures structure work
- Delay Python translation until the TypeScript re-org clarifies backend boundaries

## References

- [File conventions](./references/file-conventions.md)
- [Round summary template](./assets/round-summary-template.md)