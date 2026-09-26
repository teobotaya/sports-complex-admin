using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class CanchaService
{
    private readonly AppDbContext _db;

    public CanchaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CanchaDto>> GetAllAsync()
    {
        return await _db.Canchas.OrderBy(c => c.Nombre)
            .Select(c => ToDto(c))
            .ToListAsync();
    }

    public async Task<CanchaDto> GetByIdAsync(int id)
    {
        var cancha = await _db.Canchas.FindAsync(id) ?? throw new NotFoundException("Cancha no encontrada.");
        return ToDto(cancha);
    }

    public async Task<CanchaDto> CreateAsync(CrearCanchaDto dto)
    {
        ValidarPrecio(dto.PrecioPorHora);

        if (await _db.Canchas.AnyAsync(c => c.Nombre == dto.Nombre))
            throw new ConflictException("Ya existe una cancha con ese nombre.");

        var cancha = new Cancha
        {
            Nombre = dto.Nombre,
            TipoSuperficie = dto.TipoSuperficie,
            PrecioPorHora = dto.PrecioPorHora,
            Activa = true
        };
        _db.Canchas.Add(cancha);
        await _db.SaveChangesAsync();
        return ToDto(cancha);
    }

    public async Task<CanchaDto> UpdateAsync(int id, ActualizarCanchaDto dto)
    {
        ValidarPrecio(dto.PrecioPorHora);

        var cancha = await _db.Canchas.FindAsync(id) ?? throw new NotFoundException("Cancha no encontrada.");

        if (await _db.Canchas.AnyAsync(c => c.Nombre == dto.Nombre && c.IdCancha != id))
            throw new ConflictException("Ya existe una cancha con ese nombre.");

        var cambiaPrecio = cancha.PrecioPorHora != dto.PrecioPorHora;

        cancha.Nombre = dto.Nombre;
        cancha.TipoSuperficie = dto.TipoSuperficie;
        cancha.PrecioPorHora = dto.PrecioPorHora;
        cancha.Activa = dto.Activa;

        if (cambiaPrecio)
        {
            // El saldo de cada reserva se calcula con el precio vigente de la cancha:
            // al cambiarlo se recalcula el estado de pago de las reservas de hoy en adelante
            // (las ya jugadas conservan el estado con el que se cobraron).
            var hoy = Reloj.Hoy;
            var reservas = await _db.Reservas.Include(r => r.Pagos)
                .Where(r => r.IdCancha == id && r.EstadoReserva != "Cancelada" && r.Fecha >= hoy).ToListAsync();
            foreach (var r in reservas)
                r.EstadoPago = CalculoPago.Estado(r.Pagos.Sum(p => p.Monto),
                    CalculoPago.ImporteTotal(r.HoraInicio, r.HoraFin, dto.PrecioPorHora));
        }

        await _db.SaveChangesAsync();
        return ToDto(cancha);
    }

    private static void ValidarPrecio(decimal precio)
    {
        if (precio <= 0)
            throw new BusinessRuleException("El precio por hora debe ser mayor a cero.");
    }

    private static CanchaDto ToDto(Cancha c) =>
        new(c.IdCancha, c.Nombre, c.TipoSuperficie, c.PrecioPorHora, c.Activa);
}
