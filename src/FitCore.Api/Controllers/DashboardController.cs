using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using FitCore.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FitCore.Api.Controllers;

[Authorize(Roles = "Admin,Entrenador")]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly PagoService _pagoService;

    public DashboardController(AppDbContext context, UserManager<AppUser> userManager, PagoService pagoService)
    {
        _context = context;
        _userManager = userManager;
        _pagoService = pagoService;
    }

    // GET api/dashboard/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var hoy = DateTime.UtcNow;
        var hoyDate = DateOnly.FromDateTime(hoy);

        // 1. Clientes activos
        var clientesActivos = await _userManager.Users
            .CountAsync(u => u.Activo && u.Categoria == Categoria.Cliente);

        // 2. Cuotas vencidas / Clientes con deuda
        var estadoCuentas = await _pagoService.GetEstadoCuenta();
        var clientesConDeuda = estadoCuentas.Count(e => e.EstadoGeneral == "ConDeuda");

        // 3. Ingresos del mes actual
        var ingresosMes = await _context.Pagos
            .Where(p => (p.PeriodoMes == hoy.Month && p.PeriodoAnio == hoy.Year) ||
                        (p.Fecha.Month == hoy.Month && p.Fecha.Year == hoy.Year))
            .SumAsync(p => (decimal?)p.Monto) ?? 0m;

        // 4. Asistencias de hoy
        var asistenciasHoy = await _context.Asistencias
            .CountAsync(a => a.Fecha == hoyDate);

        // 5. Ingresos últimos 7 días (para el gráfico)
        var diasSemanaMap = new Dictionary<DayOfWeek, string>
        {
            { DayOfWeek.Sunday, "Dom" },
            { DayOfWeek.Monday, "Lun" },
            { DayOfWeek.Tuesday, "Mar" },
            { DayOfWeek.Wednesday, "Mié" },
            { DayOfWeek.Thursday, "Jue" },
            { DayOfWeek.Friday, "Vie" },
            { DayOfWeek.Saturday, "Sáb" }
        };

        var ultimos7Dias = Enumerable.Range(0, 7)
            .Select(i => hoy.Date.AddDays(-6 + i))
            .ToList();

        var fechaInicio7 = ultimos7Dias.First();
        var fechaFin7 = hoy.Date.AddDays(1);
        var fechaInicio7Prev = fechaInicio7.AddDays(-7);

        // Un solo round trip para los últimos 14 días (7 actuales + 7
        // previos para la tendencia), en vez de dos consultas separadas.
        var pagosUltimas2Semanas = await _context.Pagos
            .Where(p => p.Fecha >= fechaInicio7Prev && p.Fecha < fechaFin7)
            .Select(p => new { p.Fecha, p.Monto })
            .ToListAsync();

        var serieIngresos = ultimos7Dias.Select(d =>
        {
            var totalDia = pagosUltimas2Semanas
                .Where(p => p.Fecha.Date == d)
                .Sum(p => p.Monto);

            return new
            {
                dia = diasSemanaMap[d.DayOfWeek],
                fecha = d.ToString("yyyy-MM-dd"),
                monto = totalDia
            };
        }).ToList();

        var totalSemana = serieIngresos.Sum(s => s.monto);

        // Ingresos de los 7 días anteriores para calcular tendencia porcentual
        var pagos7Prev = pagosUltimas2Semanas
            .Where(p => p.Fecha >= fechaInicio7Prev && p.Fecha < fechaInicio7)
            .Sum(p => p.Monto);

        int porcentajeCrecimiento = 0;
        if (pagos7Prev > 0)
        {
            porcentajeCrecimiento = (int)Math.Round(((totalSemana - pagos7Prev) / pagos7Prev) * 100);
        }
        else if (totalSemana > 0)
        {
            porcentajeCrecimiento = 100;
        }

        // 6. Balance contable del mes (cuotas + otros ingresos - egresos/inversiones/compras)
        var inicioMes = new DateOnly(hoy.Year, hoy.Month, 1);
        var finMes = inicioMes.AddMonths(1).AddDays(-1);
        var movimientosMes = await _context.MovimientosFinancieros
            .Where(m => m.Fecha >= inicioMes && m.Fecha <= finMes)
            .Select(m => new { m.Tipo, m.Monto })
            .ToListAsync();

        var ingresosVariosMes = movimientosMes.Where(m => m.Tipo == TipoMovimiento.Ingreso).Sum(m => m.Monto);
        var egresosMes = movimientosMes.Where(m => m.Tipo != TipoMovimiento.Ingreso).Sum(m => m.Monto);
        var balanceMes = ingresosMes + ingresosVariosMes - egresosMes;

        // 7. Clientes activos con apto médico vencido (alerta legal/seguridad)
        var aptosMedicosVencidos = await _userManager.Users
            .CountAsync(u => u.Activo && u.Categoria == Categoria.Cliente &&
                              u.AptoMedicoVence != null && u.AptoMedicoVence < hoyDate);

        // 8. Últimos pagos registrados (feed corto para la vista general — no
        // se trae el historial completo, sólo lo último para no duplicar el
        // trabajo de la pantalla de Pagos).
        var ultimosPagos = await _context.Pagos
            .AsNoTracking()
            .Include(p => p.User)
            .OrderByDescending(p => p.Fecha)
            .Take(5)
            .Select(p => new
            {
                id = p.Id,
                clienteNombre = $"{p.User.Nombre} {p.User.Apellido}",
                monto = p.Monto,
                metodo = p.Metodo,
                fecha = p.Fecha
            })
            .ToListAsync();

        // 9. Próximos vencimientos de membresía (en los próximos 7 días)
        var limiteVencimiento = hoy.AddDays(7);
        var proximosVencimientos = await _context.Membresias
            .AsNoTracking()
            .Include(m => m.User)
            .Include(m => m.Plan)
            .Where(m => m.Activa && m.FechaFin >= hoy && m.FechaFin <= limiteVencimiento)
            .OrderBy(m => m.FechaFin)
            .Select(m => new
            {
                id = m.Id,
                clienteId = m.UserId,
                nombre = $"{m.User.Nombre} {m.User.Apellido}",
                plan = m.Plan.Nombre,
                fechaFin = m.FechaFin,
                diasRestantes = (int)Math.Ceiling((m.FechaFin - hoy).TotalDays)
            })
            .ToListAsync();

        return Ok(new
        {
            clientesActivos,
            cuotasVencidas = clientesConDeuda,
            ingresosMes,
            ingresosMesFormatted = "$" + ingresosMes.ToString("N0", new CultureInfo("es-AR")),
            asistenciasHoy,
            serieIngresos,
            totalSemana,
            totalSemanaFormatted = "$" + totalSemana.ToString("N0", new CultureInfo("es-AR")),
            porcentajeCrecimiento,
            balanceMes,
            balanceMesFormatted = "$" + balanceMes.ToString("N0", new CultureInfo("es-AR")),
            egresosMes,
            egresosMesFormatted = "$" + egresosMes.ToString("N0", new CultureInfo("es-AR")),
            aptosMedicosVencidos,
            ultimosPagos,
            proximosVencimientos
        });
    }
}
