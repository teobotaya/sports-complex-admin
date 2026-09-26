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

        var cobrado = await _db.Pagos
            .Where(p => p.FechaPago >= desde && p.FechaPago <= hasta
                && (idCancha == null || p.Reserva!.IdCancha == idCancha))
            .GroupBy(p => p.MetodoPago)
            .Select(g => new { Metodo = g.Key, Monto = g.Sum(p => p.Monto) })
            .ToListAsync();

        // Las devoluciones del período se descuentan: el reporte muestra el ingreso real (neto).
        var devuelto = await _db.Devoluciones
            .Where(d => d.Fecha >= desde && d.Fecha <= hasta
                && (idCancha == null || d.Cancelacion!.Reserva!.IdCancha == idCancha))
            .GroupBy(d => d.Metodo)
            .Select(g => new { Metodo = g.Key, Monto = g.Sum(d => d.MontoDevuelto) })
            .ToListAsync();

        return cobrado.Select(c => c.Metodo).Union(devuelto.Select(d => d.Metodo))
            .Select(metodo =>
            {
                var c = cobrado.Where(x => x.Metodo == metodo).Sum(x => x.Monto);
                var d = devuelto.Where(x => x.Metodo == metodo).Sum(x => x.Monto);
                return new ReporteIngresosDto(metodo, c, d, c - d);
            })
            .OrderByDescending(i => i.Total)
            .ToList();
    }

    /// <summary>Reservas con saldo pendiente, filtrables por cancha y por fecha del turno.</summary>
    public async Task<List<ReporteDeudorDto>> GetDeudoresAsync(int? idCancha = null, DateOnly? desde = null, DateOnly? hasta = null)
    {
        if (desde.HasValue && hasta.HasValue) ValidarRango(desde.Value, hasta.Value);

        var reservas = await _db.Reservas.Include(r => r.Cliente).Include(r => r.Cancha).Include(r => r.Pagos)
            .Where(r => r.EstadoReserva != "Cancelada" && r.EstadoPago != "Abonado"
                && (idCancha == null || r.IdCancha == idCancha)
                && (desde == null || r.Fecha >= desde) && (hasta == null || r.Fecha <= hasta))
            .ToListAsync();

        return reservas.Select(r =>
        {
            var totalEsperado = CalculoPago.ImporteTotal(r.HoraInicio, r.HoraFin, r.Cancha!.PrecioPorHora);
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
