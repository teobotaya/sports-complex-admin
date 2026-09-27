import sys, re; sys.path.insert(0, "/home/claude/diagkit")
from diagkit import *
from d02_der import near_label

ENT_DIR = "/home/claude/sca/backend/SportsComplex.Api/Entities/"
CS_TYPES = {"int", "string", "decimal", "bool", "DateOnly", "TimeOnly", "DateTime"}

def props(cls):
    """Propiedades escalares de la entidad C# (en orden), con tipo y si admiten null."""
    src = open(ENT_DIR + cls + ".cs").read()
    out = []
    for typ, nul, name in re.findall(r"public (\w+)(\??) (\w+) \{ get; set; \}", src):
        if typ in CS_TYPES: out.append((name, typ, bool(nul)))
    return out

def navs(cls):
    src = open(ENT_DIR + cls + ".cs").read()
    single = re.findall(r"public (\w+)\? (\w+) \{ get; set; \}", src)
    many = re.findall(r"public ICollection<(\w+)> (\w+) ", src)
    return [(t, n) for t, n in single if t not in CS_TYPES], many

def opcional(cls, fkattr):
    """FK que admite NULL (ej. Pago.IdUsuario): del lado del padre la multiplicidad es 0..1."""
    return any(n == fkattr and nul for n, t, nul in props(cls if isinstance(cls, str) else cls.id))

def attr_text(name, typ, nul):
    return f"+ {name}: {typ}" + (" [0..1]" if nul else "")

