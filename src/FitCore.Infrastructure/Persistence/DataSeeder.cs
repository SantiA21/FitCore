using FitCore.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FitCore.Infrastructure.Persistence;

public static class DataSeeder
{
    // Semilla fija -> la demo siempre se ve igual
    private const int Seed = 20250101;

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context     = serviceProvider.GetRequiredService<AppDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var logger      = serviceProvider.GetService<ILogger<AppDbContext>>();

        if (await userManager.Users.AnyAsync())
        {
            logger?.LogInformation("La base de datos ya contiene usuarios. Omitiendo DataSeeder.");
            return;
        }

        logger?.LogInformation("Sembrando datos de prueba (50 socios, 6 meses de historia)...");

        var rng    = new Random(Seed);
        var utcNow = DateTime.UtcNow;
        var today  = DateOnly.FromDateTime(utcNow);

        // 1. Roles
        foreach (var role in new[] { "Admin", "Entrenador", "Cliente" })
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));

        // 2. Planes (distribucion despareja a proposito)
        var planes = new[]
        {
            new Plan { Nombre = "Pase Libre Musculacion",  Precio = 25_000m,  DuracionEnDias = 30,  Activo = true },
            new Plan { Nombre = "CrossFit & Funcional",    Precio = 32_000m,  DuracionEnDias = 30,  Activo = true },
            new Plan { Nombre = "Pase 3 Dias x Semana",   Precio = 18_000m,  DuracionEnDias = 30,  Activo = true },
            new Plan { Nombre = "Plan Anual VIP",          Precio = 220_000m, DuracionEnDias = 365, Activo = true },
        };
        context.Planes.AddRange(planes);
        await context.SaveChangesAsync();

        // Pesos: Musculacion ~40%, Funcional ~25%, 3 dias ~25%, Anual ~10%
        double[] pesoPlanes = [0.40, 0.25, 0.25, 0.10];

        // 3. Admin y Entrenador
        var admin = new AppUser
        {
            UserName = "admin@fitcore.com", Email = "admin@fitcore.com",
            Nombre = "Administrador", Apellido = "FitCore",
            Telefono = "1133334444", Categoria = Categoria.Admin,
            Activo = true, EmailConfirmed = true,
            FechaAlta = utcNow.AddMonths(-12)
        };
        await userManager.CreateAsync(admin, "Admin123!");
        await userManager.AddToRoleAsync(admin, "Admin");

        var entrenador = new AppUser
        {
            UserName = "coach@fitcore.com", Email = "coach@fitcore.com",
            Nombre = "Carlos", Apellido = "Entrenador",
            Telefono = "1144445555", Categoria = Categoria.Entrenador,
            Activo = true, EmailConfirmed = true,
            FechaAlta = utcNow.AddMonths(-10)
        };
        await userManager.CreateAsync(entrenador, "Coach123!");
        await userManager.AddToRoleAsync(entrenador, "Entrenador");

        // 4. Nombres argentinos
        var nombres = new (string Nombre, string Apellido)[]
        {
            ("Juan","Perez"), ("Maria","Gomez"), ("Lucas","Rodriguez"), ("Sofia","Martinez"),
            ("Agustin","Fernandez"), ("Camila","Diaz"), ("Tomas","Lopez"), ("Valentina","Garcia"),
            ("Matias","Gonzalez"), ("Lucia","Sanchez"), ("Nicolas","Romero"), ("Florencia","Torres"),
            ("Ignacio","Vega"), ("Martina","Ruiz"), ("Santiago","Morales"), ("Catalina","Jimenez"),
            ("Franco","Castro"), ("Agustina","Herrera"), ("Joaquin","Ortiz"), ("Julieta","Medina"),
            ("Ezequiel","Alvarez"), ("Natalia","Vargas"), ("Facundo","Ramos"), ("Celeste","Reyes"),
            ("German","Flores"), ("Valeria","Cruz"), ("Pablo","Molina"), ("Rocio","Mendoza"),
            ("Diego","Rojas"), ("Antonella","Suarez"), ("Leandro","Guerrero"), ("Micaela","Rios"),
            ("Ramiro","Acosta"), ("Brenda","Ponce"), ("Hernan","Vera"), ("Carla","Silva"),
            ("Maximiliano","Serrano"), ("Debora","Pena"), ("Adrian","Navarro"), ("Stephanie","Cano"),
            ("Rodrigo","Delgado"), ("Vanesa","Cortes"), ("Emilio","Ibanez"), ("Paola","Mejia"),
            ("Sebastian","Cabrera"), ("Betina","Santos"), ("Claudio","Mendez"), ("Lorena","Aguilar"),
            ("Ariel","Espinoza"), ("Nadia","Campos"),
        };

        string[] metodosPago = ["Efectivo", "Transferencia", "Mercado Pago", "Tarjeta de Debito", "Tarjeta de Credito"];

        // 5. Cohortes
        // i  0-29: activos normales
        // i 30-39: por vencer en los proximos 7 dias
        // i 40-49: dados de baja hace 1-3 meses
        for (int i = 0; i < 50; i++)
        {
            var (nombre, apellido) = nombres[i];
            var email = string.Format("{0}.{1}{2}@example.com", nombre.ToLower(), apellido.ToLower(), i);

            var mesesAntiguedad = 6 + rng.Next(0, 3);
            var fechaAlta = utcNow.AddMonths(-mesesAntiguedad).AddDays(rng.Next(0, 15));

            bool activo = i < 40;
            var plan = ElegirPlan(rng, planes, pesoPlanes);

            var cliente = new AppUser
            {
                UserName = email, Email = email,
                Nombre = nombre, Apellido = apellido,
                Telefono = string.Format("11{0}", rng.Next(30000000, 99999999)),
                Categoria = Categoria.Cliente,
                Activo = activo,
                EmailConfirmed = true,
                FechaAlta = fechaAlta
            };
            await userManager.CreateAsync(cliente, "Cliente123!");
            await userManager.AddToRoleAsync(cliente, "Cliente");

            var metodo = metodosPago[rng.Next(metodosPago.Length)];

            for (int mes = 5; mes >= 0; mes--)
            {
                if (i >= 40 && mes <= 1) continue;

                var inicioPeriodo = utcNow.AddMonths(-mes - 1).Date;
                var finPeriodo    = inicioPeriodo.AddDays(plan.DuracionEnDias);

                if (i >= 30 && i < 40 && mes == 0)
                    finPeriodo = utcNow.AddDays(rng.Next(1, 8)).Date;

                bool esUltima = mes == 0;
                bool esActiva = esUltima && i < 40;

                var membresia = new Membresia
                {
                    UserId      = cliente.Id,
                    PlanId      = plan.Id,
                    FechaInicio = inicioPeriodo,
                    FechaFin    = finPeriodo,
                    Activa      = esActiva,
                    FechaBaja   = (!esActiva && i >= 40 && esUltima) ? finPeriodo : null,
                    MotivoBaja  = (!esActiva && i >= 40 && esUltima) ? "Baja voluntaria" : null,
                };
                context.Membresias.Add(membresia);
                await context.SaveChangesAsync();

                var variacion = 1m + (decimal)(rng.NextDouble() * 0.10 - 0.05);
                context.Pagos.Add(new Pago
                {
                    UserId      = cliente.Id,
                    MembresiaId = membresia.Id,
                    Monto       = Math.Round(plan.Precio * variacion, 0),
                    Fecha       = inicioPeriodo.AddHours(rng.Next(9, 20)),
                    Metodo      = metodo,
                    PeriodoMes  = inicioPeriodo.Month,
                    PeriodoAnio = inicioPeriodo.Year,
                    Nota        = string.Format("Cuota {0:MM/yyyy} - {1}", inicioPeriodo, plan.Nombre),
                });
            }

            // Asistencias (6 meses con curva horaria real)
            int diasPorSemana = rng.Next(2, 6);
            int diasHistoria  = (i >= 40) ? (180 - rng.Next(60, 90)) : 180;
            var inicioAsist   = today.AddDays(-diasHistoria);
            var yaAgregados   = new HashSet<DateOnly>();

            for (var dia = inicioAsist; dia <= today; dia = dia.AddDays(1))
            {
                if (dia.DayOfWeek == DayOfWeek.Sunday) continue;
                if (rng.NextDouble() > diasPorSemana / 6.0) continue;
                if (!yaAgregados.Add(dia)) continue;

                context.Asistencias.Add(new Asistencia
                {
                    UserId      = cliente.Id,
                    Fecha       = dia,
                    HoraIngreso = HorarioConCurva(rng),
                });
            }

            await context.SaveChangesAsync();
        }

        // 6. Movimientos financieros (6 meses de operativos)
        await SeedMovimientosAsync(context, admin.Id, rng, today);

        logger?.LogInformation("DataSeeder completado: 50 socios, 6 meses de historia.");
    }

    public static async Task ResetAndSeedAsync(IServiceProvider serviceProvider)
    {
        var context     = serviceProvider.GetRequiredService<AppDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();

        context.MovimientosFinancieros.RemoveRange(context.MovimientosFinancieros);
        context.Asistencias.RemoveRange(context.Asistencias);
        context.Pagos.RemoveRange(context.Pagos);
        context.Membresias.RemoveRange(context.Membresias);
        context.Planes.RemoveRange(context.Planes);
        await context.SaveChangesAsync();

        foreach (var user in await userManager.Users.ToListAsync())
            await userManager.DeleteAsync(user);

        await SeedAsync(serviceProvider);
    }

    private static Plan ElegirPlan(Random rng, Plan[] planes, double[] pesos)
    {
        double r = rng.NextDouble(), acum = 0;
        for (int i = 0; i < pesos.Length; i++)
        {
            acum += pesos[i];
            if (r < acum) return planes[i];
        }
        return planes[^1];
    }

    // 60% pico 18-21h, 25% manana 7-12h, 15% mediodia 12-17h
    private static TimeOnly HorarioConCurva(Random rng)
    {
        double r = rng.NextDouble();
        int hora = r < 0.60 ? 18 + rng.Next(0, 4)
                 : r < 0.85 ? 7  + rng.Next(0, 6)
                             : 12 + rng.Next(0, 6);
        return new TimeOnly(hora, rng.Next(0, 60));
    }

    private static decimal Variar(Random rng, decimal base_) =>
        Math.Round(base_ * (1m + (decimal)(rng.NextDouble() * 0.15 - 0.075)), 0);

    private static MovimientoFinanciero Mov(
        string adminId, TipoMovimiento tipo, string cat,
        string desc, decimal monto, DateOnly fecha) => new()
    {
        RegistradoPorUserId = adminId,
        Tipo        = tipo,
        Categoria   = cat,
        Descripcion = desc,
        Monto       = monto,
        Fecha       = fecha,
        CreadoEn    = DateTime.UtcNow,
    };

    private static async Task SeedMovimientosAsync(
        AppDbContext context, string adminId, Random rng, DateOnly today)
    {
        var lista = new List<MovimientoFinanciero>();
        for (int mes = 5; mes >= 0; mes--)
        {
            var fechaMes = today.AddMonths(-mes);
            var primero  = new DateOnly(fechaMes.Year, fechaMes.Month, 1);

            lista.Add(Mov(adminId, TipoMovimiento.Egreso,    "Alquiler",    "Alquiler local",                      185_000m,              primero.AddDays(4)));
            lista.Add(Mov(adminId, TipoMovimiento.Egreso,    "Servicios",   "Luz + Agua + Internet",               Variar(rng, 42_000m),  primero.AddDays(9)));
            lista.Add(Mov(adminId, TipoMovimiento.Egreso,    "Sueldos",     "Sueldo entrenador",                   Variar(rng, 320_000m), primero.AddDays(1)));
            lista.Add(Mov(adminId, TipoMovimiento.Egreso,    "Insumos",     "Productos de limpieza e higiene",     Variar(rng, 18_000m),  primero.AddDays(rng.Next(5, 20))));
            lista.Add(Mov(adminId, TipoMovimiento.Compra,    "Suplementos", "Stock suplementos para reventa",      Variar(rng, 55_000m),  primero.AddDays(rng.Next(3, 15))));

            if (mes % 2 == 0)
                lista.Add(Mov(adminId, TipoMovimiento.Inversion, "Equipamiento", "Mantenimiento / reposicion equipos", Variar(rng, 95_000m), primero.AddDays(rng.Next(10, 25))));
        }
        context.MovimientosFinancieros.AddRange(lista);
        await context.SaveChangesAsync();
    }
}
