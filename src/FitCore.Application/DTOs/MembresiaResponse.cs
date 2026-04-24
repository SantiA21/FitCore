namespace FitCore.Application.DTOs;

public class MembresiaResponse
{
    public int Id { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public string PlanNombre { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
}
