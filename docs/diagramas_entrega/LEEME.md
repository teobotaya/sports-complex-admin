# Diagramas para la entrega (Seminario de Integración Profesional)

Generados desde el modelo real de la base (Entity Framework Core) y verificados automáticamente:
ninguna línea se cruza con otra, ninguna pasa por encima de una caja y ninguna etiqueta queda
sobre una línea o ambigua. Además se comprueba que tablas, columnas, claves foráneas,
atributos y clases coincidan exactamente con el código.

| Archivo | Contenido (norma de entrega) |
|---|---|
| 01_relacional | Diagrama Relacional de la Base de Datos |
| 13_diccionario_de_datos.pdf | Diccionario de datos |
| 02_der_general, 03, 04 y 04b | Diagrama de Entidad-Relación (general y con atributos: operación, torneos, auditoría y administración) |
| 06_casos_de_uso | Diagrama de Casos de uso |
| 07 y 08 | Diagrama de Flujo de Datos (nivel 0 y nivel 1) |
| 05_clases_dominio | Diagrama de Clases |
| 09 a 12 | Diagramas de Secuencia |
| Diagramas_Entrega_A3.pdf | Las 13 láminas A3 apaisadas que se imprimen aparte; cada una indica su número de figura en el libro integrador |

Incluyen las tablas Auditoria (quién, cuándo y qué cambió) y Parametro (minutos de inactividad),
la asistencia de cada reserva y el usuario responsable de pagos y devoluciones (actualización del 26/09/2026).

Cada diagrama está en .png (para Word), .svg (vectorial) y .pdf (para imprimir).

Para regenerarlos: `cd fuente && python3 d01_relacional.py` (y así con cada script).
Requiere Python 3 con `shapely`, `cairosvg`, `pillow` y la fuente DejaVu Sans.

Actualización del 05/10/2026: el diagrama de casos de uso separa «CU-06 Inscribir equipos en un torneo»
(empleado) de «CU-13 Crear y editar torneo» (solo administrador), como funciona el sistema; el diagrama
de secuencia de la reserva muestra también el aviso «La cancha está reservada por torneo».

