"""Diagramas de secuencia UML sobre diagkit: disposición automática y verificable."""
import sys; sys.path.insert(0, "/home/claude/diagkit")
from diagkit import *

class Lifeline(Shape):
    kind = "lifeline"; container = True
    def __init__(self, id, x, y0, y1):
        super().__init__(id, x - 1, y0, 2, y1 - y0)
    def svg(self):
        return f'<line x1="{self.cx}" y1="{self.y}" x2="{self.cx}" y2="{self.b}" stroke="{MUTED}" stroke-width="1.2" stroke-dasharray="6 5"/>'
    def poly(self): return sbox(self.x, self.y, self.r, self.b)

class Frame(Shape):
    kind = "frame"; container = True
    def __init__(self, id, x, y, w, h, op, guards, gx=None):
        super().__init__(id, x, y, w, h)
        self.op, self.guards = op, guards   # guards: [(y_separador_o_None, texto)]
        tagw = tw(op, 13, True) + 22
        self.tagw = tagw
        self.texts.append(Text(op, x + 9, y + 18, 13, bold=True, owner=id))
        for ys, g in guards:
            yy = (y if ys is None else ys)
            gx0 = max(x + (tagw + 12 if ys is None else 12), (gx or 0))
            self.texts.append(Text(g, gx0, yy + 19, 12, italic=True, color=INK, owner=id))
    def svg(self):
        x, y, w, h, t = self.x, self.y, self.w, self.h, self.tagw
        s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{INK}" stroke-width="1.3"/>',
             f'<path d="M {x} {y+26} L {x+t-8} {y+26} L {x+t} {y+18} L {x+t} {y}" fill="#ffffff" stroke="{INK}" stroke-width="1.2"/>']
        for ys, _ in self.guards:
            if ys is not None:
                s.append(f'<line x1="{x}" y1="{ys}" x2="{x+w}" y2="{ys}" stroke="{INK}" stroke-width="1.1" stroke-dasharray="7 5"/>')
        return "\n".join(s)

