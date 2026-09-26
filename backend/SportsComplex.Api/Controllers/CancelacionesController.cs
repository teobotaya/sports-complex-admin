using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/cancelaciones")]
[Authorize]
public class CancelacionesController : ControllerBase
{
    private readonly CancelacionService _service;

    public CancelacionesController(CancelacionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<CancelacionDto>>> GetAll() => Ok(await _service.GetAllAsync());
}

[ApiController]
[Route("api/devoluciones")]
[Authorize]
public class DevolucionesController : ControllerBase
{
    private readonly DevolucionService _service;

    public DevolucionesController(DevolucionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<DevolucionDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpPost]
    public async Task<ActionResult<DevolucionDto>> Create(CrearDevolucionDto dto) => Ok(await _service.RegistrarAsync(dto, User.GetUserId()));
}
