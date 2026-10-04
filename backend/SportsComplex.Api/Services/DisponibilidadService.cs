using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

/// <summary>Reglas compartidas de disponibilidad usadas por Reservas y Partidos.</summary>
public class DisponibilidadService
{
    private readonly AppDbContext _db;

    public DisponibilidadService(AppDbContext db)
    {
        _db = db;
    }

    public async Task ValidarDisponibilidadReservaAsync(int idCancha, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, int? idReservaExcluir = null)
    {
        var solapaReserva = await _db.Reservas.AnyAsync(r =>
            r.IdCancha == idCancha &&
            r.Fecha == fecha &&
            r.EstadoReserva != "Cancelada" &&
            (idReservaExcluir == null || r.IdReserva != idReservaExcluir) &&
            r.HoraInicio < horaFin && horaInicio < r.HoraFin);

        if (solapaReserva)
            throw new ConflictException("Ya existe una reserva en esa cancha, fecha y horario.");

        var partido = await _db.Partidos.Include(p => p.Torneo).Include(p => p.EquipoLocal).Include(p => p.EquipoVisitante)
            .Where(p => p.IdCancha == idCancha && p.Fecha == fecha && p.HoraInicio >= horaInicio && p.HoraInicio < horaFin)
            .OrderBy(p => p.HoraInicio)
            .FirstOrDefaultAsync();

        if (partido is not null)
            throw new ConflictException(
                $"La cancha está reservada por torneo: «{partido.Torneo?.Nombre}» juega {partido.EquipoLocal?.Nombre} vs " +
                $"{partido.EquipoVisitante?.Nombre} a las {partido.HoraInicio:HH:mm}. Elegí otro horario u otra cancha.");
    }

    public async Task ValidarDisponibilidadPartidoAsync(int idCancha, DateOnly fecha, TimeOnly horaInicio, int? idPartidoExcluir = null)
    {
        var solapaPartido = await _db.Partidos.AnyAsync(p =>
            p.IdCancha == idCancha &&
            p.Fecha == fecha &&
            p.HoraInicio == horaInicio &&
            (idPartidoExcluir == null || p.IdPartido != idPartidoExcluir));

        if (solapaPartido)
            throw new ConflictException("Ya existe un partido programado en esa cancha, fecha y horario.");

        var solapaReserva = await _db.Reservas.AnyAsync(r =>
            r.IdCancha == idCancha &&
            r.Fecha == fecha &&
            r.EstadoReserva != "Cancelada" &&
            r.HoraInicio <= horaInicio && horaInicio < r.HoraFin);

        if (solapaReserva)
            throw new ConflictException("Ya existe una reserva en esa cancha, fecha y horario.");
    }
}
