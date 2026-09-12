using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/equipos")]
[Authorize]
public class EquiposController : ControllerBase
{
    private readonly EquipoService _equipoService;
    private readonly IntegranteService _integranteService;

    public EquiposController(EquipoService equipoService, IntegranteService integranteService)
    {
        _equipoService = equipoService;
        _integranteService = integranteService;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EquipoDto>> GetById(int id) => Ok(await _equipoService.GetByIdAsync(id));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Quitar(int id)
    {
        await _equipoService.QuitarAsync(id);
        return NoContent();
    }

    // Navegación Equipo -> Integrantes
    [HttpGet("{id:int}/integrantes")]
    public async Task<ActionResult<List<IntegranteDto>>> GetIntegrantes(int id) => Ok(await _integranteService.GetByEquipoAsync(id));

    [HttpPost("{id:int}/integrantes")]
    public async Task<ActionResult<IntegranteDto>> AgregarIntegrante(int id, CrearIntegranteDto dto) =>
        Ok(await _integranteService.AgregarAsync(id, dto));

    [HttpDelete("integrantes/{idIntegrante:int}")]
    public async Task<IActionResult> QuitarIntegrante(int idIntegrante)
    {
        await _integranteService.QuitarAsync(idIntegrante);
        return NoContent();
    }
}
