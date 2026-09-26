import sys; sys.path.insert(0, "/home/claude/diagkit")
from diagkit import *

# Casos de uso: los mismos 12 CU narrados en la Entrega Complementaria (sección 8.2)
SHARED = [("CU-10", "Iniciar sesión"), ("CU-05", "Registrar y consultar cliente"), ("CU-01", "Registrar reserva"),
          ("CU-02", "Cancelar reserva"), ("CU-03", "Registrar pago"), ("CU-06", "Crear torneo e inscribir equipos"),
          ("CU-07", "Programar partido y cargar resultado"), ("CU-12", "Recibir notificaciones automáticas")]
ADMIN = [("CU-08", "Consultar reportes administrativos"), ("CU-09", "Consultar estadísticas"), ("CU-11", "Gestionar canchas y usuarios")]
EXT = ("CU-04", "Registrar devolución")

def build():
    d = Diagram(1720, 1170, title="Diagrama de Casos de Uso — Sistema de Gestión Integral del Complejo Deportivo",
                subtitle="UML · el Administrador hereda todos los casos de uso del Empleado (generalización) · numeración igual a la de los casos de uso narrados")
    bx, by, bw, bh = 330, 110, 1060, 930
    d.add(Container("sistema", bx, by, bw, bh, "Sistema de Gestión Integral — Complejo Deportivo"))
    EW, EH = 320, 66
    x1 = bx + 60 + EW / 2          # columna izquierda (Empleado)
    x2 = bx + bw - 60 - EW / 2     # columna derecha
    ys = [by + 100 + i * 108 for i in range(len(SHARED))]
    uc = {}
    for (code, name), y in zip(SHARED, ys):
        uc[code] = d.add(Ellipse(code, x1, y, EW, EH, [code, name], size=13))
    y_cu02 = uc["CU-02"].cy
    uc["CU-04"] = d.add(Ellipse("CU-04", x2, y_cu02, EW, EH, list(EXT), size=13))
    ya = [uc["CU-06"].cy, uc["CU-07"].cy, uc["CU-12"].cy]
    for (code, name), y in zip(ADMIN, ya):
        uc[code] = d.add(Ellipse(code, x2, y, EW, EH, [code, name], size=13))

    emp = d.add(Actor("Empleado", 150, 470, ["Empleado /", "Recepcionista"]))
    adm = d.add(Actor("Administrador", 1560, ya[1] - 50, ["Administrador"]))

    # asociaciones Empleado -> casos compartidos (anclas escalonadas sobre el actor)
    n = len(SHARED)
    for k, (code, _) in enumerate(SHARED):
        a = (emp.r, emp.t + 8 + (emp.h - 16) * k / (n - 1))
        e = uc[code]
        b = (e.l, e.cy)
        d.edge("Empleado", code, [a, b], ortho=False, id=f"Empleado — {code}")
    for k, (code, _) in enumerate(ADMIN):
        a = (adm.l, adm.t + 20 + (adm.h - 40) * k / (len(ADMIN) - 1))
        b = (uc[code].r, uc[code].cy)
        d.edge("Administrador", code, [a, b], ortho=False, id=f"Administrador — {code}")
    # «extend»: CU-04 extiende a CU-02 (flecha hacia el caso base)
    c4, c2 = uc["CU-04"], uc["CU-02"]
    e = d.edge("CU-04", "CU-02", [(c4.l, c4.cy), (c2.r, c2.cy)], dashed=True, end="open_arrow", id="CU-04 extiende CU-02")
    e.label("«extend»", 0, 0.5, "above", size=12, italic=True)
    e.label("si la reserva tenía pagos", 0, 0.5, "below", size=11, color=MUTED)
    # generalización Administrador -> Empleado, por debajo del límite del sistema
    yb = by + bh + 70
    g = d.edge("Administrador", "Empleado", [(adm.cx, adm.b), (adm.cx, yb), (emp.cx, yb), (emp.cx, emp.b)],
               end="hollow_triangle", id="generalización")
    g.label("generalización: el Administrador puede hacer todo lo del Empleado", 1, 0.5, "below", size=12, color=MUTED)
    return d

if __name__ == "__main__":
    d = build()
    P = d.verify(verbose=True)
    codes = {s.id for s in d.shapes.values() if s.kind == "ellipse"}
    exp = {f"CU-{i:02d}" for i in range(1, 13)}
    if codes != exp: P.append(f"CU distintos: {codes ^ exp}")
    print("\n".join(P) or "OK")
    d.save("/home/claude/out/06_casos_de_uso")
