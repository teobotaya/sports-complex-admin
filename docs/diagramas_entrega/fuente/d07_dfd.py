import sys, math; sys.path.insert(0, "/home/claude/diagkit")
from diagkit import *

STORES = {"D1": "Usuarios", "D2": "Clientes", "D3": "Canchas", "D4": "Reservas", "D5": "Pagos",
          "D6": "Cancelaciones y devoluciones", "D7": "Notificaciones", "D8": "Torneos, equipos y partidos",
          "D9": "Auditoría", "D10": "Parámetros"}

def ext_box(d, id, x, y, lines, dup=False, w=230, h=70):
    b = d.add(Rect(id, x, y - h / 2, w, h, lines, size=14, fill=HEAD))
    if dup:  # marca de entidad externa repetida (esquina inferior derecha)
        d.decor.append(f'<line x1="{x+w-18}" y1="{y+h/2}" x2="{x+w}" y2="{y+h/2-18}" stroke="{INK}" stroke-width="1.4"/>')
    return b

def circ_pt(c, y=None, toward=None):
    r = c.w / 2
    if toward is not None:
        dx, dy = toward[0] - c.cx, toward[1] - c.cy; L = math.hypot(dx, dy)
        return (c.cx + dx / L * r, c.cy + dy / L * r)

def hpair(d, ext, proc, lab_in, lab_out, side, dy=16, t_in=0.5, t_out=0.5):
    """Dos flujos horizontales entre entidad externa y proceso: entrada arriba, salida abajo."""
    r = proc.w / 2
    xs = []
    for k, (lab, inbound) in enumerate(((lab_in, True), (lab_out, False))):
        y = proc.cy - dy if inbound else proc.cy + dy
        if lab is None: continue
        xc = proc.cx - math.sqrt(r * r - (y - proc.cy) ** 2) if side == "left" else proc.cx + math.sqrt(r * r - (y - proc.cy) ** 2)
        xe = ext.r if side == "left" else ext.l
        pts = [(xe, y), (xc, y)] if inbound else [(xc, y), (xe, y)]
        e = d.edge(ext.id if inbound else proc.id, proc.id if inbound else ext.id, pts, end="arrow", id=f"{ext.id}/{proc.id}/{lab}")
        e.label(lab, 0, t_in if inbound else t_out, "above" if inbound else "below", size=12)

def sflow(d, proc, store, label, mode, side, t=0.6, lside="above", attach=None):
    """Flujo proceso–almacén (línea recta). mode: 'r' lee, 'w' escribe, 'rw' ambos."""
    sx = store.l if side == "left" else store.r
    sy = store.cy + (attach or 0)
    a = circ_pt(proc, toward=(sx, sy))
    start = "arrow" if mode in ("w", "rw") else None     # punta hacia el almacén (al final)
    pts = [a, (sx, sy)]
    e = d.edge(proc.id, store.id, pts, ortho=False, id=f"{proc.id}~{store.id}~{label}",
               end=("arrow" if mode in ("w", "rw") else None), start=("arrow" if mode in ("r", "rw") else None))
    e.label(label, 0, t, lside, size=11)
    return e

