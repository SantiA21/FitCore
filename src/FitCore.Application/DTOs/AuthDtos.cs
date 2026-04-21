using System.ComponentModel.DataAnnotations;

namespace FitCore.Application.DTOs;

public class RegisterDto
{
    [Required]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    public string Apellido { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Roles válidos: Admin, Entrenador, Socio
    /// </summary>
    [Required]
    public string Rol { get; set; } = "Socio";
}

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public IList<string> Roles { get; set; } = new List<string>();
}