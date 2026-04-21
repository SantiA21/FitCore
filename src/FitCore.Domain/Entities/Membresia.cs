using FitCore.Domain.Entities;

public class Membresia
{
    public int Id { get; set; }

    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; }

    public int PlanId { get; set; }
    public Plan Plan { get; set; }

    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }

    public bool Activa { get; set; } = true;
}