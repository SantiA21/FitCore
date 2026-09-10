namespace FitCore.Domain.Entities;

public enum PrioridadCompra
{
    Baja,
    Media,
    Alta
}

public enum EstadoCompraFutura
{
    Pendiente,
    Comprada,
    Cancelada
}

public class CompraFutura
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = string.Empty;
    public decimal MontoEstimado { get; set; }
    public PrioridadCompra Prioridad { get; set; } = PrioridadCompra.Media;
    public EstadoCompraFutura Estado { get; set; } = EstadoCompraFutura.Pendiente;
    public DateOnly? FechaEstimada { get; set; }
    public string? Nota { get; set; }

    public string RegistradoPorUserId { get; set; } = string.Empty;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}
