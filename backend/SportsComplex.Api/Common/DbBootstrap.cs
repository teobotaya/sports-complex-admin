using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Data;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Common;

/// <summary>Crea el usuario administrador inicial (con contraseña hasheada) si el sistema está vacío.
/// Necesario porque sin al menos un usuario nadie podría iniciar sesión por primera vez.</summary>
public static class DbBootstrap
{
    public static async Task EnsureAdminUsuarioAsync(IServiceProvider services, IConfiguration config)
    {
        var db = services.GetRequiredService<AppDbContext>();
        if (await db.Usuarios.AnyAsync()) return;

        var username = config["BootstrapAdmin:Username"] ?? "admin";
        var password = config["BootstrapAdmin:Password"] ?? "Admin123!";

        var usuario = new Usuario
        {
            NombreCompleto = "Administrador",
            Username = username,
            Rol = "administrador",
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        var hasher = new PasswordHasher<Usuario>();
        usuario.PasswordHash = hasher.HashPassword(usuario, password);

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
    }
}
