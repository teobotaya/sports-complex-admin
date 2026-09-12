using SportsComplex.Api.Common;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

public class ClienteServiceTests
{
    [Fact]
    public async Task Rechaza_Telefono_Duplicado_Al_Crear()
    {
        await using var db = TestDbFactory.Create();
        db.Clientes.Add(new Cliente { NombreCompleto = "Existente", Telefono = "1122334455", FechaAlta = DateOnly.FromDateTime(DateTime.UtcNow) });
        await db.SaveChangesAsync();
        var servicio = new ClienteService(db);

        await Assert.ThrowsAsync<ConflictException>(() =>
            servicio.CreateAsync(new CrearClienteDto("Nuevo Cliente", "1122334455", null)));
    }

    [Fact]
    public async Task Rechaza_Nombre_Vacio()
    {
        await using var db = TestDbFactory.Create();
        var servicio = new ClienteService(db);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.CreateAsync(new CrearClienteDto("", "1122334455", null)));
    }

    [Fact]
    public async Task Permite_Editar_Cliente_Con_Su_Propio_Telefono()
    {
        await using var db = TestDbFactory.Create();
        var cliente = new Cliente { NombreCompleto = "Cliente A", Telefono = "1111111111", FechaAlta = DateOnly.FromDateTime(DateTime.UtcNow) };
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();
        var servicio = new ClienteService(db);

        var actualizado = await servicio.UpdateAsync(cliente.IdCliente, new ActualizarClienteDto("Cliente A Editado", "1111111111", "obs"));

        Assert.Equal("Cliente A Editado", actualizado.NombreCompleto);
    }
}
