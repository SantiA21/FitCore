namespace FitCore.Domain.Entities;

public class Asistencia
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public DateOnly Fecha { get; set; }
    public TimeOnly HoraIngreso { get; set; }
}
