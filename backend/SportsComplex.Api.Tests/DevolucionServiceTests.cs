using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class DevolucionServiceTests
{
    private static async Task<(Data.AppDbContext db, Cancelacion cancelacion)> ConCancelacionYPagoAsync(decimal montoPagado = 10000)
    {
        var db = TestDbFactory.Create();
        var reserva = new Reserva
        {
            Cancha = new Cancha { Nombre = "Cancha 1", PrecioPorHora = 15000, Activa = true },
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            HoraFin = new TimeOnly(19, 0),
            EstadoReserva = "Cancelada",
            EstadoPago = "Parcialmente abonado",
            FechaCreacion = DateTime.UtcNow
        };
        db.Reservas.Add(reserva);
        await db.SaveChangesAsync();

        if (montoPagado > 0)
        {
            db.Pagos.Add(new Pago { IdReserva = reserva.IdReserva, Monto = montoPagado, MetodoPago = "Tarjeta", FechaPago = DateOnly.FromDateTime(DateTime.UtcNow) });
        }
        var cancelacion = new Cancelacion { IdReserva = reserva.IdReserva, IdUsuario = 1, FechaCancelacion = DateTime.UtcNow };
        db.Cancelaciones.Add(cancelacion);
        await db.SaveChangesAsync();
        return (db, cancelacion);
    }

    [Fact]
    public async Task Rechaza_Devolucion_Mayor_Al_Monto_Pagado()
    {
        var (db, cancelacion) = await ConCancelacionYPagoAsync(10000);
        var servicio = new DevolucionService(db);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.RegistrarAsync(new CrearDevolucionDto(cancelacion.IdCancelacion, 15000, "Efectivo", null), 1));
    }

    [Fact]
    public async Task Rechaza_Devolucion_Sin_Pagos_Previos()
    {
        var (db, cancelacion) = await ConCancelacionYPagoAsync(0);
        var servicio = new DevolucionService(db);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.RegistrarAsync(new CrearDevolucionDto(cancelacion.IdCancelacion, 5000, "Efectivo", null), 1));
    }

    [Fact]
    public async Task Rechaza_Segunda_Devolucion_Sobre_La_Misma_Cancelacion()
    {
        var (db, cancelacion) = await ConCancelacionYPagoAsync(10000);
        var servicio = new DevolucionService(db);
        await servicio.RegistrarAsync(new CrearDevolucionDto(cancelacion.IdCancelacion, 10000, "Efectivo", null), 1);

        await Assert.ThrowsAsync<ConflictException>(() =>
            servicio.RegistrarAsync(new CrearDevolucionDto(cancelacion.IdCancelacion, 5000, "Tarjeta", null), 1));
    }

    [Fact]
    public async Task Conserva_El_Metodo_Elegido_Al_Registrar()
    {
        var (db, cancelacion) = await ConCancelacionYPagoAsync(10000);
        var servicio = new DevolucionService(db);

        var devolucion = await servicio.RegistrarAsync(new CrearDevolucionDto(cancelacion.IdCancelacion, 10000, "Tarjeta", null), 1);

        Assert.Equal("Tarjeta", devolucion.Metodo);
    }
}
