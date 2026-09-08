# FitCore — Gestor de administración de gimnasios

Sistema de gestión integral para gimnasios: clientes, membresías, pagos, asistencias y estadísticas.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | ASP.NET Core 10 (C#) |
| Frontend | React 19 + TypeScript + Vite + Tailwind + shadcn/ui |
| Base de datos | PostgreSQL 17 (Docker en desarrollo) |
| ORM | Entity Framework Core 10 + Npgsql |
| Auth | ASP.NET Core Identity + JWT |
| API Docs | Scalar (`/scalar/v1`) |

---

## Desarrollo con Docker

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac/Linux)
- [.NET 10 SDK](https://dotnet.microsoft.com/download) — solo para correr migraciones EF Core desde el host
- [Node.js 22+](https://nodejs.org/) — solo para el frontend

### 1. Clonar y configurar variables de entorno

```bash
git clone <url-del-repo>
cd FitCore

# Crear el .env local a partir del template
cp .env.example .env
# Editá .env si querés cambiar las credenciales de Postgres o el JWT key
```

### 2. Levantar los contenedores (DB + API)

```bash
docker compose up --build
```

Esto levanta:
- **`fitcore_db`** → PostgreSQL en `localhost:5433`
- **`fitcore_api`** → API .NET en `http://localhost:5192`

La API espera a que Postgres esté healthy antes de arrancar (healthcheck configurado).

### 3. Aplicar migraciones de EF Core

La primera vez (o cuando haya nuevas migraciones):

```bash
cd src/FitCore.Infrastructure
dotnet ef database update --startup-project ../FitCore.Api
```

> Las migraciones apuntan al Postgres del contenedor vía `localhost:5433`, usando la connection string de `appsettings.Development.json`.

### 4. Levantar el frontend (fuera de Docker)

```bash
cd src/fitcore-client
cp .env.example .env.local   # solo la primera vez
npm install
npm run dev
```

El frontend corre en `http://localhost:5173` y habla con la API en `http://localhost:5192`.

### 5. Verificar que todo funciona

```bash
# Estado de los contenedores
docker compose ps

# Logs de la API
docker compose logs api -f

# Acceder a la documentación de la API
open http://localhost:5192/scalar/v1
```

---

## Comandos útiles

### Resetear la base de datos local

```bash
# Para y elimina los contenedores + el volumen de datos
docker compose down -v

# Volver a levantar (base limpia)
docker compose up -d

# Re-aplicar todas las migraciones
cd src/FitCore.Infrastructure
dotnet ef database update --startup-project ../FitCore.Api
```

### Agregar una nueva migración EF Core

```bash
cd src/FitCore.Infrastructure
dotnet ef migrations add NombreDeLaMigracion --startup-project ../FitCore.Api
```

### Rebuild de la imagen del backend

```bash
docker compose build api
docker compose up -d
```

---

## Build de producción (frontend)

El frontend tiene un `Dockerfile.prod` separado (solo para deploy, no para desarrollo):

```bash
cd src/fitcore-client
docker build \
  --file Dockerfile.prod \
  --build-arg VITE_API_URL=https://api.tudominio.com \
  --tag fitcore-client:latest \
  .
```

---

## Features

- ✅ Gestión de clientes (registro, estado de membresía, historial de asistencia)
- ✅ Pagos y planes (mensualidades, fechas, avisos de cuotas por vencer)
- ✅ Control de acceso y asistencia (check-in rápido, alerta si cuota vencida)
- ✅ Panel y estadísticas (clientes activos, ingresos del mes, métricas)
- 🔜 Agenda y calendario de entrenamientos
- 🔜 Seguimiento de progreso de clientes (peso, medidas, fotos)
- 🔜 Reportes descargables
