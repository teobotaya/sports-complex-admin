using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class EquipoService
{
    private readonly AppDbContext _db;

    public EquipoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<EquipoDto>> GetByTorneoAsync(int idTorneo)
    {
        return await _db.Equipos.Include(e => e.Torneo).Include(e => e.Integrantes)
            .Where(e => e.IdTorneo == idTorneo)
            .OrderBy(e => e.Nombre)
            .Select(e => ToDto(e))
            .ToListAsync();
    }

    public async Task<EquipoDto> GetByIdAsync(int id)
    {
        var equipo = await _db.Equipos.Include(e => e.Torneo).Include(e => e.Integrantes)
            .FirstOrDefaultAsync(e => e.IdEquipo == id) ?? throw new NotFoundException("Equipo no encontrado.");
        return ToDto(equipo);
    }

    public async Task<EquipoDto> AgregarAsync(int idTorneo, CrearEquipoDto dto)
    {
        var torneo = await _db.Torneos.FindAsync(idTorneo) ?? throw new NotFoundException("Torneo no encontrado.");
        if (torneo.Estado == "Finalizado")
            throw new BusinessRuleException("No pueden agregarse equipos a un torneo finalizado.");

        if (await _db.Equipos.AnyAsync(e => e.IdTorneo == idTorneo && e.Nombre == dto.Nombre))
            throw new ConflictException("Ya existe un equipo con ese nombre en el torneo.");

        var equipo = new Equipo
        {
            IdTorneo = idTorneo,
            Nombre = dto.Nombre,
            ContactoNombre = dto.ContactoNombre,
            ContactoTelefono = dto.ContactoTelefono
        };
        _db.Equipos.Add(equipo);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(equipo.IdEquipo);
    }

    public async Task QuitarAsync(int idEquipo)
    {
        var equipo = await _db.Equipos.Include(e => e.Torneo).Include(e => e.Integrantes)
            .FirstOrDefaultAsync(e => e.IdEquipo == idEquipo) ?? throw new NotFoundException("Equipo no encontrado.");

        if (equipo.Torneo!.Estado == "Finalizado")
            throw new BusinessRuleException("No pueden quitarse equipos de un torneo finalizado.");

        var tienePartidos = await _db.Partidos.AnyAsync(p => p.IdEquipoLocal == idEquipo || p.IdEquipoVisitante == idEquipo);
        if (tienePartidos)
            throw new BusinessRuleException("No puede quitarse un equipo con partidos programados o jugados en el torneo.");

        _db.Integrantes.RemoveRange(equipo.Integrantes);
        _db.Equipos.Remove(equipo);
        await _db.SaveChangesAsync();
    }

    private static EquipoDto ToDto(Equipo e) =>
        new(e.IdEquipo, e.IdTorneo, e.Torneo?.Nombre ?? string.Empty, e.Nombre, e.ContactoNombre, e.ContactoTelefono, e.Integrantes.Count);
}
