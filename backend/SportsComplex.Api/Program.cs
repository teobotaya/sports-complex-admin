using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new TimeOnlyJsonConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<JwtTokenService>();

builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<CanchaService>();
builder.Services.AddScoped<ClienteService>();
builder.Services.AddScoped<DisponibilidadService>();
builder.Services.AddScoped<ReservaService>();
builder.Services.AddScoped<PagoService>();
builder.Services.AddScoped<CancelacionService>();
builder.Services.AddScoped<DevolucionService>();
builder.Services.AddScoped<TorneoService>();
builder.Services.AddScoped<EquipoService>();
builder.Services.AddScoped<IntegranteService>();
builder.Services.AddScoped<PartidoService>();
builder.Services.AddScoped<NotificacionService>();
builder.Services.AddScoped<ReportesService>();
builder.Services.AddScoped<EstadisticasService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"] ?? string.Empty))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
            uri.Host is "localhost" or "127.0.0.1" &&
            uri.Port is >= 3000 and <= 3010)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    await DbBootstrap.EnsureDatabaseAsync(scope.ServiceProvider, app.Logger);
    await DbBootstrap.EnsureAdminUsuarioAsync(scope.ServiceProvider, app.Configuration);
}

app.Run();
