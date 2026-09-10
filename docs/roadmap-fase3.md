# Fase 3 — Features post-MVP

Ideas para después del roadmap de la demo (`fitcore-roadmap.vercel.app`), que no tiene forma de cargar tareas propias — este archivo es el tracking equivalente hasta que se decida llevarlas a un Issue de GitHub o al tablero.

## ✅ Seguimiento de progreso físico (peso + fotos + rutina semanal)

**Estado: Hecho** — implementado el 2026-09-10.

Cada cliente tiene su propio perfil de progreso, cargado por el entrenador/admin:
- Historial de peso con fecha, foto de frente y foto de perfil por medición.
- Gráfico de evolución de peso (SVG, mismo estilo que el gráfico de ingresos del dashboard).
- Comparación "antes y después" con la primera y la última foto cargada.
- Rutina semanal (una descripción libre por día), con "hoy te toca: ..." destacado en el portal del cliente.

**Cómo se usa:**
- Admin/Entrenador: `/clientes` → ícono de progreso (📈) en la fila del cliente → `/clientes/:id/progreso`. Ahí se carga una medición nueva (peso + fecha + fotos opcionales) y se edita la rutina de los 7 días.
- Cliente: nueva sección **Mi Progreso** en el sidebar → `/mi-progreso`.

**Backend:**
- Entidades nuevas: `MedicionCorporal` (peso, fecha, nota, 2 fotos en base64), `RutinaDia` (un registro por día de semana por cliente, único por `UserId + DiaSemana`).
- Controllers: `MedicionesController` (`/api/mediciones/...`), `RutinasController` (`/api/rutinas/...`), ambos con `[Authorize(Roles = "Admin,Entrenador")]` en las rutas de escritura/lectura por cliente, y rutas `mis-mediciones` / `mi-rutina` para que el cliente vea lo suyo.
- Migración `20260910162445_AddMedicionCorporalYRutinaDia`.

**Limitación conocida — para revisar antes de escalar a producción real:**
Las fotos se guardan como `base64` directo en columnas `text` de Postgres (sin redimensionar ni comprimir, límite de 5MB por imagen validado en front y back). Funciona bien para el volumen de un gimnasio en el arranque, pero para producción con muchos socios conviene migrar a un bucket de Supabase Storage (el proyecto Supabase ya provisionado lo soporta) en vez de guardar el binario en la base relacional — evita hinchar la base y los backups.

## Ideas evaluadas y descartadas por ahora
De la lluvia de ideas: congelamiento de membresía, reserva de clases grupales, programa de referidos y check-in por QR quedaron afuera por decisión del equipo (2026-09-10). Avisos por WhatsApp quedó marcado como interesante para retomar más adelante, en línea con el canal de notificaciones ya planeado en Fase 2 del roadmap principal.
