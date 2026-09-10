namespace FitCore.Application.DTOs;

public record IniciarMercadoPagoDto(
    int PlanId,
    string? BackUrlSuccess = null,
    string? BackUrlFailure = null,
    string? BackUrlPending = null
);

public record MercadoPagoPreferenceResponse(
    string PreferenceId,
    string InitPoint,
    string? SandboxInitPoint,
    bool IsSimulated
);

public record ConfirmarMercadoPagoDto(
    int PlanId,
    string? PaymentId = null,
    string? Status = null
);

public record ConfirmarPagoTarjetaDto(
    int PlanId,
    string Ultimos4,
    string Franquicia,
    string Titular,
    string Vencimiento
);

public record ConfirmarPagoTransferenciaDto(
    int PlanId,
    string NumeroComprobante,
    string? Observaciones = null
);

public record PagoClienteHistorialDto(
    int Id,
    int? MembresiaId,
    string PlanNombre,
    decimal Monto,
    string MontoFormatted,
    DateTime Fecha,
    string FechaFormatted,
    string Metodo,
    string? Nota,
    int PeriodoMes,
    int PeriodoAnio
);
