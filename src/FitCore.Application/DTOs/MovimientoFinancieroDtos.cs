namespace FitCore.Application.DTOs;

public record CrearMovimientoDto(
    string Tipo,
    string Categoria,
    string Descripcion,
    decimal Monto,
    DateOnly Fecha,
    string? Proveedor,
    string? Nota
);

public record MovimientoFinancieroDto(
    int Id,
    string Tipo,
    string Categoria,
    string Descripcion,
    decimal Monto,
    DateOnly Fecha,
    string? Proveedor,
    string? Nota
);

public record SerieMensualDto(string Mes, decimal Ingresos, decimal Egresos);

public record ResumenContableDto(
    decimal TotalIngresosVarios,
    decimal TotalEgresos,
    decimal TotalInversiones,
    decimal TotalCompras,
    decimal TotalCuotas,
    decimal TotalIngresos,
    decimal Balance,
    List<SerieMensualDto> SerieMensual
);
