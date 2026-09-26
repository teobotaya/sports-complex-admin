import sys, math; sys.path.insert(0, "/home/claude/diagkit")
from diagkit import *
from d02_der import DER, near_label, EW, EH, DW, DH, der_legend
from model import TABLES

def attrs_of(table):
    """Atributos conceptuales: columnas que no son FK (las FK se representan con relaciones)."""
    out = []
    for tags, name, typ, nul in TABLES[table]["rows"]:
        if "FK" in tags and "PK" not in tags: continue
        out.append((name, "PK" in tags))
    return out

def oval(d, owner, name, pk, cx, cy):
    w = max(96, tw(name, 12, bold=pk) + 34)
    return d.add(Ellipse(f"{owner}.{name}", cx, cy, w, 40, name, size=12, underline=pk, bold=pk))

def fan(d, ent, attrs, t0, t1, A=340, B=190, cx=None, cy=None):
    """Atributos sobre un arco elíptico alrededor de la entidad (ángulos en grados, SVG: 270 = arriba).
    Las líneas son radiales desde el centro de la entidad, así que nunca se cruzan entre sí."""
    cx = ent.cx if cx is None else cx; cy = ent.cy if cy is None else cy
    n = len(attrs)
    ovs = []
    for i, (name, pk) in enumerate(attrs):
        th = math.radians(t0 + (t1 - t0) * (i / (n - 1) if n > 1 else 0.5))
        x, y = cx + A * math.cos(th), cy + B * math.sin(th)
        o = oval(d, ent.id, name, pk, x, y)
        # punto de la entidad sobre el rayo centro->óvalo
        dx, dy = x - ent.cx, y - ent.cy
        s = min((ent.w / 2) / abs(dx) if dx else 1e9, (ent.h / 2) / abs(dy) if dy else 1e9)
        a = (ent.cx + dx * s, ent.cy + dy * s)
        b = o.boundary_toward(ent.cx, ent.cy)
        d.edge(ent.id, o.id, [a, b], ortho=False, id=f"attr {o.id}", width=1.1)
        ovs.append(o)
    return ovs

def split_fan(d, ent, attrs, sides):
    """Reparte atributos entre varios lados: sides = [(side, cantidad, kwargs)]"""
    i = 0
    for side, cnt, kw in sides:
        fan(d, ent, attrs[i:i + cnt], side, **kw); i += cnt
    assert i == len(attrs)

# ---------------------------------------------------------------- hoja 1: operación
def build_operacion():
    d = Diagram(3170, 1660, title="DER con atributos — hoja 1: operación diaria",
                subtitle="Notación de Chen · atributo subrayado = identificador · las claves foráneas no se dibujan como atributos: las representan las relaciones")
    g = DER(d)
    YA, YB = 720, 1230
    X = [400, 1210, 2100, 2830]
    CLI = g.ent("CLIENTE", X[0], YA); RES = g.ent("RESERVA", X[1], YA); USU = g.ent("USUARIO", X[2], YA); NOT = g.ent("NOTIFICACION", X[3], YA)
    CAN = g.ent("CANCHA", X[0], YB); PAG = g.ent("PAGO", X[1], YB + 40); CNC = g.ent("CANCELACION", X[2], YB); DEV = g.ent("DEVOLUCION", X[3], YB)

    def hrel(a, b, id, verb, kind, ca, cb):
        y = a.cy; m = g.rel(id, (a.r + b.l) / 2, y, verb, kind)
        g.link(a, m, [(a.r, y), (m.l, y)], ca, "above", dist=40); g.link(b, m, [(b.l, y), (m.r, y)], cb, "above", dist=40); return m
    def vrel(a, b, id, verb, kind, ca, cb, side="right"):
        x = a.cx; m = g.rel(id, x, (a.b + b.t) / 2, verb, kind)
        g.link(a, m, [(x, a.b), (x, m.t)], ca, side); g.link(b, m, [(x, b.t), (x, m.b)], cb, side); return m
    hrel(CLI, RES, "realiza", "realiza", "1:N", "(0,N)", "(1,1)")
    hrel(RES, USU, "registra", "registra", "N:1", "(1,1)", "(0,N)")
    hrel(USU, NOT, "recibe", "recibe", "1:N", "(0,N)", "(1,1)")
    vrel(RES, PAG, "corresponde", "corresponde a", "1:N", "(0,N)", "(1,1)")
    vrel(USU, CNC, "efectua", "efectúa", "1:N", "(0,N)", "(1,1)")
    hrel(CNC, DEV, "genera", "genera", "1:1", "(0,1)", "(1,1)")
    m = g.rel("reservada", (CAN.cx + RES.cx) / 2 + 20, (CAN.cy + RES.cy) / 2, "se reserva en", "N:1")
    g.link(RES, m, [(RES.l + 20, RES.b), m.vertex("t")], "(1,1)", "left", ortho=False, dist=80)
    g.link(CAN, m, [(CAN.r, CAN.t + 14), m.vertex("l")], "(0,N)", "below", ortho=False, dist=34)
    m = g.rel("origina", (RES.cx + CNC.cx) / 2 - 20, (RES.cy + CNC.cy) / 2, "origina", "1:1")
    g.link(RES, m, [(RES.r - 20, RES.b), m.vertex("t")], "(0,1)", "right", ortho=False, dist=80)
    g.link(CNC, m, [(CNC.l, CNC.t + 14), m.vertex("r")], "(1,1)", "below", ortho=False, dist=34)

    fan(d, CLI, attrs_of("Cliente"), 195, 322, A=270, B=300)
    fan(d, RES, attrs_of("Reserva"), 205, 327, A=470, B=440)
    fan(d, USU, attrs_of("Usuario"), 216, 334, A=430, B=400)
    fan(d, NOT, attrs_of("Notificacion"), 222, 350, A=260, B=310)
    fan(d, CAN, attrs_of("Cancha"), 25, 165, A=270, B=280)
    fan(d, PAG, attrs_of("Pago"), 30, 150, A=300, B=260)
    fan(d, CNC, attrs_of("Cancelacion"), 45, 135, A=230, B=230)
    fan(d, DEV, attrs_of("Devolucion"), 15, 165, A=270, B=280)
    return d

