# WUOLLA Planner

Planificador de tareas y proyectos por equipos (Plan = Team), con módulos, tareas, campos personalizados, vistas de tabla/kanban/gantt y estadísticas.

## Stack

- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand 5
- **Backend**: NestJS 10 + TypeORM + MySQL 8
- **Auth**: LDAP / Active Directory + JWT
- **Monorepo**: npm workspaces (`apps/frontend`, `apps/backend`)

## Primeros pasos (inicializar el proyecto)

Requisitos: Node 20+, Docker y Docker Compose.

**Todos los comandos de esta sección se ejecutan desde la raíz del repo (`plannerAC/`). No hace falta hacer `cd` a `apps/backend` ni a `apps/frontend` en ningún momento** — cuando un archivo vive dentro de una subcarpeta (como los `.env`), se referencia con su ruta completa desde la raíz.

```bash
git clone https://github.com/acordova-28/plannerAC.git
cd plannerAC                                # única vez que cambiamos de carpeta
```

**Variables de entorno — hay dos `.env` distintos, cada uno para un consumidor distinto:**

| Archivo | Quién lo lee | Para qué |
|---------|--------------|----------|
| `.env` (raíz) | `docker compose` | Variables que se inyectan en `docker-compose.yml` (contraseña de MySQL, puerto expuesto, JWT/LDAP si levantas todo dockerizado) |
| `apps/backend/.env` | NestJS directamente (`ConfigModule`) | Config del backend cuando corre **en tu máquina**, no en un contenedor — por eso apunta a `localhost:3307` (el puerto que Docker expone al host), no a `db:3306` (que es la ruta interna que usa el backend *cuando también* corre dockerizado) |

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
```

**Base de datos** (el esquema se carga solo desde `database/schema_wuolla.sql`, no hay que importar nada a mano):

```bash
docker compose up -d db
```

**Dependencias e inicio en local** (dos terminales, ambas paradas en la raíz del repo):

```bash
npm install

npm run dev:backend   # terminal 1 — NestJS en http://localhost:3000
npm run dev           # terminal 2 — Vite en http://localhost:5173
```

> `npm run dev:backend` es un script de la raíz que internamente corre `nest start --watch` dentro de `apps/backend` (con hot-reload). Si en vez de eso te paras dentro de `apps/backend/` y corres comandos ahí, el equivalente es `npm run start:dev` — ahí no existe un script llamado `dev`. `npm run start` (sin `:dev`) también arranca el backend pero sin recarga automática al guardar cambios.

Con eso ya puedes entrar a http://localhost:5173 y loguearte con `admin` / `admin1` (usuario de prueba, ver `DEV_USERS` en `apps/backend/.env`; no depende de LDAP).

## Desarrollo día a día: solo la base en Docker

Este es el flujo recomendado mientras desarrollas: la base de datos corre en Docker (con el esquema ya cargado), y el backend/frontend corren en local con los comandos de siempre. Así todo el equipo comparte la misma base sin que cada uno tenga que instalar y configurar MySQL a mano.

Si alguien del equipo baja tus cambios y corre los pasos de "Primeros pasos", obtiene la misma base sin fricción — el volumen de Docker es local a cada máquina, así que cada uno genera el suyo desde `database/schema_wuolla.sql`.

Para parar la base (conserva los datos):

```bash
docker compose down
```

Para borrar también los datos de MySQL (vuelve a cargar el esquema desde cero la próxima vez):

```bash
docker compose down -v
```

## Alternativa: todo dockerizado (frontend + backend + db)

Útil para probar el build de producción completo o para desplegar, sin instalar Node ni MySQL en la máquina.

```bash
cp .env.example .env
# Editar .env: credenciales de LDAP si aplica, o dejarlas vacías para usar DEV_USERS
docker compose up -d --build
```

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Nginx sirviendo el build de Vite; proxy interno de `/api` al backend |
| Backend  | http://localhost:3000/api | API NestJS |
| MySQL    | localhost:3307 → 3306 en el contenedor | Solo si necesitas conectar Workbench/DBeaver directamente |

Notas:
- El puerto de MySQL se publica en `3307` por defecto (`DB_HOST_PORT` en `.env`) para no chocar con un MySQL local en `3306`.
- Con `NODE_ENV=development` (default en `.env.example`), si LDAP no está configurado o no responde, el login cae al fallback `DEV_USERS` (por defecto `admin:admin1`, `demo:demo`). En `NODE_ENV=production` ese fallback queda deshabilitado y se requiere LDAP real.

```bash
docker compose down      # parar (conserva datos)
docker compose down -v   # parar y borrar datos de MySQL
```

## Convenciones de commits

Este repo sigue [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<alcance opcional>): <descripción en imperativo>
```

**Tipos:**

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un bug |
| `refactor` | Cambio de código que no agrega funcionalidad ni corrige un bug |
| `perf` | Mejora de rendimiento |
| `docs` | Cambios solo de documentación |
| `style` | Formato, espacios, punto y coma — sin cambios de lógica |
| `test` | Agregar o corregir tests |
| `build` | Cambios en el sistema de build, dependencias o Docker |
| `ci` | Cambios en integración continua |
| `chore` | Mantenimiento que no toca `src` ni tests (limpieza, configs) |
| `revert` | Revierte un commit anterior |

**Ejemplos (de este mismo repo):**

```
feat(auth): add JWT + LDAP authentication module to NestJS backend
fix(docker): copy public/ folder into production image
chore: remove obsolete pre-monorepo files and fix docker-compose backend path
```

Reglas:
- Descripción en minúscula, sin punto final, en imperativo ("add", no "added"/"adds").
- El alcance (`auth`, `docker`, `kanban`, `tasks`, etc.) es opcional pero recomendado cuando el cambio es específico a una parte del sistema.
- Un commit = un cambio lógico. Evitar mezclar `feat` + `fix` + `chore` en un mismo commit.
- Commits que rompen compatibilidad: agregar `!` después del tipo/alcance (`feat(api)!: ...`) y explicar el breaking change en el cuerpo.

## Convención de ramas

```
<tipo>/<descripción-corta-en-kebab-case>
```

| Prefijo | Uso |
|---------|-----|
| `feature/` | Nueva funcionalidad |
| `fix/` | Corrección de bug |
| `refactor/` | Refactor sin cambio de comportamiento |
| `chore/` | Mantenimiento, configs, dependencias |
| `hotfix/` | Fix urgente sobre producción/`main` |

**Ejemplos:**

```
feature/kanban-drag-tactil
fix/recalculo-fechas-baseline
chore/actualizar-dependencias
```

Reglas:
- Ramas cortas, en minúsculas, palabras separadas por guiones (sin espacios ni acentos).
- Crear ramas a partir de `main`, mergear vía Pull Request.
- Borrar la rama tras el merge.
