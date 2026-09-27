import sys, math; sys.path.insert(0, "/home/claude/diagkit")
from diagkit import *

EW, EH = 190, 56          # entidad
DW, DH = 170, 78          # rombo

def near_label(e, text, at="start", dist=30, side="above", size=12, gap=7):
    """Etiqueta de cardinalidad cerca de un extremo, al costado de la línea (sirve para oblicuas)."""
    if at == "start": (x0, y0), (x1, y1) = e.pts[0], e.pts[1]
    else: (x0, y0), (x1, y1) = e.pts[-1], e.pts[-2]
    L = math.hypot(x1 - x0, y1 - y0); ux, uy = (x1 - x0) / L, (y1 - y0) / L
    px, py = x0 + ux * dist, y0 + uy * dist
    nx, ny = -uy, ux
    want = {"above": (0, -1), "below": (0, 1), "left": (-1, 0), "right": (1, 0)}[side]
    if nx * want[0] + ny * want[1] < 0: nx, ny = -nx, -ny
    w = tw(text, size); h = size * 1.05
    off = gap + abs(nx) * w / 2 + abs(ny) * h / 2
    cx, cy = px + nx * off, py + ny * off
    return e.label_xy(text, cx, cy + size * 0.36, size, "middle")

class DER:
    def __init__(self, d): self.d = d
    def ent(self, name, cx, cy, weak=False):
        return self.d.add(Rect(name, cx - EW / 2, cy - EH / 2, EW, EH, name, size=15, fill=FILL, double=weak))
    def rel(self, id, cx, cy, verb, kind):
        return self.d.add(Diamond(id, cx, cy, DW, DH, [verb, kind], size=13))
    def link(self, ent, dia, pts, card, side, ortho=True, dist=30):
        e = self.d.edge(ent.id, dia.id, pts, ortho=ortho, id=f"{ent.id}—{dia.id}")
        near_label(e, card, "start", dist, side)
        return e

def build():
    X = [200, 660, 1120, 1580]
    Ym1, Y0, Y1, Y2, Y3 = 190, 460, 730, 1000, 1190
    d = Diagram(1800, 1350, title="Diagrama de Entidad-Relación (DER) — vista general",
                subtitle="Notación de Chen · cardinalidad (mín, máx) junto a cada entidad · el tipo de relación figura dentro del rombo")
    g = DER(d)
    CLI = g.ent("CLIENTE", X[0], Y0); RES = g.ent("RESERVA", X[1], Y0); USU = g.ent("USUARIO", X[2], Y0); NOT = g.ent("NOTIFICACION", X[3], Y0)
    PAG = g.ent("PAGO", X[1], Ym1)
    CAN = g.ent("CANCHA", X[0], Y1); INT = g.ent("INTEGRANTE", X[1], Y1); CNC = g.ent("CANCELACION", X[2], Y1); DEV = g.ent("DEVOLUCION", X[3], Y1)
    PAR = g.ent("PARTIDO", X[0], Y2); EQU = g.ent("EQUIPO", X[1], Y2); TOR = g.ent("TORNEO", X[2], Y2)
    AUD = g.ent("AUDITORIA", X[3], Ym1); PRM = g.ent("PARAMETRO", X[3], Y2)

    def hrel(a, b, id, verb, kind, ca, cb, y=None):
        y = a.cy if y is None else y
        m = g.rel(id, (a.r + b.l) / 2, y, verb, kind)
        g.link(a, m, [(a.r, y), (m.l, y)], ca, "above")
        g.link(b, m, [(b.l, y), (m.r, y)], cb, "above")
        return m
    def vrel(a, b, id, verb, kind, ca, cb, x=None, side="right"):
        x = a.cx if x is None else x
        m = g.rel(id, x, (a.b + b.t) / 2, verb, kind)
        g.link(a, m, [(x, a.b), (x, m.t)], ca, side)
        g.link(b, m, [(x, b.t), (x, m.b)], cb, side)
        return m

    hrel(CLI, RES, "realiza", "realiza", "1:N", "(0,N)", "(1,1)")
    hrel(RES, USU, "registra", "registra", "N:1", "(1,1)", "(0,N)")
    hrel(USU, NOT, "recibe", "recibe", "1:N", "(0,N)", "(1,1)")
    vrel(PAG, RES, "corresponde", "corresponde a", "N:1", "(1,1)", "(0,N)")
    vrel(USU, CNC, "efectua", "efectúa", "1:N", "(0,N)", "(1,1)")
    hrel(CNC, DEV, "genera", "genera", "1:1", "(0,1)", "(1,1)")
    vrel(CAN, PAR, "aloja", "aloja", "1:N", "(0,N)", "(1,1)", side="right")
    vrel(INT, EQU, "integra", "integra", "N:1", "(1,1)", "(0,N)")
    hrel(EQU, TOR, "inscribe", "inscripto en", "N:1", "(1,1)", "(0,N)")
    hrel(PAR, EQU, "local", "tiene como", "N:1", "(1,1)", "(0,N)")
    # 'local' necesita aclarar el rol: segunda línea del rombo
    d.shapes["local"].texts[1].text = "local · N:1"

    # diagonales RESERVA–CANCHA y RESERVA–CANCELACION
    m = g.rel("reservada", (CAN.cx + RES.cx) / 2, (CAN.cy + RES.cy) / 2 + 10, "se reserva en", "N:1")
    p_res = (RES.l + 30, RES.b); p_can = (CAN.r, CAN.t + 14)
    g.link(RES, m, [p_res, m.vertex("t")], "(1,1)", "right", ortho=False, dist=26)
    g.link(CAN, m, [p_can, m.vertex("l")], "(0,N)", "below", ortho=False, dist=34)
    m = g.rel("origina", (RES.cx + CNC.cx) / 2, (RES.cy + CNC.cy) / 2 + 10, "origina", "1:1")
    g.link(RES, m, [(RES.r - 30, RES.b), m.vertex("t")], "(0,1)", "left", ortho=False, dist=26)
    g.link(CNC, m, [(CNC.l, CNC.t + 14), m.vertex("r")], "(1,1)", "below", ortho=False, dist=34)

    # usuario responsable de cada cobro y de cada operación (por arriba de USUARIO)
    m = g.rel("cobra", (PAG.r + X[2] - 40) / 2 + 20, Ym1, "cobrado por", "N:1")
    g.link(PAG, m, [(PAG.r, Ym1), (m.l, Ym1)], "(0,1)", "above")
    g.link(USU, m, [(X[2] - 40, USU.t), (X[2] - 40, Ym1), (m.r, Ym1)], "(0,N)", "left")
    m = g.rel("audita", (X[2] + 40 + AUD.l) / 2 + 20, Ym1, "realizada por", "N:1")
    g.link(AUD, m, [(AUD.l, Ym1), (m.r, Ym1)], "(0,1)", "above")
    g.link(USU, m, [(X[2] + 40, USU.t), (X[2] + 40, Ym1), (m.l, Ym1)], "(0,N)", "right")
    # usuario que registró la devolución (diagonal, entre 'recibe' y 'genera')
    m = g.rel("devuelve", (X[2] + X[3]) / 2, (Y0 + Y1) / 2, "registrada por", "N:1")
    g.link(DEV, m, [(DEV.l + 30, DEV.t), m.vertex("r")], "(0,1)", "right", ortho=False, dist=30)
    g.link(USU, m, [(USU.r - 20, USU.b), m.vertex("l")], "(0,N)", "left", ortho=False, dist=30)
    d.text("PARAMETRO no se relaciona con otras entidades:", PRM.cx, PRM.b + 24, 12, anchor="middle", color=MUTED)
    d.text("guarda valores generales (ej. minutos de inactividad).", PRM.cx, PRM.b + 42, 12, anchor="middle", color=MUTED)

    # PARTIDO–EQUIPO como visitante y PARTIDO–TORNEO, por debajo
    yv = Y2 + 110; yi = Y3 + 40
    m = g.rel("visitante", (PAR.cx + EQU.cx) / 2, yv, "tiene como", "visitante · N:1")
    g.link(PAR, m, [(PAR.cx + 40, PAR.b), (PAR.cx + 40, yv), (m.l, yv)], "(1,1)", "right")
    g.link(EQU, m, [(EQU.cx - 40, EQU.b), (EQU.cx - 40, yv), (m.r, yv)], "(0,N)", "left")
    m = g.rel("incluye", (EQU.cx + TOR.cx) / 2, yi, "pertenece a", "N:1")
    g.link(PAR, m, [(PAR.cx - 40, PAR.b), (PAR.cx - 40, yi), (m.l, yi)], "(1,1)", "left")
    g.link(TOR, m, [(TOR.cx, TOR.b), (TOR.cx, yi), (m.r, yi)], "(0,N)", "right")
    der_legend(d, 1330, 1170)
    return d

