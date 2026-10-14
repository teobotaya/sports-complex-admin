using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class TorneoReservaTests
{
    [Fact]
    public async Task Inscribir_Equipo_Existente_Copia_Sus_Integrantes()
    {
        await using var db = TestDbFactory.Create();
        var t1 = new Torneo { Nombre = "Apertura", FechaInicio = new(2026, 3, 1), FechaFin = new(2026, 6, 1), Estado = "Finalizado" };
        var t2 = new Torneo { Nombre = "Clausura", FechaInicio = new(2026, 8, 1), FechaFin = new(2026, 12, 1), Estado = "Planificado" };
        var leones = new Equipo { Torneo = t1, Nombre = "Los Leones", ContactoNombre = "Ana" };
        leones.Integrantes.Add(new Integrante { NombreCompleto = "Juan Perez", Dni = "30111222" });
        leones.Integrantes.Add(new Integrante { NombreCompleto = "Luis Gomez", Dni = "30111333" });
        db.AddRange(t1, t2, leones);
        await db.SaveChangesAsync();
        var servicio = new EquipoService(db);

        var nuevo = await servicio.AgregarAsync(t2.IdTorneo, new CrearEquipoDto("Los Leones", "Ana", null, leones.IdEquipo));

        Assert.Equal(2, nuevo.CantidadIntegrantes);
        Assert.Equal(t2.IdTorneo, nuevo.IdTorneo);
        Assert.Equal(2, (await servicio.GetAllAsync()).Count);
    }

    [Fact]
    public async Task Reservar_Sobre_Un_Partido_Dice_Que_La_Cancha_Esta_Reservada_Por_Torneo()
    {
        await using var db = TestDbFactory.Create();
        var cancha = new Cancha { Nombre = "Cancha 1", PrecioPorHora = 10000, Activa = true };
        var torneo = new Torneo { Nombre = "Copa Primavera", FechaInicio = new(2030, 10, 1), FechaFin = new(2030, 10, 30), Estado = "En curso" };
        var a = new Equipo { Torneo = torneo, Nombre = "Los Leones" };
        var b = new Equipo { Torneo = torneo, Nombre = "Las Águilas" };
        db.AddRange(cancha, torneo, a, b);
        await db.SaveChangesAsync();
        db.Partidos.Add(new Partido { IdTorneo = torneo.IdTorneo, IdEquipoLocal = a.IdEquipo, IdEquipoVisitante = b.IdEquipo,
            IdCancha = cancha.IdCancha, Fecha = new(2030, 10, 5), HoraInicio = new(20, 0), Estado = "Programado" });
        await db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => new DisponibilidadService(db)
            .ValidarDisponibilidadReservaAsync(cancha.IdCancha, new(2030, 10, 5), new(19, 0), new(21, 0)));

        Assert.Contains("reservada por torneo", ex.Message);
        Assert.Contains("Copa Primavera", ex.Message);
        Assert.Contains("20:00", ex.Message);
    }

    [Fact]
    public async Task Partidos_En_Rango_De_Fechas_Se_Listan_Para_Mostrarlos_En_Reservas()
    {
        await using var db = TestDbFactory.Create();
        var cancha = new Cancha { Nombre = "Cancha 4", PrecioPorHora = 45000, Activa = true };
        var torneo = new Torneo { Nombre = "Copa Primavera", FechaInicio = new(2030, 10, 1), FechaFin = new(2030, 11, 30), Estado = "En curso" };
        var a = new Equipo { Torneo = torneo, Nombre = "Los Leones" };
        var b = new Equipo { Torneo = torneo, Nombre = "Las Águilas" };
        db.AddRange(cancha, torneo, a, b);
        await db.SaveChangesAsync();
        foreach (var dia in new[] { new DateOnly(2030, 10, 10), new DateOnly(2030, 10, 20), new DateOnly(2030, 11, 25) })
            db.Partidos.Add(new Partido { IdTorneo = torneo.IdTorneo, IdEquipoLocal = a.IdEquipo, IdEquipoVisitante = b.IdEquipo,
                IdCancha = cancha.IdCancha, Fecha = dia, HoraInicio = new(21, 0), Estado = "Programado" });
        await db.SaveChangesAsync();
        var servicio = new PartidoService(db, new DisponibilidadService(db));

        var enRango = await servicio.GetEnRangoAsync(new(2030, 10, 14), new(2030, 11, 11));

        var unico = Assert.Single(enRango);
        Assert.Equal(new DateOnly(2030, 10, 20), unico.Fecha);
        Assert.Equal("Copa Primavera", unico.TorneoNombre);
        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.GetEnRangoAsync(new(2030, 11, 11), new(2030, 10, 14)));
    }
}
