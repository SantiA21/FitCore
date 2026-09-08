using FitCore.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FitCore.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<AppDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = serviceProvider.GetService<ILogger<AppDbContext>>();

        // Si ya existen usuarios, no duplicar datos
        if (await userManager.Users.AnyAsync())
        {
            logger?.LogInformation("La base de datos ya contiene usuarios. Omitiendo DataSeeder.");
            return;
        }

        logger?.LogInformation("Sembrando datos de prueba iniciales...");

        // 1. Roles
        string[] roles = ["Admin", "Entrenador", "Cliente"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Planes
        var planMusculacion = new Plan
        {
            Nombre = "Pase Libre Musculación",
            Precio = 25000m,
            DuracionEnDias = 30,
            Activo = true
        };

        var planCrossfit = new Plan
        {
            Nombre = "CrossFit & Funcional",
            Precio = 32000m,
            DuracionEnDias = 30,
            Activo = true
        };

        var planTresDias = new Plan
        {
            Nombre = "Pase 3 Días x Semana",
            Precio = 18000m,
            DuracionEnDias = 30,
            Activo = true
        };

        var planAnual = new Plan
        {
            Nombre = "Plan Anual VIP",
            Precio = 220000m,
            DuracionEnDias = 365,
            Activo = true
        };

        context.Planes.AddRange(planMusculacion, planCrossfit, planTresDias, planAnual);
        await context.SaveChangesAsync();

        // 3. Usuarios de Sistema (Admin y Entrenador)
        var admin = new AppUser
        {
            UserName = "admin@fitcore.com",
            Email = "admin@fitcore.com",
            Nombre = "Administrador",
            Apellido = "FitCore",
            Telefono = "1133334444",
            Categoria = Categoria.Admin,
            Activo = true,
            EmailConfirmed = true,
            FechaAlta = DateTime.UtcNow.AddMonths(-6)
        };
        await userManager.CreateAsync(admin, "Admin123!");
        await userManager.AddToRoleAsync(admin, "Admin");

        var entrenador = new AppUser
        {
            UserName = "coach@fitcore.com",
            Email = "coach@fitcore.com",
            Nombre = "Carlos",
            Apellido = "Entrenador",
            Telefono = "1144445555",
            Categoria = Categoria.Entrenador,
            Activo = true,
            EmailConfirmed = true,
            FechaAlta = DateTime.UtcNow.AddMonths(-4)
        };
        await userManager.CreateAsync(entrenador, "Coach123!");
        await userManager.AddToRoleAsync(entrenador, "Entrenador");

        // 4. Clientes con distintos estados para probar el frontend
        var clientesData = new[]
        {
            new {
                Email = "juan.perez@example.com",
                Nombre = "Juan",
                Apellido = "Pérez",
                Telefono = "1145678901",
                Activo = true,
                DiasAlta = -60,
                Plan = (Plan?)planMusculacion,
                MembresiaEstado = "Activa",
                DiasFin = 20, // Vence en 20 días
                MetodoPago = "Efectivo",
                MontoPago = 25000m,
                AsistioHoy = true,
                HoraAsistencia = new TimeOnly(9, 15)
            },
            new {
                Email = "maria.gomez@example.com",
                Nombre = "María",
                Apellido = "Gómez",
                Telefono = "1156789012",
                Activo = true,
                DiasAlta = -45,
                Plan = planCrossfit,
                MembresiaEstado = "PorVencer",
                DiasFin = 2, // Vence en 2 días
                MetodoPago = "Transferencia",
                MontoPago = 32000m,
                AsistioHoy = true,
                HoraAsistencia = new TimeOnly(18, 0)
            },
            new {
                Email = "lucas.rodriguez@example.com",
                Nombre = "Lucas",
                Apellido = "Rodríguez",
                Telefono = "1167890123",
                Activo = true,
                DiasAlta = -90,
                Plan = planTresDias,
                MembresiaEstado = "Vencida",
                DiasFin = -5, // Venció hace 5 días
                MetodoPago = "Tarjeta de Débito",
                MontoPago = 18000m,
                AsistioHoy = false,
                HoraAsistencia = new TimeOnly(10, 0)
            },
            new {
                Email = "sofia.martinez@example.com",
                Nombre = "Sofía",
                Apellido = "Martínez",
                Telefono = "1178901234",
                Activo = true,
                DiasAlta = -30,
                Plan = planAnual,
                MembresiaEstado = "Activa",
                DiasFin = 300, // Plan Anual
                MetodoPago = "Tarjeta de Crédito",
                MontoPago = 220000m,
                AsistioHoy = true,
                HoraAsistencia = new TimeOnly(8, 30)
            },
            new {
                Email = "agustin.fernandez@example.com",
                Nombre = "Agustín",
                Apellido = "Fernández",
                Telefono = "1189012345",
                Activo = false, // Inactivo / Sin membresía
                DiasAlta = -120,
                Plan = (Plan?)null,
                MembresiaEstado = "Ninguna",
                DiasFin = 0,
                MetodoPago = "",
                MontoPago = 0m,
                AsistioHoy = false,
                HoraAsistencia = new TimeOnly(0, 0)
            },
            new {
                Email = "camila.diaz@example.com",
                Nombre = "Camila",
                Apellido = "Díaz",
                Telefono = "1190123456",
                Activo = true,
                DiasAlta = -15,
                Plan = planMusculacion,
                MembresiaEstado = "Activa",
                DiasFin = 15,
                MetodoPago = "Mercado Pago",
                MontoPago = 25000m,
                AsistioHoy = true,
                HoraAsistencia = new TimeOnly(19, 45)
            }
        };

        var hoy = DateTime.UtcNow;
        var hoyDateOnly = DateOnly.FromDateTime(hoy);

        foreach (var c in clientesData)
        {
            var clienteUser = new AppUser
            {
                UserName = c.Email,
                Email = c.Email,
                Nombre = c.Nombre,
                Apellido = c.Apellido,
                Telefono = c.Telefono,
                Categoria = Categoria.Cliente,
                Activo = c.Activo,
                EmailConfirmed = true,
                FechaAlta = hoy.AddDays(c.DiasAlta)
            };

            await userManager.CreateAsync(clienteUser, "Cliente123!");
            await userManager.AddToRoleAsync(clienteUser, "Cliente");

            if (c.Plan != null)
            {
                bool esActiva = c.MembresiaEstado != "Vencida";
                var fechaInicio = hoy.AddDays(c.DiasFin - c.Plan.DuracionEnDias);
                var fechaFin = hoy.AddDays(c.DiasFin);

                var membresia = new Membresia
                {
                    UserId = clienteUser.Id,
                    PlanId = c.Plan.Id,
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin,
                    Activa = esActiva
                };
                context.Membresias.Add(membresia);
                await context.SaveChangesAsync();

                // Pago asociado
                var pago = new Pago
                {
                    UserId = clienteUser.Id,
                    MembresiaId = membresia.Id,
                    Monto = c.MontoPago,
                    Fecha = fechaInicio.AddHours(2),
                    Metodo = c.MetodoPago,
                    PeriodoMes = fechaInicio.Month,
                    PeriodoAnio = fechaInicio.Year,
                    Nota = $"Cuota {fechaInicio:MM/yyyy} - {c.Plan.Nombre}"
                };
                context.Pagos.Add(pago);

                // Asistencias históricas en días previos
                context.Asistencias.Add(new Asistencia
                {
                    UserId = clienteUser.Id,
                    Fecha = hoyDateOnly.AddDays(-2),
                    HoraIngreso = new TimeOnly(18, 30)
                });
                context.Asistencias.Add(new Asistencia
                {
                    UserId = clienteUser.Id,
                    Fecha = hoyDateOnly.AddDays(-5),
                    HoraIngreso = new TimeOnly(19, 0)
                });

                // Asistencia de hoy si corresponde
                if (c.AsistioHoy)
                {
                    context.Asistencias.Add(new Asistencia
                    {
                        UserId = clienteUser.Id,
                        Fecha = hoyDateOnly,
                        HoraIngreso = c.HoraAsistencia
                    });
                }
            }
        }

        await context.SaveChangesAsync();
        logger?.LogInformation("DataSeeder completado con éxito.");
    }

    public static async Task ResetAndSeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<AppDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();

        context.Asistencias.RemoveRange(context.Asistencias);
        context.Pagos.RemoveRange(context.Pagos);
        context.Membresias.RemoveRange(context.Membresias);
        context.Planes.RemoveRange(context.Planes);
        await context.SaveChangesAsync();

        var users = await userManager.Users.ToListAsync();
        foreach (var user in users)
        {
            await userManager.DeleteAsync(user);
        }

        await SeedAsync(serviceProvider);
    }
}
