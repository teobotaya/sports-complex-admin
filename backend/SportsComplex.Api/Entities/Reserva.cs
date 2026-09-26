namespace SportsComplex.Api.Entities;

public class Reserva
{
    public int IdReserva { get; set; }

    public int IdCliente { get; set; }
    public Cliente? Cliente { get; set; }

    public int IdCancha { get; set; }
    public Cancha? Cancha { get; set; }

    public int IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }

    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string EstadoReserva { get; set; } = "Pendiente"; // Confirmada | Pendiente | Cancelada
    public string EstadoPago { get; set; } = "Pendiente"; // Pendiente | Parcialmente abonado | Abonado
    public string? Asistencia { get; set; } // null (sin registrar) | Presente | Ausente
    public string? Observaciones { get; set; }
    public DateTime FechaCreacion { get; set; }

    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
    public Cancelacion? Cancelacion { get; set; }
}
