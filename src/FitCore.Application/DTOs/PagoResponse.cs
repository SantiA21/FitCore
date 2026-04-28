namespace FitCore.Application.DTOs;

public class PagoResponse
{
    public int Id { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public string Metodo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }

    public string? Nota { get; set; }
}
