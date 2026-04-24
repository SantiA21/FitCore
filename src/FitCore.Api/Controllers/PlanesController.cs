using FitCore.Domain.Entities;
using FitCore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitCore.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PlanesController : ControllerBase
{
    private readonly AppDbContext _context;

    public PlanesController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/planes
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var planes = await _context.Planes.ToListAsync();
        return Ok(planes);
    }

    // GET api/planes/2
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var plan = await _context.Planes.FindAsync(id);
        if (plan is null) return NotFound();
        return Ok(plan);
    }

    // POST api/planes
    [HttpPost]
    public async Task<IActionResult> Create(Plan plan)
    {
        _context.Planes.Add(plan);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan);
    }

    // PUT api/planes/2
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Plan plan)
    {
        if (id != plan.Id) return BadRequest();
        _context.Entry(plan).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE api/planes/2
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await _context.Planes.FindAsync(id);
        if (plan is null) return NotFound();
        plan.Activo = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
