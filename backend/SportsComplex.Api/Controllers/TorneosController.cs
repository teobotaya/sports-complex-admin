using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/torneos")]
[Authorize]
public class TorneosController : ControllerBase
{
    private readonly TorneoService _torneoService;
    private readonly EquipoService _equipoService;
    private readonly PartidoService _partidoService;

    public TorneosController(TorneoService torneoService, EquipoService equipoService, PartidoService partidoService)
    {
        _torneoService = torneoService;
        _equipoService = equipoService;
        _partidoService = partidoService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TorneoDto>>> GetAll() => Ok(await _torneoService.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TorneoDto>> GetById(int id) => Ok(await _torneoService.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Roles = "administrador")]
    public async Task<ActionResult<TorneoDto>> Create(CrearTorneoDto dto) => Ok(await _torneoService.CreateAsync(dto));

    [HttpPut("{id:int}")]
    [Authorize(Roles = "administrador")]
    public async Task<ActionResult<TorneoDto>> Update(int id, ActualizarTorneoDto dto) => Ok(await _torneoService.UpdateAsync(id, dto));

    [HttpGet("{id:int}/posiciones")]
    public async Task<ActionResult<List<PosicionDto>>> GetPosiciones(int id) => Ok(await _torneoService.GetPosicionesAsync(id));

    // Navegación Torneo -> Equipos
    [HttpGet("{id:int}/equipos")]
    public async Task<ActionResult<List<EquipoDto>>> GetEquipos(int id) => Ok(await _equipoService.GetByTorneoAsync(id));

    [HttpPost("{id:int}/equipos")]
    public async Task<ActionResult<EquipoDto>> AgregarEquipo(int id, CrearEquipoDto dto) => Ok(await _equipoService.AgregarAsync(id, dto));

    // Navegación Torneo -> Partidos
    [HttpGet("{id:int}/partidos")]
    public async Task<ActionResult<List<PartidoDto>>> GetPartidos(int id) => Ok(await _partidoService.GetByTorneoAsync(id));

    [HttpPost("{id:int}/partidos")]
    public async Task<ActionResult<PartidoDto>> ProgramarPartido(int id, CrearPartidoDto dto) => Ok(await _partidoService.ProgramarAsync(id, dto));
}
