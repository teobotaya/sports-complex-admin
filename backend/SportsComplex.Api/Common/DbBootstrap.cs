using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Data;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Common;

/// <summary>Crea el usuario administrador inicial (con contraseña hasheada) si el sistema está vacío.
/// Necesario porque sin al menos un usuario nadie podría iniciar sesión por primera vez.</summary>
public static class DbBootstrap
{
    /// <summary>
    /// Crea o actualiza la estructura de la base aplicando las migraciones de EF Core, así el sistema
    /// se instala solo la primera vez que arranca. Si la base ya fue creada a mano con database/schema.sql
    /// (tiene tablas pero no historial de migraciones) no se toca, para no intentar crear tablas repetidas.
    /// </summary>
    public static async Task EnsureDatabaseAsync(IServiceProvider services, ILogger logger)
    {
        var db = services.GetRequiredService<AppDbContext>();
        if (!db.Database.IsRelational()) return;

        var aplicadas = await db.Database.GetAppliedMigrationsAsync();
        if (!aplicadas.Any() && await db.Database.CanConnectAsync())
        {
            var tablas = await db.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Usuario'")
                .SingleAsync();
            if (tablas > 0)
            {
                logger.LogWarning("La base ya tiene tablas creadas sin migraciones (database/schema.sql): no se aplican migraciones.");
                return;
            }
        }
        await db.Database.MigrateAsync();
    }

    public static async Task EnsureAdminUsuarioAsync(IServiceProvider services, IConfiguration config)
    {
        var db = services.GetRequiredService<AppDbContext>();
        if (await db.Usuarios.AnyAsync()) return;

        var username = config["BootstrapAdmin:Username"] ?? "admin";
        var password = config["BootstrapAdmin:Password"]
            ?? throw new InvalidOperationException(
                "Falta BootstrapAdmin:Password. Configuralo en appsettings.json o como variable de entorno; " +
                "no existe una contraseña por defecto.");

        var usuario = new Usuario
        {
            NombreCompleto = "Administrador",
            Username = username,
            Rol = "administrador",
            Activo = true,
            FechaCreacion = Reloj.Ahora
        };
        var hasher = new PasswordHasher<Usuario>();
        usuario.PasswordHash = hasher.HashPassword(usuario, password);

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
    }
}
