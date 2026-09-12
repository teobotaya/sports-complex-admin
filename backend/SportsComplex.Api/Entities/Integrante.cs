namespace SportsComplex.Api.Entities;

public class Integrante
{
    public int IdIntegrante { get; set; }

    public int IdEquipo { get; set; }
    public Equipo? Equipo { get; set; }

    public string NombreCompleto { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
}
