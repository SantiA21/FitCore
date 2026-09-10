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
[Route("api/mediciones")]
public class MedicionesController : ControllerBase
{
    // ~5MB de imagen equivalen a ~6.7M caracteres en base64.
    private const int MaxFotoBase64Length = 7_000_000;

    private readonly AppDbContext _context;

    public MedicionesController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/mediciones/mis-mediciones
    [HttpGet("mis-mediciones")]
    public async Task<IActionResult> GetMisMediciones()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var mediciones = await ObtenerMediciones(userId);
        return Ok(mediciones);
    }

    // GET api/mediciones/cliente/{userId}
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpGet("cliente/{userId}")]
    public async Task<IActionResult> GetPorCliente(string userId)
    {
        var mediciones = await ObtenerMediciones(userId);
        return Ok(mediciones);
    }

    // POST api/mediciones/cliente/{userId}
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpPost("cliente/{userId}")]
    public async Task<IActionResult> Crear(string userId, CrearMedicionDto dto)
    {
        var registradoPor = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(registradoPor)) return Unauthorized();

        var clienteExiste = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!clienteExiste) return NotFound(new { mensaje = "Cliente no encontrado." });

        if (dto.PesoKg <= 0 || dto.PesoKg > 500)
            return BadRequest(new { mensaje = "El peso ingresado no es válido." });

        if ((dto.FotoFrenteBase64?.Length ?? 0) > MaxFotoBase64Length ||
            (dto.FotoPerfilBase64?.Length ?? 0) > MaxFotoBase64Length)
            return BadRequest(new { mensaje = "Una de las fotos supera el tamaño máximo permitido (5MB)." });

        var medicion = new MedicionCorporal
        {
            UserId = userId,
            Fecha = dto.Fecha,
            PesoKg = dto.PesoKg,
            Nota = string.IsNullOrWhiteSpace(dto.Nota) ? null : dto.Nota.Trim(),
            FotoFrenteBase64 = dto.FotoFrenteBase64,
            FotoPerfilBase64 = dto.FotoPerfilBase64,
            RegistradoPorUserId = registradoPor,
        };

        _context.MedicionesCorporales.Add(medicion);
        await _context.SaveChangesAsync();

        return Ok(AMedicionDto(medicion));
    }

    // DELETE api/mediciones/5
    [Authorize(Roles = "Admin,Entrenador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var medicion = await _context.MedicionesCorporales.FindAsync(id);
        if (medicion is null) return NotFound();

        _context.MedicionesCorporales.Remove(medicion);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<List<MedicionCorporalDto>> ObtenerMediciones(string userId)
    {
        return await _context.MedicionesCorporales
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.Fecha)
            .Select(m => new MedicionCorporalDto(m.Id, m.Fecha, m.PesoKg, m.Nota, m.FotoFrenteBase64, m.FotoPerfilBase64))
            .ToListAsync();
    }

    private static MedicionCorporalDto AMedicionDto(MedicionCorporal m) =>
        new(m.Id, m.Fecha, m.PesoKg, m.Nota, m.FotoFrenteBase64, m.FotoPerfilBase64);
}
