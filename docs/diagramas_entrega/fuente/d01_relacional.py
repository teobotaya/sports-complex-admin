import sys; sys.path.insert(0, "/home/claude/diagkit")
from diagkit import *
from model import TABLES, FKS

def build():
    OY = 60
    C0, C1, C2, C3 = 80, 600, 1120, 1640
    W = 380
    d = Diagram(2080, 1960, title="Diagrama Relacional de la Base de Datos — ComplejoDeportivoDB",
                subtitle="SQL Server · 14 tablas · notación de pata de gallo (Information Engineering) · estructura generada desde el modelo EF Core del sistema")
    T = lambda name, x, y: d.add(TableBox(name, x, y, TABLES[name]["rows"]))
    HDR, ROW = TableBox.HDR, TableBox.ROW
    def top_for(name, col, y):  # top de la tabla para que la fila `col` quede en y
        i = [r[1] for r in TABLES[name]["rows"]].index(col)
        return y - HDR - ROW * i - ROW / 2

    # Reserva y Usuario se unen por tres caminos (directo, vía Cancelacion y vía Pago):
    # Cancelacion va por arriba de la línea Reserva–Usuario y Pago por debajo, así nada se cruza.
    Dv = T("Devolucion", C3, OY + 60)
    Cn = T("Cancelacion", C2, top_for("Cancelacion", "id_cancelacion", Dv.row_y("id_cancelacion")))
    U = T("Usuario", C2, Cn.b + 100)
    R = T("Reserva", C1, top_for("Reserva", "id_usuario", U.row_y("id_usuario")))
    Cl = T("Cliente", C0, top_for("Cliente", "id_cliente", R.row_y("id_cliente")))
    Ca = T("Cancha", C0, Cl.b + 70)
    N = T("Notificacion", C3, top_for("Notificacion", "id_usuario", U.row_y("rol")))
    Au = T("Auditoria", C3, N.b + 70)
    Pg = T("Pago", C1, R.b + 90)
    To = T("Torneo", C1, Pg.b + 80)
    Eq = T("Equipo", C1, To.b + 90)
    Pa = T("Partido", C0, top_for("Partido", "id_equipo_local", Eq.row_y("id_equipo")))
    It = T("Integrante", C2, top_for("Integrante", "id_equipo", Eq.row_y("contacto_nombre")))
    Pr = T("Parametro", C2, Pg.row_y("id_usuario") + 120)

    def fk(child, col, parent, pts, unique=False):
        return d.edge(child.id, parent.id, pts, start=("zero_one" if unique else "many_zero"), end="one",
                      id=f"{child.id}.{col} → {parent.id}")
    y = R.row_y("id_cliente"); fk(R, "id_cliente", Cl, [(R.l, y), (Cl.r, y)])
    y = R.row_y("id_cancha"); yc = Ca.row_y("id_cancha")
    fk(R, "id_cancha", Ca, [(R.l, y), (C1 - 70, y), (C1 - 70, yc), (Ca.r, yc)])
    y = R.row_y("id_usuario"); fk(R, "id_usuario", U, [(R.r, y), (U.l, y)])
    # Cancelacion (arriba): a Reserva por su PK y a Usuario entrando por arriba
    y = Cn.row_y("id_reserva"); ye = R.row_y("id_reserva")
    fk(Cn, "id_reserva", R, [(Cn.l, y), (C2 - 60, y), (C2 - 60, ye), (R.r, ye)], unique=True)
    y = Cn.row_y("id_usuario"); xv = Cn.r + 55; yb = Cn.b + 40; xu = U.r - 100
    fk(Cn, "id_usuario", U, [(Cn.r, y), (xv, y), (xv, yb), (xu, yb), (xu, U.t)])
    y = Dv.row_y("id_cancelacion"); fk(Dv, "id_cancelacion", Cn, [(Dv.l, y), (Cn.r, y)], unique=True)
    y = Dv.row_y("id_usuario"); ye = U.row_y("id_usuario"); xv = C3 - 60
    fk(Dv, "id_usuario", U, [(Dv.l, y), (xv, y), (xv, ye), (U.r, ye)])
    y = N.row_y("id_usuario"); fk(N, "id_usuario", U, [(N.l, y), (U.r, y)])
    y = Au.row_y("id_usuario"); ye = U.row_y("fecha_creacion"); xv = C3 - 60
    fk(Au, "id_usuario", U, [(Au.l, y), (xv, y), (xv, ye), (U.r, ye)])
    # Pago (abajo): a Reserva por la izquierda y a Usuario entrando por abajo
    y = Pg.row_y("id_reserva"); ye = R.b - 30
    fk(Pg, "id_reserva", R, [(Pg.l, y), (C1 - 50, y), (C1 - 50, ye), (R.l, ye)])
    y = Pg.row_y("id_usuario"); xu = U.l + 120
    fk(Pg, "id_usuario", U, [(Pg.r, y), (xu, y), (xu, U.b)])
    y = Pa.row_y("id_torneo"); ye = To.b - 30
    fk(Pa, "id_torneo", To, [(Pa.r, y), (C1 - 70, y), (C1 - 70, ye), (To.l, ye)])
    y = Pa.row_y("id_equipo_local"); fk(Pa, "id_equipo_local", Eq, [(Pa.r, y), (Eq.l, y)])
    y = Pa.row_y("id_equipo_visitante"); fk(Pa, "id_equipo_visitante", Eq, [(Pa.r, y), (Eq.l, y)])
    y = Pa.row_y("id_cancha"); ye = Ca.b - 30
    fk(Pa, "id_cancha", Ca, [(Pa.l, y), (C0 - 54, y), (C0 - 54, ye), (Ca.l, ye)])
    y = Eq.row_y("id_torneo"); ye = To.b - 30; xv = Eq.r + 50
    fk(Eq, "id_torneo", To, [(Eq.r, y), (xv, y), (xv, ye), (To.r, ye)])
    y = It.row_y("id_equipo"); fk(It, "id_equipo", Eq, [(It.l, y), (Eq.r, y)])

    # referencias
    lx, ly = C2, max(It.b, Au.b) + 70
    legend_box(d, lx, ly, [
        (sample_edge("one", "many_zero"), "Uno (tabla referenciada)  —  cero o muchos (tabla que tiene la FK)"),
        (sample_edge("one", "zero_one"), "Uno  —  cero o uno (la FK además es única)"),
        (lambda x, y: Text("PK", x + 20, y + 4, 11, bold=True, color=ACCENT).svg(), "Clave primaria (columna subrayada)"),
        (lambda x, y: Text("FK", x + 20, y + 4, 11, bold=True, color=ACCENT).svg(), "Clave foránea: la línea sale de esa columna"),
        (lambda x, y: Text("UK", x + 20, y + 4, 11, bold=True, color=ACCENT).svg(), "Valor único"),
        (lambda x, y: Text("U1", x + 20, y + 4, 11, bold=True, color=ACCENT).svg(), "Combinación única entre las columnas marcadas U1 (*)"),
        (lambda x, y: Text("NULL", x + 18, y + 4, 10, color=MUTED).svg(), "Admite valores nulos (el resto es NOT NULL)"),
    ], w=820)
    d.text("(*) En Reserva: cancha + fecha + hora de inicio, única sólo entre reservas no canceladas.",
           lx, ly + 36 + 30 * 7 + 30, 12, color=MUTED)
    d.text("     En Notificacion: usuario + tipo + referencia, única cuando hay referencia (índices filtrados).",
           lx, ly + 36 + 30 * 7 + 50, 12, color=MUTED)
    return d, dict(R=R)

