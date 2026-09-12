namespace SportsComplex.Api.Dtos;

public record EquipoDto(int IdEquipo, int IdTorneo, string TorneoNombre, string Nombre, string? ContactoNombre, string? ContactoTelefono, int CantidadIntegrantes);
public record CrearEquipoDto(string Nombre, string? ContactoNombre, string? ContactoTelefono);

public record IntegranteDto(int IdIntegrante, int IdEquipo, string NombreCompleto, string Dni);
public record CrearIntegranteDto(string NombreCompleto, string Dni);
