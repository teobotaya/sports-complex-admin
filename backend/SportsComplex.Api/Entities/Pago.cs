namespace SportsComplex.Api.Entities;

public class Pago
{
    public int IdPago { get; set; }

    public int IdReserva { get; set; }
    public Reserva? Reserva { get; set; }

    public decimal Monto { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public DateOnly FechaPago { get; set; }
    public string? Observaciones { get; set; }
}
