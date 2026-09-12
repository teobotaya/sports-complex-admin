namespace SportsComplex.Api.Dtos;

public record HorarioPicoDto(int Hora, int CantidadReservas);
public record ClienteFrecuenteDto(int IdCliente, string Cliente, int CantidadReservas);
public record EstadisticasResumenDto(
    double TasaCancelaciones,
    List<HorarioPicoDto> HorariosPico,
    List<ClienteFrecuenteDto> ClientesFrecuentes,
    List<ReporteOcupacionDto> Ocupacion,
    List<ReporteIngresosDto> Ingresos);
