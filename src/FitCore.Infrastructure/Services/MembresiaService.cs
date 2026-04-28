using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FitCore.Application.DTOs;

namespace FitCore.Infrastructure.Services;

public class MembresiaService
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public MembresiaService(AppDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<MembresiaResponse> Crear(string userId, int planId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        var plan = await _context.Planes.FindAsync(planId);

        if (user == null || plan == null)
            throw new Exception("Usuario o Plan inválido");

        // Si tiene una membresía activa, la desactivamos antes de crear la nueva
        // Esto permite renovar o cambiar de plan en cualquier momento
        var membresiaActiva = await _context.Membresias
            .Where(m => m.UserId == userId && m.FechaFin >= DateTime.UtcNow && m.Activa)
            .FirstOrDefaultAsync();

        if (membresiaActiva is not null)
        {
            membresiaActiva.Activa = false;
            membresiaActiva.FechaFin = DateTime.UtcNow; // la cerramos en el momento
        }

        var hoy = DateTime.UtcNow;

        var membresia = new Membresia
        {
            UserId = userId,
            PlanId = planId,
            FechaInicio = hoy,
            FechaFin = hoy.AddDays(plan.DuracionEnDias),
            Activa = true
        };

        _context.Membresias.Add(membresia);
        await _context.SaveChangesAsync();

        return new MembresiaResponse
        {
            Id = membresia.Id,
            ClienteNombre = $"{user.Nombre} {user.Apellido}",
            PlanNombre = plan.Nombre,
            FechaInicio = membresia.FechaInicio,
            FechaFin = membresia.FechaFin
        };
    }

    public async Task<List<MembresiaResponse>> GetActivas()
    {
        return await _context.Membresias
            .Include(m => m.User)
            .Include(m => m.Plan)
            .Where(m => m.Activa && m.FechaFin >= DateTime.UtcNow)
            .Select(m => new MembresiaResponse
            {
                Id = m.Id,
                ClienteNombre = $"{m.User.Nombre} {m.User.Apellido}",
                PlanNombre = m.Plan.Nombre,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin
            })
            .ToListAsync();
    }

    public async Task<List<MembresiaResponse>> GetVencidas()
    {
        return await _context.Membresias
            .Include(m => m.User)
            .Include(m => m.Plan)
            .Where(m => m.FechaFin < DateTime.UtcNow)
            .Select(m => new MembresiaResponse
            {
                Id = m.Id,
                ClienteNombre = $"{m.User.Nombre} {m.User.Apellido}",
                PlanNombre = m.Plan.Nombre,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin
            })
            .ToListAsync();
    }

    public async Task<object> GetMetrics()
    {
        var total = await _context.Membresias.CountAsync();
        var activas = await _context.Membresias
            .CountAsync(m => m.Activa && m.FechaFin >= DateTime.UtcNow);

        return new
        {
            Total = total,
            Activas = activas,
            Vencidas = total - activas
        };
    }

    public async Task<List<MembresiaResponse>> GetPorVencer(int dias)
    {
        var hoy = DateTime.UtcNow;
        var limite = hoy.AddDays(dias);

        return await _context.Membresias
            .Include(m => m.User)
            .Include(m => m.Plan)
            .Where(m => m.Activa && m.FechaFin >= hoy && m.FechaFin <= limite)
            .Select(m => new MembresiaResponse
            {
                Id = m.Id,
                ClienteNombre = $"{m.User.Nombre} {m.User.Apellido}",
                PlanNombre = m.Plan.Nombre,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin
            })
            .ToListAsync();
    }

    public async Task<List<MembresiaResponse>> GetByUserId(string userId)
    {
        return await _context.Membresias
            .Include(m => m.Plan)
            .Where(m => m.UserId == userId && m.Activa)
            .OrderByDescending(m => m.FechaInicio)
            .Select(m => new MembresiaResponse
            {
                Id = m.Id,
                ClienteNombre = string.Empty,
                PlanNombre = m.Plan.Nombre,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin
            })
            .ToListAsync();
    }
}
