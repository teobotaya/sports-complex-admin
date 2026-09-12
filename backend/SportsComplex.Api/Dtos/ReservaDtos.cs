namespace SportsComplex.Api.Dtos;

public record ReservaDto(
    int IdReserva, int IdCliente, string ClienteNombre, int IdCancha, string CanchaNombre,
    int IdUsuario, DateOnly Fecha, TimeOnly HoraInicio, TimeOnly HoraFin,
    string EstadoReserva, string EstadoPago, string? Observaciones, DateTime FechaCreacion);

public record CrearReservaDto(int IdCliente, int IdCancha, DateOnly Fecha, TimeOnly HoraInicio, TimeOnly HoraFin, string? Observaciones);
public record ActualizarReservaDto(int IdCancha, DateOnly Fecha, TimeOnly HoraInicio, TimeOnly HoraFin, string? Observaciones);
public record CancelarReservaDto(string? Motivo);
