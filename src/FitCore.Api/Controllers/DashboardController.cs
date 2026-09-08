using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using FitCore.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FitCore.Api.Controllers;

[Authorize]
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

        var pagosUltimos7 = await _context.Pagos
            .Where(p => p.Fecha >= fechaInicio7 && p.Fecha < fechaFin7)
            .ToListAsync();

        var serieIngresos = ultimos7Dias.Select(d =>
        {
            var totalDia = pagosUltimos7
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
        var fechaInicio7Prev = fechaInicio7.AddDays(-7);
        var pagos7Prev = await _context.Pagos
            .Where(p => p.Fecha >= fechaInicio7Prev && p.Fecha < fechaInicio7)
            .SumAsync(p => (decimal?)p.Monto) ?? 0m;

        int porcentajeCrecimiento = 0;
        if (pagos7Prev > 0)
        {
            porcentajeCrecimiento = (int)Math.Round(((totalSemana - pagos7Prev) / pagos7Prev) * 100);
        }
        else if (totalSemana > 0)
        {
            porcentajeCrecimiento = 100;
        }

        // 6. Próximos vencimientos de membresía (en los próximos 10 días)
        var limiteVencimiento = hoy.AddDays(10);
        var proximosVencimientos = await _context.Membresias
            .Include(m => m.User)
            .Include(m => m.Plan)
            .Where(m => m.Activa && m.FechaFin >= hoy && m.FechaFin <= limiteVencimiento)
            .OrderBy(m => m.FechaFin)
            .Take(5)
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
            proximosVencimientos
        });
    }
}
