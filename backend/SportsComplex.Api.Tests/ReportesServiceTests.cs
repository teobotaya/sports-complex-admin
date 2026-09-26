using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class ReportesServiceTests
{
    [Fact]
    public async Task Ocupacion_Informa_Horas_Usadas_Y_Disponibles_Incluso_Sin_Reservas()
    {
        await using var db = TestDbFactory.Create();
        var c1 = new Cancha { Nombre = "Cancha 1", TipoSuperficie = "Sintetico", PrecioPorHora = 15000, Activa = true };
        var c2 = new Cancha { Nombre = "Cancha 2", TipoSuperficie = "Sintetico", PrecioPorHora = 15000, Activa = true };
        db.Canchas.AddRange(c1, c2);
        db.Reservas.Add(new Reserva { Cancha = c1, Fecha = new DateOnly(2026, 10, 1), HoraInicio = new TimeOnly(18, 0), HoraFin = new TimeOnly(20, 0), EstadoReserva = "Confirmada", EstadoPago = "Pendiente", FechaCreacion = DateTime.UtcNow });
        db.Reservas.Add(new Reserva { Cancha = c1, Fecha = new DateOnly(2026, 10, 2), HoraInicio = new TimeOnly(18, 0), HoraFin = new TimeOnly(19, 0), EstadoReserva = "Cancelada", EstadoPago = "Pendiente", FechaCreacion = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var servicio = new ReportesService(db);
        var r = await servicio.GetOcupacionAsync(new DateOnly(2026, 10, 1), new DateOnly(2026, 10, 2));

        Assert.Equal(2, r.Count);                       // también la cancha sin reservas
        var uno = r.Single(x => x.Cancha == "Cancha 1");
        Assert.Equal(2, uno.HorasUtilizadas);           // la cancelada no cuenta
        Assert.Equal(2 * 14 - 2, uno.HorasDisponibles); // 2 días × 14 h (08 a 22) − 2 usadas
        Assert.Equal(28, r.Single(x => x.Cancha == "Cancha 2").HorasDisponibles);
    }
}
