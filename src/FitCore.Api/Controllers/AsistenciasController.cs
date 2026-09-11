using System.Security.Claims;
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

    // GET api/asistencias/mis-asistencias
    [HttpGet("mis-asistencias")]
    public async Task<IActionResult> GetMisAsistencias()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var asistencias = await _context.Asistencias
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Fecha)
            .ThenByDescending(a => a.HoraIngreso)
            .Take(100)
            .Select(a => new
            {
                a.Id,
                a.Fecha,
                a.HoraIngreso
            })
            .ToListAsync();

        return Ok(asistencias);
    }

    // GET api/asistencias?fecha=2025-04-21
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpGet]
    public async Task<IActionResult> GetByFecha([FromQuery] DateOnly fecha)
    {
        var asistencias = await _context.Asistencias
            .AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.Fecha == fecha)
            .OrderBy(a => a.HoraIngreso)
            .Select(a => new
            {
                a.Id,
                a.UserId,
                a.Fecha,
                a.HoraIngreso,
                clienteNombre = a.User.Nombre,
            })
            .ToListAsync();

        return Ok(asistencias);
    }

    // GET api/asistencias/resumen?mes=4&anio=2025
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumenMes([FromQuery] int mes, [FromQuery] int anio)
    {
        var asistenciasDelMes = await _context.Asistencias
            .AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.Fecha.Month == mes && a.Fecha.Year == anio)
            .OrderByDescending(a => a.HoraIngreso)
            .ToListAsync();

        var diasConAsistencias = asistenciasDelMes
            .GroupBy(a => a.Fecha)
            .Select(g => new
            {
                fecha = g.Key,
                total = g.Count(),
                asistentes = g
                    .Select(a => string.IsNullOrWhiteSpace(a.User.Apellido) ? a.User.Nombre : $"{a.User.Nombre} {a.User.Apellido}".Trim())
                    .Where(n => !string.IsNullOrEmpty(n))
                    .Distinct()
                    .ToList(),
            })
            .ToList();

        return Ok(diasConAsistencias);
    }

    // POST api/asistencias
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpPost]
    public async Task<IActionResult> Create(AsistenciaDto dto)
    {
        var asistencia = new Asistencia
        {
            UserId = dto.UserId,
            Fecha = dto.Fecha,
            HoraIngreso = dto.HoraIngreso,
        };

        _context.Asistencias.Add(asistencia);
        await _context.SaveChangesAsync();
        return Ok(asistencia);
    }

    // DELETE api/asistencias/5
    [Authorize(Roles = "Admin,Entrenador")]
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

public record AsistenciaDto(string UserId, DateOnly Fecha, TimeOnly HoraIngreso);
