using SportsComplex.Api.Common;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class UsuarioServiceTests
{
    private static Usuario NuevoUsuario(string username) => new()
    {
        NombreCompleto = "Usuario Test",
        Username = username,
        PasswordHash = "hash",
        Rol = "empleado",
        Activo = true,
        FechaCreacion = DateTime.UtcNow
    };

    [Fact]
    public async Task Rechaza_Eliminar_La_Propia_Cuenta()
    {
        await using var db = TestDbFactory.Create();
        var usuario = NuevoUsuario("empleado1");
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
        var servicio = new UsuarioService(db, new JwtTokenService(Microsoft.Extensions.Options.Options.Create(new JwtOptions { Issuer = "t", Audience = "t", Key = "clave-de-prueba-suficientemente-larga-1234567890", ExpirationMinutes = 60 })));

        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.DeleteAsync(usuario.IdUsuario, usuario.IdUsuario));
    }

    [Fact]
    public async Task Rechaza_Eliminar_Usuario_Con_Reservas_Registradas()
    {
        await using var db = TestDbFactory.Create();
        var usuario = NuevoUsuario("empleado2");
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
        db.Reservas.Add(new Reserva
        {
            Cancha = new Cancha { Nombre = "Cancha 1", PrecioPorHora = 15000, Activa = true },
            IdUsuario = usuario.IdUsuario,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            HoraFin = new TimeOnly(19, 0),
            EstadoReserva = "Confirmada",
            EstadoPago = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var servicio = new UsuarioService(db, new JwtTokenService(Microsoft.Extensions.Options.Options.Create(new JwtOptions { Issuer = "t", Audience = "t", Key = "clave-de-prueba-suficientemente-larga-1234567890", ExpirationMinutes = 60 })));

        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.DeleteAsync(usuario.IdUsuario, 999));
    }

    [Fact]
    public async Task Elimina_Usuario_Sin_Historial_Y_Sus_Notificaciones()
    {
        await using var db = TestDbFactory.Create();
        var usuario = NuevoUsuario("empleado3");
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
        db.Notificaciones.Add(new Notificacion { IdUsuario = usuario.IdUsuario, Tipo = "pago", Mensaje = "test", Leida = false, FechaCreacion = DateTime.UtcNow });
        await db.SaveChangesAsync();
        var servicio = new UsuarioService(db, new JwtTokenService(Microsoft.Extensions.Options.Options.Create(new JwtOptions { Issuer = "t", Audience = "t", Key = "clave-de-prueba-suficientemente-larga-1234567890", ExpirationMinutes = 60 })));

        await servicio.DeleteAsync(usuario.IdUsuario, 999);

        Assert.Null(await db.Usuarios.FindAsync(usuario.IdUsuario));
        Assert.Empty(db.Notificaciones);
    }
}
