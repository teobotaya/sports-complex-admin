namespace SportsComplex.Api.Dtos;

public record PartidoDto(
    int IdPartido, int IdTorneo, string TorneoNombre,
    int IdEquipoLocal, string EquipoLocalNombre, int IdEquipoVisitante, string EquipoVisitanteNombre,
    int IdCancha, string CanchaNombre, DateOnly Fecha, TimeOnly HoraInicio,
    int? GolesLocal, int? GolesVisitante, string Estado);

public record CrearPartidoDto(int IdEquipoLocal, int IdEquipoVisitante, int IdCancha, DateOnly Fecha, TimeOnly HoraInicio);
public record RegistrarResultadoDto(int GolesLocal, int GolesVisitante);
