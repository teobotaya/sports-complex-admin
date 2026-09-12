using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;

namespace SportsComplex.Api.Services;

public class EstadisticasService
{
    private readonly AppDbContext _db;
    private readonly ReportesService _reportes;

    public EstadisticasService(AppDbContext db, ReportesService reportes)
    {
        _db = db;
        _reportes = reportes;
    }

    public async Task<EstadisticasResumenDto> GetResumenAsync(DateOnly desde, DateOnly hasta)
    {
        if (hasta < desde)
            throw new BusinessRuleException("La fecha de inicio debe ser anterior a la fecha de fin.");

        var reservas = await _db.Reservas.Include(r => r.Cliente)
            .Where(r => r.Fecha >= desde && r.Fecha <= hasta)
            .ToListAsync();

        var total = reservas.Count;
        var canceladas = reservas.Count(r => r.EstadoReserva == "Cancelada");
        var tasaCancelaciones = total == 0 ? 0 : (double)canceladas / total * 100;

        var horariosPico = reservas
            .GroupBy(r => r.HoraInicio.Hour)
            .Select(g => new HorarioPicoDto(g.Key, g.Count()))
            .OrderByDescending(h => h.CantidadReservas)
            .Take(5)
            .ToList();

        var clientesFrecuentes = reservas
            .GroupBy(r => new { r.IdCliente, Nombre = r.Cliente!.NombreCompleto })
            .Select(g => new ClienteFrecuenteDto(g.Key.IdCliente, g.Key.Nombre, g.Count()))
            .OrderByDescending(c => c.CantidadReservas)
            .Take(10)
            .ToList();

        var ocupacion = await _reportes.GetOcupacionAsync(desde, hasta);
        var ingresos = await _reportes.GetIngresosAsync(desde, hasta);

        return new EstadisticasResumenDto(Math.Round(tasaCancelaciones, 2), horariosPico, clientesFrecuentes, ocupacion, ingresos);
    }
}
