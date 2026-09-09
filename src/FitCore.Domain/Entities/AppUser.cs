using Microsoft.AspNetCore.Identity;

namespace FitCore.Domain.Entities;

public enum Categoria
{
    Admin,
    Entrenador,
    Cliente
}

public class AppUser : IdentityUser
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public DateTime FechaAlta { get; set; } = DateTime.UtcNow;
    public bool Activo { get; set; } = true;
    public Categoria Categoria { get; set; } = Categoria.Cliente;

    // Contacto de emergencia y Ficha de Salud
    public string? ContactoEmergenciaNombre { get; set; }
    public string? ContactoEmergenciaTelefono { get; set; }
    public string? ContactoEmergenciaRelacion { get; set; }
    public DateOnly? AptoMedicoVence { get; set; }

    // Relaciones — el plan actual se obtiene a través de la membresía activa
    public ICollection<Membresia> Membresias { get; set; } = [];
    public ICollection<Asistencia> Asistencias { get; set; } = [];
    public ICollection<Pago> Pagos { get; set; } = [];
}
