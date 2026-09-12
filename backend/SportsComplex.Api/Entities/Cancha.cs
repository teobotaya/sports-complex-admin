namespace SportsComplex.Api.Entities;

public class Cancha
{
    public int IdCancha { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? TipoSuperficie { get; set; }
    public decimal PrecioPorHora { get; set; }
    public bool Activa { get; set; } = true;

    public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
    public ICollection<Partido> Partidos { get; set; } = new List<Partido>();
}
