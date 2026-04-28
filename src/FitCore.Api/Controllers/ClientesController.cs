using FitCore.Domain.Entities;
using FitCore.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitCore.Infrastructure.Persistence;

namespace FitCore.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;

    public ClientesController(UserManager<AppUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    // GET api/clientes
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await _userManager.Users.ToListAsync();

        // Traer membresías activas de todos los usuarios en una sola query
        var hoy = DateTime.UtcNow;
        var membresiasActivas = await _context.Membresias
            .Include(m => m.Plan)
            .Where(m => m.Activa && m.FechaFin >= hoy)
            .ToListAsync();

        var result = usuarios.Select(u =>
        {
            var mem = membresiasActivas.FirstOrDefault(m => m.UserId == u.Id);
            return ToDto(u, mem);
        });

        return Ok(result);
    }

    // GET api/clientes/{id}
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

    // GET api/clientes/activos/count
    [HttpGet("activos/count")]
    public async Task<IActionResult> GetActivosCount()
    {
        var count = await _userManager.Users.CountAsync(u => u.Activo);
        return Ok(new { total = count });
    }

    // POST api/clientes
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

    // PUT api/clientes/{id}
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

    // DELETE api/clientes/{id} → soft delete
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.Activo = false;
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    // DELETE api/clientes/{id}/permanente → hard delete
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
