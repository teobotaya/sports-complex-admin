using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class PagoService
{
    private readonly AppDbContext _db;

    public PagoService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Todos los pagos, opcionalmente dentro de un rango de fechas de pago.
    /// Evita que el frontend tenga que pedir los pagos reserva por reserva.</summary>
    public async Task<List<PagoDto>> GetAllAsync(DateOnly? desde, DateOnly? hasta)
    {
        var query = _db.Pagos.AsQueryable();
        if (desde.HasValue) query = query.Where(p => p.FechaPago >= desde.Value);
        if (hasta.HasValue) query = query.Where(p => p.FechaPago <= hasta.Value);
        return await query.OrderByDescending(p => p.FechaPago).ThenByDescending(p => p.IdPago)
            .Select(p => ToDto(p)).ToListAsync();
    }

    public async Task<List<PagoDto>> GetByReservaAsync(int idReserva)
    {
        return await _db.Pagos.Where(p => p.IdReserva == idReserva)
            .OrderBy(p => p.FechaPago)
            .Select(p => ToDto(p)).ToListAsync();
    }

    public async Task<PagoDto> RegistrarAsync(CrearPagoDto dto)
    {
        if (dto.Monto <= 0)
            throw new BusinessRuleException("El monto del pago debe ser mayor a cero.");
        if (string.IsNullOrWhiteSpace(dto.MetodoPago))
            throw new BusinessRuleException("El método de pago es obligatorio.");

        var reserva = await _db.Reservas.Include(r => r.Cancha)
            .FirstOrDefaultAsync(r => r.IdReserva == dto.IdReserva) ?? throw new NotFoundException("Reserva no encontrada.");

        if (reserva.EstadoReserva == "Cancelada")
            throw new BusinessRuleException("No pueden registrarse pagos sobre reservas canceladas.");

        var pago = new Pago
        {
            IdReserva = dto.IdReserva,
            Monto = dto.Monto,
            MetodoPago = dto.MetodoPago,
            FechaPago = Reloj.Hoy,
            Observaciones = dto.Observaciones
        };
        _db.Pagos.Add(pago);
        await _db.SaveChangesAsync();

        await ActualizarEstadoPagoAsync(reserva);

        return ToDto(pago);
    }

    private async Task ActualizarEstadoPagoAsync(Reserva reserva)
    {
        var totalPagado = await _db.Pagos.Where(p => p.IdReserva == reserva.IdReserva).SumAsync(p => p.Monto);
        var horas = (decimal)(reserva.HoraFin.ToTimeSpan() - reserva.HoraInicio.ToTimeSpan()).TotalHours;
        var totalEsperado = reserva.Cancha!.PrecioPorHora * horas;

        reserva.EstadoPago = totalPagado <= 0 ? "Pendiente"
            : totalPagado < totalEsperado ? "Parcialmente abonado"
            : "Abonado";

        await _db.SaveChangesAsync();
    }

    private static PagoDto ToDto(Pago p) => new(p.IdPago, p.IdReserva, p.Monto, p.MetodoPago, p.FechaPago, p.Observaciones);
}
