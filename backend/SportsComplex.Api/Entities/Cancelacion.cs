namespace SportsComplex.Api.Entities;

public class Cancelacion
{
    public int IdCancelacion { get; set; }

    public int IdReserva { get; set; }
    public Reserva? Reserva { get; set; }

    public int IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }

    public string? Motivo { get; set; }
    public DateTime FechaCancelacion { get; set; }

    public Devolucion? Devolucion { get; set; }
}
