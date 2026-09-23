-- ============================================================
-- WUOLLA PLANNER — Esquema completo de base de datos
-- MySQL 8.0+  ·  InnoDB  ·  utf8mb4_unicode_ci
--
-- Ejecutar con:
--   mysql -u root -p < schema_wuolla.sql
--
-- NOTA: requiere SET NAMES utf8mb4 explícito (ver abajo) — sin esto,
-- el cliente mysql que corre este script vía docker-entrypoint-initdb.d
-- asume latin1 y los acentos de los INSERT de ejemplo quedan mojibake
-- aunque las columnas ya sean utf8mb4 (bug real detectado y corregido
-- en sesión: tareas de ejemplo con "ConfiguraciÃ³n" en vez de "Configuración").
--
-- Convenciones:
--   · PKs: CHAR(36) DEFAULT (UUID())  — MySQL 8.0.13+
--     TypeORM (@PrimaryGeneratedColumn('uuid')) genera el UUID
--     en la aplicación antes del INSERT; el DEFAULT es un
--     mecanismo de seguridad si se inserta sin especificar id.
--   · VARCHAR en lugar de ENUM de MySQL para prioridad / estado /
--     tipo.  Los ENUM requieren ALTER TABLE para añadir valores,
--     lo que puede emitir un table-level lock en producción.
--     La validación de valores válidos se delega a class-validator
--     en los DTOs de NestJS.
--   · Autenticación 100% LDAP: la tabla users NO almacena
--     contraseña. El campo ldap_uid contiene el sAMAccountName.
--   · Fechas calculadas (fecha_inicio, fecha_fin): las gestiona
--     el backend con el algoritmo de días hábiles (Lun–Vie).
--     Se almacenan en la tabla para evitar recálculo en cada GET.
--
-- Diagrama de dependencias:
--
--   users ──────────┬──── plan_users ──── plans
--                   │                       │
--                   │                    modulos
--                   │                       │
--                   └── task_responsables ─ tasks ─── task_dinamicos
--                                                           │
--                                            campos ────────┘
-- ============================================================


-- ============================================================
-- SECCIÓN 0: Base de datos
-- ============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS wuolla_planner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wuolla_planner;


-- ============================================================
-- SECCIÓN 0.1: Usuario de acceso a la base de datos
-- ============================================================
-- Crear usuario MySQL 'admin' con acceso desde cualquier host.
-- Cambiar '%' por '127.0.0.1' o la IP del servidor en producción.
-- ============================================================

CREATE USER IF NOT EXISTS 'admin'@'%' IDENTIFIED BY 'admin1';
GRANT ALL PRIVILEGES ON wuolla_planner.* TO 'admin'@'%';
FLUSH PRIVILEGES;


-- ============================================================
-- SECCIÓN 1: Tablas sin dependencias de clave foránea
-- ============================================================

-- ------------------------------------------------------------
-- users
-- Usuarios autenticados vía LDAP / Active Directory.
-- ldap_uid = sAMAccountName del directorio corporativo.
-- Sin campo de contraseña — la validación de credenciales
-- es completamente delegada al servidor LDAP.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  ldap_uid    VARCHAR(100) NOT NULL
              COMMENT 'sAMAccountName del servidor LDAP (ej: andrea.torres)',
  nombre      VARCHAR(150) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_ldap_uid (ldap_uid),
  UNIQUE KEY uq_users_email    (email)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios autenticados vía LDAP. Sin contraseña local.';


-- ------------------------------------------------------------
-- plans
-- Plan de trabajo principal. Agrupa módulos, tareas y la
-- configuración global del Gantt (fecha de inicio, h/día).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id            CHAR(36)         NOT NULL DEFAULT (UUID()),
  nombre        VARCHAR(255)     NOT NULL,
  fecha_inicio  DATE             NOT NULL
                COMMENT 'Primer día hábil del plan (debe ser Lunes)',
  horas_por_dia TINYINT UNSIGNED NOT NULL DEFAULT 8
                COMMENT 'Horas de trabajo por día para el cálculo de fechas',
  created_at    DATETIME         NOT NULL DEFAULT NOW(),
  updated_at    DATETIME         NOT NULL DEFAULT NOW() ON UPDATE NOW(),

  PRIMARY KEY (id),
  CONSTRAINT chk_plans_horas_por_dia
    CHECK (horas_por_dia BETWEEN 1 AND 24)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Plan de trabajo — agrupa módulos, tareas y configuración del Gantt.';


