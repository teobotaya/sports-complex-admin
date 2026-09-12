using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Data;

namespace SportsComplex.Api.Tests;

public static class TestDbFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
