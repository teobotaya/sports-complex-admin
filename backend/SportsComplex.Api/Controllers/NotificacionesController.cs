using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/notificaciones")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly NotificacionService _service;

    public NotificacionesController(NotificacionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificacionDto>>> GetMias() => Ok(await _service.GetByUsuarioAsync(User.GetUserId()));

    [HttpPost("{id:int}/leida")]
    public async Task<IActionResult> MarcarLeida(int id)
    {
        await _service.MarcarLeidaAsync(id, User.GetUserId());
        return NoContent();
    }

    [HttpPost("leer-todas")]
    public async Task<IActionResult> MarcarTodasLeidas()
    {
        await _service.MarcarTodasLeidasAsync(User.GetUserId());
        return NoContent();
    }
}
