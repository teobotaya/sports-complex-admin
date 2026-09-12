using SportsComplex.Api.Common;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class DisponibilidadServiceTests
{
    private static Cancha NuevaCancha() => new() { Nombre = "Cancha 1", TipoSuperficie = "Sintetico", PrecioPorHora = 15000, Activa = true };

    [Fact]
    public async Task Reserva_Rechaza_Superposicion_Con_Otra_Reserva()
    {
        await using var db = TestDbFactory.Create();
        var cancha = NuevaCancha();
        db.Canchas.Add(cancha);
        db.Reservas.Add(new Reserva
        {
            Cancha = cancha,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            HoraFin = new TimeOnly(19, 0),
            EstadoReserva = "Confirmada",
            EstadoPago = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var servicio = new DisponibilidadService(db);

        await Assert.ThrowsAsync<ConflictException>(() =>
            servicio.ValidarDisponibilidadReservaAsync(cancha.IdCancha, new DateOnly(2026, 9, 20), new TimeOnly(18, 30), new TimeOnly(19, 30)));
    }

    [Fact]
    public async Task Reserva_Permite_Horario_Consecutivo_Sin_Superposicion()
    {
        await using var db = TestDbFactory.Create();
        var cancha = NuevaCancha();
        db.Canchas.Add(cancha);
        db.Reservas.Add(new Reserva
        {
            Cancha = cancha,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            HoraFin = new TimeOnly(19, 0),
            EstadoReserva = "Confirmada",
            EstadoPago = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var servicio = new DisponibilidadService(db);

        await servicio.ValidarDisponibilidadReservaAsync(cancha.IdCancha, new DateOnly(2026, 9, 20), new TimeOnly(19, 0), new TimeOnly(20, 0));
    }

    [Fact]
    public async Task Reserva_Rechaza_Superposicion_Con_Partido_Existente()
    {
        await using var db = TestDbFactory.Create();
        var cancha = NuevaCancha();
        db.Canchas.Add(cancha);
        var torneo = new Torneo { Nombre = "Torneo Test", FechaInicio = new DateOnly(2026, 9, 1), FechaFin = new DateOnly(2026, 10, 1), Estado = "Planificado" };
        var equipoA = new Equipo { Nombre = "Equipo A", Torneo = torneo };
        var equipoB = new Equipo { Nombre = "Equipo B", Torneo = torneo };
        db.Partidos.Add(new Partido
        {
            Cancha = cancha,
            Torneo = torneo,
            EquipoLocal = equipoA,
            EquipoVisitante = equipoB,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            Estado = "Programado"
        });
        await db.SaveChangesAsync();

        var servicio = new DisponibilidadService(db);

        await Assert.ThrowsAsync<ConflictException>(() =>
            servicio.ValidarDisponibilidadReservaAsync(cancha.IdCancha, new DateOnly(2026, 9, 20), new TimeOnly(17, 30), new TimeOnly(18, 30)));
    }

    [Fact]
    public async Task Partido_Rechaza_Superposicion_Con_Reserva_Existente()
    {
        await using var db = TestDbFactory.Create();
        var cancha = NuevaCancha();
        db.Canchas.Add(cancha);
        db.Reservas.Add(new Reserva
        {
            Cancha = cancha,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            HoraFin = new TimeOnly(19, 0),
            EstadoReserva = "Confirmada",
            EstadoPago = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var servicio = new DisponibilidadService(db);

        await Assert.ThrowsAsync<ConflictException>(() =>
            servicio.ValidarDisponibilidadPartidoAsync(cancha.IdCancha, new DateOnly(2026, 9, 20), new TimeOnly(18, 30)));
    }

    [Fact]
    public async Task Partido_Rechaza_Superposicion_Con_Otro_Partido()
    {
        await using var db = TestDbFactory.Create();
        var cancha = NuevaCancha();
        db.Canchas.Add(cancha);
        var torneo = new Torneo { Nombre = "Torneo Test", FechaInicio = new DateOnly(2026, 9, 1), FechaFin = new DateOnly(2026, 10, 1), Estado = "Planificado" };
        var equipoA = new Equipo { Nombre = "Equipo A", Torneo = torneo };
        var equipoB = new Equipo { Nombre = "Equipo B", Torneo = torneo };
        db.Partidos.Add(new Partido
        {
            Cancha = cancha,
            Torneo = torneo,
            EquipoLocal = equipoA,
            EquipoVisitante = equipoB,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            Estado = "Programado"
        });
        await db.SaveChangesAsync();

        var servicio = new DisponibilidadService(db);

        await Assert.ThrowsAsync<ConflictException>(() =>
            servicio.ValidarDisponibilidadPartidoAsync(cancha.IdCancha, new DateOnly(2026, 9, 20), new TimeOnly(18, 0)));
    }

    [Fact]
    public async Task Reserva_Cancelada_No_Bloquea_Disponibilidad()
    {
        await using var db = TestDbFactory.Create();
        var cancha = NuevaCancha();
        db.Canchas.Add(cancha);
        db.Reservas.Add(new Reserva
        {
            Cancha = cancha,
            Fecha = new DateOnly(2026, 9, 20),
            HoraInicio = new TimeOnly(18, 0),
            HoraFin = new TimeOnly(19, 0),
            EstadoReserva = "Cancelada",
            EstadoPago = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var servicio = new DisponibilidadService(db);

        await servicio.ValidarDisponibilidadReservaAsync(cancha.IdCancha, new DateOnly(2026, 9, 20), new TimeOnly(18, 0), new TimeOnly(19, 0));
    }
}
