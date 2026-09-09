# FitCore — Gestor de administración de gimnasios

Sistema integral para gimnasios tradicionales de musculación: gestión de socios, membresías, cobranzas, control de asistencias, estados de cuenta y portal exclusivo de autogestión para clientes.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | ASP.NET Core 10 (C#) |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| **Base de datos** | PostgreSQL 17 (vía Docker en desarrollo, puerto host `5433`) |
| **ORM** | Entity Framework Core 10 + Npgsql |
| **Autenticación** | ASP.NET Core Identity + JWT (Tokens con roles Admin, Entrenador y Cliente) |
| **Pagos** | Integración con Checkout Mercado Pago, Tarjeta y Transferencia bancaria |
| **Documentación API** | Scalar en `http://localhost:5192/scalar/v1` |

---

## 🚀 Guía de Inicio Rápido (Primera vez)

### Prerrequisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (debe estar iniciado)
- [.NET 10 SDK](https://dotnet.microsoft.com/download) (para aplicar migraciones de Entity Framework Core)
- [Node.js 22+](https://nodejs.org/) (para correr el frontend)

---

### Paso 1: Variables de entorno
Desde la raíz del proyecto, copia el archivo de ejemplo:
```powershell
cp .env.example .env
```
*(Puedes editar `.env` si deseas cambiar contraseñas de Postgres o claves de JWT / Mercado Pago).*

---

### Paso 2: Levantar los contenedores de Docker
Ejecuta en la raíz del proyecto:
```powershell
docker compose up -d --build
```
Esto iniciará:
* **`fitcore_db`** → PostgreSQL en `localhost:5433`
* **`fitcore_api`** → Backend ASP.NET Core en `http://localhost:5192`

> 💡 **Nota sobre puertos:** Si `fitcore_api` está corriendo en Docker, ocupará el puerto `5192`. Si prefieres ejecutar el backend en Windows con `dotnet run` o `dotnet watch`, primero detén el contenedor con `docker stop fitcore_api` para evitar conflictos de puerto.

---

### Paso 3: Aplicar las migraciones de Base de Datos
Aplica las migraciones de Entity Framework Core sobre PostgreSQL:
```powershell
dotnet ef database update --project src/FitCore.Infrastructure --startup-project src/fitcore.api
```
*(El backend incluye un `DataSeeder` automático que creará los usuarios y planes iniciales si la base de datos está vacía).*

---

### Paso 4: Levantar el Frontend
En una nueva terminal, ingresa a la carpeta del cliente:
```powershell
cd src/fitcore-client
cp .env.example .env.local   # Solo la primera vez
npm install
npm run dev
```
El frontend quedará activo en: 👉 **`http://localhost:5173`**

---

## 📱 Módulos y Portales del Sistema

### 👑 Portal de Administración (`Admin` / `Entrenador`)
* **Dashboard (`/dashboard-admin`):** Métricas en tiempo real de socios activos, ingresos mensuales, asistencias de hoy y planes más elegidos.
* **Clientes (`/clientes`):** Listado completo, alta, edición, estados de membresía y búsqueda.
* **Planes (`/planes-admin`):** ABM de planes de entrenamiento, precios y duración en días.
* **Cobranzas y Pagos (`/pagos`):** Historial y registro de pagos manuales o automáticos.
* **Estado de Cuenta (`/estado-cuenta`):** Visualización de balances y cuotas de los socios.
* **Control de Asistencias (`/asistencias`):** Registro de ingresos por fecha, hora y cliente.

### 🏋️ Portal del Cliente (`Cliente`)
* **Inicio (`/dashboard-cliente`):** Resumen personal, días restantes de membresía, horarios de apertura de sala de musculación, termómetro de concurrencia en tiempo real (horarios pico vs. tranquilos) y novedades de equipamiento.
* **Mi Membresía (`/mi-membresia`):** Consulta de plan activo, contratación y renovación online mediante Mercado Pago, tarjeta o transferencia con emisión de recibos.
* **Mis Asistencias (`/mis-asistencias`):** Historial de visitas al gimnasio, constancia del mes y promedio de entrenamientos por semana.
* **Mi Perfil (`/mi-perfil`):** Datos personales, contacto de emergencia ante imprevistos y semáforo de vigencia del Apto Médico anual (persistido en PostgreSQL).

---

## 💻 Comandos Frecuentes

### Reconstruir la API en Docker tras modificar código C#
Si estás corriendo el backend dentro de Docker y modificas código backend:
```powershell
docker compose build api
docker compose up -d api
```

### Modo desarrollo local del Backend (sin Docker para la API)
Si prefieres programar en C# con recarga en caliente:
```powershell
# 1. Deja solo la base de datos en Docker
docker stop fitcore_api

# 2. Corre el backend localmente
cd src/fitcore.api
dotnet watch run
```

### Crear y aplicar nuevas migraciones de EF Core
```powershell
# Crear migración
dotnet ef migrations add NombreDeLaMigracion --project src/FitCore.Infrastructure --startup-project src/fitcore.api

# Aplicar a la BD
dotnet ef database update --project src/FitCore.Infrastructure --startup-project src/fitcore.api
```

### Resetear la Base de Datos desde cero
```powershell
# Detener y borrar contenedores + volumen de datos
docker compose down -v

# Volver a levantar PostgreSQL limpio
docker compose up -d db

# Aplicar migraciones
dotnet ef database update --project src/FitCore.Infrastructure --startup-project src/fitcore.api
```

### Build de Producción del Frontend
```powershell
cd src/fitcore-client
npm run build
```
O empaquetado en imagen Docker para producción:
```powershell
cd src/fitcore-client
docker build -f Dockerfile.prod -t fitcore-client:latest .
```
