# Sports Complex Admin

Sistema de gestión integral (backoffice) para un complejo deportivo: administra canchas,
reservas, clientes, pagos, cancelaciones, torneos, equipos y partidos desde un único panel,
con control de acceso por rol.

<p>
  <img alt="ASP.NET Core 8" src="https://img.shields.io/badge/ASP.NET%20Core-8.0-512BD4?style=flat-square&logo=dotnet&logoColor=white">
  <img alt="Entity Framework Core" src="https://img.shields.io/badge/EF%20Core-8.0-512BD4?style=flat-square">
  <img alt="SQL Server" src="https://img.shields.io/badge/SQL%20Server-2022-CC2927?style=flat-square&logo=microsoftsqlserver&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-17-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-4.4-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-2.9-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white">
  <img alt="Licencia MIT" src="https://img.shields.io/badge/Licencia-MIT-green?style=flat-square">
</p>

---

## Qué resuelve

Un complejo deportivo gestiona el turnero a mano: cuadernos, planillas y mensajes sueltos.
El problema real no es guardar la reserva, es **evitar que la misma cancha se reserve dos veces
en el mismo horario** y poder saber, en cualquier momento, qué está cobrado y qué no.

Este sistema centraliza esa operación:

- El **cliente no es un usuario del sistema**: es una entidad que el complejo da de alta y
  administra internamente. No existe portal ni login de cliente, porque así funciona el negocio real.
- La **regla de no superposición vive en la base de datos**, no en el formulario: un índice único
  filtrado garantiza la integridad incluso si la reserva entra por otra vía.
- Cada reserva arrastra su **estado de pago**, sus **cancelaciones** y, si corresponde, su **devolución**.

## Arquitectura

```
┌──────────────────────────┐     HTTPS / JSON      ┌───────────────────────────┐
│  Frontend SPA            │  ──────────────────▶  │  API REST                 │
│  React 17 + TypeScript   │  ◀──────────────────  │  ASP.NET Core 8           │
│  Vite · React Router v5  │      JWT Bearer       │  Controllers → Services   │
└──────────────────────────┘                       └────────────┬──────────────┘
                                                                │ EF Core 8
                                                   ┌────────────▼──────────────┐
                                                   │  SQL Server 2022          │
                                                   │  12 tablas · constraints  │
                                                   └───────────────────────────┘
```

Tres capas con responsabilidades separadas: los **controllers** solo validan la entrada y
traducen DTOs, la **lógica de negocio vive en los servicios de dominio**, y la **integridad
se garantiza en la base** mediante constraints e índices.

| Capa | Contenido |
|---|---|
| API | 12 controllers · 48 endpoints REST · autenticación JWT · CORS · Swagger |
| Dominio | 16 servicios (reservas, disponibilidad, pagos, cancelaciones, devoluciones, torneos, estadísticas, reportes…) |
| Datos | 12 entidades EF Core · 12 tablas · migraciones versionadas · scripts de schema y seed |
| Frontend | 17 páginas · layout con sidebar por rol · sistema de diseño propio en CSS |
| Calidad | 24 pruebas unitarias xUnit sobre los servicios · pruebas de componentes con Vitest · integración continua en GitHub Actions |

## Reglas de negocio destacadas

**No superposición de reservas.** Implementada como índice único filtrado, de modo que una
reserva cancelada libera el horario pero una confirmada o pendiente lo bloquea:

```sql
CREATE UNIQUE INDEX UX_Reserva_Cancha_Fecha_Horario
    ON dbo.Reserva (id_cancha, fecha, hora_inicio)
    WHERE estado_reserva <> 'Cancelada';
```

Además, la base valida con `CHECK` que `hora_fin > hora_inicio`, que los montos sean positivos
y que los estados pertenezcan a su dominio (`Confirmada` / `Pendiente` / `Cancelada`,
`Pendiente` / `Parcialmente abonado` / `Abonado`). El servicio de disponibilidad hace la
verificación previa para dar un mensaje claro al usuario; la base es la última línea de defensa.

