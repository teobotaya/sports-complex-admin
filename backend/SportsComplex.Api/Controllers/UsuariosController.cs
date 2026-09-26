using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "administrador")]
public class UsuariosController : ControllerBase
{
    private readonly UsuarioService _service;

    public UsuariosController(UsuarioService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<UsuarioDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Create(CrearUsuarioDto dto) => Ok(await _service.CreateAsync(dto));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> Update(int id, ActualizarUsuarioDto dto) => Ok(await _service.UpdateAsync(id, dto, User.GetUserId()));

    [HttpPost("{id:int}/desactivar")]
    public async Task<IActionResult> Desactivar(int id)
    {
        await _service.DesactivarAsync(id, User.GetUserId());
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, User.GetUserId());
        return NoContent();
    }
}
