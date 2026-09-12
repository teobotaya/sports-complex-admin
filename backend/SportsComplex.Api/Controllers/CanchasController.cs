using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Services;

namespace SportsComplex.Api.Controllers;

[ApiController]
[Route("api/canchas")]
[Authorize]
public class CanchasController : ControllerBase
{
    private readonly CanchaService _service;

    public CanchasController(CanchaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<CanchaDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CanchaDto>> GetById(int id) => Ok(await _service.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Roles = "administrador")]
    public async Task<ActionResult<CanchaDto>> Create(CrearCanchaDto dto) => Ok(await _service.CreateAsync(dto));

    [HttpPut("{id:int}")]
    [Authorize(Roles = "administrador")]
    public async Task<ActionResult<CanchaDto>> Update(int id, ActualizarCanchaDto dto) => Ok(await _service.UpdateAsync(id, dto));
}
