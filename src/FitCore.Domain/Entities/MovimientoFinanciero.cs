namespace FitCore.Domain.Entities;

public enum TipoMovimiento
{
    Ingreso,
    Egreso,
    Inversion,
    Compra
}

public class MovimientoFinanciero
{
    public int Id { get; set; }

    public TipoMovimiento Tipo { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateOnly Fecha { get; set; }
    public string? Proveedor { get; set; }
    public string? Nota { get; set; }

    public string RegistradoPorUserId { get; set; } = string.Empty;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}
