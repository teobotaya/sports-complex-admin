namespace SportsComplex.Api.Dtos;

public record CancelacionDto(int IdCancelacion, int IdReserva, int IdUsuario, string? Motivo, DateTime FechaCancelacion);
public record CrearCancelacionDto(string? Motivo);

public record DevolucionDto(int IdDevolucion, int IdCancelacion, decimal MontoDevuelto, string Metodo, DateOnly Fecha, string? Observaciones, string? RegistradoPor);
public record CrearDevolucionDto(int IdCancelacion, decimal MontoDevuelto, string Metodo, string? Observaciones);
