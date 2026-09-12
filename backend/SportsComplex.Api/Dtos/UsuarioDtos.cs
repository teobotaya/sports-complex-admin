namespace SportsComplex.Api.Dtos;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, UsuarioDto Usuario);

public record UsuarioDto(int IdUsuario, string NombreCompleto, string Username, string Rol, bool Activo, DateTime FechaCreacion);
public record CrearUsuarioDto(string NombreCompleto, string Username, string Password, string Rol);
public record ActualizarUsuarioDto(string NombreCompleto, string Rol);
