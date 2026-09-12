using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class IntegranteService
{
    private readonly AppDbContext _db;

    public IntegranteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<IntegranteDto>> GetByEquipoAsync(int idEquipo)
    {
        return await _db.Integrantes.Where(i => i.IdEquipo == idEquipo)
            .OrderBy(i => i.NombreCompleto)
            .Select(i => ToDto(i)).ToListAsync();
    }

    public async Task<IntegranteDto> AgregarAsync(int idEquipo, CrearIntegranteDto dto)
    {
        if (!await _db.Equipos.AnyAsync(e => e.IdEquipo == idEquipo))
            throw new NotFoundException("Equipo no encontrado.");

        if (string.IsNullOrWhiteSpace(dto.NombreCompleto) || string.IsNullOrWhiteSpace(dto.Dni))
            throw new BusinessRuleException("Nombre completo y DNI son obligatorios.");

        if (await _db.Integrantes.AnyAsync(i => i.IdEquipo == idEquipo && i.Dni == dto.Dni))
            throw new ConflictException("Ya existe un integrante con ese DNI en el equipo.");

        var integrante = new Integrante { IdEquipo = idEquipo, NombreCompleto = dto.NombreCompleto, Dni = dto.Dni };
        _db.Integrantes.Add(integrante);
        await _db.SaveChangesAsync();
        return ToDto(integrante);
    }

    public async Task QuitarAsync(int idIntegrante)
    {
        var integrante = await _db.Integrantes.FindAsync(idIntegrante) ?? throw new NotFoundException("Integrante no encontrado.");
        _db.Integrantes.Remove(integrante);
        await _db.SaveChangesAsync();
    }

    private static IntegranteDto ToDto(Integrante i) => new(i.IdIntegrante, i.IdEquipo, i.NombreCompleto, i.Dni);
}
