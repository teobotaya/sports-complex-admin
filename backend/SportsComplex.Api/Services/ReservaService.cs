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

    public async Task<List<ReservaDto>> GetAllAsync(DateOnly? fecha, int? idCancha, int? idCliente, string? estado)
    {
        var query = _db.Reservas.Include(r => r.Cliente).Include(r => r.Cancha).AsQueryable();

        if (fecha.HasValue) query = query.Where(r => r.Fecha == fecha.Value);
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
            FechaCreacion = DateTime.UtcNow
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

        if (!await _db.Canchas.AnyAsync(c => c.IdCancha == dto.IdCancha && c.Activa))
            throw new NotFoundException("Cancha no encontrada o inactiva.");

        await _disponibilidad.ValidarDisponibilidadReservaAsync(dto.IdCancha, dto.Fecha, dto.HoraInicio, dto.HoraFin, id);

        reserva.IdCancha = dto.IdCancha;
        reserva.Fecha = dto.Fecha;
        reserva.HoraInicio = dto.HoraInicio;
        reserva.HoraFin = dto.HoraFin;
        reserva.Observaciones = dto.Observaciones;
        await _db.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    private static void ValidarHorario(TimeOnly inicio, TimeOnly fin)
    {
        if (fin <= inicio)
            throw new BusinessRuleException("La hora de fin debe ser posterior a la hora de inicio.");
    }

    private static ReservaDto ToDto(Reserva r) => new(
        r.IdReserva, r.IdCliente, r.Cliente?.NombreCompleto ?? string.Empty,
        r.IdCancha, r.Cancha?.Nombre ?? string.Empty, r.IdUsuario,
        r.Fecha, r.HoraInicio, r.HoraFin, r.EstadoReserva, r.EstadoPago, r.Observaciones, r.FechaCreacion);
}
