"""
diagkit: diagramas técnicos prolijos, con coordenadas explícitas, ruteo ortogonal
y verificación automática (sin cruces, sin líneas sobre cajas, texto que entra).

Uso básico:
    d = Diagram(2000, 1400, title="...")
    t = d.add(TableBox("Reserva", x, y, rows=[...]))
    d.edge(src, dst, pts=[...], start="many_zero", end="one")
    problems = d.verify()
    d.save("salida")  # .svg .png .pdf
"""
from __future__ import annotations
import math, html
from dataclasses import dataclass, field
from PIL import ImageFont
from shapely.geometry import LineString, Polygon, Point, box as sbox
from shapely.ops import unary_union

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
_FONTS = {}
FAMILY = "DejaVu Sans"

def font(size, bold=False, italic=False):
    key = (size, bold, italic)
    if key not in _FONTS:
        name = {(False, False): "DejaVuSans", (True, False): "DejaVuSans-Bold",
                (False, True): "DejaVuSans-Oblique", (True, True): "DejaVuSans-BoldOblique"}[(bold, italic)]
        _FONTS[key] = ImageFont.truetype(FONT_DIR + name + ".ttf", size)
    return _FONTS[key]

def tw(text, size, bold=False, italic=False):
    return font(size, bold, italic).getlength(text)

def esc(s): return html.escape(str(s), quote=True)

INK = "#1f2933"      # líneas y texto
MUTED = "#52606d"
HEAD = "#e4ebe6"      # encabezados
FILL = "#ffffff"
ACCENT = "#1f6f4a"

# ---------------------------------------------------------------- texto
@dataclass
class Text:
    text: str
    x: float
    y: float                 # baseline
    size: int = 13
    bold: bool = False
    italic: bool = False
    anchor: str = "start"    # start | middle | end
    color: str = INK
    underline: bool = False
    maxw: float | None = None  # ancho disponible (para verificar)
    owner: str = ""

    def width(self): return tw(self.text, self.size, self.bold, self.italic)

    def bbox(self):
        w = self.width()
        x0 = self.x if self.anchor == "start" else self.x - w / 2 if self.anchor == "middle" else self.x - w
        asc = self.size * 0.80; desc = self.size * 0.25
        return (x0, self.y - asc, x0 + w, self.y + desc)

    def svg(self):
        deco = ' text-decoration="underline"' if self.underline else ""
        st = []
        if self.bold: st.append('font-weight="bold"')
        if self.italic: st.append('font-style="italic"')
        s = f'<text x="{self.x:.1f}" y="{self.y:.1f}" font-size="{self.size}" text-anchor="{self.anchor}" fill="{self.color}" {" ".join(st)}{deco}>{esc(self.text)}</text>'
        if self.underline:  # cairosvg no soporta text-decoration: dibujar la línea
            x0, _, x1, _ = self.bbox()
            s += f'<line x1="{x0:.1f}" y1="{self.y+2.5:.1f}" x2="{x1:.1f}" y2="{self.y+2.5:.1f}" stroke="{self.color}" stroke-width="1"/>'
        return s

# ---------------------------------------------------------------- formas
class Shape:
    kind = "shape"
    container = False
    def __init__(self, id, x, y, w, h):
        self.id, self.x, self.y, self.w, self.h = id, x, y, w, h
        self.texts: list[Text] = []
    @property
    def l(self): return self.x
    @property
    def r(self): return self.x + self.w
    @property
    def t(self): return self.y
    @property
    def b(self): return self.y + self.h
    @property
    def cx(self): return self.x + self.w / 2
    @property
    def cy(self): return self.y + self.h / 2
    def poly(self): return sbox(self.x, self.y, self.r, self.b)
    def side_point(self, side, frac=0.5):
        if side == "l": return (self.l, self.t + self.h * frac)
        if side == "r": return (self.r, self.t + self.h * frac)
        if side == "t": return (self.l + self.w * frac, self.t)
        if side == "b": return (self.l + self.w * frac, self.b)
        raise ValueError(side)
    def svg(self): return ""
    def all_texts(self): return self.texts

