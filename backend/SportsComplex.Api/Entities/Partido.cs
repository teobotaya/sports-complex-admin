namespace SportsComplex.Api.Entities;

public class Partido
{
    public int IdPartido { get; set; }

    public int IdTorneo { get; set; }
    public Torneo? Torneo { get; set; }

    public int IdEquipoLocal { get; set; }
    public Equipo? EquipoLocal { get; set; }

    public int IdEquipoVisitante { get; set; }
    public Equipo? EquipoVisitante { get; set; }

    public int IdCancha { get; set; }
    public Cancha? Cancha { get; set; }

    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public int? GolesLocal { get; set; }
    public int? GolesVisitante { get; set; }
    public string Estado { get; set; } = "Programado"; // Programado | Jugado
}
