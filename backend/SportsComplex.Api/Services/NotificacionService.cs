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
        var hoy = Reloj.Hoy;
        // Un aviso por evento y usuario: se identifica por tipo + registro de origen (restricción única en la BD).
        var existentes = (await _db.Notificaciones.Where(n => n.IdUsuario == idUsuario && n.IdReferencia != null)
            .Select(n => new { n.Tipo, n.IdReferencia }).ToListAsync())
            .Select(n => (n.Tipo, n.IdReferencia!.Value)).ToHashSet();
        var nuevas = new List<Entities.Notificacion>();

        void Agregar(string tipo, int idReferencia, string mensaje)
        {
            if (existentes.Add((tipo, idReferencia)))
                nuevas.Add(NuevaNotificacion(idUsuario, tipo, idReferencia, mensaje));
        }

        var reservasVencidas = await _db.Reservas
            .Where(r => r.Fecha < hoy && r.EstadoReserva != "Cancelada" && r.EstadoPago != "Abonado")
            .ToListAsync();
        foreach (var r in reservasVencidas)
            Agregar("pago", r.IdReserva, $"La reserva #{r.IdReserva} del {r.Fecha:dd/MM/yyyy} tiene un pago vencido.");

        var partidosSinResultado = await _db.Partidos
            .Where(p => p.Fecha < hoy && p.Estado == "Programado")
            .ToListAsync();
        foreach (var p in partidosSinResultado)
            Agregar("partido", p.IdPartido, $"El partido #{p.IdPartido} del {p.Fecha:dd/MM/yyyy} no tiene resultado cargado.");

        var cancelacionesConDeuda = await _db.Cancelaciones
            .Where(c => !_db.Devoluciones.Any(d => d.IdCancelacion == c.IdCancelacion)
                && _db.Pagos.Any(p => p.IdReserva == c.IdReserva))
            .ToListAsync();
        foreach (var c in cancelacionesConDeuda)
            Agregar("cancelacion", c.IdCancelacion, $"La cancelación #{c.IdCancelacion} tiene una devolución pendiente.");

        if (nuevas.Count == 0) return;

        _db.Notificaciones.AddRange(nuevas);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Otro pedido simultáneo (ej. dos pestañas) ya generó el mismo aviso: se descarta el repetido.
            foreach (var n in nuevas) _db.Entry(n).State = EntityState.Detached;
        }
    }

    private static Entities.Notificacion NuevaNotificacion(int idUsuario, string tipo, int idReferencia, string mensaje) => new()
    {
        IdUsuario = idUsuario,
        Tipo = tipo,
        IdReferencia = idReferencia,
        Mensaje = mensaje,
        Leida = false,
        FechaCreacion = Reloj.Ahora
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
