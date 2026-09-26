"""Carga el modelo real de la base (generado desde EF Core) y el DDL real."""
import json, re, os
HERE = os.path.dirname(__file__)
MODEL = json.load(open(os.path.join(HERE, "model.json")))
DDL = open(os.path.join(HERE, "ddl_real.sql")).read()

def ddl_order(table):
    m = re.search(r"CREATE TABLE \[%s\] \((.*?)\n\);" % table, DDL, re.S)
    return re.findall(r"^\s+\[(\w+)\] ", m.group(1), re.M)

def checks(table):
    m = re.search(r"CREATE TABLE \[%s\] \((.*?)\n\);" % table, DDL, re.S)
    return re.findall(r"CONSTRAINT \[(CK_\w+)\] CHECK \((.*)\)", m.group(1))

TABLES = {}
for t in MODEL:
    cols = {c["name"]: c for c in t["columns"]}
    order = ddl_order(t["table"])
    assert set(order) == set(cols), t["table"]
    uniq_single = {i["cols"][0] for i in t["indexes"] if i["unique"] and len(i["cols"]) == 1}
    uniq_multi = [i for i in t["indexes"] if i["unique"] and len(i["cols"]) > 1]
    fkcols = {f["cols"][0]: f for f in t["fks"]}
    rows = []
    for name in order:
        c = cols[name]
        tags = []
        if c["pk"]: tags.append("PK")
        if name in fkcols: tags.append("FK")
        if name in uniq_single and not c["pk"]: tags.append("UK")
        for k, u in enumerate(uniq_multi, 1):
            if name in u["cols"]: tags.append(f"U{k}")
        rows.append((" ".join(tags), name, c["type"], c["nullable"]))
    TABLES[t["table"]] = dict(rows=rows, fks=t["fks"], indexes=t["indexes"], entity=t["entity"], columns=cols,
                              uniq_multi=uniq_multi, checks=checks(t["table"]))

FKS = [(t, f["cols"][0], f["principal"], f["unique"]) for t, v in TABLES.items() for f in v["fks"]]
