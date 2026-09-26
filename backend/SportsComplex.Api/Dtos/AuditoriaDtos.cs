namespace SportsComplex.Api.Dtos;

public record AuditoriaDto(int IdAuditoria, DateTime FechaHora, string Usuario, string Entidad, int IdRegistro, string Accion, string? Detalle);

public record ParametroDto(string Clave, string Valor, string? Descripcion);
public record ActualizarParametroDto(string Valor);

public record RegistrarAsistenciaDto(string Asistencia);