def semantic_check(d):
    """El diagrama debe contener exactamente las tablas, columnas y FK del modelo real."""
    P = []
    tabs = {s.id: s for s in d.shapes.values() if s.kind == "table"}
    if set(tabs) != set(TABLES): P.append(f"TABLAS distintas: {set(tabs) ^ set(TABLES)}")
    for name, s in tabs.items():
        if s.rows != TABLES[name]["rows"]: P.append(f"COLUMNAS distintas en {name}")
    drawn = set()
    for e in d.edges:
        child, rest = e.id.split(".", 1); col, parent = [x.strip() for x in rest.split("→")]
        drawn.add((child, col, parent))
        unique = [f for f in FKS if f[0] == child and f[1] == col][0][3]
        if (e.start == "zero_one") != unique: P.append(f"CARDINALIDAD incorrecta en {e.id}")
        # la línea debe salir de la fila de la columna FK
        y0 = e.pts[0][1]
        if abs(d.shapes[child].row_y(col) - y0) > 0.5: P.append(f"{e.id} no sale de la fila {col}")
        # y llegar a la tabla referenciada
        if e.dst != parent: P.append(f"{e.id} llega a {e.dst}")
    expected = {(c, col, p) for c, col, p, _ in FKS}
    if drawn != expected: P.append(f"FK faltantes/sobrantes: {expected ^ drawn}")
    return P

if __name__ == "__main__":
    d, _ = build()
    P = d.verify(verbose=True) + semantic_check(d)
    print("\n".join(P) or "OK")
    d.save(sys.argv[1] if len(sys.argv) > 1 else "/home/claude/out/01_relacional")
