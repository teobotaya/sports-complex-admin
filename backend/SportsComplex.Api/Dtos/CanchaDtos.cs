namespace SportsComplex.Api.Dtos;

public record CanchaDto(int IdCancha, string Nombre, string? TipoSuperficie, decimal PrecioPorHora, bool Activa);
public record CrearCanchaDto(string Nombre, string? TipoSuperficie, decimal PrecioPorHora);
public record ActualizarCanchaDto(string Nombre, string? TipoSuperficie, decimal PrecioPorHora, bool Activa);
