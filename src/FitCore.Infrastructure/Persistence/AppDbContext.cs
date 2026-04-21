using FitCore.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Infrastructure.Persistence;
public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Plan> Planes { get; set; }
    public DbSet<Membresia> Membresias { get; set; }
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Asistencia> Asistencias { get; set; }
}