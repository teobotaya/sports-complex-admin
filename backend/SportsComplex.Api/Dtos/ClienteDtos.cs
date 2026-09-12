namespace SportsComplex.Api.Dtos;

public record ClienteDto(int IdCliente, string NombreCompleto, string Telefono, string? Observaciones, DateOnly FechaAlta);
public record CrearClienteDto(string NombreCompleto, string Telefono, string? Observaciones);
public record ActualizarClienteDto(string NombreCompleto, string Telefono, string? Observaciones);
