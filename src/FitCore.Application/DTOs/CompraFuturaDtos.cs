namespace FitCore.Application.DTOs;

public record CrearCompraFuturaDto(
    string Descripcion,
    decimal MontoEstimado,
    string Prioridad,
    DateOnly? FechaEstimada,
    string? Nota
);

public record ActualizarCompraFuturaDto(
    string? Descripcion,
    decimal? MontoEstimado,
    string? Prioridad,
    string? Estado,
    DateOnly? FechaEstimada,
    string? Nota
);

public record CompraFuturaDto(
    int Id,
    string Descripcion,
    decimal MontoEstimado,
    string Prioridad,
    string Estado,
    DateOnly? FechaEstimada,
    string? Nota
);
