namespace FitCore.Domain.Entities;

public class MedicionCorporal
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public DateOnly Fecha { get; set; }
    public decimal PesoKg { get; set; }
    public string? Nota { get; set; }

    // Fotos de "antes / después" — guardadas como data URL base64.
    public string? FotoFrenteBase64 { get; set; }
    public string? FotoPerfilBase64 { get; set; }

    public string RegistradoPorUserId { get; set; } = string.Empty;
}
