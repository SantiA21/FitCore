namespace FitCore.Domain.Entities;

public class Membresia
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int PlanId { get; set; }
    public Plan Plan { get; set; } = null!;

    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }

    public bool Activa { get; set; } = true;
}
