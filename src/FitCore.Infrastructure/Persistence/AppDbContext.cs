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

    public DbSet<Plan> Planes { get; set; }
    public DbSet<Membresia> Membresias { get; set; }
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Asistencia> Asistencias { get; set; }
    public DbSet<MedicionCorporal> MedicionesCorporales { get; set; }
    public DbSet<RutinaDia> RutinasDia { get; set; }
    public DbSet<MovimientoFinanciero> MovimientosFinancieros { get; set; }
    public DbSet<CompraFutura> ComprasFuturas { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Membresia → AppUser
        builder.Entity<Membresia>()
            .HasOne(m => m.User)
            .WithMany(u => u.Membresias)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Pago → AppUser
        builder.Entity<Pago>()
            .HasOne(p => p.User)
            .WithMany(u => u.Pagos)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Asistencia → AppUser
        builder.Entity<Asistencia>()
            .HasOne(a => a.User)
            .WithMany(u => u.Asistencias)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // MedicionCorporal → AppUser
        builder.Entity<MedicionCorporal>()
            .HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // RutinaDia → AppUser (un registro por día de semana como máximo)
        builder.Entity<RutinaDia>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RutinaDia>()
            .HasIndex(r => new { r.UserId, r.DiaSemana })
            .IsUnique();
    }
}
