using FitCore.Domain.Entities;

namespace FitCore.Application.DTOs;

public record RegisterDto(
    string Nombre,
    string Apellido,
    string Email,
    string Password,
    Categoria Categoria
);

public record LoginDto(
    string Email,
    string Password
);

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public Categoria Categoria { get; set; }
}
