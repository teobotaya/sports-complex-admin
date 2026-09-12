using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;

namespace SportsComplex.Api.Services;

public class NotificacionService
{
    private readonly AppDbContext _db;

    public NotificacionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NotificacionDto>> GetByUsuarioAsync(int idUsuario)
    {
        await GenerarAutomaticasAsync(idUsuario);

        return await _db.Notificaciones.Where(n => n.IdUsuario == idUsuario)
            .OrderByDescending(n => n.FechaCreacion)
            .Select(n => new NotificacionDto(n.IdNotificacion, n.Tipo, n.Mensaje, n.Leida, n.FechaCreacion))
            .ToListAsync();
    }

    /// <summary>Genera alertas automáticas (pagos vencidos, partidos sin resultado, devoluciones
    /// pendientes) para el usuario indicado, evitando duplicar la misma alerta ya existente.</summary>
    private async Task GenerarAutomaticasAsync(int idUsuario)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var existentes = await _db.Notificaciones.Where(n => n.IdUsuario == idUsuario)
            .Select(n => n.Mensaje).ToListAsync();
        var nuevas = new List<Entities.Notificacion>();

        var reservasVencidas = await _db.Reservas
            .Where(r => r.Fecha < hoy && r.EstadoReserva != "Cancelada" && r.EstadoPago != "Abonado")
            .ToListAsync();
        foreach (var r in reservasVencidas)
        {
            var mensaje = $"La reserva #{r.IdReserva} del {r.Fecha:yyyy-MM-dd} tiene un pago vencido.";
            if (!existentes.Contains(mensaje))
                nuevas.Add(NuevaNotificacion(idUsuario, "pago", mensaje));
        }

        var partidosSinResultado = await _db.Partidos
            .Where(p => p.Fecha < hoy && p.Estado == "Programado")
            .ToListAsync();
        foreach (var p in partidosSinResultado)
        {
            var mensaje = $"El partido #{p.IdPartido} del {p.Fecha:yyyy-MM-dd} no tiene resultado cargado.";
            if (!existentes.Contains(mensaje))
                nuevas.Add(NuevaNotificacion(idUsuario, "partido", mensaje));
        }

        var cancelacionesConDeuda = await _db.Cancelaciones
            .Where(c => !_db.Devoluciones.Any(d => d.IdCancelacion == c.IdCancelacion))
            .ToListAsync();
        foreach (var c in cancelacionesConDeuda)
        {
            var totalPagado = await _db.Pagos.Where(p => p.IdReserva == c.IdReserva).SumAsync(p => p.Monto);
            if (totalPagado <= 0) continue;
            var mensaje = $"La cancelación #{c.IdCancelacion} tiene una devolución pendiente.";
            if (!existentes.Contains(mensaje))
                nuevas.Add(NuevaNotificacion(idUsuario, "cancelacion", mensaje));
        }

        if (nuevas.Count > 0)
        {
            _db.Notificaciones.AddRange(nuevas);
            await _db.SaveChangesAsync();
        }
    }

    private static Entities.Notificacion NuevaNotificacion(int idUsuario, string tipo, string mensaje) => new()
    {
        IdUsuario = idUsuario,
        Tipo = tipo,
        Mensaje = mensaje,
        Leida = false,
        FechaCreacion = DateTime.UtcNow
    };

    public async Task MarcarLeidaAsync(int idNotificacion, int idUsuario)
    {
        var notificacion = await _db.Notificaciones
            .FirstOrDefaultAsync(n => n.IdNotificacion == idNotificacion && n.IdUsuario == idUsuario)
            ?? throw new NotFoundException("Notificación no encontrada.");

        notificacion.Leida = true;
        await _db.SaveChangesAsync();
    }

    public async Task MarcarTodasLeidasAsync(int idUsuario)
    {
        var pendientes = await _db.Notificaciones.Where(n => n.IdUsuario == idUsuario && !n.Leida).ToListAsync();
        foreach (var n in pendientes) n.Leida = true;
        await _db.SaveChangesAsync();
    }
}
