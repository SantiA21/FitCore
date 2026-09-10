namespace FitCore.Application.DTOs;

public record RutinaDiaDto(int DiaSemana, string Descripcion);

public record ActualizarRutinaDto(List<RutinaDiaDto> Dias);
