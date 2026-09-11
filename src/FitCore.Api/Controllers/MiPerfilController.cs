using System.Security.Claims;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/usuarios/mi-perfil")]
public class MiPerfilController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;

    public MiPerfilController(UserManager<AppUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    // GET api/usuarios/mi-perfil
    [HttpGet]
    public async Task<IActionResult> GetMiPerfil()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var hoy = DateTime.UtcNow;
        var mem = await _context.Membresias
            .AsNoTracking()
            .Include(m => m.Plan)
            .Where(m => m.UserId == userId && m.Activa && m.FechaFin >= hoy)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            user.Id,
            user.Nombre,
            user.Apellido,
            user.Email,
            user.Telefono,
            user.FechaAlta,
            user.Activo,
            categoria = user.Categoria.ToString(),
            user.ContactoEmergenciaNombre,
            user.ContactoEmergenciaTelefono,
            user.ContactoEmergenciaRelacion,
            user.AptoMedicoVence,
            membresia = mem is not null ? new
            {
                planId = mem.PlanId,
                planNombre = mem.Plan?.Nombre,
                fechaFin = mem.FechaFin
            } : null
        });
    }

    // PUT api/usuarios/mi-perfil
    [HttpPut]
    public async Task<IActionResult> UpdateMiPerfil([FromBody] UpdateMiPerfilDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        if (dto.Telefono is not null)
            user.Telefono = dto.Telefono.Trim();

        user.ContactoEmergenciaNombre = dto.ContactoEmergenciaNombre?.Trim();
        user.ContactoEmergenciaTelefono = dto.ContactoEmergenciaTelefono?.Trim();
        user.ContactoEmergenciaRelacion = dto.ContactoEmergenciaRelacion?.Trim();

        if (dto.AptoMedicoVence.HasValue)
            user.AptoMedicoVence = dto.AptoMedicoVence.Value;

        var resultado = await _userManager.UpdateAsync(user);
        if (!resultado.Succeeded)
            return BadRequest(new { errores = resultado.Errors.Select(e => e.Description) });

        return Ok(new
        {
            mensaje = "Perfil actualizado correctamente en la base de datos",
            user.Telefono,
            user.ContactoEmergenciaNombre,
            user.ContactoEmergenciaTelefono,
            user.ContactoEmergenciaRelacion,
            user.AptoMedicoVence
        });
    }
}
