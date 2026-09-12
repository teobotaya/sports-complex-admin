namespace SportsComplex.Api.Entities;

public class Cliente
{
    public int IdCliente { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateOnly FechaAlta { get; set; }

    public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
}