class TableBox(Shape):
    """Tabla del modelo relacional: rows = [(clave, nombre, tipo, nulo)]"""
    kind = "table"
    HDR = 34; ROW = 26
    def __init__(self, id, x, y, rows, w=380, title=None):
        super().__init__(id, x, y, w, self.HDR + self.ROW * len(rows))
        self.title = title or id
        self.rows = rows
        self.cols = {r[1]: i for i, r in enumerate(rows)}
        self.texts.append(Text(self.title, self.cx, y + 23, 15, bold=True, anchor="middle", maxw=w - 16, owner=id))
        for i, (k, name, typ, nul) in enumerate(rows):
            by = y + self.HDR + self.ROW * i + 18
            if k: self.texts.append(Text(k, x + 10, by, 11, bold=True, color=ACCENT, maxw=48, owner=id))
            self.texts.append(Text(name, x + 62, by, 13, bold=("PK" in (k or "")), underline=("PK" in (k or "")), maxw=170, owner=id))
            self.texts.append(Text(typ, x + 238, by, 12, color=MUTED, maxw=w - 238 - 44, owner=id))
            if nul: self.texts.append(Text("NULL", x + w - 8, by, 10, color=MUTED, anchor="end", maxw=40, owner=id))
    def row_y(self, name):
        i = self.cols[name]
        return self.y + self.HDR + self.ROW * i + self.ROW / 2
    def svg(self):
        s = [f'<rect x="{self.x}" y="{self.y}" width="{self.w}" height="{self.h}" fill="{FILL}" stroke="{INK}" stroke-width="1.4"/>',
             f'<rect x="{self.x}" y="{self.y}" width="{self.w}" height="{self.HDR}" fill="{HEAD}" stroke="{INK}" stroke-width="1.4"/>']
        for i in range(1, len(self.rows)):
            yy = self.y + self.HDR + self.ROW * i
            s.append(f'<line x1="{self.x}" y1="{yy}" x2="{self.r}" y2="{yy}" stroke="#c7cfd6" stroke-width="0.8"/>')
        for xx in (self.x + 56, self.x + 230):
            s.append(f'<line x1="{xx}" y1="{self.y+self.HDR}" x2="{xx}" y2="{self.b}" stroke="#c7cfd6" stroke-width="0.8"/>')
        return "\n".join(s)

class ClassBox(Shape):
    """Clase UML: nombre, atributos, operaciones."""
    kind = "class"
    HDR = 34; ROW = 21; PAD = 6
    def __init__(self, id, x, y, attrs, ops=(), w=300, stereotype=None, title=None):
        n_ops = max(len(ops), 0)
        hdr = self.HDR + (16 if stereotype else 0)
        h = hdr + self.PAD * 2 + self.ROW * len(attrs) + self.PAD * 2 + self.ROW * n_ops + (0 if n_ops else 8)
        super().__init__(id, x, y, w, h)
        self.hdr = hdr; self.attrs = list(attrs); self.ops = list(ops); self.stereotype = stereotype
        self.title = title or id
        ty = y + 23
        if stereotype:
            self.texts.append(Text(f"«{stereotype}»", self.cx, y + 17, 11, italic=True, anchor="middle", color=MUTED, maxw=w - 12, owner=id))
            ty = y + 36
        self.texts.append(Text(self.title, self.cx, ty, 15, bold=True, anchor="middle", maxw=w - 12, owner=id))
        self.attr_top = y + hdr
        for i, a in enumerate(self.attrs):
            self.texts.append(Text(a, x + 10, self.attr_top + self.PAD + self.ROW * i + 15, 12, maxw=w - 16, owner=id))
        self.ops_top = self.attr_top + self.PAD * 2 + self.ROW * len(self.attrs)
        for i, o in enumerate(self.ops):
            self.texts.append(Text(o, x + 10, self.ops_top + self.PAD + self.ROW * i + 15, 12, maxw=w - 16, owner=id))
    def row_y(self, i): return self.attr_top + self.PAD + self.ROW * i + self.ROW / 2
    def svg(self):
        return "\n".join([
            f'<rect x="{self.x}" y="{self.y}" width="{self.w}" height="{self.h}" fill="{FILL}" stroke="{INK}" stroke-width="1.4"/>',
            f'<rect x="{self.x}" y="{self.y}" width="{self.w}" height="{self.hdr}" fill="{HEAD}" stroke="{INK}" stroke-width="1.4"/>',
            f'<line x1="{self.x}" y1="{self.ops_top}" x2="{self.r}" y2="{self.ops_top}" stroke="{INK}" stroke-width="1.2"/>'])