-- ============================================================
-- SECCIÓN 2: Tablas con dependencias de primer nivel
--            (referencian solo users o plans)
-- ============================================================

-- ------------------------------------------------------------
-- plan_users
-- Pivote n-n: membresía de usuarios a planes con control de rol.
-- rol: 'admin' puede editar la configuración del plan,
--      'editor' puede editar tareas,
--      'viewer' solo lectura.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_users (
  plan_id       CHAR(36)          NOT NULL,
  user_id       CHAR(36)          NOT NULL,
  rol           VARCHAR(20)       NOT NULL
                COMMENT 'admin | editor | viewer',
  horas_por_dia TINYINT UNSIGNED  NOT NULL DEFAULT 8
                COMMENT 'Horas/día que este usuario dedica a este plan.',

  PRIMARY KEY (plan_id, user_id),

  CONSTRAINT fk_plan_users_plan
    FOREIGN KEY (plan_id) REFERENCES plans(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_plan_users_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Membresía de usuarios a planes con control de rol (admin|editor|viewer).';


-- ------------------------------------------------------------
-- modulos
-- Agrupación funcional de tareas dentro de un plan.
-- Ejemplos: Wuolla, Gavetas, SIA.
-- El campo orden controla la posición vertical en el Gantt
-- (fila de cabecera colapsable del grupo).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modulos (
  id       CHAR(36)          NOT NULL DEFAULT (UUID()),
  plan_id  CHAR(36)          NOT NULL,
  nombre   VARCHAR(150)      NOT NULL,
  color    VARCHAR(7)        NOT NULL DEFAULT '#2563eb'
           COMMENT 'Color del módulo en el Gantt/Kanban (hex).',
  orden    SMALLINT UNSIGNED NOT NULL DEFAULT 0
           COMMENT 'Posición de aparición en el Gantt',

  PRIMARY KEY (id),
  INDEX idx_modulos_plan_orden (plan_id, orden),

  CONSTRAINT fk_modulos_plan
    FOREIGN KEY (plan_id) REFERENCES plans(id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Módulos — grupos funcionales de tareas dentro de un plan.';


-- ------------------------------------------------------------
-- campos
-- Definición de columnas dinámicas configurables por plan.
-- La aplicación puede crear columnas ad-hoc (Sprint, Complejidad,
-- Plataforma, etc.) sin cambiar el schema.
-- tipo_dato determina el control de edición en el frontend;
-- el valor siempre se almacena como TEXT en task_dinamicos.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campos (
  id        CHAR(36)          NOT NULL DEFAULT (UUID()),
  plan_id   CHAR(36)          NOT NULL,
  nombre    VARCHAR(150)      NOT NULL,
  tipo_dato VARCHAR(20)       NOT NULL DEFAULT 'texto'
            COMMENT 'texto | numero | fecha | booleano',
  orden     SMALLINT UNSIGNED NOT NULL DEFAULT 0
            COMMENT 'Posición de la columna en la tabla del Gantt',

  PRIMARY KEY (id),
  INDEX idx_campos_plan_orden (plan_id, orden),

  CONSTRAINT fk_campos_plan
    FOREIGN KEY (plan_id) REFERENCES plans(id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Columnas dinámicas configurables por plan (Sprint, Complejidad, etc.).';


-- ============================================================
-- SECCIÓN 3: Tablas con dependencias de segundo nivel
-- ============================================================

-- ------------------------------------------------------------
-- tasks
-- Unidad básica del planner.
--
-- PRIORIDAD / ESTADO / TIPO — por qué VARCHAR y no ENUM:
--   MySQL ENUM requiere ALTER TABLE para agregar un valor nuevo.
--   En tablas con millones de filas esto puede bloquear la tabla
--   varios segundos o minutos. VARCHAR evita este riesgo.
--   La validación de valores válidos se hace en los DTOs de NestJS
--   con @IsIn([...]) de class-validator.
--
-- FECHAS CALCULADAS:
--   fecha_inicio y fecha_fin son calculadas por el backend usando
--   el algoritmo secuencial de días hábiles (Lun–Vie) y guardadas
--   aquí para no recalcular en cada GET.
--   Se recalculan automáticamente:
--     · Al crear una tarea
--     · Al cambiar horas_estimadas de cualquier tarea del módulo
--     · Al cambiar fecha_inicio u horas_por_dia del plan
--
-- BASELINE:
--   horas_baseline, fecha_inicio_baseline, fecha_fin_baseline
--   son snapshots congelados cuando el usuario ejecuta
--   "Fijar baseline". Una vez fijados, no se modifican
--   automáticamente. Se muestran como la barra gris (capa 1)
--   en el Gantt de 3 capas.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id                    CHAR(36)          NOT NULL DEFAULT (UUID()),
  modulo_id             CHAR(36)          NOT NULL,
  nombre                TEXT              NOT NULL,

  -- Estimación de horas
  horas_estimadas       FLOAT             NULL
                        COMMENT 'Horas estimadas actuales. NULL = sin estimar.',
  horas_baseline        FLOAT             NULL
                        COMMENT 'Snapshot de horas al fijar baseline.',

  -- Clasificación (validación en la aplicación)
  prioridad             VARCHAR(10)       NOT NULL DEFAULT 'Media'
                        COMMENT 'Alta | Media | Baja',
  estado                VARCHAR(20)       NOT NULL DEFAULT 'Pendiente'
                        COMMENT 'Pendiente | En progreso | Completado | Bloqueado',
  tipo                  VARCHAR(30)       NULL
                        COMMENT 'Frontend | Backend | Front/Back | null',

  -- Posición secuencial dentro del módulo (determina el orden del Gantt)
  orden                 SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  -- Fechas calculadas por el backend (algoritmo días hábiles)
  fecha_inicio          DATE              NULL
                        COMMENT 'Calculada. Primer día hábil de la tarea.',
  fecha_fin             DATE              NULL
                        COMMENT 'Calculada. Último día hábil de la tarea.',

  -- Baseline — snapshots congelados al ejecutar "Fijar baseline"
  fecha_inicio_baseline DATE              NULL
                        COMMENT 'Snapshot de fecha inicio en el baseline.',
  fecha_fin_baseline    DATE              NULL
                        COMMENT 'Snapshot de fecha fin en el baseline.',

  -- Progreso real para la capa de avance en el Gantt (0–100 %)
  porcentaje_progreso   TINYINT UNSIGNED  NOT NULL DEFAULT 0
                        COMMENT '% de avance real. Capa de progreso (rojo/verde) en el Gantt.',

  -- Texto libre
  description           TEXT              NULL
                        COMMENT 'Descripción larga de la tarea.',
  notes                 TEXT              NULL
                        COMMENT 'Notas adicionales.',

  created_at            DATETIME          NOT NULL DEFAULT NOW(),
  updated_at            DATETIME          NOT NULL DEFAULT NOW() ON UPDATE NOW(),

  PRIMARY KEY (id),
  INDEX idx_tasks_modulo_orden (modulo_id, orden),

  -- Integridad numérica a nivel de base de datos
  CONSTRAINT chk_tasks_porcentaje
    CHECK (porcentaje_progreso <= 100),
  CONSTRAINT chk_tasks_horas_est
    CHECK (horas_estimadas IS NULL OR horas_estimadas >= 0),
  CONSTRAINT chk_tasks_horas_base
    CHECK (horas_baseline  IS NULL OR horas_baseline  >= 0),

  CONSTRAINT fk_tasks_modulo
    FOREIGN KEY (modulo_id) REFERENCES modulos(id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Tareas — unidad básica del planner. Fechas calculadas y almacenadas por el backend.';


-- ============================================================
-- SECCIÓN 4: Pivotes de tercer nivel
-- ============================================================

-- ------------------------------------------------------------
-- task_responsables
-- n-n entre tasks y users.
-- Una tarea puede tener múltiples responsables (co-ownership).
-- Al eliminar un usuario o una tarea, se eliminan sus registros
-- automáticamente (CASCADE).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_responsables (
  task_id  CHAR(36) NOT NULL,
  user_id  CHAR(36) NOT NULL,

  PRIMARY KEY (task_id, user_id),

  CONSTRAINT fk_task_resp_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_task_resp_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Responsables por tarea. Una tarea puede tener varios responsables.';


-- ------------------------------------------------------------
-- task_dinamicos
-- Valores de columnas dinámicas para cada tarea.
-- UNIQUE(task_id, campo_id): una tarea tiene máximo un valor
-- por campo dinámico.
-- El valor se almacena siempre como TEXT. El frontend lo castea
-- según el tipo_dato del campo relacionado ('numero' → Number,
-- 'fecha' → Date, 'booleano' → Boolean, 'texto' → String).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_dinamicos (
  id        CHAR(36) NOT NULL DEFAULT (UUID()),
  task_id   CHAR(36) NOT NULL,
  campo_id  CHAR(36) NOT NULL,
  valor     TEXT     NULL
            COMMENT 'Siempre TEXT. Casteo en frontend según tipo_dato del campo.',

  PRIMARY KEY (id),
  UNIQUE KEY uq_task_dinamicos_task_campo (task_id, campo_id),
  INDEX      idx_task_dinamicos_task      (task_id),

  CONSTRAINT fk_task_din_task
    FOREIGN KEY (task_id)  REFERENCES tasks(id)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_din_campo
    FOREIGN KEY (campo_id) REFERENCES campos(id) ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Valores de columnas dinámicas. TEXT siempre; casteo responsabilidad del frontend.';


-- ============================================================
-- SECCIÓN 5: Seed data
-- ============================================================
--
-- UUIDs fijos — serie legible para referencia cruzada:
--   users:          11…001, 11…002
--   plans:          22…001
--   modulos:        33…001, 33…002, 33…003
--   tasks:          44…001 – 44…005
--   campos:         55…001, 55…002
--   task_dinamicos: 66…001 – 66…007
--
-- IMPORTANTE: Este seed NO es idempotente. Si se ejecuta dos
-- veces, los INSERT fallarán por violación de PK/UNIQUE.
-- Para re-ejecutar el seed sin recrear el schema, limpiar
-- las tablas en orden inverso de dependencias:
--
--   SET FOREIGN_KEY_CHECKS = 0;
--   TRUNCATE TABLE task_dinamicos;
--   TRUNCATE TABLE task_responsables;
--   TRUNCATE TABLE tasks;
--   TRUNCATE TABLE campos;
--   TRUNCATE TABLE modulos;
--   TRUNCATE TABLE plan_users;
--   TRUNCATE TABLE plans;
--   TRUNCATE TABLE users;
--   SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================

-- Desactivar checks FK durante la inserción del seed
-- para no depender del orden de los INSERT
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Usuarios (LDAP — sin contraseña)
-- ------------------------------------------------------------
INSERT INTO users (id, ldap_uid, nombre, email) VALUES
  (
    '11111111-0000-4000-a000-000000000001',
    'andrea.torres',
    'Andrea Torres',
    'andrea.torres@farmcorp.com.ec'
  ),
  (
    '11111111-0000-4000-a000-000000000002',
    'carlos.vega',
    'Carlos Vega',
    'carlos.vega@farmcorp.com.ec'
  );

-- ------------------------------------------------------------
-- Plan WUOLLA
-- fecha_inicio = lunes de la semana actual
--
-- Cálculo: DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 5) % 7 DAY)
--   DAYOFWEEK() → 1=Dom, 2=Lun, 3=Mar, 4=Mié, 5=Jue, 6=Vie, 7=Sáb
--   Días a restar para llegar al Lunes:
--     Lun(2): (2+5)%7 = 0  → sin retroceso  ✓
--     Mar(3): (3+5)%7 = 1  → retrocede 1 día ✓
--     Mié(4): (4+5)%7 = 2  → retrocede 2 días ✓
--     Jue(5): (5+5)%7 = 3  → retrocede 3 días ✓
--     Vie(6): (6+5)%7 = 4  → retrocede 4 días ✓
--     Sáb(7): (7+5)%7 = 5  → retrocede 5 días ✓
--     Dom(1): (1+5)%7 = 6  → retrocede 6 días ✓
-- ------------------------------------------------------------
INSERT INTO plans (id, nombre, fecha_inicio, horas_por_dia) VALUES
  (
    '22222222-0000-4000-a000-000000000001',
    'WUOLLA',
    DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 5) % 7 DAY),
    8
  );

-- ------------------------------------------------------------
-- Membresía al plan
-- ------------------------------------------------------------
INSERT INTO plan_users (plan_id, user_id, rol) VALUES
  ('22222222-0000-4000-a000-000000000001', '11111111-0000-4000-a000-000000000001', 'admin'),
  ('22222222-0000-4000-a000-000000000001', '11111111-0000-4000-a000-000000000002', 'editor');

-- ------------------------------------------------------------
-- Módulos del plan WUOLLA
-- ------------------------------------------------------------
INSERT INTO modulos (id, plan_id, nombre, orden) VALUES
  ('33333333-0000-4000-a000-000000000001', '22222222-0000-4000-a000-000000000001', 'Wuolla',  0),
  ('33333333-0000-4000-a000-000000000002', '22222222-0000-4000-a000-000000000001', 'Gavetas', 1),
  ('33333333-0000-4000-a000-000000000003', '22222222-0000-4000-a000-000000000001', 'SIA',     2);

-- ------------------------------------------------------------
-- Tareas de ejemplo (5 tareas distribuidas en los 3 módulos)
-- fecha_inicio / fecha_fin = NULL — el backend las calculará
-- en el primer recálculo de fechas del plan.
-- ------------------------------------------------------------
INSERT INTO tasks (
  id, modulo_id, nombre,
  horas_estimadas, prioridad, estado, tipo, orden
) VALUES
  -- Módulo: Wuolla (2 tareas)
  (
    '44444444-0000-4000-a000-000000000001',
    '33333333-0000-4000-a000-000000000001',
    'Pruebas de integración con Servientrega',
    2, 'Alta', 'En progreso', 'Backend', 0
  ),
  (
    '44444444-0000-4000-a000-000000000002',
    '33333333-0000-4000-a000-000000000001',
    'Incorporar logos de Cruz Azul y La Ganga en el detalle de la orden',
    2, 'Alta', 'Pendiente', 'Frontend', 1
  ),
  -- Módulo: Gavetas (1 tarea)
  (
    '44444444-0000-4000-a000-000000000003',
    '33333333-0000-4000-a000-000000000002',
    'Diseño de interfaz principal del módulo Gavetas',
    8, 'Media', 'Pendiente', 'Frontend', 0
  ),
  -- Módulo: SIA (2 tareas — la segunda sin estimar)
  (
    '44444444-0000-4000-a000-000000000004',
    '33333333-0000-4000-a000-000000000003',
    'Configuración inicial de base de datos SIA',
    4, 'Alta', 'Pendiente', 'Backend', 0
  ),
  (
    '44444444-0000-4000-a000-000000000005',
    '33333333-0000-4000-a000-000000000003',
    'API de autenticación LDAP para SIA',
    NULL, 'Alta', 'Pendiente', 'Backend', 1
  );

-- ------------------------------------------------------------
-- Responsables de las tareas
-- La tarea 005 (API LDAP) tiene dos co-responsables
-- ------------------------------------------------------------
INSERT INTO task_responsables (task_id, user_id) VALUES
  -- Andrea: integración Servientrega
  ('44444444-0000-4000-a000-000000000001', '11111111-0000-4000-a000-000000000001'),
  -- Andrea: logos Cruz Azul / La Ganga
  ('44444444-0000-4000-a000-000000000002', '11111111-0000-4000-a000-000000000001'),
  -- Carlos: diseño Gavetas
  ('44444444-0000-4000-a000-000000000003', '11111111-0000-4000-a000-000000000002'),
  -- Carlos: base de datos SIA
  ('44444444-0000-4000-a000-000000000004', '11111111-0000-4000-a000-000000000002'),
  -- API LDAP: co-responsabilidad Andrea + Carlos
  ('44444444-0000-4000-a000-000000000005', '11111111-0000-4000-a000-000000000001'),
  ('44444444-0000-4000-a000-000000000005', '11111111-0000-4000-a000-000000000002');

-- ------------------------------------------------------------
-- Campos dinámicos del plan WUOLLA
-- ------------------------------------------------------------
INSERT INTO campos (id, plan_id, nombre, tipo_dato, orden) VALUES
  (
    '55555555-0000-4000-a000-000000000001',
    '22222222-0000-4000-a000-000000000001',
    'Sprint', 'texto', 0
  ),
  (
    '55555555-0000-4000-a000-000000000002',
    '22222222-0000-4000-a000-000000000001',
    'Complejidad', 'numero', 1
  );

-- ------------------------------------------------------------
-- Valores de campos dinámicos por tarea
-- (valor siempre TEXT; el frontend castea según tipo_dato)
-- ------------------------------------------------------------
INSERT INTO task_dinamicos (id, task_id, campo_id, valor) VALUES
  -- Tarea 001 — Sprint 1, Complejidad 3
  ('66666666-0000-4000-a000-000000000001', '44444444-0000-4000-a000-000000000001', '55555555-0000-4000-a000-000000000001', 'Sprint 1'),
  ('66666666-0000-4000-a000-000000000002', '44444444-0000-4000-a000-000000000001', '55555555-0000-4000-a000-000000000002', '3'),
  -- Tarea 002 — Sprint 1
  ('66666666-0000-4000-a000-000000000003', '44444444-0000-4000-a000-000000000002', '55555555-0000-4000-a000-000000000001', 'Sprint 1'),
  -- Tarea 003 — Sprint 2, Complejidad 5
  ('66666666-0000-4000-a000-000000000004', '44444444-0000-4000-a000-000000000003', '55555555-0000-4000-a000-000000000001', 'Sprint 2'),
  ('66666666-0000-4000-a000-000000000005', '44444444-0000-4000-a000-000000000003', '55555555-0000-4000-a000-000000000002', '5'),
  -- Tarea 004 — Sprint 2, Complejidad 4
  ('66666666-0000-4000-a000-000000000006', '44444444-0000-4000-a000-000000000004', '55555555-0000-4000-a000-000000000001', 'Sprint 2'),
  ('66666666-0000-4000-a000-000000000007', '44444444-0000-4000-a000-000000000004', '55555555-0000-4000-a000-000000000002', '4');

-- Reactivar checks FK
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- Verificación rápida post-ejecución (ejecutar por separado):
--
--   SELECT 'users'           AS tabla, COUNT(*) AS n FROM users
--   UNION ALL
--   SELECT 'plans',                    COUNT(*)      FROM plans
--   UNION ALL
--   SELECT 'plan_users',               COUNT(*)      FROM plan_users
--   UNION ALL
--   SELECT 'modulos',                  COUNT(*)      FROM modulos
--   UNION ALL
--   SELECT 'tasks',                    COUNT(*)      FROM tasks
--   UNION ALL
--   SELECT 'task_responsables',        COUNT(*)      FROM task_responsables
--   UNION ALL
--   SELECT 'campos',                   COUNT(*)      FROM campos
--   UNION ALL
--   SELECT 'task_dinamicos',           COUNT(*)      FROM task_dinamicos;
--
-- Resultado esperado:
--   users              → 2
--   plans              → 1
--   plan_users         → 2
--   modulos            → 3
--   tasks              → 5
--   task_responsables  → 6
--   campos             → 2
--   task_dinamicos     → 7
-- ============================================================
