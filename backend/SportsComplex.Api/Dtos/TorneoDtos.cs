namespace SportsComplex.Api.Dtos;

public record TorneoDto(int IdTorneo, string Nombre, DateOnly FechaInicio, DateOnly FechaFin, string? Categoria, string Estado, int CantidadEquipos, int CantidadPartidos);
public record CrearTorneoDto(string Nombre, DateOnly FechaInicio, DateOnly FechaFin, string? Categoria);
public record ActualizarTorneoDto(string Nombre, DateOnly FechaInicio, DateOnly FechaFin, string? Categoria, string Estado);

public record PosicionDto(int IdEquipo, string Equipo, int PJ, int PG, int PE, int PP, int GF, int GC, int DG, int Pts);
