using Microsoft.AspNetCore.Identity;

namespace FitCore.Domain.Entities;

public class AppUser : IdentityUser
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public DateTime FechaAlta { get; set; } = DateTime.UtcNow;
    public bool Activo { get; set; } = true;
}