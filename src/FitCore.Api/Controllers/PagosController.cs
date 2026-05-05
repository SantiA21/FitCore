using FitCore.Application.DTOs;
using FitCore.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitCore.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PagosController : ControllerBase
{
    private readonly PagoService _service;

    public PagosController(PagoService service)
    {
        _service = service;
    }

    // POST api/pagos
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearPagoRequest request)
    {
        try
        {
            var result = await _service.Crear(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET api/pagos
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAll());
    }

    // GET api/pagos/estado-cuenta
    [HttpGet("estado-cuenta")]
    public async Task<IActionResult> GetEstadoCuenta()
    {
        try
        {
            return Ok(await _service.GetEstadoCuenta());
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}