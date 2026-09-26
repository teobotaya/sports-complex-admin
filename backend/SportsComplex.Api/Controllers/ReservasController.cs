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
    private readonly AuditoriaService _auditoria;

    public ReservasController(ReservaService service, CancelacionService cancelacionService, AuditoriaService auditoria)
    {
        _service = service;
        _cancelacionService = cancelacionService;
        _auditoria = auditoria;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReservaDto>>> GetAll(
        [FromQuery] DateOnly? fecha, [FromQuery] int? idCancha, [FromQuery] int? idCliente, [FromQuery] string? estado,
        [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta) =>
        Ok(await _service.GetAllAsync(fecha, idCancha, idCliente, estado, desde, hasta));

    [HttpGet("{id:int}/historial")]
    public async Task<ActionResult<List<AuditoriaDto>>> Historial(int id) => Ok(await _auditoria.GetHistorialReservaAsync(id));

    [HttpPut("{id:int}/asistencia")]
    public async Task<ActionResult<ReservaDto>> Asistencia(int id, RegistrarAsistenciaDto dto) =>
        Ok(await _service.RegistrarAsistenciaAsync(id, dto));

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
