namespace FitCore.Application.DTOs;

public class CrearPagoRequest
{
    public string UserId { get; set; } = string.Empty;
    public int? MembresiaId { get; set; }
    public decimal? Monto { get; set; }
    public string Metodo { get; set; } = string.Empty;
    public string? Nota { get; set; }

    // Si no se manda, se usa el mes actual
    public int? PeriodoMes { get; set; }
    public int? PeriodoAnio { get; set; }
}