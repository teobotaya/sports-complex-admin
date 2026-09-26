using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class ReservaService
{
    private readonly AppDbContext _db;
    private readonly DisponibilidadService _disponibilidad;

    public ReservaService(AppDbContext db, DisponibilidadService disponibilidad)
    {
        _db = db;
        _disponibilidad = disponibilidad;
    }

    public async Task<List<ReservaDto>> GetAllAsync(DateOnly? fecha, int? idCancha, int? idCliente, string? estado,
        DateOnly? desde = null, DateOnly? hasta = null)
    {
        if (desde.HasValue && hasta.HasValue && hasta < desde)
            throw new BusinessRuleException("La fecha de inicio debe ser anterior a la fecha de fin.");

        var query = _db.Reservas.Include(r => r.Cliente).Include(r => r.Cancha).AsQueryable();

        if (fecha.HasValue) query = query.Where(r => r.Fecha == fecha.Value);
        if (desde.HasValue) query = query.Where(r => r.Fecha >= desde.Value);
        if (hasta.HasValue) query = query.Where(r => r.Fecha <= hasta.Value);
        if (idCancha.HasValue) query = query.Where(r => r.IdCancha == idCancha.Value);
        if (idCliente.HasValue) query = query.Where(r => r.IdCliente == idCliente.Value);
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(r => r.EstadoReserva == estado);

        return await query.OrderByDescending(r => r.Fecha).ThenBy(r => r.HoraInicio)
            .Select(r => ToDto(r)).ToListAsync();
    }

    public async Task<ReservaDto> GetByIdAsync(int id)
    {
        var reserva = await _db.Reservas.Include(r => r.Cliente).Include(r => r.Cancha)
            .FirstOrDefaultAsync(r => r.IdReserva == id) ?? throw new NotFoundException("Reserva no encontrada.");
        return ToDto(reserva);
    }

    public async Task<ReservaDto> CreateAsync(CrearReservaDto dto, int idUsuario)
    {
        ValidarHorario(dto.HoraInicio, dto.HoraFin);

        if (!await _db.Clientes.AnyAsync(c => c.IdCliente == dto.IdCliente))
            throw new NotFoundException("Cliente no encontrado.");
        if (!await _db.Canchas.AnyAsync(c => c.IdCancha == dto.IdCancha && c.Activa))
            throw new NotFoundException("Cancha no encontrada o inactiva.");

        await _disponibilidad.ValidarDisponibilidadReservaAsync(dto.IdCancha, dto.Fecha, dto.HoraInicio, dto.HoraFin);

        var reserva = new Reserva
        {
            IdCliente = dto.IdCliente,
            IdCancha = dto.IdCancha,
            IdUsuario = idUsuario,
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            EstadoReserva = "Confirmada",
            EstadoPago = "Pendiente",
            Observaciones = dto.Observaciones,
            FechaCreacion = Reloj.Ahora
        };
        _db.Reservas.Add(reserva);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(reserva.IdReserva);
    }

    public async Task<ReservaDto> UpdateAsync(int id, ActualizarReservaDto dto)
    {
        ValidarHorario(dto.HoraInicio, dto.HoraFin);

        var reserva = await _db.Reservas.FindAsync(id) ?? throw new NotFoundException("Reserva no encontrada.");

        if (reserva.EstadoReserva == "Cancelada")
            throw new BusinessRuleException("Una reserva cancelada no puede modificarse.");

        var cambiaTurno = reserva.IdCancha != dto.IdCancha || reserva.Fecha != dto.Fecha
            || reserva.HoraInicio != dto.HoraInicio || reserva.HoraFin != dto.HoraFin;

        if (cambiaTurno)
        {
            // Mover la reserva exige una cancha activa y libre. Si solo se editan las
            // Observaciones, se permite aunque la cancha haya pasado a mantenimiento.
            if (!await _db.Canchas.AnyAsync(c => c.IdCancha == dto.IdCancha && c.Activa))
                throw new NotFoundException("Cancha no encontrada o inactiva.");

            await _disponibilidad.ValidarDisponibilidadReservaAsync(dto.IdCancha, dto.Fecha, dto.HoraInicio, dto.HoraFin, id);
        }

        reserva.IdCancha = dto.IdCancha;
        reserva.Fecha = dto.Fecha;
        reserva.HoraInicio = dto.HoraInicio;
        reserva.HoraFin = dto.HoraFin;
        reserva.Observaciones = dto.Observaciones;

        // Si cambió la duración o la cancha, cambia el importe: se recalcula el estado de pago.
        var precio = await _db.Canchas.Where(c => c.IdCancha == dto.IdCancha).Select(c => c.PrecioPorHora).FirstAsync();
        var pagado = await _db.Pagos.Where(p => p.IdReserva == id).SumAsync(p => p.Monto);
        reserva.EstadoPago = CalculoPago.Estado(pagado, CalculoPago.ImporteTotal(dto.HoraInicio, dto.HoraFin, precio));

        await _db.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    /// <summary>Asistencia del cliente al turno: Presente o Ausente ("no se presentó").</summary>
    public async Task<ReservaDto> RegistrarAsistenciaAsync(int id, RegistrarAsistenciaDto dto)
    {
        if (dto.Asistencia is not ("Presente" or "Ausente"))
            throw new BusinessRuleException("La asistencia debe ser 'Presente' o 'Ausente'.");

        var reserva = await _db.Reservas.FindAsync(id) ?? throw new NotFoundException("Reserva no encontrada.");
        if (reserva.EstadoReserva == "Cancelada")
            throw new BusinessRuleException("No se registra asistencia en una reserva cancelada.");
        if (reserva.Fecha > Reloj.Hoy)
            throw new BusinessRuleException("La asistencia se registra el día del turno o después.");

        reserva.Asistencia = dto.Asistencia;
        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    private static void ValidarHorario(TimeOnly inicio, TimeOnly fin) => ReglasHorario.ValidarTurno(inicio, fin);

    private static ReservaDto ToDto(Reserva r) => new(
        r.IdReserva, r.IdCliente, r.Cliente?.NombreCompleto ?? string.Empty,
        r.IdCancha, r.Cancha?.Nombre ?? string.Empty, r.IdUsuario,
        r.Fecha, r.HoraInicio, r.HoraFin, r.EstadoReserva, r.EstadoPago, r.Asistencia, r.Observaciones, r.FechaCreacion);
}
