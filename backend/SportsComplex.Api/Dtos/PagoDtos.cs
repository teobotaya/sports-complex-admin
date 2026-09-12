namespace SportsComplex.Api.Dtos;

public record PagoDto(int IdPago, int IdReserva, decimal Monto, string MetodoPago, DateOnly FechaPago, string? Observaciones);
public record CrearPagoDto(int IdReserva, decimal Monto, string MetodoPago, string? Observaciones);
