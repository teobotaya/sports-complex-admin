using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class PartidoService
{
    private readonly AppDbContext _db;
    private readonly DisponibilidadService _disponibilidad;

    public PartidoService(AppDbContext db, DisponibilidadService disponibilidad)
    {
        _db = db;
        _disponibilidad = disponibilidad;
    }

    public async Task<List<PartidoDto>> GetByTorneoAsync(int idTorneo)
    {
        return await Query().Where(p => p.IdTorneo == idTorneo)
            .OrderBy(p => p.Fecha).ThenBy(p => p.HoraInicio)
            .Select(p => ToDto(p)).ToListAsync();
    }

    public async Task<PartidoDto> GetByIdAsync(int id)
    {
        var partido = await Query().FirstOrDefaultAsync(p => p.IdPartido == id)
            ?? throw new NotFoundException("Partido no encontrado.");
        return ToDto(partido);
    }

    public async Task<PartidoDto> ProgramarAsync(int idTorneo, CrearPartidoDto dto)
    {
        var torneo = await _db.Torneos.Include(t => t.Equipos)
            .FirstOrDefaultAsync(t => t.IdTorneo == idTorneo) ?? throw new NotFoundException("Torneo no encontrado.");

        if (torneo.Estado == "Finalizado")
            throw new BusinessRuleException("Un torneo finalizado no permite programar nuevos partidos.");

        if (torneo.Equipos.Count < 2)
            throw new BusinessRuleException("El torneo debe tener al menos dos equipos inscriptos para programar partidos.");

        if (dto.IdEquipoLocal == dto.IdEquipoVisitante)
            throw new BusinessRuleException("Un equipo no puede enfrentarse a sí mismo.");

        if (!torneo.Equipos.Any(e => e.IdEquipo == dto.IdEquipoLocal) || !torneo.Equipos.Any(e => e.IdEquipo == dto.IdEquipoVisitante))
            throw new BusinessRuleException("Ambos equipos deben pertenecer al torneo.");

        if (!await _db.Canchas.AnyAsync(c => c.IdCancha == dto.IdCancha && c.Activa))
            throw new NotFoundException("Cancha no encontrada o inactiva.");

        await _disponibilidad.ValidarDisponibilidadPartidoAsync(dto.IdCancha, dto.Fecha, dto.HoraInicio);

        var partido = new Partido
        {
            IdTorneo = idTorneo,
            IdEquipoLocal = dto.IdEquipoLocal,
            IdEquipoVisitante = dto.IdEquipoVisitante,
            IdCancha = dto.IdCancha,
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            Estado = "Programado"
        };
        _db.Partidos.Add(partido);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(partido.IdPartido);
    }

    public async Task<PartidoDto> RegistrarResultadoAsync(int idPartido, RegistrarResultadoDto dto)
    {
        if (dto.GolesLocal < 0 || dto.GolesVisitante < 0)
            throw new BusinessRuleException("Los goles no pueden ser negativos.");

        var partido = await _db.Partidos.Include(p => p.Torneo)
            .FirstOrDefaultAsync(p => p.IdPartido == idPartido) ?? throw new NotFoundException("Partido no encontrado.");

        if (partido.Torneo!.Estado == "Finalizado")
            throw new BusinessRuleException("Un torneo finalizado no permite modificar sus partidos.");

        if (partido.Estado != "Programado")
            throw new BusinessRuleException("Solo pueden cargarse resultados en partidos con estado 'Programado'.");

        partido.GolesLocal = dto.GolesLocal;
        partido.GolesVisitante = dto.GolesVisitante;
        partido.Estado = "Jugado";
        await _db.SaveChangesAsync();

        return await GetByIdAsync(idPartido);
    }

    private IQueryable<Partido> Query() =>
        _db.Partidos.Include(p => p.Torneo).Include(p => p.EquipoLocal).Include(p => p.EquipoVisitante).Include(p => p.Cancha);

    private static PartidoDto ToDto(Partido p) => new(
        p.IdPartido, p.IdTorneo, p.Torneo?.Nombre ?? string.Empty,
        p.IdEquipoLocal, p.EquipoLocal?.Nombre ?? string.Empty,
        p.IdEquipoVisitante, p.EquipoVisitante?.Nombre ?? string.Empty,
        p.IdCancha, p.Cancha?.Nombre ?? string.Empty,
        p.Fecha, p.HoraInicio, p.GolesLocal, p.GolesVisitante, p.Estado);
}
