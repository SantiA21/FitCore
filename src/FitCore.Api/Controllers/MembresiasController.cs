using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitCore.Infrastructure.Services;
using FitCore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FitCore.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MembresiasController : ControllerBase
{
    private readonly MembresiaService _service;
    private readonly AppDbContext _context;

    public MembresiasController(MembresiaService service, AppDbContext context)
    {
        _service = service;
        _context = context;
    }

    // POST api/membresias
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearMembresiaRequest request)
    {
        var result = await _service.Crear(request.UserId, request.PlanId);
        return Ok(result);
    }

    // GET api/membresias/mi-membresia
    // Devuelve la membresía activa del usuario logueado
    [HttpGet("mi-membresia")]
    public async Task<IActionResult> GetMiMembresia()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var membresia = await _context.Membresias
            .Include(m => m.Plan)
            .Where(m => m.UserId == userId && m.FechaFin >= DateTime.UtcNow)
            .OrderByDescending(m => m.FechaFin)
            .Select(m => new
            {
                m.Id,
                m.PlanId,
                planNombre = m.Plan.Nombre,
                planPrecio = m.Plan.Precio,
                m.FechaInicio,
                m.FechaFin,
                m.Activa,
            })
            .FirstOrDefaultAsync();

        if (membresia is null) return NotFound();
        return Ok(membresia);
    }

    // GET api/membresias/activas
    [HttpGet("activas")]
    public async Task<IActionResult> GetActivas()
    {
        var result = await _service.GetActivas();
        return Ok(result);
    }

    // GET api/membresias/vencidas
    [HttpGet("vencidas")]
    public async Task<IActionResult> GetVencidas()
    {
        var result = await _service.GetVencidas();
        return Ok(result);
    }

    // GET api/membresias/metrics
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        var result = await _service.GetMetrics();
        return Ok(result);
    }

    // GET api/membresias/por-vencer
    [HttpGet("por-vencer")]
    public async Task<IActionResult> GetPorVencer([FromQuery] int dias = 3)
    {
        var result = await _service.GetPorVencer(dias);
        return Ok(result);
    }

    // POST api/membresias/{userId}/cancelar  →  cancela la membresía activa con motivo (Admin)
    [HttpPost("{userId}/cancelar")]
    public async Task<IActionResult> Cancelar(string userId, [FromBody] CancelarMembresiaRequest? request)
    {
        var ok = await _service.Cancelar(userId, request?.Motivo, request?.Observaciones);
        if (!ok) return NotFound(new { message = "No se encontró una membresía activa para este usuario." });
        return Ok(new { message = "Membresía cancelada correctamente." });
    }

    // POST api/membresias/cancelar-mi-membresia  →  el cliente cancela su propia membresía activa
    [HttpPost("cancelar-mi-membresia")]
    public async Task<IActionResult> CancelarMiMembresia([FromBody] CancelarMembresiaRequest? request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var ok = await _service.Cancelar(userId, request?.Motivo, request?.Observaciones);
        if (!ok) return NotFound(new { message = "No tenés una membresía activa para cancelar." });
        return Ok(new { message = "Tu membresía fue cancelada correctamente." });
    }

    // DELETE api/membresias/{userId}/activa  →  inactiva la membresía activa del usuario (compatibilidad)
    [HttpDelete("{userId}/activa")]
    public async Task<IActionResult> Inactivar(string userId)
    {
        var ok = await _service.Cancelar(userId, "Baja por edición de usuario", null);
        if (!ok) return NotFound();

        return NoContent();
    }

    // GET api/Membresias/usuario/{userId}
    [HttpGet("usuario/{userId}")]
    public async Task<IActionResult> GetByUsuario(string userId)
    {
        return Ok(await _service.GetByUserId(userId));
    }
}

public class CrearMembresiaRequest
{
    public string UserId { get; set; } = string.Empty;
    public int PlanId { get; set; }
}

public class CancelarMembresiaRequest
{
    public string? Motivo { get; set; }
    public string? Observaciones { get; set; }
}