def der_legend(d, x, y):
    def ent(x, y): return f'<rect x="{x}" y="{y-12}" width="62" height="24" fill="#fff" stroke="{INK}" stroke-width="1.4"/>'
    def rom(x, y): return f'<polygon points="{x+31},{y-14} {x+62},{y} {x+31},{y+14} {x},{y}" fill="{HEAD}" stroke="{INK}" stroke-width="1.4"/>'
    def card(x, y): return Text("(0,N)", x + 31, y + 4, 12, anchor="middle").svg()
    legend_box(d, x, y, [(ent, "Entidad"), (rom, "Relación (verbo y tipo: 1:1, 1:N, N:1)"),
                         (card, "Mín. y máx. de veces que participa la entidad de al lado")], w=440)

# relaciones esperadas según las FK reales: (entidad hija, entidad padre, única)
from model import FKS, TABLES
def fk_requerida(child, col):
    return [f for f in TABLES[child]["fks"] if f["cols"][0] == col][0]["required"]
def semantic_check(d):
    P = []
    ents = {s.id for s in d.shapes.values() if s.kind == "rect"}
    exp_ents = {t.upper() for t in TABLES}
    if ents != exp_ents: P.append(f"ENTIDADES distintas: {ents ^ exp_ents}")
    rels = {}
    for e in d.edges: rels.setdefault(e.dst, []).append(e)
    pairs = []
    for rid, es in rels.items():
        if len(es) != 2: P.append(f"relación {rid} con {len(es)} extremos"); continue
        cards = {e.src: e.labels[0].text for e in es}
        pairs.append((rid, cards))
    for child, col, parent, uniq in FKS:
        C, Pn = child.upper(), parent.upper()
        cc = "(1,1)" if fk_requerida(child, col) else "(0,1)"   # FK opcional (NULL) → mínimo 0
        ok = [r for r, c in pairs if set(c) == {C, Pn} and c[C] == cc and c[Pn] == ("(0,1)" if uniq else "(0,N)")]
        if not ok: P.append(f"FALTA/INCORRECTA relación para {child}.{col} → {parent}")
    if len(pairs) != len(FKS): P.append(f"{len(pairs)} relaciones dibujadas vs {len(FKS)} FK")
    return P

if __name__ == "__main__":
    d = build()
    P = d.verify(verbose=True) + semantic_check(d)
    print("\n".join(P) or "OK")
    d.save(sys.argv[1] if len(sys.argv) > 1 else "/home/claude/out/02_der_general")