def build():
    OY = 90
    C0, C1, C2, C3 = 80, 560, 1040, 1520
    W = 320
    d = Diagram(1920, 1640, title="Diagrama de Clases — modelo de dominio",
                subtitle="UML · clases de SportsComplex.Api.Entities · asociaciones navegables en ambos sentidos · multiplicidad en cada extremo")
    boxes = {}
    def C(name, x, y):
        b = d.add(ClassBox(name, x, y, [attr_text(*p) for p in props(name)], ops=(), w=W))
        b.names = [p[0] for p in props(name)]
        boxes[name] = b; return b
    def top_for(name, attr, y):
        i = [p[0] for p in props(name)].index(attr)
        hdr = ClassBox.HDR
        return y - hdr - ClassBox.PAD - ClassBox.ROW * i - ClassBox.ROW / 2
    def ry(b, attr): return b.row_y(b.names.index(attr))

    # Misma disposición que el diagrama relacional: Cancelacion por arriba de Reserva–Usuario y Pago por debajo.
    Dv = C("Devolucion", C3, OY + 60)
    Cn = C("Cancelacion", C2, top_for("Cancelacion", "IdCancelacion", ry(Dv, "IdCancelacion")))
    U = C("Usuario", C2, Cn.b + 100)
    R = C("Reserva", C1, top_for("Reserva", "IdUsuario", ry(U, "IdUsuario")))
    Cl = C("Cliente", C0, top_for("Cliente", "IdCliente", ry(R, "IdCliente")))
    Ca = C("Cancha", C0, Cl.b + 70)
    N = C("Notificacion", C3, top_for("Notificacion", "IdUsuario", ry(U, "Rol")))
    Au = C("Auditoria", C3, N.b + 70)
    Pg = C("Pago", C1, R.b + 90)
    To = C("Torneo", C1, Pg.b + 80)
    Eq = C("Equipo", C1, To.b + 90)
    Pa = C("Partido", C0, top_for("Partido", "IdEquipoLocal", ry(Eq, "IdEquipo")))
    It = C("Integrante", C2, top_for("Integrante", "IdEquipo", ry(Eq, "ContactoNombre")))
    Pr = C("Parametro", C2, ry(Pg, "IdUsuario") + 120)

    def assoc(child, fkattr, parent, pts, many="0..*", role=None, sc="above", sp="above", dc=22):
        e = d.edge(child.id, parent.id, pts, id=f"{child.id}.{fkattr} → {parent.id}")
        near_label(e, many, "start", dc, sc)
        near_label(e, "1" if not opcional(child, fkattr) else "0..1", "end", 16 if not opcional(child, fkattr) else 22, sp)
        return e
    y = ry(R, "IdCliente"); assoc(R, "IdCliente", Cl, [(R.l, y), (Cl.r, y)])
    y = ry(R, "IdCancha"); yc = ry(Ca, "IdCancha")
    assoc(R, "IdCancha", Ca, [(R.l, y), (C1 - 70, y), (C1 - 70, yc), (Ca.r, yc)], sc="below")
    y = ry(R, "IdUsuario"); assoc(R, "IdUsuario", U, [(R.r, y), (U.l, y)])
    y = ry(Cn, "IdReserva"); ye = ry(R, "IdReserva")
    assoc(Cn, "IdReserva", R, [(Cn.l, y), (C2 - 60, y), (C2 - 60, ye), (R.r, ye)], many="0..1")
    y = ry(Cn, "IdUsuario"); xv = Cn.r + 55; yb = Cn.b + 40; xu = U.r - 100
    assoc(Cn, "IdUsuario", U, [(Cn.r, y), (xv, y), (xv, yb), (xu, yb), (xu, U.t)], sp="right")
    y = ry(Dv, "IdCancelacion"); assoc(Dv, "IdCancelacion", Cn, [(Dv.l, y), (Cn.r, y)], many="0..1")
    y = ry(Dv, "IdUsuario"); ye = ry(U, "IdUsuario"); xv = C3 - 60
    assoc(Dv, "IdUsuario", U, [(Dv.l, y), (xv, y), (xv, ye), (U.r, ye)], sc="below")
    y = ry(N, "IdUsuario"); assoc(N, "IdUsuario", U, [(N.l, y), (U.r, y)])
    y = ry(Au, "IdUsuario"); ye = ry(U, "FechaCreacion"); xv = C3 - 60
    assoc(Au, "IdUsuario", U, [(Au.l, y), (xv, y), (xv, ye), (U.r, ye)], sp="below")
    y = ry(Pg, "IdReserva"); ye = R.b - 30
    assoc(Pg, "IdReserva", R, [(Pg.l, y), (C1 - 50, y), (C1 - 50, ye), (R.l, ye)])
    y = ry(Pg, "IdUsuario"); xu = U.l + 120
    assoc(Pg, "IdUsuario", U, [(Pg.r, y), (xu, y), (xu, U.b)], sp="right")
    y = ry(Pa, "IdTorneo"); ye = To.b - 30
    e = d.edge(Pa.id, To.id, [(Pa.r, y), (Pa.r + 40, y), (Pa.r + 40, ye), (To.l, ye)], id="Partido.IdTorneo → Torneo")
    e.label_xy("0..*", Pa.r + 32, y - 18, 12, "end")
    near_label(e, "1", "end", 16, "below")
    y = ry(Pa, "IdEquipoLocal"); assoc(Pa, "IdEquipoLocal", Eq, [(Pa.r, y), (Eq.l, y)], sp="above", sc="above", dc=75)
    y = ry(Pa, "IdEquipoVisitante"); assoc(Pa, "IdEquipoVisitante", Eq, [(Pa.r, y), (Eq.l, y)], sp="below", sc="below")
    y = ry(Pa, "IdCancha"); ye = Ca.b - 30
    assoc(Pa, "IdCancha", Ca, [(Pa.l, y), (C0 - 54, y), (C0 - 54, ye), (Ca.l, ye)], sc="below", sp="above")
    y = ry(Eq, "IdTorneo"); ye = To.b - 30; xv = Eq.r + 50
    assoc(Eq, "IdTorneo", To, [(Eq.r, y), (xv, y), (xv, ye), (To.r, ye)], sc="above", sp="below")
    y = ry(It, "IdEquipo"); assoc(It, "IdEquipo", Eq, [(It.l, y), (Eq.r, y)])
    return d

def semantic_check(d):
    P = []
    import os
    classes = sorted(f[:-3] for f in os.listdir(ENT_DIR) if f.endswith(".cs"))
    drawn = sorted(s.id for s in d.shapes.values() if s.kind == "class")
    if classes != drawn: P.append(f"CLASES distintas {set(classes) ^ set(drawn)}")
    for c in drawn:
        exp = [attr_text(*p) for p in props(c)]
        if d.shapes[c].attrs != exp: P.append(f"ATRIBUTOS distintos en {c}")
    # cada propiedad de navegación "padre" (X? Nav) debe tener su asociación
    exp_assoc = set()
    for c in classes:
        single, many = navs(c)
        for t, n in single:
            fk = "Id" + n if ("Id" + n) in [p[0] for p in props(c)] else None
            if fk: exp_assoc.add((c, fk, t))
    got = set()
    for e in d.edges:
        child, rest = e.id.split(".", 1); fk, parent = [x.strip() for x in rest.split("→")]
        got.add((child, fk, parent))
    if exp_assoc != got: P.append(f"ASOCIACIONES distintas: {exp_assoc ^ got}")
    return P

if __name__ == "__main__":
    d = build()
    P = d.verify(verbose=True) + semantic_check(d)
    print("\n".join(P) or "OK")
    d.save("/home/claude/out/05_clases_dominio")
