namespace FitCore.Domain.Entities;

public class Pago
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int? MembresiaId { get; set; }
    public Membresia? Membresia { get; set; }

    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }

    public string Metodo { get; set; } = string.Empty;
}
