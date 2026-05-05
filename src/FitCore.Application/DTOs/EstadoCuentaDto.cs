namespace FitCore.Application.DTOs;

public class EstadoCuentaDto
{
    public string UserId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PlanNombre { get; set; }
    public DateTime? MembresiaVence { get; set; }

    // Estado general del cliente
    public string EstadoGeneral { get; set; } = string.Empty; // AlDia | ConDeuda | MembresiaVencida

    // Detalle de los últimos 3 meses
    public List<PeriodoEstado> Periodos { get; set; } = [];
}

public class PeriodoEstado
{
    public int Mes { get; set; }
    public int Anio { get; set; }
    public string NombreMes { get; set; } = string.Empty; // "Marzo 2025"
    public bool Pagado { get; set; }
    public decimal? Monto { get; set; }
    public string? Metodo { get; set; }
    public DateTime? FechaPago { get; set; }
}