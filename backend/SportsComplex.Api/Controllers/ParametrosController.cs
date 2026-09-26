using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/parametros")]
[Authorize]
public class ParametrosController : ControllerBase
{
    private readonly ParametroService _service;

    public ParametrosController(ParametroService service)
    {
        _service = service;
    }

    // Todos los usuarios los leen (el sistema necesita saber cuándo cerrar la sesión por inactividad).
    [HttpGet]
    public async Task<ActionResult<List<ParametroDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpPut("{clave}")]
    [Authorize(Roles = "administrador")]
    public async Task<ActionResult<ParametroDto>> Update(string clave, ActualizarParametroDto dto) =>
        Ok(await _service.ActualizarAsync(clave, dto));
}