class Rect(Shape):
    """Caja genérica con texto centrado (entidad DER, entidad externa DFD, participante)."""
    kind = "rect"
    def __init__(self, id, x, y, w, h, lines, size=14, bold=True, fill=FILL, double=False, rounded=0, stroke=INK, dash=False, head=None):
        super().__init__(id, x, y, w, h)
        self.fill, self.double, self.rounded, self.stroke, self.dash = fill, double, rounded, stroke, dash
        lines = [lines] if isinstance(lines, str) else lines
        lh = size * 1.25
        y0 = self.cy - (len(lines) - 1) * lh / 2 + size * 0.36
        for i, ln in enumerate(lines):
            self.texts.append(Text(ln, self.cx, y0 + i * lh, size, bold=bold, anchor="middle", maxw=w - 14, owner=id))
    def svg(self):
        d = ' stroke-dasharray="6 4"' if self.dash else ""
        s = f'<rect x="{self.x}" y="{self.y}" width="{self.w}" height="{self.h}" rx="{self.rounded}" fill="{self.fill}" stroke="{self.stroke}" stroke-width="1.5"{d}/>'
        if self.double:
            s += f'<rect x="{self.x+4}" y="{self.y+4}" width="{self.w-8}" height="{self.h-8}" fill="none" stroke="{self.stroke}" stroke-width="1"/>'
        return s

class Diamond(Shape):
    kind = "diamond"
    def __init__(self, id, cx, cy, w, h, lines, size=13):
        super().__init__(id, cx - w / 2, cy - h / 2, w, h)
        lines = [lines] if isinstance(lines, str) else lines
        lh = size * 1.2
        y0 = cy - (len(lines) - 1) * lh / 2 + size * 0.36
        for i, ln in enumerate(lines):
            # ancho útil de un rombo a la altura del texto
            dy = abs(y0 + i * lh - size * 0.36 - cy) + size * 0.5
            avail = w * (1 - 2 * dy / h) - 10
            self.texts.append(Text(ln, cx, y0 + i * lh, size, anchor="middle", maxw=avail, owner=id))
    def pts(self): return [(self.cx, self.t), (self.r, self.cy), (self.cx, self.b), (self.l, self.cy)]
    def poly(self): return Polygon(self.pts())
    def vertex(self, side): return {"t": (self.cx, self.t), "r": (self.r, self.cy), "b": (self.cx, self.b), "l": (self.l, self.cy)}[side]
    def svg(self):
        p = " ".join(f"{x:.1f},{y:.1f}" for x, y in self.pts())
        return f'<polygon points="{p}" fill="{HEAD}" stroke="{INK}" stroke-width="1.5"/>'

class Ellipse(Shape):
    kind = "ellipse"
    def __init__(self, id, cx, cy, w, h, lines, size=13, underline=False, fill=FILL, bold=False, dashed=False, italic=False):
        super().__init__(id, cx - w / 2, cy - h / 2, w, h)
        self.fill, self.dashed = fill, dashed
        lines = [lines] if isinstance(lines, str) else lines
        lh = size * 1.22
        y0 = cy - (len(lines) - 1) * lh / 2 + size * 0.36
        for i, ln in enumerate(lines):
            dy = abs(y0 + i * lh - size * 0.36 - cy) + size * 0.55
            frac = max(0.0, 1 - (2 * dy / h) ** 2)
            avail = w * math.sqrt(frac) - 12
            self.texts.append(Text(ln, cx, y0 + i * lh, size, anchor="middle", underline=underline, bold=bold, italic=italic, maxw=avail, owner=id))
    def poly(self):
        n = 72
        return Polygon([(self.cx + self.w / 2 * math.cos(2 * math.pi * k / n), self.cy + self.h / 2 * math.sin(2 * math.pi * k / n)) for k in range(n)])
    def boundary_toward(self, px, py):
        """punto del borde en dirección a (px,py) desde el centro"""
        dx, dy = px - self.cx, py - self.cy
        a, b = self.w / 2, self.h / 2
        t = 1 / math.sqrt((dx / a) ** 2 + (dy / b) ** 2)
        return (self.cx + dx * t, self.cy + dy * t)
    def svg(self):
        d = ' stroke-dasharray="5 3"' if self.dashed else ""
        return f'<ellipse cx="{self.cx:.1f}" cy="{self.cy:.1f}" rx="{self.w/2:.1f}" ry="{self.h/2:.1f}" fill="{self.fill}" stroke="{INK}" stroke-width="1.4"{d}/>'

