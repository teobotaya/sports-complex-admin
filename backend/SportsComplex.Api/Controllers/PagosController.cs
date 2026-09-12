using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/pagos")]
[Authorize]
public class PagosController : ControllerBase
{
    private readonly PagoService _service;

    public PagosController(PagoService service)
    {
        _service = service;
    }

    [HttpGet("reserva/{idReserva:int}")]
    public async Task<ActionResult<List<PagoDto>>> GetByReserva(int idReserva) =>
        Ok(await _service.GetByReservaAsync(idReserva));

    [HttpPost]
    public async Task<ActionResult<PagoDto>> Create(CrearPagoDto dto) => Ok(await _service.RegistrarAsync(dto));
}
