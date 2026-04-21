namespace FitCore.Application.DTOs;

public class PagoResponse
{
    public int Id { get; set; }
    public string ClienteNombre { get; set; }
    public decimal Monto { get; set; }
    public string Metodo { get; set; }
    public DateTime Fecha { get; set; }
}