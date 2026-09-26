using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;

namespace SportsComplex.Api.Services;

public class ReportesService
{
    private readonly AppDbContext _db;

    public ReportesService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ReporteOcupacionDto>> GetOcupacionAsync(DateOnly desde, DateOnly hasta, int? idCancha = null)
    {
        ValidarRango(desde, hasta);

        var canchas = await _db.Canchas
            .Where(c => idCancha == null ? c.Activa : c.IdCancha == idCancha)
            .Select(c => new { c.IdCancha, c.Nombre })
            .ToListAsync();

        var reservas = await _db.Reservas
            .Where(r => r.Fecha >= desde && r.Fecha <= hasta && r.EstadoReserva != "Cancelada"
                && (idCancha == null || r.IdCancha == idCancha))
            .Select(r => new { r.IdCancha, r.HoraInicio, r.HoraFin })
            .ToListAsync();

        // Capacidad del período: días × horas de atención (08:00 a 22:00).
        var dias = hasta.DayNumber - desde.DayNumber + 1;
        var capacidad = dias * ReglasHorario.HorasPorDia;

        return canchas.Select(c =>
            {
                var usadas = (int)reservas.Where(r => r.IdCancha == c.IdCancha)
                    .Sum(r => (r.HoraFin.ToTimeSpan() - r.HoraInicio.ToTimeSpan()).TotalHours);
                return new ReporteOcupacionDto(c.IdCancha, c.Nombre, usadas, Math.Max(0, capacidad - usadas));
            })
            .OrderByDescending(r => r.HorasUtilizadas).ThenBy(r => r.Cancha)
            .ToList();
    }

    public async Task<List<ReporteIngresosDto>> GetIngresosAsync(DateOnly desde, DateOnly hasta, int? idCancha = null)
    {
        ValidarRango(desde, hasta);

        return await _db.Pagos.Include(p => p.Reserva)
            .Where(p => p.FechaPago >= desde && p.FechaPago <= hasta
                && (idCancha == null || p.Reserva!.IdCancha == idCancha))
            .GroupBy(p => p.MetodoPago)
            .Select(g => new ReporteIngresosDto(g.Key, g.Sum(p => p.Monto)))
            .ToListAsync();
    }

    public async Task<List<ReporteDeudorDto>> GetDeudoresAsync(int? idCancha = null)
    {
        var reservas = await _db.Reservas.Include(r => r.Cliente).Include(r => r.Cancha).Include(r => r.Pagos)
            .Where(r => r.EstadoReserva != "Cancelada" && r.EstadoPago != "Abonado"
                && (idCancha == null || r.IdCancha == idCancha))
            .ToListAsync();

        return reservas.Select(r =>
        {
            var horas = (decimal)(r.HoraFin.ToTimeSpan() - r.HoraInicio.ToTimeSpan()).TotalHours;
            var totalEsperado = r.Cancha!.PrecioPorHora * horas;
            var totalPagado = r.Pagos.Sum(p => p.Monto);
            return new ReporteDeudorDto(r.IdCliente, r.Cliente!.NombreCompleto, r.IdReserva, r.Fecha, totalEsperado - totalPagado);
        })
        .Where(d => d.SaldoPendiente > 0)
        .OrderByDescending(d => d.SaldoPendiente)
        .ToList();
    }

    private static void ValidarRango(DateOnly desde, DateOnly hasta)
    {
        if (hasta < desde)
            throw new BusinessRuleException("La fecha de inicio debe ser anterior a la fecha de fin.");
    }
}
