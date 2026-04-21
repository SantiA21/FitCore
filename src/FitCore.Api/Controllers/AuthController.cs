using FitCore.Application.DTOs;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FitCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly TokenService _tokenService;

    // Roles válidos del sistema
    private static readonly HashSet<string> RolesValidos = new() { "Admin", "Entrenador", "Socio" };

    public AuthController(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        TokenService tokenService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (!RolesValidos.Contains(dto.Rol))
            return BadRequest(new { mensaje = $"Rol inválido. Roles válidos: {string.Join(", ", RolesValidos)}" });

        var userExistente = await _userManager.FindByEmailAsync(dto.Email);
        if (userExistente is not null)
            return Conflict(new { mensaje = "Ya existe un usuario con ese email." });

        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
        };

        var resultado = await _userManager.CreateAsync(user, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new { errores = resultado.Errors.Select(e => e.Description) });

        // Crear el rol si no existe y asignárselo al usuario
        if (!await _roleManager.RoleExistsAsync(dto.Rol))
            await _roleManager.CreateAsync(new IdentityRole(dto.Rol));

        await _userManager.AddToRoleAsync(user, dto.Rol);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerarToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Email = user.Email!,
            Nombre = user.Nombre,
            Apellido = user.Apellido,
            Roles = roles
        });
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !user.Activo)
            return Unauthorized(new { mensaje = "Credenciales inválidas." });

        var passwordValido = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!passwordValido)
            return Unauthorized(new { mensaje = "Credenciales inválidas." });

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerarToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Email = user.Email!,
            Nombre = user.Nombre,
            Apellido = user.Apellido,
            Roles = roles
        });
    }
}