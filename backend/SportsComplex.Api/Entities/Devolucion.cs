namespace SportsComplex.Api.Entities;

public class Devolucion
{
    public int IdDevolucion { get; set; }

    public int IdCancelacion { get; set; }
    public Cancelacion? Cancelacion { get; set; }

    // Usuario que registró la devolución (auditoría). Null solo en devoluciones anteriores a esta columna.
    public int? IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }

    public decimal MontoDevuelto { get; set; }
    public string Metodo { get; set; } = string.Empty;
    public DateOnly Fecha { get; set; }
    public string? Observaciones { get; set; }
}