def build():
    d = Diagram(2600, 1680, title="Diagrama de Flujo de Datos — Nivel 1",
                subtitle="Notación Yourdon/DeMarco · los almacenes y entidades externas se repiten para evitar cruces (repetido = línea extra) · 'Empleado / Administrador' = cualquier usuario del sistema")
    PL, PR = 560, 1980
    SL, SR = 900, 1360          # x izquierda de las columnas de almacenes
    SW = 280
    R = 88
    P = {}
    def proc(id, cx, cy, num, lines): P[id] = d.add(Circle(id, cx, cy, R, num, lines, size=13)); return P[id]
    OY = 60
    proc("P1", PL, OY + 200, "1", ["Autenticar", "usuario"])
    proc("P2", PL, OY + 440, "2", ["Gestionar", "clientes"])
    proc("P3", PL, OY + 690, "3", ["Gestionar", "reservas"])
    proc("P4", PL, OY + 950, "4", ["Registrar", "pagos"])
    proc("P5", PL, OY + 1220, "5", ["Cancelar reserva", "y registrar", "devolución"])
    proc("P9", PR, OY + 230, "9", ["Administrar canchas,", "usuarios y", "parámetros"])
    proc("P6", PR, OY + 520, "6", ["Gestionar", "torneos"])
    proc("P7", PR, OY + 880, "7", ["Generar", "notificaciones"])
    proc("P8", PR, OY + 1240, "8", ["Emitir reportes", "y estadísticas"])

    S = {}
    seen = set()
    def store(id, code, x, y):
        dup = code in seen; seen.add(code)
        S[id] = d.add(Store(id, x, y - 18, SW, code, STORES[code], size=13, duplicate=dup)); return S[id]
    # columna izquierda (procesos 1 a 5)
    store("S1", "D1", SL, OY + 200)
    store("A0", "D10", SL, OY + 290)
    store("A2", "D9", SL, OY + 400)
    store("S2", "D2", SL, OY + 520)
    store("S3", "D8", SL, OY + 620)
    store("A3", "D9", SL, OY + 670)
    store("S4", "D3", SL, OY + 720)
    store("S5", "D4", SL, OY + 820)
    store("S6", "D3", SL, OY + 950)
    store("A4", "D9", SL, OY + 1015)
    store("S7", "D5", SL, OY + 1080)
    store("S8", "D4", SL, OY + 1220)
    store("S9", "D6", SL, OY + 1330)
    store("A5", "D9", SL, OY + 1400)
    # columna derecha (procesos 9, 6, 7, 8)
    store("B9", "D9", SR, OY + 95)
    store("R1", "D1", SR, OY + 170)
    store("B10", "D10", SR, OY + 250)
    store("R2", "D3", SR, OY + 330)
    store("R3", "D8", SR, OY + 470)
    store("B6", "D9", SR, OY + 545)
    store("R4", "D4", SR, OY + 620)
    store("R5", "D8", SR, OY + 740)
    store("R6", "D7", SR, OY + 850)
    store("R7", "D6", SR, OY + 960)
    store("R8", "D5", SR, OY + 1080)
    store("R9", "D6", SR, OY + 1190)
    store("R10", "D4", SR, OY + 1290)
    store("R11", "D3", SR, OY + 1390)
    store("R12", "D2", SR, OY + 1480)

    # entidades externas
    EX_L, EX_R = 60, 2310
    first = True
    for pid in ("P1", "P2", "P3", "P4", "P5"):
        ext_box(d, "E1-" + pid, EX_L, P[pid].cy, ["Empleado /", "Administrador"], dup=not first); first = False
    ext_box(d, "E2-P9", EX_R, P["P9"].cy, "Administrador")
    ext_box(d, "E2-P6", EX_R, P["P6"].cy - 50, "Administrador", dup=True)
    ext_box(d, "E1-P6", EX_R, P["P6"].cy + 50, ["Empleado /", "Administrador"], dup=True)
    ext_box(d, "E1-P7", EX_R, P["P7"].cy, ["Empleado /", "Administrador"], dup=True)
    ext_box(d, "E2-P8", EX_R, P["P8"].cy, "Administrador", dup=True)

    sh = d.shapes
    hpair(d, sh["E1-P1"], P["P1"], "credenciales", "sesión y rol", "left")
    hpair(d, sh["E1-P2"], P["P2"], "datos del cliente", "ficha e historial", "left")
    hpair(d, sh["E1-P3"], P["P3"], "pedido de turno", "confirmación / rechazo", "left")
    hpair(d, sh["E1-P4"], P["P4"], "pago recibido", "estado de pago", "left")
    hpair(d, sh["E1-P5"], P["P5"], "pedido de cancelación", "cancelación registrada", "left")
    hpair(d, sh["E2-P9"], P["P9"], "canchas, usuarios y parámetros", "confirmación", "right")
    # P6: dos entidades apiladas → flujos a la altura de cada caja
    def hflow(ext, proc, lab, y, inbound, side, lside):
        r = proc.w / 2
        xc = proc.cx + (1 if side == "right" else -1) * math.sqrt(r * r - (y - proc.cy) ** 2)
        xe = ext.l if side == "right" else ext.r
        pts = [(xe, y), (xc, y)] if inbound else [(xc, y), (xe, y)]
        e = d.edge(ext.id if inbound else proc.id, proc.id if inbound else ext.id, pts, end="arrow", id=f"{ext.id}/{proc.id}/{lab}")
        e.label(lab, 0, 0.5, lside, size=12)
    p6 = P["P6"]
    hflow(sh["E2-P6"], p6, "datos del torneo", p6.cy - 64, True, "right", "above")
    hflow(sh["E2-P6"], p6, "torneo registrado", p6.cy - 36, False, "right", "below")
    hflow(sh["E1-P6"], p6, "equipos, partidos, resultados", p6.cy + 36, True, "right", "above")
    hflow(sh["E1-P6"], p6, "fixture y posiciones", p6.cy + 64, False, "right", "below")
    hpair(d, sh["E1-P7"], P["P7"], "marcar como leída", "notificaciones", "right")
    hpair(d, sh["E2-P8"], P["P8"], "período a consultar", "reportes y estadísticas", "right")

    # almacenes — izquierda
    sflow(d, P["P1"], S["S1"], "datos de usuario", "r", "left")
    sflow(d, P["P1"], S["A0"], "minutos de inactividad", "r", "left", lside="below")
    sflow(d, P["P2"], S["A2"], "cambios / historial", "rw", "left", lside="above")
    sflow(d, P["P3"], S["A3"], "historial", "rw", "left", lside="above", t=0.9)
    sflow(d, P["P4"], S["A4"], "cobro y usuario", "w", "left", lside="above", t=0.86)
    sflow(d, P["P5"], S["A5"], "cambios y usuario", "w", "left", lside="below", t=0.86)
    sflow(d, P["P2"], S["S2"], "cliente", "rw", "left", attach=-8, lside="above")
    sflow(d, P["P3"], S["S2"], "cliente", "r", "left", attach=8, lside="below")
    sflow(d, P["P3"], S["S3"], "partidos", "r", "left", lside="above")
    sflow(d, P["P3"], S["S4"], "cancha", "r", "left", lside="below", t=0.6)
    sflow(d, P["P3"], S["S5"], "reserva", "rw", "left", attach=-8, lside="above")
    sflow(d, P["P4"], S["S5"], "reserva", "rw", "left", attach=8, lside="below")
    sflow(d, P["P4"], S["S6"], "precio por hora", "r", "left", lside="above")
    sflow(d, P["P4"], S["S7"], "pago", "w", "left", attach=-8, lside="below")
    sflow(d, P["P5"], S["S7"], "pagos", "r", "left", attach=8, lside="above")
    sflow(d, P["P5"], S["S8"], "reserva", "rw", "left", lside="above")
    sflow(d, P["P5"], S["S9"], "cancelación / devolución", "w", "left", lside="above", t=0.8)
    # almacenes — derecha
    sflow(d, P["P9"], S["B9"], "cambios y usuario", "w", "right", lside="above")
    sflow(d, P["P9"], S["R1"], "usuario", "w", "right", lside="above")
    sflow(d, P["P9"], S["B10"], "parámetros", "w", "right", lside="below")
    sflow(d, P["P6"], S["B6"], "cambios y usuario", "w", "right", lside="above", t=0.5)
    sflow(d, P["P9"], S["R2"], "cancha", "w", "right", attach=-8, lside="above")
    sflow(d, P["P6"], S["R2"], "canchas", "r", "right", attach=8, lside="below")
    sflow(d, P["P6"], S["R3"], "torneo, equipo, partido", "rw", "right", lside="above")
    sflow(d, P["P6"], S["R4"], "reservas", "r", "right", attach=-8, lside="below")
    sflow(d, P["P7"], S["R4"], "reservas", "r", "right", attach=8, lside="above")
    sflow(d, P["P7"], S["R5"], "partidos", "r", "right", lside="above")
    sflow(d, P["P7"], S["R6"], "notificación", "rw", "right", lside="above")
    sflow(d, P["P7"], S["R7"], "cancelaciones", "r", "right", lside="below")
    sflow(d, P["P7"], S["R8"], "pagos", "r", "right", attach=-8, lside="below")
    sflow(d, P["P8"], S["R8"], "pagos", "r", "right", attach=8, lside="above")
    sflow(d, P["P8"], S["R9"], "cancelaciones", "r", "right", lside="above")
    sflow(d, P["P8"], S["R10"], "reservas", "r", "right", lside="above")
    sflow(d, P["P8"], S["R11"], "canchas", "r", "right", lside="below", t=0.72)
    sflow(d, P["P8"], S["R12"], "clientes", "r", "right", lside="below", t=0.72)
    return d

