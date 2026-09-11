using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace FitCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IWebHostEnvironment _env;

    public SeedController(IServiceProvider serviceProvider, IWebHostEnvironment env)
    {
        _serviceProvider = serviceProvider;
        _env = env;
    }

    [HttpPost]
    public async Task<IActionResult> Seed()
    {
        if (!_env.IsDevelopment())
            return Forbid();

        await DataSeeder.SeedAsync(_serviceProvider);
        return Ok(new { mensaje = "Datos de prueba sembrados correctamente." });
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset()
    {
        if (!_env.IsDevelopment())
            return Forbid();

        await DataSeeder.ResetAndSeedAsync(_serviceProvider);
        return Ok(new { mensaje = "Base de datos reiniciada y re-sembrada con datos de prueba." });
    }
}
