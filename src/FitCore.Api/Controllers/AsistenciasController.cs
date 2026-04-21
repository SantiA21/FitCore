using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AsistenciasController : ControllerBase
{
    private readonly AppDbContext _context;

    public AsistenciasController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/asistencias?fecha=2025-04-21
    [HttpGet]
    public async Task<IActionResult> GetByFecha([FromQuery] DateOnly fecha)
    {
        var asistencias = await _context.Asistencias
            .Include(a => a.Cliente)
            .Where(a => a.Fecha == fecha)
            .OrderBy(a => a.HoraIngreso)
            .Select(a => new
            {
                a.Id,
                a.ClienteId,
                a.Fecha,
                a.HoraIngreso,
                clienteNombre = a.Cliente.Nombre,
            })
            .ToListAsync();

        return Ok(asistencias);
    }

    // GET api/asistencias/resumen?mes=4&anio=2025
    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumenMes([FromQuery] int mes, [FromQuery] int anio)
    {
        var diasConAsistencias = await _context.Asistencias
            .Where(a => a.Fecha.Month == mes && a.Fecha.Year == anio)
            .GroupBy(a => a.Fecha)
            .Select(g => new { fecha = g.Key, total = g.Count() })
            .ToListAsync();

        return Ok(diasConAsistencias);
    }

    // POST api/asistencias
    [HttpPost]
    public async Task<IActionResult> Create(AsistenciaDto dto)
    {
        var asistencia = new Asistencia
        {
            ClienteId = dto.ClienteId,
            Fecha = dto.Fecha,
            HoraIngreso = dto.HoraIngreso,
        };

        _context.Asistencias.Add(asistencia);
        await _context.SaveChangesAsync();
        return Ok(asistencia);
    }

    // DELETE api/asistencias/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var asistencia = await _context.Asistencias.FindAsync(id);
        if (asistencia is null) return NotFound();
        _context.Asistencias.Remove(asistencia);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public record AsistenciaDto(int ClienteId, DateOnly Fecha, TimeOnly HoraIngreso);
