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

        var cleanNumber = dto.NumeroTarjeta.Replace(" ", "").Trim();
        if (cleanNumber.Length < 13 || cleanNumber.Length > 19 || !cleanNumber.All(char.IsDigit))
            return BadRequest(new { mensaje = "El número de tarjeta es inválido." });

        if (!IsValidLuhn(cleanNumber))
            return BadRequest(new { mensaje = "El número de tarjeta no es válido (no supera el algoritmo de verificación bancaria Luhn)." });

        if (string.IsNullOrWhiteSpace(dto.Titular))
            return BadRequest(new { mensaje = "El nombre del titular es obligatorio." });

        if (string.IsNullOrWhiteSpace(dto.Vencimiento))
            return BadRequest(new { mensaje = "La fecha de vencimiento es obligatoria." });

        var parts = dto.Vencimiento.Trim().Split('/');
        if (parts.Length != 2 || !int.TryParse(parts[0], out int mes) || !int.TryParse(parts[1], out int anio2Dig))
            return BadRequest(new { mensaje = "Formato de vencimiento inválido. Utilice MM/AA." });

        if (mes < 1 || mes > 12)
            return BadRequest(new { mensaje = "El mes de vencimiento debe estar entre 01 y 12." });

        int anioCompleto = 2000 + anio2Dig;
        var hoy = DateTime.UtcNow;
        if (anioCompleto < hoy.Year || (anioCompleto == hoy.Year && mes < hoy.Month))
            return BadRequest(new { mensaje = "La tarjeta se encuentra vencida." });

        if (string.IsNullOrWhiteSpace(dto.Cvv) || dto.Cvv.Length < 3)
            return BadRequest(new { mensaje = "El código de seguridad (CVV) es inválido." });

        var plan = await _context.Planes.FirstOrDefaultAsync(p => p.Id == dto.PlanId);
        if (plan is null) return NotFound(new { mensaje = "Plan no encontrado." });

        // Activamos membresía
        var membresiaRes = await _membresiaService.Crear(userId, plan.Id);

        var ultimos4 = cleanNumber.Length >= 4 ? cleanNumber[^4..] : cleanNumber;
        var franquicia = DetectarFranquicia(cleanNumber);

        var pago = new Pago
        {
            UserId = userId,
            MembresiaId = membresiaRes.Id,
            Monto = plan.Precio,
            Fecha = hoy,
            Metodo = $"Tarjeta ({franquicia})",
            Nota = $"{franquicia} terminada en {ultimos4} - Titular: {dto.Titular.Trim()} (DNI: {dto.Dni?.Trim()})",
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

    private static bool IsValidLuhn(string number)
    {
        if (string.IsNullOrWhiteSpace(number) || !number.All(char.IsDigit)) return false;
        if (number.Length < 13 || number.Length > 19) return false;

        int sum = 0;
        bool shouldDouble = false;

        for (int i = number.Length - 1; i >= 0; i--)
        {
            int digit = number[i] - '0';
            if (shouldDouble)
            {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }

        return sum % 10 == 0;
    }

    private static string DetectarFranquicia(string number)
    {
        if (number.StartsWith("4")) return "Visa";
        if (number.StartsWith("34") || number.StartsWith("37")) return "American Express";
        if (number.StartsWith("51") || number.StartsWith("52") || number.StartsWith("53") ||
            number.StartsWith("54") || number.StartsWith("55") ||
            (number.Length >= 4 && int.TryParse(number[..4], out int bin) && bin >= 2221 && bin <= 2720))
            return "Mastercard";
        if (number.StartsWith("589657") || number.StartsWith("6042") || number.StartsWith("6043")) return "Cabal";
        return "Tarjeta";
    }
}
