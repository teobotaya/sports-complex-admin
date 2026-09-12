using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class PartidoServiceTests
{
    private static async Task<(Data.AppDbContext db, Torneo torneo, Equipo a, Equipo b, Cancha cancha)> ConTorneoYEquiposAsync()
    {
        var db = TestDbFactory.Create();
        var torneo = new Torneo { Nombre = "Torneo Test", FechaInicio = new DateOnly(2026, 9, 1), FechaFin = new DateOnly(2026, 10, 1), Estado = "Planificado" };
        var equipoA = new Equipo { Nombre = "Equipo A", Torneo = torneo };
        var equipoB = new Equipo { Nombre = "Equipo B", Torneo = torneo };
        var cancha = new Cancha { Nombre = "Cancha 1", PrecioPorHora = 15000, Activa = true };
        db.Torneos.Add(torneo);
        db.Equipos.AddRange(equipoA, equipoB);
        db.Canchas.Add(cancha);
        await db.SaveChangesAsync();
        return (db, torneo, equipoA, equipoB, cancha);
    }

    [Fact]
    public async Task Rechaza_Equipo_Contra_Si_Mismo()
    {
        var (db, torneo, equipoA, _, cancha) = await ConTorneoYEquiposAsync();
        var servicio = new PartidoService(db, new DisponibilidadService(db));

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.ProgramarAsync(torneo.IdTorneo, new CrearPartidoDto(equipoA.IdEquipo, equipoA.IdEquipo, cancha.IdCancha, new DateOnly(2026, 9, 15), new TimeOnly(18, 0))));
    }

    [Fact]
    public async Task Rechaza_Programar_En_Torneo_Finalizado()
    {
        var (db, torneo, equipoA, equipoB, cancha) = await ConTorneoYEquiposAsync();
        torneo.Estado = "Finalizado";
        await db.SaveChangesAsync();
        var servicio = new PartidoService(db, new DisponibilidadService(db));

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.ProgramarAsync(torneo.IdTorneo, new CrearPartidoDto(equipoA.IdEquipo, equipoB.IdEquipo, cancha.IdCancha, new DateOnly(2026, 9, 15), new TimeOnly(18, 0))));
    }

    [Fact]
    public async Task Rechaza_Goles_Negativos_Al_Registrar_Resultado()
    {
        var (db, torneo, equipoA, equipoB, cancha) = await ConTorneoYEquiposAsync();
        var servicio = new PartidoService(db, new DisponibilidadService(db));
        var partido = await servicio.ProgramarAsync(torneo.IdTorneo, new CrearPartidoDto(equipoA.IdEquipo, equipoB.IdEquipo, cancha.IdCancha, new DateOnly(2026, 9, 15), new TimeOnly(18, 0)));

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.RegistrarResultadoAsync(partido.IdPartido, new RegistrarResultadoDto(-1, 2)));
    }

    [Fact]
    public async Task Programa_Partido_Valido_Correctamente()
    {
        var (db, torneo, equipoA, equipoB, cancha) = await ConTorneoYEquiposAsync();
        var servicio = new PartidoService(db, new DisponibilidadService(db));

        var partido = await servicio.ProgramarAsync(torneo.IdTorneo, new CrearPartidoDto(equipoA.IdEquipo, equipoB.IdEquipo, cancha.IdCancha, new DateOnly(2026, 9, 15), new TimeOnly(18, 0)));

        Assert.Equal("Programado", partido.Estado);
    }
}
