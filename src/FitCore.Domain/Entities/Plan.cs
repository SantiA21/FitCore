public class Plan
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int DuracionEnDias { get; set; }
    public bool Activo { get; set; } = true;

    public Guid GymId { get; set; } // clave para SaaS
}