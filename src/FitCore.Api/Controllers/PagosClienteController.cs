using System.Security.Claims;
using FitCore.Application.DTOs;
using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using FitCore.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Api.Controllers;

[ApiController]
[Route("api/pagos-cliente")]
[Authorize]
public class PagosClienteController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly MembresiaService _membresiaService;
    private readonly MercadoPagoService _mercadoPagoService;
    private readonly ILogger<PagosClienteController> _logger;

    public PagosClienteController(
        AppDbContext context,
        UserManager<AppUser> userManager,
        MembresiaService membresiaService,
        MercadoPagoService mercadoPagoService,
        ILogger<PagosClienteController> logger)
    {
        _context = context;
        _userManager = userManager;
        _membresiaService = membresiaService;
        _mercadoPagoService = mercadoPagoService;
        _logger = logger;
    }

    // POST api/pagos-cliente/iniciar-mercadopago
    [HttpPost("iniciar-mercadopago")]
    public async Task<IActionResult> IniciarMercadoPago([FromBody] IniciarMercadoPagoDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var plan = await _context.Planes.FirstOrDefaultAsync(p => p.Id == dto.PlanId && p.Activo);
        if (plan is null) return NotFound(new { mensaje = "Plan no encontrado o inactivo." });

        var preference = await _mercadoPagoService.CrearPreferencia(
            user,
            plan,
            dto.BackUrlSuccess,
            dto.BackUrlFailure,
            dto.BackUrlPending
        );

        return Ok(preference);
    }

    // POST api/pagos-cliente/confirmar-mercadopago
    [HttpPost("confirmar-mercadopago")]
    public async Task<IActionResult> ConfirmarMercadoPago([FromBody] ConfirmarMercadoPagoDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var plan = await _context.Planes.FirstOrDefaultAsync(p => p.Id == dto.PlanId);
        if (plan is null) return NotFound(new { mensaje = "Plan no encontrado." });

        // Activamos o renovamos la membresía
        var membresiaRes = await _membresiaService.Crear(userId, plan.Id);

        var hoy = DateTime.UtcNow;
        var notaPago = string.IsNullOrWhiteSpace(dto.PaymentId)
            ? $"Pago online Mercado Pago - Plan {plan.Nombre}"
            : $"Pago online Mercado Pago (ID: {dto.PaymentId}) - Plan {plan.Nombre}";

        var pago = new Pago
        {
            UserId = userId,
            MembresiaId = membresiaRes.Id,
            Monto = plan.Precio,
            Fecha = hoy,
            Metodo = "Mercado Pago",
            Nota = notaPago,
            PeriodoMes = hoy.Month,
            PeriodoAnio = hoy.Year,
        };

        _context.Pagos.Add(pago);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "¡Pago procesado con éxito!",
            membresia = membresiaRes,
            pagoId = pago.Id
        });
    }

    // POST api/pagos-cliente/confirmar-tarjeta
    [HttpPost("confirmar-tarjeta")]
    public async Task<IActionResult> ConfirmarTarjeta([FromBody] ConfirmarPagoTarjetaDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.NumeroTarjeta) || dto.NumeroTarjeta.Replace(" ", "").Length < 15)
            return BadRequest(new { mensaje = "El número de tarjeta es inválido." });

        if (string.IsNullOrWhiteSpace(dto.Titular))
            return BadRequest(new { mensaje = "El nombre del titular es obligatorio." });

        if (string.IsNullOrWhiteSpace(dto.Vencimiento))
            return BadRequest(new { mensaje = "La fecha de vencimiento es obligatoria." });

        if (string.IsNullOrWhiteSpace(dto.Cvv) || dto.Cvv.Length < 3)
            return BadRequest(new { mensaje = "El código de seguridad (CVV) es inválido." });

        var plan = await _context.Planes.FirstOrDefaultAsync(p => p.Id == dto.PlanId);
        if (plan is null) return NotFound(new { mensaje = "Plan no encontrado." });

        // Activamos membresía
        var membresiaRes = await _membresiaService.Crear(userId, plan.Id);

        var hoy = DateTime.UtcNow;
        var cleanNumber = dto.NumeroTarjeta.Replace(" ", "");
        var ultimos4 = cleanNumber.Length >= 4 ? cleanNumber[^4..] : cleanNumber;

        var pago = new Pago
        {
            UserId = userId,
            MembresiaId = membresiaRes.Id,
            Monto = plan.Precio,
            Fecha = hoy,
            Metodo = "Tarjeta de Crédito",
            Nota = $"Tarjeta terminada en {ultimos4} - Titular: {dto.Titular.Trim()} (DNI: {dto.Dni?.Trim()})",
            PeriodoMes = hoy.Month,
            PeriodoAnio = hoy.Year,
        };

        _context.Pagos.Add(pago);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "¡Pago con tarjeta aprobado y membresía activada!",
            membresia = membresiaRes,
            pagoId = pago.Id
        });
    }

    // POST api/pagos-cliente/confirmar-transferencia
    [HttpPost("confirmar-transferencia")]
    public async Task<IActionResult> ConfirmarTransferencia([FromBody] ConfirmarPagoTransferenciaDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.NumeroComprobante))
            return BadRequest(new { mensaje = "El número o código de comprobante de transferencia es obligatorio." });

        var plan = await _context.Planes.FirstOrDefaultAsync(p => p.Id == dto.PlanId);
        if (plan is null) return NotFound(new { mensaje = "Plan no encontrado." });

        // Activamos membresía
        var membresiaRes = await _membresiaService.Crear(userId, plan.Id);

        var hoy = DateTime.UtcNow;
        var obs = string.IsNullOrWhiteSpace(dto.Observaciones) ? "" : $" ({dto.Observaciones.Trim()})";
        var nota = $"Comprobante Transferencia: {dto.NumeroComprobante.Trim()}{obs} - Plan: {plan.Nombre}";

        var pago = new Pago
        {
            UserId = userId,
            MembresiaId = membresiaRes.Id,
            Monto = plan.Precio,
            Fecha = hoy,
            Metodo = "Transferencia",
            Nota = nota,
            PeriodoMes = hoy.Month,
            PeriodoAnio = hoy.Year,
        };

        _context.Pagos.Add(pago);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "¡Transferencia registrada y membresía activada con éxito!",
            membresia = membresiaRes,
            pagoId = pago.Id
        });
    }

    // GET api/pagos-cliente/mis-pagos
    [HttpGet("mis-pagos")]
    public async Task<IActionResult> MisPagos()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var pagos = await _context.Pagos
            .Include(p => p.Membresia)
                .ThenInclude(m => m!.Plan)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.Fecha)
            .ToListAsync();

        var dtos = pagos.Select(p => new PagoClienteHistorialDto(
            Id: p.Id,
            MembresiaId: p.MembresiaId,
            PlanNombre: p.Membresia?.Plan?.Nombre ?? "Plan General",
            Monto: p.Monto,
            MontoFormatted: $"${p.Monto:N0}".Replace(",", "."),
            Fecha: p.Fecha,
            FechaFormatted: p.Fecha.ToLocalTime().ToString("dd/MM/yyyy HH:mm"),
            Metodo: p.Metodo,
            Nota: p.Nota,
            PeriodoMes: p.PeriodoMes,
            PeriodoAnio: p.PeriodoAnio
        ));

        return Ok(dtos);
    }
}
