# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc -b && vite build (production)
npm run preview  # Preview production build locally
npx tsc -b       # Type-check only (no emit)
```

## Stack

- **React 19** + **TypeScript 5** + **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no postcss.config, no tailwind.config; theme in `src/index.css` using `@theme {}`)
- **Zustand 5** — single store in `src/store/useTaskStore.ts`
- **dnd-kit** — drag & drop for Kanban (`useDraggable` / `useDroppable`)

## Architecture

### Data flow
```
INITIAL_TASKS (data/tasks.ts)
  → useTaskStore (tasks[], config, filters, view, zoom, activeTaskId)
  → useComputedTasks(tasks, config) → ComputedTask[]  (adds fechaInicio/fechaFin via working-day calc)
  → useFilters(computed, filters)   → filtered ComputedTask[]
  → GanttView | KanbanView
```

Computed dates are **never stored** in the Zustand store — they're derived on every render via `useMemo`. The store only holds raw `Task[]`.

### Key files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All types: `Task`, `ComputedTask`, `Estado`/`Prioridad`/`Tipo` enums, `ProjectConfig`, `FilterState`, `ZoomLevel` |
| `src/data/tasks.ts` | Hardcoded `INITIAL_TASKS` array (23 tasks) — the only place to add/edit tasks |
| `src/utils/workingDays.ts` | `calcTaskDates` / `calcBaselineDates` — sequential working-day scheduler (Mon–Fri only) |
| `src/constants/gantt.ts` | Pixel constants: `ROW_HEIGHT`, `GROUP_ROW_HEIGHT`, `TIMELINE_HEIGHT`, `LEFT_PANEL_WIDTH`, `DAY_WIDTH` per zoom |
| `src/hooks/useGanttLayout.ts` | Converts `ComputedTask[]` → pixel positions for every SVG bar (`BarLayout` per task ID) |

### Gantt architecture

`GanttView` owns scroll-sync refs (left body ↔ right body Y, timeline ↔ right body X). The flag `isSyncing` prevents scroll event loops.

The right panel is:
```
GanttChart
  ├── timelineRef div (overflow-x: hidden, scrollLeft driven by JS)  → GanttTimeline
  └── bodyRef div (overflow: auto)  → GanttBars (SVG)
          ├── Weekend rects + row stripe rects (background)
          ├── Week vertical grid lines
          ├── GanttTodayLine
          └── GanttBar × n  (3 SVG rects: baseline gray / plan blue / progress red-green)
```

**3-layer bars:** baseline (`horasBaseline` → date range, gray, 8px tall) + plan (`horas` → date range, blue, 18px tall) + progress (plan width × `porcentajeReal`%, colored by `Estado`). Baseline only renders if `horasBaseline !== null` (set via `freezeBaseline()` in store).

### Working-day logic

`calcDatesFromHours` (private in `workingDays.ts`) is the single date-calculation function. It takes an array of tasks and a `getHours` accessor, which lets `calcTaskDates` and `calcBaselineDates` reuse the same algorithm for current vs. baseline hours. Tasks are **sequential** — each starts exactly where the previous finishes.

### CSV export

`src/utils/csvExport.ts` — writes UTF-8 BOM (`﻿`) for Excel compatibility with Spanish characters. Headers match the original HTML exactly.

## Conventions

- UI and task content are in **Spanish**.
- `Task.tipo = Tipo.SinTipo` (empty string `''`) means no type assigned.
- `Task.horas = null` means unestimated (rendered as `—` everywhere).
- `Task.horasBaseline = null` until the user clicks "Fijar baseline" — do not auto-populate it.
- Brand dark blue is `#1A5276` (used inline via arbitrary Tailwind values like `bg-[#1A5276]`).
- Components under `gantt/` and `kanban/` do **not** connect to the store directly — they receive data as props. Only `GanttView`, `KanbanView`, `Header`, and `TaskSlideOver` access Zustand.
