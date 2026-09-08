using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace FitCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;

    public SeedController(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    [HttpPost]
    public async Task<IActionResult> Seed()
    {
        await DataSeeder.SeedAsync(_serviceProvider);
        return Ok(new { mensaje = "Datos de prueba sembrados correctamente." });
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset()
    {
        await DataSeeder.ResetAndSeedAsync(_serviceProvider);
        return Ok(new { mensaje = "Base de datos reiniciada y re-sembrada con datos de prueba." });
    }
}
