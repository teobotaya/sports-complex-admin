namespace SportsComplex.Api.Entities;

public class Devolucion
{
    public int IdDevolucion { get; set; }

    public int IdCancelacion { get; set; }
    public Cancelacion? Cancelacion { get; set; }

    public decimal MontoDevuelto { get; set; }
    public string Metodo { get; set; } = string.Empty;
    public DateOnly Fecha { get; set; }
    public string? Observaciones { get; set; }
}
