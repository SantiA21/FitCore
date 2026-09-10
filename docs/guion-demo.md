# Guión de la demo — 10 minutos

Sigue el orden ya acordado en el roadmap: el portal de autogestión va al final porque es el argumento de venta y conviene dejarlo como cierre. **No se toca el checkout en vivo** — esa parte se cuenta, no se muestra (evita cualquier riesgo de generar un cobro real en el medio de la demo).

> ⚠️ Los pasos 3 y 4 (llavero NFC y reporte del mes) dependen de tareas de Fase 2 que todavía no están hechas. Este guión asume el sistema completo — hay que revisarlo de nuevo cuando esas features estén listas, antes del ensayo cronometrado.

Preparación previa (no cuenta en los 10 minutos):
- Dos navegadores (o uno normal + uno en incógnito) con sesión ya iniciada: uno como `admin@fitcore.com`, otro como un cliente con membresía activa y próxima a vencer.
- Un socio de prueba con historial cargado (pagos + asistencias de varias semanas) para abrir en el paso 2.
- Si el llavero NFC está listo: probarlo una vez antes de arrancar, fuera de cámara.

---

## 0. Apertura (0:00 – 0:30)

> "Esto es FitCore: un sistema de gestión para gimnasios de musculación. Socios, cobranzas, asistencias y un portal donde el socio se autogestiona sin llamar a recepción. Se los muestro corriendo, con datos reales de seis meses."

Arrancás ya logueado como admin, en el Panel Central. No pierdas tiempo mostrando el login.

---

## 1. Dashboard del admin (0:30 – 2:00)

**Mostrás:** Panel Central (`/dashboard-admin`).

> "Esto es lo primero que ve el dueño del gimnasio al entrar. Socios activos, clientes con la cuota vencida o por vencer, ingresos del mes, asistencias de hoy."

- Señalá las 4 métricas de arriba (clientes activos, con vencimiento próximo, ingresos, asistencias hoy) — decí el número en voz alta, no dejes que lo lean solos.
- Abrí el calendario de asistencias y pasá el mouse por un par de días con actividad.
- Mostrá el gráfico de ingresos de los últimos 7 días.

> "Todo esto se actualiza solo, no hay nada cargado a mano para la demo — son seis meses de operación simulada."

---

## 2. Ficha de un socio (2:00 – 3:30)

**Mostrás:** `/clientes` → abrís un socio con historial cargado.

> "Vamos a un socio puntual. Acá tenés sus datos de contacto, contacto de emergencia, el estado de su Apto Médico..."

- Señalá el semáforo del Apto Médico (vigente / por vencer / vencido) — es un detalle que un gimnasio real valora.
- Bajá al historial de pagos: mostrá 2-3 pagos con distintos métodos (Mercado Pago, tarjeta, transferencia).
- Bajá al historial de asistencias: mostrá la frecuencia semanal.

> "Todo esto lo puede consultar el mismo socio desde su portal — se los muestro en el cierre."

---

## 3. Asistencia con llavero NFC (3:30 – 4:45)

**Mostrás:** pantalla kiosco de recepción, lector USB conectado.

> "En recepción no hay que buscar al socio por nombre. Pasa el llavero..."

- Pasá el llavero de prueba por el lector.
- Señalá que la asistencia aparece **en vivo** en el dashboard (si tenés el dashboard en un segundo monitor o pestaña, mejor: mostrá el conteo actualizarse solo).

> "Y si la membresía está vencida, el sistema lo avisa ahí mismo, antes de dejarlo entrar."

*(Si el lector no está conectado ese día: contá el flujo con una captura o el kiosco en modo simulado, pero avisá antes que es una demo del flujo, no en vivo — no finjas que funciona si no funciona.)*

---

## 4. Cobranzas, estado de cuenta y reporte (4:45 – 6:45)

**Mostrás:** `/pagos` → `/estado-cuenta` → pantalla de Reportes.

> "Del lado administrativo: acá se registran los pagos manuales, y acá el estado de cuenta general — quién debe, quién está al día."

- En Pagos: mostrá el historial reciente, filtros por método.
- En Estado de Cuenta: mostrá 1-2 socios con saldo pendiente.
- En Reportes: elegí un rango rápido (ej. "Este mes"), mostrá el resumen de ingresos y exportá un CSV en vivo.

> "Todo lo que ven acá se puede exportar para el contador o para análisis propio, en un clic."

---

## 5. Portal del cliente — cierre (6:45 – 9:15)

**Cambiás a la cuenta de cliente** (segundo navegador, ya logueado).

> "Y este es el argumento de venta real: el socio no depende de recepción para nada de esto."

- Inicio del cliente: días restantes de membresía, horarios de sala, novedades del gym.
- Mostrá la **campana de notificaciones** con el aviso de vencimiento próximo.
- Mis Asistencias: historial personal, constancia del mes.
- Mi Membresía: mostrá los planes disponibles y el flujo de pago — **hasta el botón de pagar, sin tocarlo.**

> "Todo lo que vieron del lado admin, el socio lo tiene espejado acá, en modo autogestión. Eso significa menos carga para recepción y un socio que no se entera tarde de que le vence la cuota."

---

## Cierre (9:15 – 10:00)

> "Eso es FitCore: gestión completa del gimnasio de un lado, autogestión real del socio del otro, y todo corriendo sobre datos reales de seis meses de operación. Preguntas?"

---

### Reglas de oro para el día de la demo
1. **No tocar el checkout en vivo** — se cuenta, no se muestra.
2. Las dos cuentas (admin y cliente) ya logueadas *antes* de empezar, en dos navegadores.
3. Si algo no responde, no lo debuguees en cámara — seguí al siguiente punto y volvé si da el tiempo.
4. Cronometrar el ensayo completo al menos una vez antes del día real (tarea "Ensayo completo cronometrado" del roadmap).
