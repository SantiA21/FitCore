namespace FitCore.Application.DTOs;

public record CrearMedicionDto(
    DateOnly Fecha,
    decimal PesoKg,
    string? Nota,
    string? FotoFrenteBase64,
    string? FotoPerfilBase64
);

public record MedicionCorporalDto(
    int Id,
    DateOnly Fecha,
    decimal PesoKg,
    string? Nota,
    string? FotoFrenteBase64,
    string? FotoPerfilBase64
);