class Circle(Ellipse):
    """Proceso DFD (Yourdon/DeMarco): círculo con número arriba, línea divisoria y nombre debajo."""
    kind = "process"
    def __init__(self, id, cx, cy, r, number, lines, size=13):
        Shape.__init__(self, id, cx - r, cy - r, 2 * r, 2 * r)
        self.fill, self.dashed = FILL, False
        lines = [lines] if isinstance(lines, str) else lines
        lh = size * 1.25
        self.sep_y = cy - r * 0.30
        num_base = self.sep_y - size * 0.55
        self.texts.append(Text(number, cx, num_base, size + 1, anchor="middle", bold=True,
                               maxw=2 * math.sqrt(max(0, r * r - (num_base - size * 0.4 - cy) ** 2)) - 12, owner=id))
        # nombre centrado en el espacio que queda bajo la línea
        area_top, area_bot = self.sep_y + 4, cy + r * 0.80
        mid = (area_top + area_bot) / 2
        y0 = mid - (len(lines) - 1) * lh / 2 + size * 0.36
        for i, ln in enumerate(lines):
            yb = y0 + i * lh
            worst = max(abs(yb - cy), abs(yb - size * 0.8 - cy))
            avail = 2 * math.sqrt(max(0, r * r - worst * worst)) - 14
            self.texts.append(Text(ln, cx, yb, size, anchor="middle", maxw=avail, owner=id))
    def svg(self):
        r = self.w / 2
        dy = self.sep_y - self.cy
        hw = math.sqrt(max(0, r * r - dy * dy))
        return (f'<circle cx="{self.cx:.1f}" cy="{self.cy:.1f}" r="{r:.1f}" fill="{FILL}" stroke="{INK}" stroke-width="1.6"/>'
                f'<line x1="{self.cx-hw:.1f}" y1="{self.sep_y:.1f}" x2="{self.cx+hw:.1f}" y2="{self.sep_y:.1f}" stroke="{INK}" stroke-width="1"/>')

class Store(Shape):
    """Almacén de datos DFD: dos líneas horizontales abiertas a la derecha, con código Dn."""
    kind = "store"
    def __init__(self, id, x, y, w, code, name, size=13, duplicate=False):
        super().__init__(id, x, y, w, 36)
        self.code, self.duplicate = code, duplicate
        self.texts.append(Text(code, x + 22, y + 23, size, bold=True, anchor="middle", maxw=38, owner=id))
        self.texts.append(Text(name, x + 50, y + 23, size, maxw=w - 58, owner=id))
    def svg(self):
        x, y, w, h = self.x, self.y, self.w, self.h
        s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{FILL}" stroke="none"/>',
             f'<line x1="{x}" y1="{y}" x2="{x+w}" y2="{y}" stroke="{INK}" stroke-width="1.5"/>',
             f'<line x1="{x}" y1="{y+h}" x2="{x+w}" y2="{y+h}" stroke="{INK}" stroke-width="1.5"/>',
             f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y+h}" stroke="{INK}" stroke-width="1.5"/>',
             f'<line x1="{x+44}" y1="{y}" x2="{x+44}" y2="{y+h}" stroke="{INK}" stroke-width="1.1"/>']
        if self.duplicate:
            s.append(f'<line x1="{x+6}" y1="{y}" x2="{x+6}" y2="{y+h}" stroke="{INK}" stroke-width="1.1"/>')
        return "\n".join(s)

class Actor(Shape):
    """Actor UML (monigote) con nombre debajo."""
    kind = "actor"
    def __init__(self, id, cx, top, name_lines, size=14):
        name_lines = [name_lines] if isinstance(name_lines, str) else name_lines
        w = max(70, max(tw(n, size, True) for n in name_lines) + 10)
        h = 78 + 6 + len(name_lines) * size * 1.25
        super().__init__(id, cx - w / 2, top, w, h)
        self.fig_b = top + 78
        for i, n in enumerate(name_lines):
            self.texts.append(Text(n, cx, top + 78 + 6 + size + i * size * 1.25, size, bold=True, anchor="middle", maxw=w, owner=id))
    def svg(self):
        cx, t = self.cx, self.y
        return "\n".join([
            f'<circle cx="{cx}" cy="{t+12}" r="11" fill="{FILL}" stroke="{INK}" stroke-width="1.6"/>',
            f'<line x1="{cx}" y1="{t+23}" x2="{cx}" y2="{t+52}" stroke="{INK}" stroke-width="1.6"/>',
            f'<line x1="{cx-20}" y1="{t+33}" x2="{cx+20}" y2="{t+33}" stroke="{INK}" stroke-width="1.6"/>',
            f'<line x1="{cx}" y1="{t+52}" x2="{cx-17}" y2="{t+76}" stroke="{INK}" stroke-width="1.6"/>',
            f'<line x1="{cx}" y1="{t+52}" x2="{cx+17}" y2="{t+76}" stroke="{INK}" stroke-width="1.6"/>'])

