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

def attr_text(name, typ, nul):
    return f"+ {name}: {typ}" + (" [0..1]" if nul else "")

def build():
    OY = 90
    C0, C1, C2, C3 = 80, 560, 1040, 1520
    W = 320
    d = Diagram(1920, 1400, title="Diagrama de Clases — modelo de dominio",
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

    R = C("Reserva", C1, OY + 60)
    Cl = C("Cliente", C0, top_for("Cliente", "IdCliente", ry(R, "IdCliente")))
    Ca = C("Cancha", C0, Cl.b + 70)
    U = C("Usuario", C2, top_for("Usuario", "IdUsuario", ry(R, "IdUsuario")))
    N = C("Notificacion", C3, top_for("Notificacion", "IdUsuario", ry(U, "IdUsuario")))
    Cn = C("Cancelacion", C2, U.b + 90)
    Dv = C("Devolucion", C3, top_for("Devolucion", "IdCancelacion", ry(Cn, "FechaCancelacion")))
    Pg = C("Pago", C1, R.b + 90)
    To = C("Torneo", C1, Pg.b + 80)
    Eq = C("Equipo", C1, To.b + 90)
    Pa = C("Partido", C0, top_for("Partido", "IdEquipoLocal", ry(Eq, "IdEquipo")))
    It = C("Integrante", C2, top_for("Integrante", "IdEquipo", ry(Eq, "ContactoNombre")))

    def assoc(child, fkattr, parent, pts, many="0..*", role=None, sc="above", sp="above", dc=22):
        e = d.edge(child.id, parent.id, pts, id=f"{child.id}.{fkattr} → {parent.id}")
        near_label(e, many, "start", dc, sc)
        near_label(e, "1", "end", 16, sp)
        if role: near_label(e, role, "end", 70, "below" if sp == "above" else "above", size=11)
        return e
    y = ry(R, "IdCliente"); assoc(R, "IdCliente", Cl, [(R.l, y), (Cl.r, y)])
    y = ry(R, "IdCancha"); yc = ry(Ca, "IdCancha")
    assoc(R, "IdCancha", Ca, [(R.l, y), (C1 - 70, y), (C1 - 70, yc), (Ca.r, yc)], sc="below")
    y = ry(R, "IdUsuario"); assoc(R, "IdUsuario", U, [(R.r, y), (U.l, y)])
    y = ry(N, "IdUsuario"); assoc(N, "IdUsuario", U, [(N.l, y), (U.r, y)])
    y = ry(Cn, "IdReserva"); ye = R.b - 30
    assoc(Cn, "IdReserva", R, [(Cn.l, y), (C2 - 70, y), (C2 - 70, ye), (R.r, ye)], many="0..1")
    y = ry(Cn, "IdUsuario"); ye = U.b - 40; xv = Cn.r + 50
    assoc(Cn, "IdUsuario", U, [(Cn.r, y), (xv, y), (xv, ye), (U.r, ye)], sc="above", sp="below")
    y = ry(Dv, "IdCancelacion"); assoc(Dv, "IdCancelacion", Cn, [(Dv.l, y), (Cn.r, y)], many="0..1")
    y = ry(Pg, "IdReserva"); ye = R.b - 30
    assoc(Pg, "IdReserva", R, [(Pg.l, y), (C1 - 50, y), (C1 - 50, ye), (R.l, ye)])
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