def build_contexto():
    d = Diagram(1900, 800, title="Diagrama de Flujo de Datos — Nivel 0 (diagrama de contexto)",
                subtitle="Notación Yourdon/DeMarco · el Administrador también puede enviar y recibir todos los flujos del Empleado")
    c = d.add(Circle("P0", 950, 420, 250, "0", ["Sistema de Gestión Integral", "del Complejo Deportivo"], size=16))
    E = ext_box(d, "E1", 60, 420, ["Empleado /", "Recepcionista"], w=250, h=500)
    A = ext_box(d, "E2", 1590, 420, "Administrador", w=250, h=360)
    inn = ["credenciales", "datos de clientes", "pedidos de reserva, modificación y cancelación", "pagos y devoluciones", "equipos, partidos y resultados"]
    out = ["agenda y disponibilidad de canchas", "confirmaciones y rechazos", "estado de pagos y saldos", "notificaciones internas", "fixture y tabla de posiciones"]
    def fl(ext, lab, y, inbound, side):
        r = c.w / 2
        xc = c.cx + (-1 if side == "left" else 1) * math.sqrt(r * r - (y - c.cy) ** 2)
        xe = ext.r if side == "left" else ext.l
        pts = [(xe, y), (xc, y)] if inbound else [(xc, y), (xe, y)]
        e = d.edge(ext.id if inbound else "P0", "P0" if inbound else ext.id, pts, end="arrow", id=f"{ext.id}:{lab}")
        e.label_xy(lab, (pts[0][0] + pts[1][0]) / 2 if side == "right" else ext.r + 14, y - 7, 12, "middle" if side == "right" else "start")
    ys = [c.cy - 210 + 42 * i for i in range(10)]
    for lab, y in zip(inn, ys[:5]): fl(E, lab, y, True, "left")
    for lab, y in zip(out, ys[5:]): fl(E, lab, y + 12, False, "left")
    ain = ["datos de canchas y tarifas", "datos de torneos", "usuarios y parámetros", "período a consultar"]
    aout = ["reportes de ocupación, ingresos y deudores", "estadísticas del complejo"]
    ys2 = [c.cy - 150 + 50 * i for i in range(6)]
    for lab, y in zip(ain, ys2[:4]): fl(A, lab, y, True, "right")
    for lab, y in zip(aout, ys2[4:]): fl(A, lab, y + 10, False, "right")
    return d

if __name__ == "__main__":
    for name, fn in (("07_dfd_nivel0_contexto", build_contexto), ("08_dfd_nivel1", build)):
        d = fn(); P = d.verify(verbose=True)
        print(name, "\n".join(P) or "OK")
        d.save("/home/claude/out/" + name)
