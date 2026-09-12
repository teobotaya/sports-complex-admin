/*
  Sistema de Gestión Integral para Complejo Deportivo
  Script de creación de base de datos - SQL Server
  Fuente: docs/Trabajo_Acumulativo_Seminario_Teo_Botaya (1).pdf
          Sección 5 - Base de Datos (Modelo Relacional) + Sección 3 (reglas de negocio)

  NOTA: Este script documenta el modelo relacional y sirve como referencia manual.
  La fuente autoritativa de la estructura, aplicada realmente contra la base, son las
  migraciones EF Core en backend/SportsComplex.Api/Migrations (ejecutar con
  `dotnet ef database update`). Ambos están sincronizados; ver también
  database/ef_generated_script.sql (script idempotente generado desde las migraciones).
*/

IF DB_ID(N'ComplejoDeportivoDB') IS NULL
BEGIN
    CREATE DATABASE ComplejoDeportivoDB;
END
GO

USE ComplejoDeportivoDB;
GO

-- =========================================================
-- CLIENTE
-- =========================================================
CREATE TABLE dbo.Cliente (
    id_cliente      INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo VARCHAR(150)  NOT NULL,
    telefono        VARCHAR(20)   NOT NULL UNIQUE,
    observaciones   NVARCHAR(MAX) NULL,
    fecha_alta      DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE)
);
GO

-- =========================================================
-- USUARIO
-- =========================================================
CREATE TABLE dbo.Usuario (
    id_usuario      INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo VARCHAR(150)  NOT NULL,
    username        VARCHAR(50)   NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    rol             VARCHAR(20)   NOT NULL
        CHECK (rol IN ('administrador', 'empleado')),
    activo          BIT           NOT NULL DEFAULT 1,
    fecha_creacion  DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);
GO

-- =========================================================
-- CANCHA
-- =========================================================
CREATE TABLE dbo.Cancha (
    id_cancha       INT IDENTITY(1,1) PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL UNIQUE,
    tipo_superficie VARCHAR(50)   NULL,
    precio_por_hora DECIMAL(10,2) NOT NULL CHECK (precio_por_hora > 0),
    activa          BIT           NOT NULL DEFAULT 1
);
GO

-- =========================================================
-- RESERVA
-- =========================================================
CREATE TABLE dbo.Reserva (
    id_reserva      INT IDENTITY(1,1) PRIMARY KEY,
    id_cliente      INT           NOT NULL,
    id_cancha       INT           NOT NULL,
    id_usuario      INT           NOT NULL,
    fecha           DATE          NOT NULL,
    hora_inicio     TIME          NOT NULL,
    hora_fin        TIME          NOT NULL,
    estado_reserva  VARCHAR(20)   NOT NULL DEFAULT 'Pendiente'
        CHECK (estado_reserva IN ('Confirmada', 'Pendiente', 'Cancelada')),
    estado_pago     VARCHAR(30)   NOT NULL DEFAULT 'Pendiente'
        CHECK (estado_pago IN ('Pendiente', 'Parcialmente abonado', 'Abonado')),
    observaciones   NVARCHAR(MAX) NULL,
    fecha_creacion  DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Reserva_Cliente FOREIGN KEY (id_cliente) REFERENCES dbo.Cliente(id_cliente),
    CONSTRAINT FK_Reserva_Cancha  FOREIGN KEY (id_cancha)  REFERENCES dbo.Cancha(id_cancha),
    CONSTRAINT FK_Reserva_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario(id_usuario),
    CONSTRAINT CK_Reserva_Horario CHECK (hora_fin > hora_inicio)
);
GO

-- Regla: no puede haber dos reservas activas en la misma cancha, fecha y horario.
CREATE UNIQUE INDEX UX_Reserva_Cancha_Fecha_Horario
    ON dbo.Reserva (id_cancha, fecha, hora_inicio)
    WHERE estado_reserva <> 'Cancelada';
GO

CREATE INDEX IX_Reserva_Cliente ON dbo.Reserva(id_cliente);
CREATE INDEX IX_Reserva_Fecha   ON dbo.Reserva(fecha);
GO

-- =========================================================
-- PAGO
-- =========================================================
CREATE TABLE dbo.Pago (
    id_pago         INT IDENTITY(1,1) PRIMARY KEY,
    id_reserva      INT           NOT NULL,
    monto           DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    metodo_pago     VARCHAR(30)   NOT NULL,
    fecha_pago      DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    observaciones   NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Pago_Reserva FOREIGN KEY (id_reserva) REFERENCES dbo.Reserva(id_reserva)
);
GO

CREATE INDEX IX_Pago_Reserva ON dbo.Pago(id_reserva);
GO

-- =========================================================
-- CANCELACION
-- =========================================================
CREATE TABLE dbo.Cancelacion (
    id_cancelacion    INT IDENTITY(1,1) PRIMARY KEY,
    id_reserva        INT           NOT NULL UNIQUE,
    id_usuario        INT           NOT NULL,
    motivo            NVARCHAR(MAX) NULL,
    fecha_cancelacion DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Cancelacion_Reserva FOREIGN KEY (id_reserva) REFERENCES dbo.Reserva(id_reserva),
    CONSTRAINT FK_Cancelacion_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario(id_usuario)
);
GO

