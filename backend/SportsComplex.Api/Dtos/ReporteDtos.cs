namespace SportsComplex.Api.Dtos;

public record ReporteOcupacionDto(int IdCancha, string Cancha, int HorasUtilizadas, int HorasDisponibles);
public record ReporteIngresosDto(string MetodoPago, decimal Total);
public record ReporteDeudorDto(int IdCliente, string Cliente, int IdReserva, DateOnly Fecha, decimal SaldoPendiente);
