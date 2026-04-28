using FitCore.Application.DTOs;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Infrastructure.Services;

public class PagoService
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public PagoService(AppDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<PagoResponse> Crear(CrearPagoRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);

        if (user == null)
            throw new Exception("Usuario no encontrado");

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
            UserId = request.UserId,
            MembresiaId = request.MembresiaId,
            Monto = montoFinal,
            Metodo = request.Metodo,
            Nota = request.Nota,
            Fecha = DateTime.UtcNow
        };

        _context.Pagos.Add(pago);
        await _context.SaveChangesAsync();

        return new PagoResponse
        {
            Id = pago.Id,
            ClienteNombre = user.Nombre,
            Monto = pago.Monto,
            Metodo = pago.Metodo,
            Fecha = pago.Fecha
        };
    }

    public async Task<List<PagoResponse>> GetAll()
    {
        return await _context.Pagos
            .Include(p => p.User)
            .OrderByDescending(p => p.Fecha)
            .Select(p => new PagoResponse
            {
                Id = p.Id,
                ClienteNombre = p.User.Nombre,
                Monto = p.Monto,
                Metodo = p.Metodo,
                Fecha = p.Fecha,
                Nota = p.Nota
            })
            .ToListAsync();
    }
}
