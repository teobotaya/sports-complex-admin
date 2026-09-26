using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/reportes")]
[Authorize(Roles = "administrador")]
public class ReportesController : ControllerBase
{
    private readonly ReportesService _service;

    public ReportesController(ReportesService service)
    {
        _service = service;
    }

    [HttpGet("ocupacion")]
    public async Task<ActionResult<List<ReporteOcupacionDto>>> GetOcupacion([FromQuery] DateOnly desde, [FromQuery] DateOnly hasta, [FromQuery] int? idCancha) =>
        Ok(await _service.GetOcupacionAsync(desde, hasta, idCancha));

    [HttpGet("ingresos")]
    public async Task<ActionResult<List<ReporteIngresosDto>>> GetIngresos([FromQuery] DateOnly desde, [FromQuery] DateOnly hasta, [FromQuery] int? idCancha) =>
        Ok(await _service.GetIngresosAsync(desde, hasta, idCancha));

    [HttpGet("deudores")]
    public async Task<ActionResult<List<ReporteDeudorDto>>> GetDeudores(
        [FromQuery] int? idCancha, [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta) =>
        Ok(await _service.GetDeudoresAsync(idCancha, desde, hasta));
}

[ApiController]
[Route("api/estadisticas")]
[Authorize(Roles = "administrador")]
public class EstadisticasController : ControllerBase
{
    private readonly EstadisticasService _service;

    public EstadisticasController(EstadisticasService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<EstadisticasResumenDto>> GetResumen([FromQuery] DateOnly desde, [FromQuery] DateOnly hasta) =>
        Ok(await _service.GetResumenAsync(desde, hasta));
}
