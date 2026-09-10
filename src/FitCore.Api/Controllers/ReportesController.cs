using System.Text;
using FitCore.Api.Helpers;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using FitCore.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Api.Controllers;

[Authorize(Roles = "Admin,Entrenador")]
[ApiController]
[Route("api/reportes")]
public class ReportesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PagoService _pagoService;

    public ReportesController(AppDbContext context, PagoService pagoService)
    {
        _context = context;
        _pagoService = pagoService;
    }

    private static (DateOnly Desde, DateOnly Hasta) RangoODefecto(DateOnly? desde, DateOnly? hasta)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        return (desde ?? hoy.AddDays(-30), hasta ?? hoy);
    }

    private static (DateTime Desde, DateTime Hasta) ARangoDeFechaHora(DateOnly desde, DateOnly hasta) =>
        (
            DateTime.SpecifyKind(desde.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc),
            DateTime.SpecifyKind(hasta.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc)
        );

    // ── Ingresos ──────────────────────────────────────────────────────────

    // GET api/reportes/ingresos?desde=&hasta=
    [HttpGet("ingresos")]
    public async Task<IActionResult> Ingresos([FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta)
    {
        var (d, h) = RangoODefecto(desde, hasta);
        var pagos = await ObtenerPagos(d, h);

        var items = pagos.Select(p => new
        {
            fecha = DateOnly.FromDateTime(p.Fecha),
            cliente = $"{p.User.Nombre} {p.User.Apellido}",
            monto = p.Monto,
            metodo = p.Metodo,
            nota = p.Nota
        }).ToList();

        return Ok(new { desde = d, hasta = h, total = items.Sum(i => i.monto), cantidad = items.Count, items });
    }

    [HttpGet("ingresos/export")]
    public async Task<IActionResult> IngresosExport([FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta)
    {
        var (d, h) = RangoODefecto(desde, hasta);
        var pagos = await ObtenerPagos(d, h);

        var headers = new[] { "Fecha", "Cliente", "Monto", "Método", "Nota" };
        var rows = pagos.Select(p => (IReadOnlyList<object?>)new object?[]
        {
            DateOnly.FromDateTime(p.Fecha), $"{p.User.Nombre} {p.User.Apellido}", p.Monto, p.Metodo, p.Nota
        });

        return DevolverXml("Ingresos", headers, rows, $"ingresos_{d:yyyyMMdd}_{h:yyyyMMdd}.xml");
    }

    private async Task<List<Pago>> ObtenerPagos(DateOnly desde, DateOnly hasta)
    {
        var (desdeDt, hastaDt) = ARangoDeFechaHora(desde, hasta);
        return await _context.Pagos
            .Include(p => p.User)
            .Where(p => p.Fecha >= desdeDt && p.Fecha < hastaDt)
            .OrderByDescending(p => p.Fecha)
            .ToListAsync();
    }

    // ── Morosidad ─────────────────────────────────────────────────────────

    // GET api/reportes/morosidad
    [HttpGet("morosidad")]
    public async Task<IActionResult> Morosidad()
    {
        var morosos = await ObtenerMorosos();
        var items = morosos.Select(m => new
        {
            cliente = m.Estado.Nombre,
            email = m.Estado.Email,
            plan = m.Estado.PlanNombre,
            vence = m.Estado.MembresiaVence,
            mesesAdeudados = m.MesesAdeudados,
            montoEstimado = m.MontoEstimado
        }).ToList();

        return Ok(new { cantidad = items.Count, totalEstimado = items.Sum(i => i.montoEstimado), items });
    }

    [HttpGet("morosidad/export")]
    public async Task<IActionResult> MorosidadExport()
    {
        var morosos = await ObtenerMorosos();

        var headers = new[] { "Cliente", "Email", "Plan", "Vence", "Meses Adeudados", "Monto Estimado" };
        var rows = morosos.Select(m => (IReadOnlyList<object?>)new object?[]
        {
            m.Estado.Nombre, m.Estado.Email, m.Estado.PlanNombre, m.Estado.MembresiaVence, m.MesesAdeudados, m.MontoEstimado
        });

        return DevolverXml("Morosidad", headers, rows, $"morosidad_{DateTime.UtcNow:yyyyMMdd}.xml");
    }

    private async Task<List<(FitCore.Application.DTOs.EstadoCuentaDto Estado, int MesesAdeudados, decimal MontoEstimado)>> ObtenerMorosos()
    {
        var estados = await _pagoService.GetEstadoCuenta();
        return estados
            .Where(e => e.EstadoGeneral == "ConDeuda")
            .Select(e =>
            {
                var mesesAdeudados = e.Periodos.Count(p => !p.Pagado);
                return (e, mesesAdeudados, mesesAdeudados * (e.PlanPrecio ?? 0));
            })
            .ToList();
    }

    // ── Ocupación por hora ────────────────────────────────────────────────

    // GET api/reportes/ocupacion?desde=&hasta=
    [HttpGet("ocupacion")]
    public async Task<IActionResult> Ocupacion([FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta)
    {
        var (d, h) = RangoODefecto(desde, hasta);
        var porHora = await CalcularOcupacion(d, h);
        return Ok(new
        {
            desde = d,
            hasta = h,
            totalAsistencias = porHora.Sum(p => p.cantidad),
            // Igual que en Contable: los tuples necesitan proyectarse a un tipo
            // anonimo con nombres para que System.Text.Json los serialice bien.
            porHora = porHora.Select(p => new { p.hora, p.cantidad })
        });
    }

    [HttpGet("ocupacion/export")]
    public async Task<IActionResult> OcupacionExport([FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta)
    {
        var (d, h) = RangoODefecto(desde, hasta);
        var porHora = await CalcularOcupacion(d, h);

        var headers = new[] { "Hora", "Cantidad de Asistencias" };
        var rows = porHora.Select(p => (IReadOnlyList<object?>)new object?[] { $"{p.hora}:00", p.cantidad });

        return DevolverXml("Ocupacion", headers, rows, $"ocupacion_{d:yyyyMMdd}_{h:yyyyMMdd}.xml");
    }

    private async Task<List<(int hora, int cantidad)>> CalcularOcupacion(DateOnly desde, DateOnly hasta)
    {
        var asistencias = await _context.Asistencias
            .Where(a => a.Fecha >= desde && a.Fecha <= hasta)
            .ToListAsync();

        return Enumerable.Range(6, 18) // 06:00 a 23:00, franja habitual de un gimnasio
            .Select(hora => (hora, asistencias.Count(a => a.HoraIngreso.Hour == hora)))
            .ToList();
    }

    // ── Contable (ingresos + egresos + inversiones + compras) ────────────

    // GET api/reportes/contable?desde=&hasta=
    [HttpGet("contable")]
    public async Task<IActionResult> Contable([FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta)
    {
        var (d, h) = RangoODefecto(desde, hasta);
        var (pagos, movimientos) = await ObtenerDatosContables(d, h);

        var items = ArmarItemsContables(pagos, movimientos);
        var (totalIngresos, totalEgresos, totalInversiones, totalCompras) = CalcularTotales(pagos, movimientos);

        return Ok(new
        {
            desde = d,
            hasta = h,
            totalIngresos,
            totalEgresos,
            totalInversiones,
            totalCompras,
            balance = totalIngresos - totalEgresos - totalInversiones - totalCompras,
            // Los tuples de C# se serializan como "{}" con System.Text.Json (usa
            // propiedades, no los campos ItemN de la tupla) — se proyectan a un
            // tipo anónimo con nombres para que el JSON tenga los campos reales.
            items = items.Select(i => new { i.fecha, i.tipo, i.categoria, i.descripcion, i.monto })
        });
    }

    [HttpGet("contable/export")]
    public async Task<IActionResult> ContableExport([FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta)
    {
        var (d, h) = RangoODefecto(desde, hasta);
        var (pagos, movimientos) = await ObtenerDatosContables(d, h);
        var items = ArmarItemsContables(pagos, movimientos);

        var headers = new[] { "Fecha", "Tipo", "Categoría", "Descripción", "Monto" };
        var rows = items.Select(i => (IReadOnlyList<object?>)new object?[] { i.fecha, i.tipo, i.categoria, i.descripcion, i.monto });

        return DevolverXml("Contable", headers, rows, $"contable_{d:yyyyMMdd}_{h:yyyyMMdd}.xml");
    }

    private async Task<(List<Pago> Pagos, List<MovimientoFinanciero> Movimientos)> ObtenerDatosContables(DateOnly desde, DateOnly hasta)
    {
        var pagos = await ObtenerPagos(desde, hasta);
        var movimientos = await _context.MovimientosFinancieros
            .Where(m => m.Fecha >= desde && m.Fecha <= hasta)
            .ToListAsync();
        return (pagos, movimientos);
    }

    private static List<(DateOnly fecha, string tipo, string categoria, string descripcion, decimal monto)> ArmarItemsContables(
        List<Pago> pagos, List<MovimientoFinanciero> movimientos)
    {
        var deCuotas = pagos.Select(p => (
            fecha: DateOnly.FromDateTime(p.Fecha),
            tipo: "Ingreso",
            categoria: "Cuota",
            descripcion: $"Cuota de {p.User.Nombre} {p.User.Apellido}",
            monto: p.Monto
        ));

        var deMovimientos = movimientos.Select(m => (
            fecha: m.Fecha,
            tipo: m.Tipo.ToString(),
            categoria: m.Categoria,
            descripcion: m.Descripcion,
            monto: m.Monto
        ));

        return deCuotas.Concat(deMovimientos).OrderByDescending(x => x.fecha).ToList();
    }

    private static (decimal Ingresos, decimal Egresos, decimal Inversiones, decimal Compras) CalcularTotales(
        List<Pago> pagos, List<MovimientoFinanciero> movimientos)
    {
        decimal ingresos = pagos.Sum(p => p.Monto) + movimientos.Where(m => m.Tipo == TipoMovimiento.Ingreso).Sum(m => m.Monto);
        decimal egresos = movimientos.Where(m => m.Tipo == TipoMovimiento.Egreso).Sum(m => m.Monto);
        decimal inversiones = movimientos.Where(m => m.Tipo == TipoMovimiento.Inversion).Sum(m => m.Monto);
        decimal compras = movimientos.Where(m => m.Tipo == TipoMovimiento.Compra).Sum(m => m.Monto);
        return (ingresos, egresos, inversiones, compras);
    }

    // ── Helper de exportación ────────────────────────────────────────────

    private FileContentResult DevolverXml(string sheetName, IReadOnlyList<string> headers, IEnumerable<IReadOnlyList<object?>> rows, string fileName)
    {
        var xml = SpreadsheetXml.Build(sheetName, headers, rows);
        return File(Encoding.UTF8.GetBytes(xml), "application/vnd.ms-excel", fileName);
    }
}
