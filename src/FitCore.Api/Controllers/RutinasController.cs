using System.Security.Claims;
using FitCore.Application.DTOs;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/rutinas")]
public class RutinasController : ControllerBase
{
    private readonly AppDbContext _context;

    public RutinasController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/rutinas/mi-rutina
    [HttpGet("mi-rutina")]
    public async Task<IActionResult> GetMiRutina()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var dias = await ObtenerDias(userId);
        return Ok(dias);
    }

    // GET api/rutinas/cliente/{userId}
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpGet("cliente/{userId}")]
    public async Task<IActionResult> GetPorCliente(string userId)
    {
        var dias = await ObtenerDias(userId);
        return Ok(dias);
    }

    // PUT api/rutinas/cliente/{userId} — reemplaza la rutina semanal completa
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpPut("cliente/{userId}")]
    public async Task<IActionResult> ActualizarRutina(string userId, ActualizarRutinaDto dto)
    {
        var clienteExiste = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!clienteExiste) return NotFound(new { mensaje = "Cliente no encontrado." });

        var existentes = await _context.RutinasDia.Where(r => r.UserId == userId).ToListAsync();

        foreach (var diaDto in dto.Dias)
        {
            if (diaDto.DiaSemana < 0 || diaDto.DiaSemana > 6) continue;

            var dia = (DayOfWeek)diaDto.DiaSemana;
            var existente = existentes.FirstOrDefault(r => r.DiaSemana == dia);
            var descripcion = diaDto.Descripcion?.Trim();

            if (string.IsNullOrEmpty(descripcion))
            {
                if (existente is not null) _context.RutinasDia.Remove(existente);
                continue;
            }

            if (existente is not null)
            {
                existente.Descripcion = descripcion;
                existente.ActualizadoEn = DateTime.UtcNow;
            }
            else
            {
                _context.RutinasDia.Add(new RutinaDia
                {
                    UserId = userId,
                    DiaSemana = dia,
                    Descripcion = descripcion,
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    private async Task<List<RutinaDiaDto>> ObtenerDias(string userId)
    {
        return await _context.RutinasDia
            .Where(r => r.UserId == userId)
            .Select(r => new RutinaDiaDto((int)r.DiaSemana, r.Descripcion))
            .ToListAsync();
    }
}
