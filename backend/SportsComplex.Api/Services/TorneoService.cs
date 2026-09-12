using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class TorneoService
{
    private readonly AppDbContext _db;

    private static readonly string[] EstadosValidos = { "Planificado", "En curso", "Finalizado" };

    public TorneoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<TorneoDto>> GetAllAsync()
    {
        return await _db.Torneos
            .OrderByDescending(t => t.FechaInicio)
            .Select(t => new TorneoDto(t.IdTorneo, t.Nombre, t.FechaInicio, t.FechaFin, t.Categoria, t.Estado,
                t.Equipos.Count, t.Partidos.Count))
            .ToListAsync();
    }

    public async Task<TorneoDto> GetByIdAsync(int id)
    {
        var torneo = await _db.Torneos.Include(t => t.Equipos).Include(t => t.Partidos)
            .FirstOrDefaultAsync(t => t.IdTorneo == id) ?? throw new NotFoundException("Torneo no encontrado.");
        return ToDto(torneo);
    }

    public async Task<TorneoDto> CreateAsync(CrearTorneoDto dto)
    {
        ValidarFechas(dto.FechaInicio, dto.FechaFin);

        var torneo = new Torneo
        {
            Nombre = dto.Nombre,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Categoria = dto.Categoria,
            Estado = "Planificado"
        };
        _db.Torneos.Add(torneo);
        await _db.SaveChangesAsync();
        return ToDto(torneo);
    }

    public async Task<TorneoDto> UpdateAsync(int id, ActualizarTorneoDto dto)
    {
        ValidarFechas(dto.FechaInicio, dto.FechaFin);
        if (!EstadosValidos.Contains(dto.Estado))
            throw new BusinessRuleException("Estado de torneo inválido.");

        var torneo = await _db.Torneos.Include(t => t.Equipos).Include(t => t.Partidos)
            .FirstOrDefaultAsync(t => t.IdTorneo == id) ?? throw new NotFoundException("Torneo no encontrado.");

        torneo.Nombre = dto.Nombre;
        torneo.FechaInicio = dto.FechaInicio;
        torneo.FechaFin = dto.FechaFin;
        torneo.Categoria = dto.Categoria;
        torneo.Estado = dto.Estado;
        await _db.SaveChangesAsync();
        return ToDto(torneo);
    }

    public async Task<List<PosicionDto>> GetPosicionesAsync(int idTorneo)
    {
        if (!await _db.Torneos.AnyAsync(t => t.IdTorneo == idTorneo))
            throw new NotFoundException("Torneo no encontrado.");

        var equipos = await _db.Equipos.Where(e => e.IdTorneo == idTorneo).ToListAsync();
        var partidosJugados = await _db.Partidos
            .Where(p => p.IdTorneo == idTorneo && p.Estado == "Jugado")
            .ToListAsync();

        var tabla = equipos.Select(eq =>
        {
            int pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, gc = 0;

            foreach (var p in partidosJugados.Where(p => p.IdEquipoLocal == eq.IdEquipo || p.IdEquipoVisitante == eq.IdEquipo))
            {
                var esLocal = p.IdEquipoLocal == eq.IdEquipo;
                var golesPropios = esLocal ? p.GolesLocal ?? 0 : p.GolesVisitante ?? 0;
                var golesRival = esLocal ? p.GolesVisitante ?? 0 : p.GolesLocal ?? 0;

                pj++;
                gf += golesPropios;
                gc += golesRival;

                if (golesPropios > golesRival) pg++;
                else if (golesPropios == golesRival) pe++;
                else pp++;
            }

            return new PosicionDto(eq.IdEquipo, eq.Nombre, pj, pg, pe, pp, gf, gc, gf - gc, pg * 3 + pe);
        })
        .OrderByDescending(p => p.Pts).ThenByDescending(p => p.DG).ThenByDescending(p => p.GF)
        .ToList();

        return tabla;
    }

    private static void ValidarFechas(DateOnly inicio, DateOnly fin)
    {
        if (fin < inicio)
            throw new BusinessRuleException("La fecha de fin debe ser posterior o igual a la fecha de inicio.");
    }

    private static TorneoDto ToDto(Torneo t) =>
        new(t.IdTorneo, t.Nombre, t.FechaInicio, t.FechaFin, t.Categoria, t.Estado, t.Equipos.Count, t.Partidos.Count);
}
