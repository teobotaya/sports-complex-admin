/*
  Datos iniciales mínimos - Sistema de Gestión Integral para Complejo Deportivo
  Fuente: docs - Estudio de Prefactibilidad ("tres canchas de fútbol cinco y
  una cancha de fútbol siete, todas con iluminación nocturna").

  El usuario administrador inicial se crea desde el backend (no en SQL plano)
  para garantizar que la contraseña se almacene con hash criptográfico.
*/

USE ComplejoDeportivoDB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Cancha)
BEGIN
    INSERT INTO dbo.Cancha (nombre, tipo_superficie, precio_por_hora, activa) VALUES
        ('Cancha 1 - Futbol 5', 'Cesped sintetico', 15000.00, 1),
        ('Cancha 2 - Futbol 5', 'Cesped sintetico', 15000.00, 1),
        ('Cancha 3 - Futbol 5', 'Cesped sintetico', 15000.00, 1),
        ('Cancha 4 - Futbol 7', 'Cesped sintetico', 22000.00, 1);
END
GO
