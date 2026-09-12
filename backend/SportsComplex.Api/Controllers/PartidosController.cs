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

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PartidoDto>> GetById(int id) => Ok(await _service.GetByIdAsync(id));

    [HttpPost("{id:int}/resultado")]
    public async Task<ActionResult<PartidoDto>> RegistrarResultado(int id, RegistrarResultadoDto dto) =>
        Ok(await _service.RegistrarResultadoAsync(id, dto));
}
