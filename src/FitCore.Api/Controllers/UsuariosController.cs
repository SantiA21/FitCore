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
[Route("api/[controller]")]
[Route("api/clientes")] // Alias para retrocompatibilidad
public class UsuariosController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;

    public UsuariosController(UserManager<AppUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    // GET api/usuarios/mi-perfil
    [HttpGet("mi-perfil")]
    public async Task<IActionResult> GetMiPerfil()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var hoy = DateTime.UtcNow;
        var mem = await _context.Membresias
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
    [HttpPut("mi-perfil")]
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

    // GET api/usuarios?categoria=Cliente&activo=true
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Categoria? categoria = null,
        [FromQuery] bool? activo = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (categoria.HasValue)
            query = query.Where(u => u.Categoria == categoria.Value);

        if (activo.HasValue)
            query = query.Where(u => u.Activo == activo.Value);

        var usuarios = await query.ToListAsync();

        // Traer membresías activas de los usuarios filtrados
        var hoy = DateTime.UtcNow;
        var userIds = usuarios.Select(u => u.Id).ToList();

        var membresiasActivas = await _context.Membresias
            .Include(m => m.Plan)
            .Where(m => userIds.Contains(m.UserId) && m.Activa && m.FechaFin >= hoy)
            .ToListAsync();

        var result = usuarios.Select(u =>
        {
            var mem = membresiasActivas.FirstOrDefault(m => m.UserId == u.Id);
            return ToDto(u, mem);
        });

        return Ok(result);
    }

    // GET api/usuarios/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var hoy = DateTime.UtcNow;
        var mem = await _context.Membresias
            .Include(m => m.Plan)
            .Where(m => m.UserId == id && m.Activa && m.FechaFin >= hoy)
            .FirstOrDefaultAsync();

        return Ok(ToDto(user, mem));
    }

    // GET api/usuarios/activos/count?categoria=Cliente
    [HttpGet("activos/count")]
    public async Task<IActionResult> GetActivosCount([FromQuery] Categoria? categoria = null)
    {
        var query = _userManager.Users.Where(u => u.Activo);

        if (categoria.HasValue)
            query = query.Where(u => u.Categoria == categoria.Value);

        var count = await query.CountAsync();
        return Ok(new { total = count });
    }

    // POST api/usuarios
    [HttpPost]
    public async Task<IActionResult> Create(CreateUsuarioDto dto)
    {
        var userExistente = await _userManager.FindByEmailAsync(dto.Email);
        if (userExistente is not null)
            return Conflict(new { mensaje = "Ya existe un usuario con ese email." });

        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            Nombre = dto.Nombre,
            Apellido = dto.Apellido ?? string.Empty,
            Telefono = dto.Telefono ?? string.Empty,
            Categoria = dto.Categoria,
            Activo = true,
        };

        var password = dto.Password ?? $"Temp_{Guid.NewGuid():N}!1A";
        var resultado = await _userManager.CreateAsync(user, password);

        if (!resultado.Succeeded)
            return BadRequest(new { errores = resultado.Errors.Select(e => e.Description) });

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToDto(user, null));
    }

    // PUT api/usuarios/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, UpdateUsuarioDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.Nombre = dto.Nombre;
        user.Apellido = dto.Apellido ?? user.Apellido;
        user.Telefono = dto.Telefono ?? user.Telefono;
        user.Email = dto.Email;
        user.UserName = dto.Email;
        user.Categoria = dto.Categoria;
        user.Activo = dto.Activo;

        var resultado = await _userManager.UpdateAsync(user);
        if (!resultado.Succeeded)
            return BadRequest(new { errores = resultado.Errors.Select(e => e.Description) });

        return NoContent();
    }

    // DELETE api/usuarios/{id} → soft delete
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.Activo = false;
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    // DELETE api/usuarios/{id}/permanente → hard delete
    [HttpDelete("{id}/permanente")]
    public async Task<IActionResult> HardDelete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var resultado = await _userManager.DeleteAsync(user);
        if (!resultado.Succeeded)
            return BadRequest(new { errores = resultado.Errors.Select(e => e.Description) });

        return NoContent();
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private static UsuarioDto ToDto(AppUser u, Membresia? membresiaActiva) => new(
        u.Id,
        u.Nombre,
        u.Apellido,
        u.Telefono,
        u.Email ?? string.Empty,
        u.FechaAlta,
        u.Activo,
        u.Categoria,
        membresiaActiva?.PlanId,
        membresiaActiva?.Plan?.Nombre,
        membresiaActiva?.FechaFin
    );
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record UsuarioDto(
    string Id,
    string Nombre,
    string Apellido,
    string Telefono,
    string Email,
    DateTime FechaAlta,
    bool Activo,
    FitCore.Domain.Entities.Categoria Categoria,
    int? PlanId,
    string? PlanNombre,
    DateTime? MembresiaVence
);

public record CreateUsuarioDto(
    string Nombre,
    string? Apellido,
    string? Telefono,
    string Email,
    string? Password,
    FitCore.Domain.Entities.Categoria Categoria
);

public record UpdateUsuarioDto(
    string Nombre,
    string? Apellido,
    string? Telefono,
    string Email,
    bool Activo,
    FitCore.Domain.Entities.Categoria Categoria
);

public record UpdateMiPerfilDto(
    string? Telefono,
    string? ContactoEmergenciaNombre,
    string? ContactoEmergenciaTelefono,
    string? ContactoEmergenciaRelacion,
    DateOnly? AptoMedicoVence
);
