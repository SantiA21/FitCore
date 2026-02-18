using System;
using System.Collections.Generic;
using System.Text;

namespace FitCore.Domain.Entities
{
    public class Cliente
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime FechaAlta { get; set; } = DateTime.UtcNow;
        public bool Activo { get; set; } = true;
    }
}