class Seq:
    """Uso:
        s = Seq("Título", "subtítulo")
        s.actor("E", "Empleado"); s.part("F", ["Frontend", "NuevaReserva.tsx"])
        s.msg("E", "F", "texto"); s.ret("F", "E", "texto"); s.self_("S", "texto")
        s.alt([("[condición]", lambda: ...), ("[si no]", lambda: ...)], op="alt")
        d = s.render()
    """
    ROW = 46
    def __init__(self, title, subtitle=None):
        self.title, self.subtitle = title, subtitle
        self.parts = []          # (id, kind, lines)
        self.events = []         # ('msg', a, b, text, kind) | ('frame_start', op, guard) | ('frame_else', guard) | ('frame_end',)
        self.n = 0
    def actor(self, id, name): self.parts.append((id, "actor", name))
    def part(self, id, lines): self.parts.append((id, "box", lines if isinstance(lines, list) else [lines]))
    def msg(self, a, b, text, kind="call"):
        self.n += 1
        self.events.append(("msg", a, b, f"{self.n}. {text}", kind))
    def ret(self, a, b, text): self.msg(a, b, text, "return")
    def self_(self, a, text): self.msg(a, a, text, "self")
    def alt(self, branches, op="alt"):
        for i, (guard, fn) in enumerate(branches):
            self.events.append(("frame_start", op, guard) if i == 0 else ("frame_else", guard))
            fn()
        self.events.append(("frame_end",))

    def render(self, min_gap=150, left=70, top=110):
        ids = [p[0] for p in self.parts]
        idx = {p: i for i, p in enumerate(ids)}
        # 1) separación necesaria entre líneas de vida vecinas según las etiquetas
        need = [min_gap] * (len(ids) - 1)
        for ev in self.events:
            if ev[0] != "msg": continue
            _, a, b, text, kind = ev
            w = tw(text, 12) + 36
            if a == b:
                i = idx[a]
                if i < len(need): need[i] = max(need[i], w + 40)
                continue
            i, j = sorted((idx[a], idx[b]))
            # la etiqueta se escribe en el primer tramo junto al emisor
            k = idx[a] if idx[a] < idx[b] else idx[a] - 1
            need[k] = max(need[k], w)
        # los textos de guarda se escriben junto a la línea de vida más a la izquierda del marco
        st = []
        for ev in self.events:
            if ev[0] == "frame_start": st.append({"g": [ev[2]], "p": set()})
            elif ev[0] == "frame_else": st[-1]["g"].append(ev[1])
            elif ev[0] == "msg":
                for f in st: f["p"] |= {ev[1], ev[2]}
            elif ev[0] == "frame_end":
                f = st.pop()
                if st: st[-1]["p"] |= f["p"]
                k = min(idx[p] for p in f["p"])
                if k < len(need): need[k] = max(need[k], max(tw(g, 12, italic=True) for g in f["g"]) + 44)
        head_w = [max(tw(l, 14, True) for l in (p[2] if isinstance(p[2], list) else [p[2]])) + 30 for p in self.parts]
        xs = [left + head_w[0] / 2]
        for k, g in enumerate(need):
            xs.append(xs[-1] + max(g, (head_w[k] + head_w[k + 1]) / 2 + 30))
        X = dict(zip(ids, xs))
        # 2) recorrido vertical
        head_b = max(top + 78 + 6 + 2 * 17.5 if p[1] == "actor" else top + 20 + 26 + 18 * len(p[2]) for p in self.parts)
        y = head_b + 50
        rows = []; frames = []; stack = []
        depth = 0
        for ev in self.events:
            if ev[0] == "msg":
                _, a, b, text, kind = ev
                if kind == "self": rows.append((ev, y)); y += self.ROW + 22
                else: rows.append((ev, y)); y += self.ROW
            elif ev[0] == "frame_start":
                stack.append({"op": ev[1], "top": y - 10, "guards": [(None, ev[2])], "depth": len(stack), "parts": set()})
                y += 48
            elif ev[0] == "frame_else":
                stack[-1]["guards"].append((y - 6, ev[1])); y += 42
            elif ev[0] == "frame_end":
                f = stack.pop(); f["bottom"] = y - 6; frames.append(f); y += 14
                if stack: stack[-1]["parts"] |= f["parts"]
            if ev[0] == "msg" and stack:
                for f in stack: f["parts"] |= {ev[1], ev[2]}
        total_h = y + 40
        W = xs[-1] + head_w[-1] / 2 + left
        d = Diagram(int(W), int(total_h + 60), self.title, self.subtitle)
        # cabezas y líneas de vida
        for (pid, kind, lines), x in zip(self.parts, xs):
            if kind == "actor":
                a = d.add(Actor(pid + "_h", x, top, lines if isinstance(lines, list) else [lines]))
                hb = a.b
            else:
                h = 26 + 18 * len(lines)
                r = d.add(Rect(pid + "_h", x - head_w[idx[pid]] / 2, top + 20, head_w[idx[pid]], h, lines, size=14, fill=HEAD))
                r.texts = []
                for i, ln in enumerate(lines):
                    r.texts.append(Text(ln, x, top + 20 + 22 + i * 18, 14 if i == 0 else 12, bold=(i == 0),
                                        color=INK if i == 0 else MUTED, anchor="middle", maxw=head_w[idx[pid]] - 10, owner=r.id))
                hb = r.b
            d.add(Lifeline(pid, x, hb, total_h))
        # marcos (de afuera hacia adentro: menor profundidad primero)
        for k, f in enumerate(sorted(frames, key=lambda f: f["depth"])):
            ps = [X[p] for p in f["parts"]] or xs
            pad = 24 + 0 * f["depth"]
            x0 = min(ps) - 120 + 14 * f["depth"]; x1 = max(ps) + 120 - 14 * f["depth"]
            # que la etiqueta del guard entre
            gw = max(tw(g, 12, italic=True) for _, g in f["guards"]) + tw(f["op"], 13, True) + 60
            x1 = max(x1, x0 + gw)
            gx = min(ps) + 14
            gw2 = max(tw(g, 12, italic=True) for _, g in f["guards"]) + (gx - x0) + 30
            x1 = max(x1, x0 + gw2)
            d.add(Frame(f"frame{k}", x0, f["top"], x1 - x0, f["bottom"] - f["top"], f["op"], f["guards"], gx=gx))
        # mensajes
        for (ev, yy) in rows:
            _, a, b, text, kind = ev
            if kind == "self":
                x = X[a]
                pts = [(x, yy), (x + 44, yy), (x + 44, yy + 24), (x, yy + 24)]
                e = d.edge(a, a, pts, end="arrow", id=text)
                e.label_xy(text, x + 52, yy + 17, 12, "start")
                continue
            xa, xb = X[a], X[b]
            e = d.edge(a, b, [(xa, yy), (xb, yy)], end=("open_arrow" if kind == "return" else "arrow"),
                       dashed=(kind == "return"), id=text)
            if xa < xb: e.label_xy(text, xa + 12, yy - 7, 12, "start")
            else: e.label_xy(text, xa - 12, yy - 7, 12, "end")
        # los mensajes pueden atravesar líneas de vida intermedias y marcos: permitido
        return d
