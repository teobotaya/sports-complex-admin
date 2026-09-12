namespace SportsComplex.Api.Dtos;

public record NotificacionDto(int IdNotificacion, string Tipo, string Mensaje, bool Leida, DateTime FechaCreacion);
