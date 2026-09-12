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

    // GET api/asistencias/estadisticas?mes=4&anio=2025
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpGet("estadisticas")]
    public async Task<IActionResult> GetEstadisticas([FromQuery] int mes, [FromQuery] int anio)
    {
        var asistenciasDelMes = await _context.Asistencias
            .AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.Fecha.Month == mes && a.Fecha.Year == anio)
            .ToListAsync();

        var primerDiaMes = new DateOnly(anio, mes, 1);
        var mesAnterior = primerDiaMes.AddMonths(-1);
        var totalMesAnterior = await _context.Asistencias
            .AsNoTracking()
            .Where(a => a.Fecha.Month == mesAnterior.Month && a.Fecha.Year == mesAnterior.Year)
            .CountAsync();

        var totalMes = asistenciasDelMes.Count;

        var porDia = asistenciasDelMes
            .GroupBy(a => a.Fecha)
            .Select(g => new { fecha = g.Key, total = g.Count() })
            .OrderByDescending(g => g.total)
            .ToList();

        var diaPico = porDia.FirstOrDefault();
        var diasConAsistencia = porDia.Count;
        var promedioPorDiaActivo = diasConAsistencia > 0
            ? Math.Round((double)totalMes / diasConAsistencia, 1)
            : 0;

        var topAsistentes = asistenciasDelMes
            .GroupBy(a => a.UserId)
            .Select(g => new
            {
                userId = g.Key,
                nombre = FormatNombre(g.First().User),
                total = g.Count(),
            })
            .OrderByDescending(x => x.total)
            .ThenBy(x => x.nombre)
            .Take(8)
            .ToList();

        var porDiaSemana = Enumerable.Range(0, 7)
            .Select(dow => new
            {
                diaSemana = dow,
                total = asistenciasDelMes.Count(a => (int)a.Fecha.DayOfWeek == dow),
            })
            .ToList();

        double? variacionPorcentual = totalMesAnterior > 0
            ? Math.Round((totalMes - totalMesAnterior) / (double)totalMesAnterior * 100, 1)
            : totalMes > 0 ? 100 : null;

        return Ok(new
        {
            totalMes,
            totalMesAnterior,
            variacionPorcentual,
            diasConAsistencia,
            promedioPorDiaActivo,
            diaPico = diaPico is null ? null : new { fecha = diaPico.fecha, total = diaPico.total },
            topAsistentes,
            porDiaSemana,
        });
    }

    private static string FormatNombre(FitCore.Domain.Entities.AppUser user)
    {
        return string.IsNullOrWhiteSpace(user.Apellido)
            ? user.Nombre
            : $"{user.Nombre} {user.Apellido}".Trim();
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
