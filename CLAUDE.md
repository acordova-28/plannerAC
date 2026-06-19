# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-file, browser-only task estimation planner for the WUOLLA project. No build step, no dependencies, no server.

**To run:** open `Estimacion_WUOLLA.html` directly in a browser, or serve it with any static server:
```
python -m http.server
```

## Architecture

Everything lives in `Estimacion_WUOLLA.html` — HTML structure, embedded CSS, and vanilla JavaScript in one file (~355 lines).

**Data:** The `TASKS` array (hardcoded JS) holds all 23 tasks with fields: `id`, `modulo`, `tarea`, `horas`, `prioridad`, `responsable`, `estado`, `tipo`. No persistence layer — changes to hours are in-memory only, with CSV export as the output mechanism.

**Core logic:**
- `calcDates()` — iterates `TASKS`, accumulates hours, maps to working-day date ranges (skips weekends via `nextWorkday()`)
- `recalc()` — re-renders the table and stats dashboard after any mutation
- `updateHours(id, val)` — patches `horas` on a task and triggers `recalc()`
- `exportCSV()` — serializes current state to a UTF-8 BOM CSV (for Excel compatibility with Spanish characters)

**Working-day convention:** Monday–Friday only; `firstWorkday()` and `nextWorkday()` enforce this. The configurable start date and hours-per-day feed directly into `calcDates()`.

## Conventions

- UI and task content are in **Spanish**.
- All styling is inline `<style>` — no external CSS file.
- If adding tasks, append to the `TASKS` array following the existing object shape. `horas: null` means unestimated.
