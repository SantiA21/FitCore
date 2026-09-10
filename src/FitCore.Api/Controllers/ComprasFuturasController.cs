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
[Route("api/compras-futuras")]
public class ComprasFuturasController : ControllerBase
{
    private readonly AppDbContext _context;

    public ComprasFuturasController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/compras-futuras
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var compras = await _context.ComprasFuturas
            .OrderBy(c => c.Estado)
            .ThenByDescending(c => c.Prioridad)
            .ThenBy(c => c.FechaEstimada)
            .Select(c => new CompraFuturaDto(c.Id, c.Descripcion, c.MontoEstimado, c.Prioridad.ToString(), c.Estado.ToString(), c.FechaEstimada, c.Nota))
            .ToListAsync();

        return Ok(compras);
    }

    // POST api/compras-futuras
    [HttpPost]
    public async Task<IActionResult> Crear(CrearCompraFuturaDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Descripcion))
            return BadRequest(new { mensaje = "La descripción es obligatoria." });

        if (dto.MontoEstimado < 0)
            return BadRequest(new { mensaje = "El monto estimado no puede ser negativo." });

        if (!Enum.TryParse<PrioridadCompra>(dto.Prioridad, true, out var prioridad))
            prioridad = PrioridadCompra.Media;

        var compra = new CompraFutura
        {
            Descripcion = dto.Descripcion.Trim(),
            MontoEstimado = dto.MontoEstimado,
            Prioridad = prioridad,
            FechaEstimada = dto.FechaEstimada,
            Nota = string.IsNullOrWhiteSpace(dto.Nota) ? null : dto.Nota.Trim(),
            RegistradoPorUserId = userId,
        };

        _context.ComprasFuturas.Add(compra);
        await _context.SaveChangesAsync();

        return Ok(new CompraFuturaDto(compra.Id, compra.Descripcion, compra.MontoEstimado, compra.Prioridad.ToString(), compra.Estado.ToString(), compra.FechaEstimada, compra.Nota));
    }

    // PUT api/compras-futuras/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(int id, ActualizarCompraFuturaDto dto)
    {
        var compra = await _context.ComprasFuturas.FindAsync(id);
        if (compra is null) return NotFound();

        if (dto.Descripcion is not null) compra.Descripcion = dto.Descripcion.Trim();
        if (dto.MontoEstimado.HasValue) compra.MontoEstimado = dto.MontoEstimado.Value;
        if (dto.Prioridad is not null && Enum.TryParse<PrioridadCompra>(dto.Prioridad, true, out var prioridad))
            compra.Prioridad = prioridad;
        if (dto.FechaEstimada.HasValue) compra.FechaEstimada = dto.FechaEstimada;
        if (dto.Nota is not null) compra.Nota = string.IsNullOrWhiteSpace(dto.Nota) ? null : dto.Nota.Trim();

        if (dto.Estado is not null && Enum.TryParse<EstadoCompraFutura>(dto.Estado, true, out var estado))
        {
            var pasaAComprada = estado == EstadoCompraFutura.Comprada && compra.Estado != EstadoCompraFutura.Comprada;
            compra.Estado = estado;

            // Al marcarla como comprada, se registra el gasto real en el modulo contable
            if (pasaAComprada)
            {
                _context.MovimientosFinancieros.Add(new MovimientoFinanciero
                {
                    Tipo = TipoMovimiento.Compra,
                    Categoria = "Compra planificada",
                    Descripcion = compra.Descripcion,
                    Monto = compra.MontoEstimado,
                    Fecha = DateOnly.FromDateTime(DateTime.UtcNow),
                    RegistradoPorUserId = compra.RegistradoPorUserId,
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new CompraFuturaDto(compra.Id, compra.Descripcion, compra.MontoEstimado, compra.Prioridad.ToString(), compra.Estado.ToString(), compra.FechaEstimada, compra.Nota));
    }

    // DELETE api/compras-futuras/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var compra = await _context.ComprasFuturas.FindAsync(id);
        if (compra is null) return NotFound();

        _context.ComprasFuturas.Remove(compra);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
