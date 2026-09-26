using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class ReglasHorarioTests
{
    [Theory]
    [InlineData(18, 1, 19, 0)]
    [InlineData(18, 0, 19, 1)]
    [InlineData(18, 15, 19, 15)]
    [InlineData(18, 30, 19, 30)]
    public void Turno_Rechaza_Horas_Fraccionadas(int hi, int mi, int hf, int mf)
    {
        Assert.Throws<BusinessRuleException>(() =>
            ReglasHorario.ValidarTurno(new TimeOnly(hi, mi), new TimeOnly(hf, mf)));
    }

    [Theory]
    [InlineData(18, 19)]
    [InlineData(8, 10)]
    public void Turno_Acepta_Horas_Enteras(int hi, int hf)
    {
        ReglasHorario.ValidarTurno(new TimeOnly(hi, 0), new TimeOnly(hf, 0));
    }

    [Fact]
    public void Partido_Rechaza_Hora_Fraccionada()
    {
        Assert.Throws<BusinessRuleException>(() => ReglasHorario.ValidarInicioPartido(new TimeOnly(20, 30)));
    }

    [Fact]
    public async Task Reserva_De_18_A_1901_Es_Rechazada_Y_No_Bloquea_Turno_Siguiente()
    {
        await using var db = TestDbFactory.Create();
        var cancha = new Cancha { Nombre = "Cancha 1", TipoSuperficie = "Sintetico", PrecioPorHora = 15000, Activa = true };
        var cliente = new Cliente { NombreCompleto = "Juan Perez", Telefono = "1122334455", FechaAlta = DateOnly.FromDateTime(DateTime.Today) };
        db.Canchas.Add(cancha);
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        var servicio = new ReservaService(db, new DisponibilidadService(db));
        var fecha = new DateOnly(2026, 10, 1);

        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.CreateAsync(
            new CrearReservaDto(cliente.IdCliente, cancha.IdCancha, fecha, new TimeOnly(18, 0), new TimeOnly(19, 1), null), 1));

        await servicio.CreateAsync(new CrearReservaDto(cliente.IdCliente, cancha.IdCancha, fecha, new TimeOnly(18, 0), new TimeOnly(19, 0), "Llegó 5 minutos tarde"), 1);
        var siguiente = await servicio.CreateAsync(new CrearReservaDto(cliente.IdCliente, cancha.IdCancha, fecha, new TimeOnly(19, 0), new TimeOnly(20, 0), null), 1);

        Assert.Equal(new TimeOnly(19, 0), siguiente.HoraInicio);
    }
}
