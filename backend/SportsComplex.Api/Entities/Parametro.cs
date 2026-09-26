namespace SportsComplex.Api.Entities;

/// <summary>Parámetro operativo del sistema que el administrador puede ajustar (ej. minutos de inactividad).</summary>
public class Parametro
{
    public const string MinutosInactividad = "minutos_inactividad";

    public int IdParametro { get; set; }
    public string Clave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}
