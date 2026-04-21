namespace FitCore.Domain.Entities;

public class Asistencia
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraIngreso { get; set; }
}
