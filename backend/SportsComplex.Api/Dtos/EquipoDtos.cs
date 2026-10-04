namespace SportsComplex.Api.Dtos;

public record EquipoDto(int IdEquipo, int IdTorneo, string TorneoNombre, string Nombre, string? ContactoNombre, string? ContactoTelefono, int CantidadIntegrantes);
// IdEquipoOrigen: equipo ya registrado (de otro torneo) del que se copian los integrantes.
public record CrearEquipoDto(string Nombre, string? ContactoNombre, string? ContactoTelefono, int? IdEquipoOrigen = null);

public record IntegranteDto(int IdIntegrante, int IdEquipo, string NombreCompleto, string Dni);
public record CrearIntegranteDto(string NombreCompleto, string Dni);
