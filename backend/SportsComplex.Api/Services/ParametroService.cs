using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

/// <summary>Parámetros operativos que ajusta el administrador (módulo Administración del Sistema).</summary>
public class ParametroService
{
    public const int MinutosInactividadPorDefecto = 30;

    private readonly AppDbContext _db;

    public ParametroService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ParametroDto>> GetAllAsync()
    {
        await AsegurarPorDefectoAsync();
        return await _db.Parametros.OrderBy(p => p.Clave)
            .Select(p => new ParametroDto(p.Clave, p.Valor, p.Descripcion)).ToListAsync();
    }

    public async Task<ParametroDto> ActualizarAsync(string clave, ActualizarParametroDto dto)
    {
        await AsegurarPorDefectoAsync();
        var parametro = await _db.Parametros.FirstOrDefaultAsync(p => p.Clave == clave)
            ?? throw new NotFoundException("Parámetro no encontrado.");

        var valor = (dto.Valor ?? string.Empty).Trim();
        if (clave == Parametro.MinutosInactividad)
        {
            if (!int.TryParse(valor, out var minutos) || minutos < 5 || minutos > 480)
                throw new BusinessRuleException("Los minutos de inactividad deben ser un número entre 5 y 480.");
            valor = minutos.ToString();
        }

        parametro.Valor = valor;
        await _db.SaveChangesAsync();
        return new ParametroDto(parametro.Clave, parametro.Valor, parametro.Descripcion);
    }

    /// <summary>Bases creadas antes de esta tabla (o en memoria, en las pruebas) arrancan con el valor por defecto.</summary>
    private async Task AsegurarPorDefectoAsync()
    {
        if (await _db.Parametros.AnyAsync(p => p.Clave == Parametro.MinutosInactividad)) return;
        _db.Parametros.Add(new Parametro
        {
            Clave = Parametro.MinutosInactividad,
            Valor = MinutosInactividadPorDefecto.ToString(),
            Descripcion = "Minutos sin actividad antes de cerrar la sesión automáticamente"
        });
        await _db.SaveChangesAsync();
    }
}
