using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/reservas")]
[Authorize]
public class ReservasController : ControllerBase
{
    private readonly ReservaService _service;
    private readonly CancelacionService _cancelacionService;

    public ReservasController(ReservaService service, CancelacionService cancelacionService)
    {
        _service = service;
        _cancelacionService = cancelacionService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReservaDto>>> GetAll(
        [FromQuery] DateOnly? fecha, [FromQuery] int? idCancha, [FromQuery] int? idCliente, [FromQuery] string? estado) =>
        Ok(await _service.GetAllAsync(fecha, idCancha, idCliente, estado));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ReservaDto>> GetById(int id) => Ok(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<ActionResult<ReservaDto>> Create(CrearReservaDto dto) =>
        Ok(await _service.CreateAsync(dto, User.GetUserId()));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ReservaDto>> Update(int id, ActualizarReservaDto dto) =>
        Ok(await _service.UpdateAsync(id, dto));

    [HttpPost("{id:int}/cancelar")]
    public async Task<ActionResult<CancelacionDto>> Cancelar(int id, CrearCancelacionDto dto) =>
        Ok(await _cancelacionService.CancelarReservaAsync(id, User.GetUserId(), dto));
}
