using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using FitCore.Application.DTOs;

namespace FitCore.Infrastructure.Services;

public class MembresiaService
{
    private readonly AppDbContext _context;

    public MembresiaService(AppDbContext context)
    {
        _context = context;
    }



    public async Task<MembresiaResponse> Crear(int clienteId, int planId)
    {
        var existeActiva = await _context.Membresias
    .AnyAsync(m => m.ClienteId == clienteId && m.FechaFin >= DateTime.UtcNow);

        if (existeActiva)
        {
            throw new Exception("El cliente ya tiene una membresía activa");
        }

        var cliente = await _context.Clientes.FindAsync(clienteId);
        var plan = await _context.Planes.FindAsync(planId);

        if (cliente == null || plan == null)
            throw new Exception("Cliente o Plan inválido");

        var hoy = DateTime.UtcNow;

        var membresia = new Membresia
        {
            ClienteId = clienteId,
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
            ClienteNombre = cliente.Nombre,
            PlanNombre = plan.Nombre,
            FechaInicio = membresia.FechaInicio,
            FechaFin = membresia.FechaFin
        };
    }

    public async Task<List<MembresiaResponse>> GetActivas()
    {
        return await _context.Membresias
            .Include(m => m.Cliente)
            .Include(m => m.Plan)
            .Where(m => m.FechaFin >= DateTime.UtcNow)
            .Select(m => new MembresiaResponse
            {
                Id = m.Id,
                ClienteNombre = m.Cliente.Nombre,
                PlanNombre = m.Plan.Nombre,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin
            })
            .ToListAsync();
    }

    public async Task<List<MembresiaResponse>> GetVencidas()
    {
        return await _context.Membresias
            .Include(m => m.Cliente)
            .Include(m => m.Plan)
            .Where(m => m.FechaFin < DateTime.UtcNow)
            .Select(m => new MembresiaResponse
            {
                Id = m.Id,
                ClienteNombre = m.Cliente.Nombre,
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
            .CountAsync(m => m.FechaFin >= DateTime.UtcNow);

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
            .Include(m => m.Cliente)
            .Include(m => m.Plan)
            .Where(m => m.FechaFin >= hoy && m.FechaFin <= limite)
            .Select(m => new MembresiaResponse
            {
                Id = m.Id,
                ClienteNombre = m.Cliente.Nombre,
                PlanNombre = m.Plan.Nombre,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin
            })
            .ToListAsync();
    }
}