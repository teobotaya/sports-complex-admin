namespace SportsComplex.Api.Entities;

public class Torneo
{
    public int IdTorneo { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public string? Categoria { get; set; }
    public string Estado { get; set; } = "Planificado"; // Planificado | En curso | Finalizado

    public ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
    public ICollection<Partido> Partidos { get; set; } = new List<Partido>();
}
