namespace SportsComplex.Api.Entities;

/// <summary>
/// Registro automático de cada operación (alta, modificación o baja): qué registro, qué cambió,
/// cuándo y qué usuario lo hizo. Lo completa AppDbContext al guardar; nadie lo carga a mano.
/// </summary>
public class Auditoria
{
    public int IdAuditoria { get; set; }
    public DateTime FechaHora { get; set; }

    public int? IdUsuario { get; set; } // null: operación del propio sistema (ej. creación del admin inicial)
    public Usuario? Usuario { get; set; }

    public string Entidad { get; set; } = string.Empty;  // Reserva, Cliente, Pago…
    public int IdRegistro { get; set; }
    public string Accion { get; set; } = string.Empty;   // Alta | Modificación | Baja
    public string? Detalle { get; set; }                 // campos modificados: "Hora fin: 19:00 → 20:00"
}
