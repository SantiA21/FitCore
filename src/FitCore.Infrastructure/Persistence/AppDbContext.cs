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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // AppUser → Plan
        builder.Entity<AppUser>()
            .HasOne(u => u.Plan)
            .WithMany()
            .HasForeignKey(u => u.PlanId)
            .OnDelete(DeleteBehavior.SetNull);

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
    }
}
