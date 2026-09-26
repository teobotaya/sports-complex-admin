namespace SportsComplex.Api.Entities;

public class Usuario
{
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty; // administrador | empleado
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }

    public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
    public ICollection<Cancelacion> Cancelaciones { get; set; } = new List<Cancelacion>();
    public ICollection<Notificacion> Notificaciones { get; set; } = new List<Notificacion>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
    public ICollection<Devolucion> Devoluciones { get; set; } = new List<Devolucion>();
    public ICollection<Auditoria> Auditorias { get; set; } = new List<Auditoria>();
}
