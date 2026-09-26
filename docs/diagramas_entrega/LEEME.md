# Diagramas para la entrega (Seminario de Integración Profesional)

Generados desde el modelo real de la base (Entity Framework Core) y verificados automáticamente:
ninguna línea se cruza con otra, ninguna pasa por encima de una caja y ninguna etiqueta queda
sobre una línea o ambigua. Además se comprueba que tablas, columnas, claves foráneas,
atributos y clases coincidan exactamente con el código.

| Archivo | Contenido (norma de entrega) |
|---|---|
| 01_relacional | Diagrama Relacional de la Base de Datos |
| 13_diccionario_de_datos.pdf | Diccionario de datos |
| 02_der_general, 03 y 04 | Diagrama de Entidad-Relación (general y con atributos) |
| 06_casos_de_uso | Diagrama de Casos de uso |
| 07 y 08 | Diagrama de Flujo de Datos (nivel 0 y nivel 1) |
| 05_clases_dominio | Diagrama de Clases |
| 09 a 12 | Diagramas de Secuencia |
| Diagramas_Entrega_A3.pdf | Todos los diagramas en A3 apaisado, numerados y con epígrafe |

Cada diagrama está en .png (para Word), .svg (vectorial) y .pdf (para imprimir).

Para regenerarlos: `cd fuente && python3 d01_relacional.py` (y así con cada script).
Requiere Python 3 con `shapely`, `cairosvg`, `pillow` y la fuente DejaVu Sans.
