namespace FitCore.Application.DTOs;

public class CrearPagoRequest
{
    public string UserId { get; set; } = string.Empty;
    public int? MembresiaId { get; set; }
    public decimal? Monto { get; set; } // Opcional: si no se pasa se toma el precio del plan
    public string Metodo { get; set; } = string.Empty;

    public string? Nota { get; set; }

}
