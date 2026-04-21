using Microsoft.AspNetCore.Mvc;
using FitCore.Infrastructure.Services;

namespace FitCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MembresiasController : ControllerBase
    {
        private readonly MembresiaService _service;

        public MembresiasController(MembresiaService service)
        {
            _service = service;
        }

        // Crear membresía
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CrearMembresiaRequest request)
        {
            var result = await _service.Crear(request.ClienteId, request.PlanId);
            return Ok(result);
        }

        // Obtener membresías activas
        [HttpGet("activas")]
        public async Task<IActionResult> GetActivas()
        {
            var result = await _service.GetActivas();
            return Ok(result);
        }

        // Obtener membresías vencidas
        [HttpGet("vencidas")]
        public async Task<IActionResult> GetVencidas()
        {
            var result = await _service.GetVencidas();
            return Ok(result);
        }

        // Dashboard / métricas
        [HttpGet("metrics")]
        public async Task<IActionResult> GetMetrics()
        {
            var result = await _service.GetMetrics();
            return Ok(result);
        }

        [HttpGet("por-vencer")]
        public async Task<IActionResult> GetPorVencer([FromQuery] int dias = 3)
        {
            var result = await _service.GetPorVencer(dias);
            return Ok(result);
        }
    }

    // DTO para crear membresía
    public class CrearMembresiaRequest
    {
        public int ClienteId { get; set; }
        public int PlanId { get; set; }
    }
}