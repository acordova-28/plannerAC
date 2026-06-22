# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo structure

```
plannerAC/
├── package.json          ← workspace root (npm workspaces)
├── packages/
│   └── shared/           ← @wuolla/shared — types, enums, working-day logic
│       └── src/
│           ├── enums/    ← estado.enum.ts, prioridad.enum.ts, tipo.enum.ts
│           ├── types/    ← tarea.types.ts (Task, ComputedTask, ProjectConfig, etc.)
│           └── utils/    ← fechas.ts (calcTaskDates, calcBaselineDates)
└── apps/
    ├── frontend/         ← @wuolla/frontend — React 19 + Vite
    └── backend/          ← @wuolla/backend — NestJS + MySQL
```

## Commands

```bash
# From root
npm run dev           # Vite dev server at http://localhost:5173
npm run dev:backend   # NestJS dev server at http://localhost:3000
npm run build         # Production build frontend
npm run build:backend # Production build backend

# From apps/frontend
npx tsc -b            # Type-check only (no emit)
```

## Stack

- **React 19** + **TypeScript 5** + **Vite 6**
- **React Router v7** — `createBrowserRouter` with auth guard in `src/router.tsx`
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no postcss.config, no tailwind.config; theme in `src/index.css` using `@theme {}`)
- **Zustand 5** — stores in `apps/frontend/src/store/`
- **dnd-kit** — drag & drop for Kanban (`useDraggable` / `useDroppable`)
- **NestJS 10** + **TypeORM** + **MySQL 8** — backend in `apps/backend/`
- **@wuolla/shared** — shared types and working-day utilities

## Frontend architecture

### Data flow
```
API /api/tareas (backend)
  → useTaskStore (tasks[], config, filters, view, zoom, activeTaskId)
  → useComputedTasks(tasks, config) → ComputedTask[]  (adds fechaInicio/fechaFin via working-day calc)
  → useFilters(computed, filters)   → filtered ComputedTask[]
  → GanttView | KanbanView
```

Computed dates are **never stored** in the Zustand store — they're derived on every render via `useMemo`. The store only holds raw `Task[]`.

### Routing

- `/login` — LoginPage (redirects to `/` if authenticated)
- `/` — Planner (protected by PrivateRoute — redirects to `/login` if not authenticated)
- `*` — NotFound

### Key files

| File | Purpose |
|------|---------|
| `packages/shared/src/index.ts` | Barrel export for all shared types, enums, utils |
| `packages/shared/src/types/tarea.types.ts` | `Task`, `ComputedTask`, `ProjectConfig`, `FilterState`, `ZoomLevel`, `ViewMode` |
| `packages/shared/src/utils/fechas.ts` | `calcTaskDates` / `calcBaselineDates` — sequential working-day scheduler (Mon–Fri only) |
| `apps/frontend/src/api/client.ts` | `apiFetch` — authenticated HTTP client |
| `apps/frontend/src/api/tareas.api.ts` | `getTareas`, `updateTarea` |
| `apps/frontend/src/api/auth.api.ts` | `loginApi`, `getMeApi` |
| `apps/frontend/src/store/useAuthStore.ts` | Auth state (token, user, login/logout) |
| `apps/frontend/src/store/useTaskStore.ts` | Task state — loads from `/api/tareas` |
| `apps/frontend/src/constants/gantt.ts` | Pixel constants: `ROW_HEIGHT`, `GROUP_ROW_HEIGHT`, `TIMELINE_HEIGHT`, `LEFT_PANEL_WIDTH`, `DAY_WIDTH` per zoom |
| `apps/frontend/src/hooks/useGanttLayout.ts` | Converts `ComputedTask[]` → pixel positions for every SVG bar (`BarLayout` per task ID) |

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

## Backend architecture

- API prefix: `/api`
- Tasks endpoint: `/api/tareas` (GET, PUT), `/api/tareas/:id` (GET, PUT, PATCH, DELETE)
- Auth endpoint: `/api/auth/login` (POST), `/api/auth/me` (GET)
- Stats endpoint: `/api/estadisticas` (GET)
- All endpoints except `/api/auth/login` require JWT (`Authorization: Bearer <token>`)
- JWT tokens are issued on login and stored in `localStorage` as `wuolla_token` + `wuolla_user`

## Conventions

- UI and task content are in **Spanish**.
- `Task.tipo = Tipo.SinTipo` (empty string `''`) means no type assigned.
- `Task.horas = null` means unestimated (rendered as `—` everywhere).
- `Task.horasBaseline = null` until the user clicks "Fijar baseline" — do not auto-populate it.
- Brand dark blue is `#1A5276` (used inline via arbitrary Tailwind values like `bg-[#1A5276]`).
- Components under `gantt/` and `kanban/` do **not** connect to the store directly — they receive data as props. Only `GanttView`, `KanbanView`, `Header`, and `TaskSlideOver` access Zustand.
- All shared types/enums are imported from `@wuolla/shared`, NOT from local `../types`.
