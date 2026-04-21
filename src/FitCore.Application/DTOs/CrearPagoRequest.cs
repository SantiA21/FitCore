namespace FitCore.Application.DTOs;

public class CrearPagoRequest
{
    public int ClienteId { get; set; }
    public int? MembresiaId { get; set; }
    public decimal? Monto { get; set; } // Este campo es opcional. Te sugiere un precio y permite override
    public string Metodo { get; set; }
}