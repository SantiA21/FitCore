using System.Globalization;
using System.Security.Claims;
using FitCore.Application.DTOs;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Api.Controllers;

[Authorize(Roles = "Admin,Entrenador")]
[ApiController]
[Route("api/movimientos")]
public class MovimientosFinancierosController : ControllerBase
{
    private readonly AppDbContext _context;

    public MovimientosFinancierosController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/movimientos?tipo=Egreso&desde=2026-09-01&hasta=2026-09-30
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? tipo, [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta)
    {
        var query = _context.MovimientosFinancieros.AsQueryable();

        if (!string.IsNullOrWhiteSpace(tipo) && Enum.TryParse<TipoMovimiento>(tipo, true, out var tipoEnum))
            query = query.Where(m => m.Tipo == tipoEnum);
        if (desde.HasValue) query = query.Where(m => m.Fecha >= desde.Value);
        if (hasta.HasValue) query = query.Where(m => m.Fecha <= hasta.Value);

        var movimientos = await query
            .OrderByDescending(m => m.Fecha)
            .ThenByDescending(m => m.Id)
            .Select(m => new MovimientoFinancieroDto(m.Id, m.Tipo.ToString(), m.Categoria, m.Descripcion, m.Monto, m.Fecha, m.Proveedor, m.Nota))
            .ToListAsync();

        return Ok(movimientos);
    }

    // GET api/movimientos/resumen — balance del mes actual + serie de los ultimos 6 meses
    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var hoy = DateTime.UtcNow;
        var inicioMes = new DateOnly(hoy.Year, hoy.Month, 1);
        var finMes = inicioMes.AddMonths(1).AddDays(-1);

        var movimientosMes = await _context.MovimientosFinancieros
            .Where(m => m.Fecha >= inicioMes && m.Fecha <= finMes)
            .ToListAsync();

        var cuotasMes = await _context.Pagos
            .Where(p => p.Fecha.Month == hoy.Month && p.Fecha.Year == hoy.Year)
            .SumAsync(p => (decimal?)p.Monto) ?? 0m;

        decimal ingresosVarios = movimientosMes.Where(m => m.Tipo == TipoMovimiento.Ingreso).Sum(m => m.Monto);
        decimal egresos = movimientosMes.Where(m => m.Tipo == TipoMovimiento.Egreso).Sum(m => m.Monto);
        decimal inversiones = movimientosMes.Where(m => m.Tipo == TipoMovimiento.Inversion).Sum(m => m.Monto);
        decimal compras = movimientosMes.Where(m => m.Tipo == TipoMovimiento.Compra).Sum(m => m.Monto);
        decimal totalIngresos = cuotasMes + ingresosVarios;
        decimal balance = totalIngresos - egresos - inversiones - compras;

        var serieMensual = new List<SerieMensualDto>();
        for (int i = 5; i >= 0; i--)
        {
            var mesRef = new DateOnly(hoy.Year, hoy.Month, 1).AddMonths(-i);
            var finMesRef = mesRef.AddMonths(1).AddDays(-1);

            var cuotasDelMes = await _context.Pagos
                .Where(p => p.Fecha.Month == mesRef.Month && p.Fecha.Year == mesRef.Year)
                .SumAsync(p => (decimal?)p.Monto) ?? 0m;

            var movsDelMes = await _context.MovimientosFinancieros
                .Where(m => m.Fecha >= mesRef && m.Fecha <= finMesRef)
                .ToListAsync();

            var ingresosDelMes = cuotasDelMes + movsDelMes.Where(m => m.Tipo == TipoMovimiento.Ingreso).Sum(m => m.Monto);
            var egresosDelMes = movsDelMes.Where(m => m.Tipo != TipoMovimiento.Ingreso).Sum(m => m.Monto);

            var nombreMes = mesRef.ToDateTime(TimeOnly.MinValue).ToString("MMM", new CultureInfo("es-AR"));
            serieMensual.Add(new SerieMensualDto(nombreMes, ingresosDelMes, egresosDelMes));
        }

        return Ok(new ResumenContableDto(ingresosVarios, egresos, inversiones, compras, cuotasMes, totalIngresos, balance, serieMensual));
    }

    // POST api/movimientos
    [HttpPost]
    public async Task<IActionResult> Crear(CrearMovimientoDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (!Enum.TryParse<TipoMovimiento>(dto.Tipo, true, out var tipo))
            return BadRequest(new { mensaje = "Tipo de movimiento inválido. Usá Ingreso, Egreso, Inversion o Compra." });

        if (dto.Monto <= 0)
            return BadRequest(new { mensaje = "El monto debe ser mayor a cero." });

        if (string.IsNullOrWhiteSpace(dto.Descripcion))
            return BadRequest(new { mensaje = "La descripción es obligatoria." });

        var movimiento = new MovimientoFinanciero
        {
            Tipo = tipo,
            Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? "General" : dto.Categoria.Trim(),
            Descripcion = dto.Descripcion.Trim(),
            Monto = dto.Monto,
            Fecha = dto.Fecha,
            Proveedor = string.IsNullOrWhiteSpace(dto.Proveedor) ? null : dto.Proveedor.Trim(),
            Nota = string.IsNullOrWhiteSpace(dto.Nota) ? null : dto.Nota.Trim(),
            RegistradoPorUserId = userId,
        };

        _context.MovimientosFinancieros.Add(movimiento);
        await _context.SaveChangesAsync();

        return Ok(new MovimientoFinancieroDto(movimiento.Id, movimiento.Tipo.ToString(), movimiento.Categoria, movimiento.Descripcion, movimiento.Monto, movimiento.Fecha, movimiento.Proveedor, movimiento.Nota));
    }

    // DELETE api/movimientos/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var movimiento = await _context.MovimientosFinancieros.FindAsync(id);
        if (movimiento is null) return NotFound();

        _context.MovimientosFinancieros.Remove(movimiento);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