class Container(Shape):
    """Marco (límite del sistema, paquete). Las líneas pueden atravesar su borde."""
    kind = "container"
    container = True
    def __init__(self, id, x, y, w, h, title, size=15):
        super().__init__(id, x, y, w, h)
        self.texts.append(Text(title, x + w / 2, y + 26, size, bold=True, anchor="middle", maxw=w - 20, owner=id))
    def svg(self):
        return f'<rect x="{self.x}" y="{self.y}" width="{self.w}" height="{self.h}" rx="6" fill="#f7f9f8" stroke="{INK}" stroke-width="1.4"/>'

# ---------------------------------------------------------------- aristas
MARK_LEN = {"one": 18, "zero_one": 30, "many_zero": 34, "many_one": 26, "arrow": 14, "open_arrow": 14,
            "hollow_triangle": 18, None: 0, "one_single": 12}

@dataclass
class Edge:
    id: str
    src: str
    dst: str
    pts: list
    start: str | None = None   # marcador en el origen
    end: str | None = None     # marcador en el destino
    dashed: bool = False
    labels: list = field(default_factory=list)
    ortho: bool = True
    width: float = 1.4
    color: str = INK

    def line(self): return LineString(self.pts)

    def label(self, text, seg, t=0.5, side="above", gap=6, size=12, italic=False, bold=False, color=INK):
        """Etiqueta al costado del segmento `seg` (índice), sin tocar la línea."""
        (x0, y0), (x1, y1) = self.pts[seg], self.pts[seg + 1]
        mx, my = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        w = tw(text, size, bold, italic)
        if abs(y1 - y0) < 1e-6 or not self.ortho:  # horizontal (u oblicua: tratar como horizontal)
            if side == "above": tx, ty, anc = mx, my - gap - size * 0.25, "middle"
            else: tx, ty, anc = mx, my + gap + size * 0.8, "middle"
            if not self.ortho and abs(x1 - x0) > 1e-6 and abs(y1 - y0) > 1e-6:
                # oblicua: desplazar perpendicularmente
                L = math.hypot(x1 - x0, y1 - y0); nx, ny = -(y1 - y0) / L, (x1 - x0) / L
                if side == "above" and ny > 0: nx, ny = -nx, -ny
                if side == "below" and ny < 0: nx, ny = -nx, -ny
                off = gap + size * 0.6 + abs(nx) * w / 2
                tx, ty, anc = mx + nx * off, my + ny * off + size * 0.35, "middle"
        else:  # vertical
            if side in ("right", "below", "above"):
                s = side if side in ("right",) else "right"
            if side == "left": tx, ty, anc = mx - gap, my + size * 0.35, "end"
            else: tx, ty, anc = mx + gap, my + size * 0.35, "start"
        lab = Text(text, tx, ty, size, italic=italic, bold=bold, anchor=anc, color=color, owner=self.id)
        self.labels.append(lab)
        return lab

    def label_xy(self, text, x, y, size=12, anchor="middle", italic=False, bold=False, color=INK):
        lab = Text(text, x, y, size, italic=italic, bold=bold, anchor=anchor, color=color, owner=self.id)
        self.labels.append(lab); return lab

    def svg(self):
        d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in self.pts)
        dash = ' stroke-dasharray="7 5"' if self.dashed else ""
        s = [f'<path d="{d}" fill="none" stroke="{self.color}" stroke-width="{self.width}"{dash}/>']
        s.append(marker(self.start, self.pts[0], self.pts[1], self.color))
        s.append(marker(self.end, self.pts[-1], self.pts[-2], self.color))
        return "\n".join(x for x in s if x)

