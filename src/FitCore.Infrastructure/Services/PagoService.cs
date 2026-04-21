using FitCore.Application.DTOs;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Infrastructure.Services;

public class PagoService
{
    private readonly AppDbContext _context;

    public PagoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagoResponse> Crear(CrearPagoRequest request)
    {
        var cliente = await _context.Clientes.FindAsync(request.ClienteId);

        if (cliente == null)
            throw new Exception("Cliente no encontrado");

        decimal montoFinal;

        if (request.Monto.HasValue && request.Monto > 0)
        {
            montoFinal = request.Monto.Value;
        }
        else
        {
            if (request.MembresiaId == null)
                throw new Exception("Debe especificar un monto o una membresía");

            var membresia = await _context.Membresias
                .Include(m => m.Plan)
                .FirstOrDefaultAsync(m => m.Id == request.MembresiaId);

            if (membresia == null)
                throw new Exception("Membresía no encontrada");

            montoFinal = membresia.Plan.Precio;
        }

        var pago = new Pago
        {
            ClienteId = request.ClienteId,
            MembresiaId = request.MembresiaId,
            Monto = montoFinal,
            Metodo = request.Metodo,
            Fecha = DateTime.UtcNow
        };

        _context.Pagos.Add(pago);
        await _context.SaveChangesAsync();

        return new PagoResponse
        {
            Id = pago.Id,
            ClienteNombre = cliente.Nombre,
            Monto = pago.Monto,
            Metodo = pago.Metodo,
            Fecha = pago.Fecha
        };
    }

    public async Task<List<PagoResponse>> GetAll()
    {
        return await _context.Pagos
            .Include(p => p.Cliente)
            .Select(p => new PagoResponse
            {
                Id = p.Id,
                ClienteNombre = p.Cliente.Nombre,
                Monto = p.Monto,
                Metodo = p.Metodo,
                Fecha = p.Fecha
            })
            .ToListAsync();
    }
}