using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class DevolucionService
{
    private readonly AppDbContext _db;

    public DevolucionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<DevolucionDto>> GetAllAsync()
    {
        return await _db.Devoluciones.Include(d => d.Usuario).Select(d => ToDto(d)).ToListAsync();
    }

    public async Task<DevolucionDto> RegistrarAsync(CrearDevolucionDto dto, int idUsuario)
    {
        if (dto.MontoDevuelto <= 0)
            throw new BusinessRuleException("El monto a devolver debe ser mayor a cero.");
        if (string.IsNullOrWhiteSpace(dto.Metodo))
            throw new BusinessRuleException("El método de devolución es obligatorio.");

        var cancelacion = await _db.Cancelaciones.FindAsync(dto.IdCancelacion)
            ?? throw new NotFoundException("Cancelación no encontrada.");

        if (await _db.Devoluciones.AnyAsync(d => d.IdCancelacion == dto.IdCancelacion))
            throw new ConflictException("Ya existe una devolución registrada para esta cancelación.");

        var totalAbonado = await _db.Pagos.Where(p => p.IdReserva == cancelacion.IdReserva).SumAsync(p => p.Monto);
        if (totalAbonado <= 0)
            throw new BusinessRuleException("No existen pagos previos asociados a la reserva cancelada.");
        if (dto.MontoDevuelto > totalAbonado)
            throw new BusinessRuleException("El monto devuelto no puede ser mayor al total abonado.");

        var devolucion = new Devolucion
        {
            IdCancelacion = dto.IdCancelacion,
            IdUsuario = idUsuario > 0 ? idUsuario : null,
            MontoDevuelto = dto.MontoDevuelto,
            Metodo = dto.Metodo,
            Fecha = Reloj.Hoy,
            Observaciones = dto.Observaciones
        };
        _db.Devoluciones.Add(devolucion);
        await _db.SaveChangesAsync();

        await _db.Entry(devolucion).Reference(d => d.Usuario).LoadAsync();
        return ToDto(devolucion);
    }

    private static DevolucionDto ToDto(Devolucion d) =>
        new(d.IdDevolucion, d.IdCancelacion, d.MontoDevuelto, d.Metodo, d.Fecha, d.Observaciones, d.Usuario?.NombreCompleto);
}