def marker(kind, tip, prev, color=INK):
    """Dibuja el marcador en `tip`, orientado según el segmento prev->tip."""
    if not kind: return ""
    dx, dy = tip[0] - prev[0], tip[1] - prev[1]
    L = math.hypot(dx, dy); ux, uy = dx / L, dy / L       # hacia la punta
    nx, ny = -uy, ux                                        # normal
    X, Y = tip
    def P(a, b): return (X - ux * a + nx * b, Y - uy * a + ny * b)   # a: distancia hacia atrás, b: lateral
    def line(p, q, w=1.4): return f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{color}" stroke-width="{w}"/>'
    def circ(a, r=5): c = P(a, 0); return f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="{r}" fill="#ffffff" stroke="{color}" stroke-width="1.4"/>'
    out = []
    if kind == "one":            # || uno y solo uno
        out += [line(P(8, -8), P(8, 8)), line(P(14, -8), P(14, 8))]
    elif kind == "one_single":
        out += [line(P(9, -8), P(9, 8))]
    elif kind == "zero_one":     # o| cero o uno
        out += [line(P(8, -8), P(8, 8)), circ(21)]
    elif kind == "many_zero":    # o< cero o muchos
        out += [line(P(14, 0), P(0, -9)), line(P(14, 0), P(0, 9)), line(P(14, 0), P(0, 0)), circ(24)]
    elif kind == "many_one":     # |< uno o muchos
        out += [line(P(14, 0), P(0, -9)), line(P(14, 0), P(0, 9)), line(P(20, -8), P(20, 8))]
    elif kind == "arrow":        # flecha rellena
        a, b, c = P(0, 0), P(13, -5.5), P(13, 5.5)
        out.append(f'<polygon points="{a[0]:.1f},{a[1]:.1f} {b[0]:.1f},{b[1]:.1f} {c[0]:.1f},{c[1]:.1f}" fill="{color}" stroke="{color}" stroke-width="1"/>')
    elif kind == "open_arrow":   # flecha abierta (dependencia, include/extend)
        out += [line(P(0, 0), P(13, -6.5)), line(P(0, 0), P(13, 6.5))]
    elif kind == "hollow_triangle":  # generalización
        a, b, c = P(0, 0), P(17, -9), P(17, 9)
        out.append(f'<polygon points="{a[0]:.1f},{a[1]:.1f} {b[0]:.1f},{b[1]:.1f} {c[0]:.1f},{c[1]:.1f}" fill="#ffffff" stroke="{color}" stroke-width="1.4"/>')
    return "\n".join(out)

