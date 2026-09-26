using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

/// <summary>Consulta del registro de auditoría ("historial de cambios").</summary>
public class AuditoriaService
{
    private readonly AppDbContext _db;

    public AuditoriaService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Historial de una reserva: la reserva en sí, sus pagos, su cancelación y su devolución.</summary>
    public async Task<List<AuditoriaDto>> GetHistorialReservaAsync(int idReserva)
    {
        if (!await _db.Reservas.AnyAsync(r => r.IdReserva == idReserva))
            throw new NotFoundException("Reserva no encontrada.");

        var pagos = await _db.Pagos.Where(p => p.IdReserva == idReserva).Select(p => p.IdPago).ToListAsync();
        var cancelaciones = await _db.Cancelaciones.Where(c => c.IdReserva == idReserva).Select(c => c.IdCancelacion).ToListAsync();
        var devoluciones = await _db.Devoluciones.Where(d => cancelaciones.Contains(d.IdCancelacion)).Select(d => d.IdDevolucion).ToListAsync();

        return await Consultar(_db.Auditorias.Where(a =>
            (a.Entidad == nameof(Reserva) && a.IdRegistro == idReserva) ||
            (a.Entidad == nameof(Pago) && pagos.Contains(a.IdRegistro)) ||
            (a.Entidad == nameof(Cancelacion) && cancelaciones.Contains(a.IdRegistro)) ||
            (a.Entidad == nameof(Devolucion) && devoluciones.Contains(a.IdRegistro))));
    }

    /// <summary>Historial de modificaciones de los datos de un cliente.</summary>
    public async Task<List<AuditoriaDto>> GetHistorialClienteAsync(int idCliente)
    {
        if (!await _db.Clientes.AnyAsync(c => c.IdCliente == idCliente))
            throw new NotFoundException("Cliente no encontrado.");

        return await Consultar(_db.Auditorias.Where(a => a.Entidad == nameof(Cliente) && a.IdRegistro == idCliente));
    }

    private static Task<List<AuditoriaDto>> Consultar(IQueryable<Auditoria> query) =>
        query.OrderByDescending(a => a.FechaHora).ThenByDescending(a => a.IdAuditoria)
            .Select(a => new AuditoriaDto(a.IdAuditoria, a.FechaHora,
                a.Usuario != null ? a.Usuario.NombreCompleto : "Sistema",
                a.Entidad, a.IdRegistro, a.Accion, a.Detalle))
            .ToListAsync();
}
