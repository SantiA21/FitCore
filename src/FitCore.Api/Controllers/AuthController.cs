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
    private readonly TokenService _tokenService;

    public AuthController(
        UserManager<AppUser> userManager,
        TokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var userExistente = await _userManager.FindByEmailAsync(dto.Email);
        if (userExistente is not null)
            return Conflict(new { mensaje = "Ya existe un usuario con ese email." });

        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
            Categoria = Categoria.Cliente,
            Activo = true,
            FechaAlta = DateTime.UtcNow
        };

        var resultado = await _userManager.CreateAsync(user, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new { errores = resultado.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, "Cliente");

        var token = _tokenService.GenerarToken(user);

        return Ok(new AuthResponseDto
        {
            Id = user.Id,
            Token = token,
            Email = user.Email!,
            Nombre = user.Nombre,
            Apellido = user.Apellido,
            Categoria = user.Categoria,
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

        var token = _tokenService.GenerarToken(user);

        return Ok(new AuthResponseDto
        {
            Id = user.Id,
            Token = token,
            Email = user.Email!,
            Nombre = user.Nombre,
            Apellido = user.Apellido,
            Categoria = user.Categoria,
        });
    }
}