# ---------------------------------------------------------------- diagrama
class Diagram:
    def __init__(self, w, h, title=None, subtitle=None, min_gap=10):
        self.w, self.h = w, h
        self.shapes: dict[str, Shape] = {}
        self.edges: list[Edge] = []
        self.free: list[Text] = []
        self.decor: list[str] = []      # svg extra que no participa de la verificación de cruces (p.ej. leyenda) — igual se verifica su bbox
        self.decor_boxes: list = []
        self.min_gap = min_gap
        self.title, self.subtitle = title, subtitle
        if title:
            self.free.append(Text(title, 40, 44, 22, bold=True, owner="__title"))
        if subtitle:
            self.free.append(Text(subtitle, 40, 70, 13, color=MUTED, owner="__title"))
        self.allow_touch = set()   # pares de aristas que pueden tocarse (p.ej. mensajes a la misma línea de vida)

    def add(self, s: Shape):
        assert s.id not in self.shapes, f"id duplicado {s.id}"
        self.shapes[s.id] = s; return s

    def edge(self, src, dst, pts, **kw):
        e = Edge(kw.pop("id", f"{src}->{dst}#{len(self.edges)}"), src, dst, [tuple(map(float, p)) for p in pts], **kw)
        self.edges.append(e); return e

    def text(self, *a, **k):
        t = Text(*a, **k); self.free.append(t); return t

    def box_decor(self, x, y, w, h, svg):
        self.decor.append(svg); self.decor_boxes.append((x, y, x + w, y + h))

    # ------------------------------------------------------------ verificación
    def verify(self, verbose=False):
        P = []
        shapes = list(self.shapes.values())
        solid = [s for s in shapes if not s.container]
        # 1) cajas que se superponen
        for i, a in enumerate(solid):
            for b in solid[i + 1:]:
                if a.poly().buffer(8).intersects(b.poly()):
                    P.append(f"SUPERPOSICIÓN: {a.id} y {b.id} están a menos de 8px")
        # 2) dentro del lienzo
        for s in shapes:
            if s.x < 10 or s.y < 10 or s.r > self.w - 10 or s.b > self.h - 10:
                P.append(f"FUERA DEL LIENZO: {s.id}")
        # 3) texto que no entra
        for s in shapes:
            for t in s.all_texts():
                if t.maxw is not None and t.width() > t.maxw + 0.5:
                    P.append(f"TEXTO NO ENTRA: '{t.text}' en {s.id} ({t.width():.0f}px > {t.maxw:.0f}px)")
        # 3b) texto de procesos DFD sin tocar la línea divisoria
        for s_ in shapes:
            if s_.kind == "process":
                for k, t in enumerate(s_.texts):
                    x0, y0, x1, y1 = t.bbox()
                    if (k == 0 and y1 > s_.sep_y - 2) or (k > 0 and y0 < s_.sep_y + 2):
                        P.append(f"TEXTO SOBRE LA LÍNEA DIVISORIA en {s_.id}: '{t.text}'")
        # 4) aristas
        lines = {e.id: e.line() for e in self.edges}
        for e in self.edges:
            L = lines[e.id]
            if len(e.pts) < 2: P.append(f"ARISTA VACÍA {e.id}"); continue
            # ortogonalidad
            if e.ortho:
                for (x0, y0), (x1, y1) in zip(e.pts, e.pts[1:]):
                    if abs(x0 - x1) > 0.5 and abs(y0 - y1) > 0.5:
                        P.append(f"NO ORTOGONAL: {e.id} segmento ({x0:.0f},{y0:.0f})-({x1:.0f},{y1:.0f})")
            # segmentos de largo cero o retrocesos
            for (x0, y0), (x1, y1) in zip(e.pts, e.pts[1:]):
                if math.hypot(x1 - x0, y1 - y0) < 1: P.append(f"SEGMENTO NULO en {e.id}")
            # extremos sobre el borde de su forma
            for end, sid in ((e.pts[0], e.src), (e.pts[-1], e.dst)):
                s = self.shapes[sid]
                dist = s.poly().exterior.distance(Point(end))
                if dist > 2.0:
                    P.append(f"EXTREMO FUERA DEL BORDE: {e.id} en {sid} (a {dist:.1f}px)")
            # espacio para los marcadores
            for kind, a, b in ((e.start, e.pts[0], e.pts[1]), (e.end, e.pts[-1], e.pts[-2])):
                need = MARK_LEN.get(kind, 0) + 10
                if kind and math.hypot(a[0] - b[0], a[1] - b[1]) < need:
                    P.append(f"TRAMO FINAL CORTO para el marcador en {e.id} (necesita {need}px)")
            # atraviesa formas
            for s in solid:
                poly = s.poly()
                if s.id in (e.src, e.dst):
                    inner = poly.buffer(-2.5)
                    if not inner.is_empty and L.intersects(inner):
                        P.append(f"ATRAVIESA SU PROPIA FORMA: {e.id} entra en {s.id}")
                else:
                    if L.intersects(poly.buffer(4)):
                        P.append(f"PASA SOBRE UNA FORMA: {e.id} toca {s.id}")
        # cruces y líneas demasiado próximas
        for i, a in enumerate(self.edges):
            for b in self.edges[i + 1:]:
                if (a.id, b.id) in self.allow_touch or (b.id, a.id) in self.allow_touch: continue
                La, Lb = lines[a.id], lines[b.id]
                if La.intersects(Lb):
                    inter = La.intersection(Lb)
                    P.append(f"CRUCE: {a.id} × {b.id} en {inter.representative_point().coords[0]}")
                    continue
                shared = {a.src, a.dst} & {b.src, b.dst}
                d = La.distance(Lb)
                if d < self.min_gap:
                    # permitir cercanía sólo junto a una forma compartida
                    ok = False
                    if shared:
                        zone = unary_union([self.shapes[s].poly().buffer(24) for s in shared])
                        if La.difference(zone).distance(Lb.difference(zone)) >= self.min_gap if not La.difference(zone).is_empty and not Lb.difference(zone).is_empty else True:
                            ok = True
                    if not ok:
                        P.append(f"LÍNEAS DEMASIADO JUNTAS ({d:.1f}px): {a.id} y {b.id}")
        # 4b) textos de marcos (guardas, nombres de marco) sin tocar líneas ni otros bordes
        for c in shapes:
            if not c.container: continue
            for t in c.texts:
                bb = sbox(*t.bbox())
                for e in self.edges:
                    if bb.intersects(lines[e.id].buffer(2.5)): P.append(f"TEXTO DE MARCO SOBRE LÍNEA: '{t.text}' toca {e.id}")
                for o in shapes:
                    if o is c: continue
                    if o.container and bb.intersects(o.poly().exterior.buffer(2)): P.append(f"TEXTO DE MARCO SOBRE BORDE: '{t.text}' toca {o.id}")
                    if not o.container and bb.intersects(o.poly().buffer(2)): P.append(f"TEXTO DE MARCO SOBRE FORMA: '{t.text}' toca {o.id}")
        # 5) etiquetas
        labels = [(t, e.id) for e in self.edges for t in e.labels] + [(t, t.owner) for t in self.free]
        for t, owner in labels:
            bb = sbox(*t.bbox())
            x0, y0, x1, y1 = t.bbox()
            if x0 < 5 or y0 < 5 or x1 > self.w - 5 or y1 > self.h - 5:
                P.append(f"ETIQUETA FUERA DEL LIENZO: '{t.text}'")
            for s in solid:
                if bb.intersects(s.poly().buffer(2)):
                    P.append(f"ETIQUETA SOBRE FORMA: '{t.text}' toca {s.id}")
            for s in shapes:
                if s.container:
                    # no debe cruzar el borde del contenedor
                    if bb.intersects(s.poly().exterior.buffer(2)):
                        P.append(f"ETIQUETA SOBRE EL BORDE: '{t.text}' toca el marco {s.id}")
            for e in self.edges:
                if bb.intersects(lines[e.id].buffer(2.5)):
                    P.append(f"ETIQUETA SOBRE LÍNEA: '{t.text}' toca {e.id}")
        for i, (a, _) in enumerate(labels):
            for b, _ in labels[i + 1:]:
                if sbox(*a.bbox()).buffer(2).intersects(sbox(*b.bbox())):
                    P.append(f"ETIQUETAS SUPERPUESTAS: '{a.text}' y '{b.text}'")
        # 6) cada etiqueta debe estar claramente más cerca de su propia línea que de cualquier otra
        for e in self.edges:
            for t in e.labels:
                bb = sbox(*t.bbox())
                own = bb.distance(lines[e.id])
                for o in self.edges:
                    if o.id == e.id: continue
                    other = bb.distance(lines[o.id])
                    if other < own + 10:
                        P.append(f"ETIQUETA AMBIGUA: '{t.text}' de {e.id} está a {own:.0f}px de su línea y a {other:.0f}px de {o.id}")
        for bx in self.decor_boxes:
            bb = sbox(*bx)
            for s in solid:
                if bb.intersects(s.poly().buffer(6)): P.append(f"LEYENDA SOBRE FORMA {s.id}")
            for e in self.edges:
                if bb.intersects(lines[e.id].buffer(6)): P.append(f"LEYENDA SOBRE LÍNEA {e.id}")
        if verbose:
            print(f"{len(self.shapes)} formas, {len(self.edges)} líneas, {len(labels)} etiquetas → {len(P)} problemas")
        return P

    # ------------------------------------------------------------ salida
    def svg(self):
        out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" font-family="{FAMILY}, Arial, sans-serif">',
               f'<rect x="0" y="0" width="{self.w}" height="{self.h}" fill="#ffffff"/>']
        cont = [s for s in self.shapes.values() if s.container]
        rest = [s for s in self.shapes.values() if not s.container]
        for s in cont: out.append(s.svg())
        for s in cont:
            out += [t.svg() for t in s.all_texts()]
        for e in self.edges: out.append(e.svg())
        for s in rest: out.append(s.svg())
        for s in rest: out += [t.svg() for t in s.all_texts()]
        for e in self.edges: out += [t.svg() for t in e.labels]
        out += self.decor
        out += [t.svg() for t in self.free]
        out.append("</svg>")
        return "\n".join(out)

    def save(self, base, scale=2.0):
        import cairosvg
        s = self.svg()
        open(base + ".svg", "w").write(s)
        cairosvg.svg2png(bytestring=s.encode(), write_to=base + ".png", scale=scale)
        cairosvg.svg2pdf(bytestring=s.encode(), write_to=base + ".pdf")
        return base

