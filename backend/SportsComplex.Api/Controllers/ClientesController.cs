using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly ClienteService _service;
    private readonly AuditoriaService _auditoria;

    public ClientesController(ClienteService service, AuditoriaService auditoria)
    {
        _service = service;
        _auditoria = auditoria;
    }

    [HttpGet("{id:int}/historial")]
    public async Task<ActionResult<List<AuditoriaDto>>> Historial(int id) => Ok(await _auditoria.GetHistorialClienteAsync(id));

    [HttpGet]
    public async Task<ActionResult<List<ClienteDto>>> GetAll([FromQuery] string? busqueda) =>
        Ok(await _service.GetAllAsync(busqueda));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteDto>> GetById(int id) => Ok(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Create(CrearClienteDto dto) => Ok(await _service.CreateAsync(dto));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClienteDto>> Update(int id, ActualizarClienteDto dto) => Ok(await _service.UpdateAsync(id, dto));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