**Roles.** `administrador` accede a todo; `empleado` (recepción) opera el día a día pero no ve
usuarios, reportes ni estadísticas. El filtrado se aplica tanto en la API (`[Authorize]`) como
en la navegación del frontend.

## Módulos

Canchas · Reservas · Clientes · Pagos · Cancelaciones y devoluciones · Torneos · Equipos e
integrantes · Partidos y tabla de posiciones · Usuarios · Notificaciones · Reportes · Estadísticas

## Documentación técnica

En [`docs/diagramas`](docs/diagramas) están los diagramas del sistema, versionados como código
fuente Mermaid (`.mmd`) además de la imagen renderizada:

| Diagrama | Archivo |
|---|---|
| Relacional de la base de datos | `01_relacional.png` |
| Entidad-Relación | `03_der.png` |
| Clases | `08b_clases.png` |
| Casos de uso | `08a_casos_uso.png` |
| Flujo (alta y cierre de reserva) | `08c1_flujo_alta.png`, `08c2_flujo_cierre.png` |
| Secuencia (login, reserva, cancelación) | `08d`, `08e`, `08f` |

## Puesta en marcha

### Con Docker (recomendado)

Levanta base de datos, API y frontend con un solo comando.

```bash
cp .env.example .env          # completar las credenciales antes de continuar
docker compose up --build
```

Frontend en `http://localhost:8080`, API en `http://localhost:5080`.

### Sin Docker

**Requisitos:** .NET 8 SDK · Node.js 18+ · SQL Server 2022

```bash
# 1. Configuración
cp backend/SportsComplex.Api/appsettings.example.json \
   backend/SportsComplex.Api/appsettings.json

# 2. Backend y frontend en paralelo
npm install
npm run dev:all
```

Frontend en `http://localhost:3000`, Swagger en el puerto que reporte la API.
La primera vez que arranca, la API crea el schema y el usuario administrador inicial.

Si preferís crear la base a mano, los scripts están en [`database/`](database):
`schema.sql` (estructura), `seed.sql` (datos de prueba) y `script_entrega_bd.sql` (script completo).

> Ni `appsettings.json` ni `.env` se versionan, porque contienen credenciales.
> Usá `appsettings.example.json` y `.env.example` como plantillas.

## Tests

```bash
npm run test                                                  # frontend (Vitest)
dotnet test backend/SportsComplex.Api.Tests                   # backend (xUnit)
```

24 pruebas unitarias cubren los servicios de dominio críticos: disponibilidad de canchas,
reservas, pagos, devoluciones, partidos, clientes y usuarios, usando una base en memoria.
Ambas suites, más la compilación y el chequeo de tipos, corren en cada push mediante
GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Estructura

```
sports-complex-admin
├── .github/workflows/ # integración continua
├── docker-compose.yml # base de datos + API + frontend
├── backend/SportsComplex.Api
│   ├── Controllers/   # 12 controllers REST
│   ├── Services/      # 16 servicios de dominio
│   ├── Entities/      # 12 entidades EF Core
│   ├── Dtos/          # contratos de entrada y salida
│   ├── Data/          # DbContext y configuración
│   └── Migrations/    # migraciones EF Core
├── backend/SportsComplex.Api.Tests   # pruebas unitarias (xUnit)
├── database/          # schema.sql · seed.sql · script completo
├── docs/              # diagramas y documentación técnica
└── src/               # SPA React + TypeScript
    └── app/
        ├── api/       # clientes HTTP tipados
        ├── components/
        ├── context/   # AuthContext (JWT)
        ├── layouts/
        ├── pages/     # 17 páginas
        └── styles/    # sistema de diseño (tokens CSS)
```

## Autor

**Teo Matías Botaya** — Licenciatura en Sistemas de Información, Universidad del Salvador (sede Pilar).
Proyecto desarrollado de forma individual: modelado de datos, API, frontend y documentación técnica.

[teobotaya@gmail.com](mailto:teobotaya@gmail.com) · [github.com/teobotaya](https://github.com/teobotaya)

## Licencia

MIT — ver [LICENSE](LICENSE).
