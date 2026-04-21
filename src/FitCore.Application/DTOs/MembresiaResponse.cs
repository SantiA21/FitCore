namespace FitCore.Application.DTOs;

public class MembresiaResponse
{
    public int Id { get; set; }
    public string ClienteNombre { get; set; }
    public string PlanNombre { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
}