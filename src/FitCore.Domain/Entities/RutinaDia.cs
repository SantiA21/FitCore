namespace FitCore.Domain.Entities;

public class RutinaDia
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public DayOfWeek DiaSemana { get; set; }
    public string Descripcion { get; set; } = string.Empty;

    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
}
