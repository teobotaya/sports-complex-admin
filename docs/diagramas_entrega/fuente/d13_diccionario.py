"""Diccionario de datos generado desde el modelo real de la base (EF Core) → HTML → PDF."""
import sys, json, html, re; sys.path.insert(0, "/home/claude/diagkit")
from model import TABLES, FKS
D = json.load(open("/home/claude/diagkit/descripciones.json"))
ORDER = ["Cliente", "Usuario", "Cancha", "Reserva", "Pago", "Cancelacion", "Devolucion", "Notificacion",
         "Torneo", "Equipo", "Integrante", "Partido", "Auditoria", "Parametro"]
SIZE = {"int": "4 bytes", "bit": "1 bit", "date": "3 bytes", "time": "5 bytes", "datetime2": "8 bytes"}
e = html.escape

def tipo_tam(t):
    m = re.match(r"(\w+)\((.+)\)", t)
    if m: return m.group(1).upper(), m.group(2).upper()
    return t.upper(), SIZE.get(t, "")

def restr(table, name, tags):
    out = []
    if "PK" in tags: out.append("PK · IDENTITY(1,1)")
    for c, col, p, u in FKS:
        if c == table and col == name: out.append(f"FK → {p}(id_{p.lower()})")
    if "UK" in tags: out.append("UNIQUE")
    for k, u in enumerate(TABLES[table]["uniq_multi"], 1):
        if name in u["cols"]:
            txt = "UNIQUE (" + " + ".join(u["cols"]) + ")"
            if u["filter"]: txt += " sólo entre reservas no canceladas"
            out.append(txt)
    for ck, sql in TABLES[table]["checks"]:
        if re.search(r"\b%s\b" % name, sql): out.append(f"CHECK ({sql})")
    return out

def build():
    parts = ["""<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 14mm 12mm; }
    body { font-family: 'DejaVu Sans', Arial, sans-serif; color:#1f2933; font-size: 9.5pt; }
    h1 { font-size: 18pt; margin: 0 0 4px; } .sub { color:#52606d; margin: 0 0 14px; }
    h2 { font-size: 12.5pt; margin: 18px 0 2px; } p.t { margin: 0 0 6px; color:#3e4c59; }
    table { width:100%; border-collapse: collapse; page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    th { background:#e4ebe6; text-align:left; padding:5px 6px; border:1px solid #9aa5b1; font-size:8.5pt; }
    td { padding:4px 6px; border:1px solid #c7cfd6; vertical-align: top; }
    td.n { font-weight: bold; white-space: nowrap; } td.k { font-size: 8.3pt; color:#1f6f4a; }
    .sec { page-break-inside: avoid; }
    .nota { border:1px solid #c7cfd6; padding:8px 10px; background:#f7f9f8; margin-bottom: 10px; }
    </style></head><body>
    <h1>Diccionario de Datos — ComplejoDeportivoDB</h1>
    <p class="sub">SQL Server · 14 tablas · tipos, nulabilidad y restricciones tomados del modelo real que usa el sistema (Entity Framework Core)</p>
    <div class="nota"><b>Cómo leerlo.</b> «Tamaño»: longitud declarada en los tipos de largo variable (NVARCHAR, DECIMAL) o espacio en disco en los de largo fijo; MAX = texto libre.
    «Nulo»: No = el dato es obligatorio (NOT NULL). En «Restricciones» figuran la clave primaria, las claves foráneas y las reglas CHECK/UNIQUE que aplica el motor.
    Todas las FK usan ON DELETE NO ACTION: no se puede borrar un registro que tenga otros que dependan de él.</div>"""]
    for t in ORDER:
        v = TABLES[t]
        parts.append(f'<div class="sec"><h2>{e(t)}</h2><p class="t">{e(D["t"][t])}</p>'
                     '<table><tr><th style="width:15%">Campo</th><th style="width:10%">Tipo</th><th style="width:7%">Tamaño</th>'
                     '<th style="width:5%">Nulo</th><th style="width:27%">Restricciones</th><th>Descripción</th></tr>')
        for tags, name, typ, nul in v["rows"]:
            ty, sz = tipo_tam(typ)
            if "PK" in tags: ty += ""
            parts.append(f'<tr><td class="n">{e(name)}</td><td>{e(ty)}</td><td>{e(sz)}</td><td>{"Sí" if nul else "No"}</td>'
                         f'<td class="k">{"<br>".join(e(x) for x in restr(t, name, tags))}</td><td>{e(D["c"][t][name])}</td></tr>')
        parts.append("</table></div>")
    parts.append("</body></html>")
    return "\n".join(parts)

def check():
    P = []
    for t in ORDER:
        for tags, name, typ, nul in TABLES[t]["rows"]:
            if name not in D["c"][t]: P.append(f"sin descripción {t}.{name}")
            d = D["c"][t][name].lower()
            if nul and "obligatori" in d: P.append(f"contradicción nulo {t}.{name}")
    if set(ORDER) != set(TABLES): P.append("tablas")
    return P

if __name__ == "__main__":
    h = build()
    open("/home/claude/out/13_diccionario_de_datos.html", "w").write(h)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.set_content(h); pg.pdf(path="/home/claude/out/13_diccionario_de_datos.pdf", format="A4", landscape=True,
                                   margin={"top": "14mm", "bottom": "16mm", "left": "12mm", "right": "12mm"},
                                   display_header_footer=True, header_template="<span></span>",
                                   footer_template='<div style="font-size:8px;width:100%;text-align:center;color:#52606d">Diccionario de datos · página <span class="pageNumber"></span> de <span class="totalPages"></span></div>')
        b.close()
    print("\n".join(check()) or "OK")
