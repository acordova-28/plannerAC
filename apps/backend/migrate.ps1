# migrate.ps1 — Aplica las migraciones de la tarea #3
# Uso: .\apps\backend\migrate.ps1  (desde la raiz del repo)

$envFile = Join-Path $PSScriptRoot ".env"

# Leer variables del .env (ignora comentarios y líneas vacías)
$env_vars = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[^#]\S+=\S' } | ForEach-Object {
    $parts = $_ -split '=', 2
    $env_vars[$parts[0].Trim()] = $parts[1].Trim()
}

# Exponer credenciales como variables de entorno para el proceso Node
$env:DB_HOST     = $env_vars['DB_HOST']
$env:DB_PORT     = $env_vars['DB_PORT']
$env:DB_NAME     = $env_vars['DB_NAME']
$env:DB_USER     = $env_vars['DB_USER']
$env:DB_PASSWORD = $env_vars['DB_PASSWORD']

Write-Host "Conectando a $($env:DB_NAME) @ $($env:DB_HOST):$($env:DB_PORT) como $($env:DB_USER) ..."

# @'...'@ — here-string de comilla simple: PowerShell no expande nada dentro
$nodeScript = @'
const mysql = require('mysql2/promise');

async function columnExists(conn, table, column, db) {
  const [rows] = await conn.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [db, table, column]
  );
  return rows.length > 0;
}

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const db = process.env.DB_NAME;

  const migrations = [
    { table: 'tasks',      column: 'description',   sql: "ALTER TABLE tasks      ADD COLUMN description   TEXT NULL" },
    { table: 'tasks',      column: 'notes',          sql: "ALTER TABLE tasks      ADD COLUMN notes         TEXT NULL" },
    { table: 'modulos',    column: 'color',          sql: "ALTER TABLE modulos    ADD COLUMN color         VARCHAR(7) NOT NULL DEFAULT '#2563eb'" },
    { table: 'plan_users', column: 'horas_por_dia',  sql: "ALTER TABLE plan_users ADD COLUMN horas_por_dia TINYINT UNSIGNED NOT NULL DEFAULT 8" },
  ];

  for (const m of migrations) {
    const exists = await columnExists(conn, m.table, m.column, db);
    if (exists) {
      console.log('SKIP (ya existe):', m.table + '.' + m.column);
    } else {
      await conn.execute(m.sql);
      console.log('OK (agregada):  ', m.table + '.' + m.column);
    }
  }

  await conn.end();
  console.log('\nMigracion completada.');
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
'@

$tmpFile = Join-Path $PSScriptRoot "wuolla_migrate.cjs"
$nodeScript | Out-File -FilePath $tmpFile -Encoding utf8

Push-Location $PSScriptRoot
node $tmpFile
$exitCode = $LASTEXITCODE
Pop-Location

Remove-Item $tmpFile -Force

if ($exitCode -ne 0) { exit 1 }