# ---------------------------------------------------------------- utilidades
def ortho(*pts):
    """Construye una polilínea ortogonal. Acepta puntos (x,y) o ('x', valor) / ('y', valor)
    para moverse sólo en un eje desde el último punto."""
    out = []
    for p in pts:
        if isinstance(p[0], str):
            x, y = out[-1]
            out.append((p[1], y) if p[0] == "x" else (x, p[1]))
        else:
            out.append(tuple(p))
    return out

def legend_box(d: Diagram, x, y, items, title="Referencias", size=12, w=None):
    """items: list of (svg_sample_fn(x,y) -> str, texto). Dibuja una caja de referencias."""
    rowh = 30
    w = w or (max(tw(t, size) for _, t in items) + 110)
    h = 36 + rowh * len(items)
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#ffffff" stroke="{MUTED}" stroke-width="1"/>',
         Text(title, x + 12, y + 22, 13, bold=True).svg()]
    for i, (fn, t) in enumerate(items):
        yy = y + 36 + rowh * i + rowh / 2
        s.append(fn(x + 12, yy))
        s.append(Text(t, x + 92, yy + size * 0.35, size).svg())
    d.box_decor(x, y, w, h, "\n".join(s))
    return (x, y, w, h)

def sample_edge(start, end, dashed=False, length=66):
    def fn(x, y):
        e = Edge("s", "", "", [(x, y), (x + length, y)], start=start, end=end, dashed=dashed)
        return e.svg()
    return fn
