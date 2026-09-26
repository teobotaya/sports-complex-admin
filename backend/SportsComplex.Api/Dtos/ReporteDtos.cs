namespace SportsComplex.Api.Dtos;

public record ReporteOcupacionDto(int IdCancha, string Cancha, int HorasUtilizadas, int HorasDisponibles);
/// <summary>Ingresos de un método de pago: Total = Cobrado − Devuelto (ingreso neto).</summary>
public record ReporteIngresosDto(string MetodoPago, decimal Cobrado, decimal Devuelto, decimal Total);
public record ReporteDeudorDto(int IdCliente, string Cliente, int IdReserva, DateOnly Fecha, decimal SaldoPendiente);