-- =========================================================
-- DEVOLUCION
-- =========================================================
CREATE TABLE dbo.Devolucion (
    id_devolucion   INT IDENTITY(1,1) PRIMARY KEY,
    id_cancelacion  INT           NOT NULL UNIQUE,
    monto_devuelto  DECIMAL(10,2) NOT NULL CHECK (monto_devuelto > 0),
    metodo          VARCHAR(30)   NOT NULL,
    fecha           DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    observaciones   NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Devolucion_Cancelacion FOREIGN KEY (id_cancelacion) REFERENCES dbo.Cancelacion(id_cancelacion)
);
GO

-- =========================================================
-- NOTIFICACION
-- =========================================================
CREATE TABLE dbo.Notificacion (
    id_notificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario      INT           NOT NULL,
    tipo            VARCHAR(50)   NOT NULL,
    mensaje         NVARCHAR(MAX) NOT NULL,
    leida           BIT           NOT NULL DEFAULT 0,
    fecha_creacion  DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Notificacion_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario(id_usuario)
);
GO

CREATE INDEX IX_Notificacion_Usuario ON dbo.Notificacion(id_usuario);
GO

-- =========================================================
-- TORNEO
-- =========================================================
CREATE TABLE dbo.Torneo (
    id_torneo    INT IDENTITY(1,1) PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    fecha_inicio DATE         NOT NULL,
    fecha_fin    DATE         NOT NULL,
    categoria    VARCHAR(50)  NULL,
    estado       VARCHAR(20)  NOT NULL DEFAULT 'Planificado'
        CHECK (estado IN ('Planificado', 'En curso', 'Finalizado')),
    CONSTRAINT CK_Torneo_Fechas CHECK (fecha_fin >= fecha_inicio)
);
GO

-- =========================================================
-- EQUIPO
-- =========================================================
CREATE TABLE dbo.Equipo (
    id_equipo         INT IDENTITY(1,1) PRIMARY KEY,
    id_torneo         INT          NOT NULL,
    nombre            VARCHAR(150) NOT NULL,
    contacto_nombre   VARCHAR(150) NULL,
    contacto_telefono VARCHAR(20)  NULL,
    CONSTRAINT FK_Equipo_Torneo FOREIGN KEY (id_torneo) REFERENCES dbo.Torneo(id_torneo),
    CONSTRAINT UQ_Equipo_Torneo_Nombre UNIQUE (id_torneo, nombre)
);
GO

CREATE INDEX IX_Equipo_Torneo ON dbo.Equipo(id_torneo);
GO

-- =========================================================
-- INTEGRANTE
-- =========================================================
CREATE TABLE dbo.Integrante (
    id_integrante   INT IDENTITY(1,1) PRIMARY KEY,
    id_equipo       INT          NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    dni             VARCHAR(15)  NOT NULL,
    CONSTRAINT FK_Integrante_Equipo FOREIGN KEY (id_equipo) REFERENCES dbo.Equipo(id_equipo),
    CONSTRAINT UQ_Integrante_Equipo_Dni UNIQUE (id_equipo, dni)
);
GO

CREATE INDEX IX_Integrante_Equipo ON dbo.Integrante(id_equipo);
GO

-- =========================================================
-- PARTIDO
-- =========================================================
CREATE TABLE dbo.Partido (
    id_partido          INT IDENTITY(1,1) PRIMARY KEY,
    id_torneo           INT         NOT NULL,
    id_equipo_local     INT         NOT NULL,
    id_equipo_visitante INT         NOT NULL,
    id_cancha           INT         NOT NULL,
    fecha               DATE        NOT NULL,
    hora_inicio         TIME        NOT NULL,
    goles_local         INT         NULL CHECK (goles_local >= 0),
    goles_visitante     INT         NULL CHECK (goles_visitante >= 0),
    estado              VARCHAR(20) NOT NULL DEFAULT 'Programado'
        CHECK (estado IN ('Programado', 'Jugado')),
    CONSTRAINT FK_Partido_Torneo           FOREIGN KEY (id_torneo)           REFERENCES dbo.Torneo(id_torneo),
    CONSTRAINT FK_Partido_EquipoLocal       FOREIGN KEY (id_equipo_local)     REFERENCES dbo.Equipo(id_equipo),
    CONSTRAINT FK_Partido_EquipoVisitante   FOREIGN KEY (id_equipo_visitante) REFERENCES dbo.Equipo(id_equipo),
    CONSTRAINT FK_Partido_Cancha            FOREIGN KEY (id_cancha)           REFERENCES dbo.Cancha(id_cancha),
    CONSTRAINT CK_Partido_EquiposDistintos CHECK (id_equipo_local <> id_equipo_visitante)
);
GO

-- Regla: no pueden programarse dos partidos en la misma cancha y horario.
CREATE UNIQUE INDEX UX_Partido_Cancha_Fecha_Horario
    ON dbo.Partido (id_cancha, fecha, hora_inicio);
GO

CREATE INDEX IX_Partido_Torneo ON dbo.Partido(id_torneo);
GO
