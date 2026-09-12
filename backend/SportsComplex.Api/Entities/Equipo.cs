namespace SportsComplex.Api.Entities;

public class Equipo
{
    public int IdEquipo { get; set; }

    public int IdTorneo { get; set; }
    public Torneo? Torneo { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string? ContactoNombre { get; set; }
    public string? ContactoTelefono { get; set; }

    public ICollection<Integrante> Integrantes { get; set; } = new List<Integrante>();
    public ICollection<Partido> PartidosLocal { get; set; } = new List<Partido>();
    public ICollection<Partido> PartidosVisitante { get; set; } = new List<Partido>();
}