# ---------------------------------------------------------------- hoja 2: torneos
def build_torneos():
    d = Diagram(2420, 1300, title="DER con atributos — hoja 2: torneos",
                subtitle="Notación de Chen · atributo subrayado = identificador · CANCHA es la misma entidad de la hoja 1 (se repite para mostrar la relación)")
    g = DER(d)
    Y = 860
    PAR = g.ent("PARTIDO", 640, Y); EQU = g.ent("EQUIPO", 1260, Y); TOR = g.ent("TORNEO", 1880, Y)
    CAN = g.ent("CANCHA", 640, 390); INT = g.ent("INTEGRANTE", 1260, 390)
    def hrel(a, b, id, verb, kind, ca, cb):
        y = a.cy; m = g.rel(id, (a.r + b.l) / 2, y, verb, kind)
        g.link(a, m, [(a.r, y), (m.l, y)], ca, "above"); g.link(b, m, [(b.l, y), (m.r, y)], cb, "above"); return m
    def vrel(a, b, id, verb, kind, ca, cb, side="right"):
        x = a.cx; m = g.rel(id, x, (a.b + b.t) / 2, verb, kind)
        g.link(a, m, [(x, a.b), (x, m.t)], ca, side); g.link(b, m, [(x, b.t), (x, m.b)], cb, side); return m
    vrel(CAN, PAR, "aloja", "aloja", "1:N", "(0,N)", "(1,1)")
    vrel(INT, EQU, "integra", "integra", "N:1", "(1,1)", "(0,N)", side="left")
    hrel(PAR, EQU, "local", "tiene como", "N:1", "(1,1)", "(0,N)"); d.shapes["local"].texts[1].text = "local · N:1"
    hrel(EQU, TOR, "inscribe", "inscripto en", "N:1", "(1,1)", "(0,N)")
    yv, yi = Y + 160, Y + 330
    m = g.rel("visitante", (PAR.cx + EQU.cx) / 2, yv, "tiene como", "visitante · N:1")
    g.link(PAR, m, [(PAR.cx + 40, PAR.b), (PAR.cx + 40, yv), (m.l, yv)], "(1,1)", "right")
    g.link(EQU, m, [(EQU.cx - 40, EQU.b), (EQU.cx - 40, yv), (m.r, yv)], "(0,N)", "left")
    m = g.rel("incluye", (EQU.cx + TOR.cx) / 2, yi, "pertenece a", "N:1")
    g.link(PAR, m, [(PAR.cx - 40, PAR.b), (PAR.cx - 40, yi), (m.l, yi)], "(1,1)", "left")
    g.link(TOR, m, [(TOR.cx, TOR.b), (TOR.cx, yi), (m.r, yi)], "(0,N)", "right")

    fan(d, PAR, attrs_of("Partido"), 162, 252, A=330, B=280)
    fan(d, TOR, attrs_of("Torneo"), -78, 32, A=330, B=310)
    fan(d, CAN, attrs_of("Cancha"), 195, 345, A=300, B=240)
    fan(d, INT, attrs_of("Integrante"), 215, 325, A=260, B=200)
    fan(d, EQU, attrs_of("Equipo"), 296, 338, A=350, B=330)
    return d

def semantic_check(d, tables):
    P = []
    for t in tables:
        ent = t.upper()
        drawn = {s.id.split(".", 1)[1] for s in d.shapes.values() if s.kind == "ellipse" and s.id.startswith(ent + ".")}
        exp = {n for n, _ in attrs_of(t)}
        if drawn != exp: P.append(f"ATRIBUTOS de {ent}: faltan {exp - drawn} sobran {drawn - exp}")
        for n, pk in attrs_of(t):
            s = d.shapes.get(f"{ent}.{n}")
            if s and s.texts[0].underline != pk: P.append(f"subrayado incorrecto en {ent}.{n}")
    return P

if __name__ == "__main__":
    out = "/home/claude/out/"
    for name, fn, tabs in (("03_der_atributos_operacion", build_operacion, ["Cliente", "Reserva", "Usuario", "Notificacion", "Cancha", "Pago", "Cancelacion", "Devolucion"]),
                           ("04_der_atributos_torneos", build_torneos, ["Partido", "Equipo", "Torneo", "Cancha", "Integrante"])):
        d = fn()
        P = d.verify(verbose=True) + semantic_check(d, tabs)
        print(name, "\n".join(P) or "OK")
        d.save(out + name)
