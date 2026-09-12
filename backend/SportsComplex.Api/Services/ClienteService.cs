using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class ClienteService
{
    private readonly AppDbContext _db;

    public ClienteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ClienteDto>> GetAllAsync(string? busqueda)
    {
        var query = _db.Clientes.AsQueryable();
        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            query = query.Where(c => c.NombreCompleto.Contains(busqueda) || c.Telefono.Contains(busqueda));
        }
        return await query.OrderBy(c => c.NombreCompleto).Select(c => ToDto(c)).ToListAsync();
    }

    public async Task<ClienteDto> GetByIdAsync(int id)
    {
        var cliente = await _db.Clientes.FindAsync(id) ?? throw new NotFoundException("Cliente no encontrado.");
        return ToDto(cliente);
    }

    public async Task<ClienteDto> CreateAsync(CrearClienteDto dto)
    {
        ValidarDatos(dto.NombreCompleto, dto.Telefono);

        if (await _db.Clientes.AnyAsync(c => c.Telefono == dto.Telefono))
            throw new ConflictException("Ya existe un cliente con ese número de teléfono.");

        var cliente = new Cliente
        {
            NombreCompleto = dto.NombreCompleto,
            Telefono = dto.Telefono,
            Observaciones = dto.Observaciones,
            FechaAlta = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();
        return ToDto(cliente);
    }

    public async Task<ClienteDto> UpdateAsync(int id, ActualizarClienteDto dto)
    {
        ValidarDatos(dto.NombreCompleto, dto.Telefono);

        var cliente = await _db.Clientes.FindAsync(id) ?? throw new NotFoundException("Cliente no encontrado.");

        if (await _db.Clientes.AnyAsync(c => c.Telefono == dto.Telefono && c.IdCliente != id))
            throw new ConflictException("Ya existe un cliente con ese número de teléfono.");

        cliente.NombreCompleto = dto.NombreCompleto;
        cliente.Telefono = dto.Telefono;
        cliente.Observaciones = dto.Observaciones;
        await _db.SaveChangesAsync();
        return ToDto(cliente);
    }

    public async Task DeleteAsync(int id)
    {
        var cliente = await _db.Clientes.FindAsync(id) ?? throw new NotFoundException("Cliente no encontrado.");

        if (await _db.Reservas.AnyAsync(r => r.IdCliente == id))
            throw new BusinessRuleException("No se puede eliminar un cliente con reservas asociadas.");

        _db.Clientes.Remove(cliente);
        await _db.SaveChangesAsync();
    }

    private static void ValidarDatos(string nombre, string telefono)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new BusinessRuleException("El nombre completo es obligatorio.");
        if (string.IsNullOrWhiteSpace(telefono))
            throw new BusinessRuleException("El teléfono es obligatorio.");
    }

    private static ClienteDto ToDto(Cliente c) =>
        new(c.IdCliente, c.NombreCompleto, c.Telefono, c.Observaciones, c.FechaAlta);
}
