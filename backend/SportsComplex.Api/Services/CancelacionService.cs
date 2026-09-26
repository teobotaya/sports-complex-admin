using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class CancelacionService
{
    private readonly AppDbContext _db;

    public CancelacionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CancelacionDto>> GetAllAsync()
    {
        return await _db.Cancelaciones.OrderByDescending(c => c.FechaCancelacion)
            .Select(c => ToDto(c)).ToListAsync();
    }

    public async Task<CancelacionDto> CancelarReservaAsync(int idReserva, int idUsuario, CrearCancelacionDto dto)
    {
        var reserva = await _db.Reservas.FindAsync(idReserva) ?? throw new NotFoundException("Reserva no encontrada.");

        if (reserva.EstadoReserva == "Cancelada")
            throw new BusinessRuleException("Una reserva ya cancelada no puede volver a cancelarse.");

        reserva.EstadoReserva = "Cancelada";

        var cancelacion = new Cancelacion
        {
            IdReserva = idReserva,
            IdUsuario = idUsuario,
            Motivo = dto.Motivo,
            FechaCancelacion = Reloj.Ahora
        };
        _db.Cancelaciones.Add(cancelacion);
        await _db.SaveChangesAsync();

        return ToDto(cancelacion);
    }

    private static CancelacionDto ToDto(Cancelacion c) =>
        new(c.IdCancelacion, c.IdReserva, c.IdUsuario, c.Motivo, c.FechaCancelacion);
}
