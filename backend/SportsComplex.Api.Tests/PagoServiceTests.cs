using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class PagoServiceTests
{
    private static async Task<(Data.AppDbContext db, Reserva reserva)> ConReservaAsync(decimal precioPorHora = 15000)
    {
        var db = TestDbFactory.Create();
        var cancha = new Cancha { Nombre = "Cancha 1", PrecioPorHora = precioPorHora, Activa = true };
        var reserva = new Reserva
        {
            Cancha = cancha,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            HoraFin = new TimeOnly(19, 0),
            EstadoReserva = "Confirmada",
            EstadoPago = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        };
        db.Reservas.Add(reserva);
        await db.SaveChangesAsync();
        return (db, reserva);
    }

    [Fact]
    public async Task Rechaza_Monto_Menor_O_Igual_A_Cero()
    {
        var (db, reserva) = await ConReservaAsync();
        var servicio = new PagoService(db);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.RegistrarAsync(new CrearPagoDto(reserva.IdReserva, 0, "Efectivo", null)));
    }

    [Fact]
    public async Task Rechaza_Pago_Sobre_Reserva_Cancelada()
    {
        var (db, reserva) = await ConReservaAsync();
        reserva.EstadoReserva = "Cancelada";
        await db.SaveChangesAsync();
        var servicio = new PagoService(db);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.RegistrarAsync(new CrearPagoDto(reserva.IdReserva, 5000, "Efectivo", null)));
    }

    [Fact]
    public async Task Pago_Parcial_Deja_Estado_Parcialmente_Abonado()
    {
        var (db, reserva) = await ConReservaAsync(15000);
        var servicio = new PagoService(db);

        await servicio.RegistrarAsync(new CrearPagoDto(reserva.IdReserva, 5000, "Efectivo", null));

        var actualizada = await db.Reservas.FindAsync(reserva.IdReserva);
        Assert.Equal("Parcialmente abonado", actualizada!.EstadoPago);
    }

    [Fact]
    public async Task Pago_Total_Deja_Estado_Abonado()
    {
        var (db, reserva) = await ConReservaAsync(15000);
        var servicio = new PagoService(db);

        await servicio.RegistrarAsync(new CrearPagoDto(reserva.IdReserva, 15000, "Efectivo", null));

        var actualizada = await db.Reservas.FindAsync(reserva.IdReserva);
        Assert.Equal("Abonado", actualizada!.EstadoPago);
    }
}
