using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/partidos")]
[Authorize]
public class PartidosController : ControllerBase
{
    private readonly PartidoService _service;

    public PartidosController(PartidoService service)
    {
        _service = service;
    }

    /// <summary>Partidos de un día (?fecha=) o de un rango (?desde=&amp;hasta=, ambos opcionales).
    /// La agenda y el listado de reservas los muestran como canchas reservadas por torneo.</summary>
    [HttpGet]
    public async Task<ActionResult<List<PartidoDto>>> Get([FromQuery] DateOnly? fecha, [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta) =>
        Ok(fecha.HasValue
            ? await _service.GetByFechaAsync(fecha.Value)
            : await _service.GetEnRangoAsync(desde, hasta));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PartidoDto>> GetById(int id) => Ok(await _service.GetByIdAsync(id));

    [HttpPost("{id:int}/resultado")]
    public async Task<ActionResult<PartidoDto>> RegistrarResultado(int id, RegistrarResultadoDto dto) =>
        Ok(await _service.RegistrarResultadoAsync(id, dto));
}
