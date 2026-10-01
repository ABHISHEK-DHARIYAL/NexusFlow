#!/usr/bin/env python3
"""
Mechanically parses prisma/schema.prisma and generates MySQL DDL following
Prisma's documented, deterministic type-mapping conventions for the mysql
provider. Written because this sandbox cannot reach binaries.prisma.sh to
run `prisma migrate diff` / `prisma generate` directly (see final report).

This does NOT invent any model, field, or relation - it only reads what is
already in schema.prisma and translates it to SQL.
"""
import re
import sys

SCHEMA_PATH = "prisma/schema.prisma"

with open(SCHEMA_PATH) as f:
    content = f.read()

# Strip line comments (// ...) but keep the rest of the line before them
def strip_comment(line):
    # avoid stripping inside strings (default("..."))
    out = []
    in_str = False
    i = 0
    while i < len(line):
        c = line[i]
        if c == '"':
            in_str = not in_str
        if not in_str and c == '/' and i + 1 < len(line) and line[i+1] == '/':
            break
        out.append(c)
        i += 1
    return ''.join(out)

# ---- Parse enums ----
enums = {}  # name -> [values]
for m in re.finditer(r'enum\s+(\w+)\s*\{([^}]*)\}', content):
    name = m.group(1)
    body = m.group(2)
    values = []
    for line in body.splitlines():
        line = strip_comment(line).strip()
        if not line:
            continue
        values.append(line)
    enums[name] = values

# ---- Parse models ----
models = {}  # name -> {fields: [...], block_attrs: [...], map: table_name}

model_pattern = re.compile(r'model\s+(\w+)\s*\{(.*?)\n\}', re.DOTALL)
for m in model_pattern.finditer(content):
    name = m.group(1)
    body = m.group(2)
    fields = []
    block_attrs = []
    for raw_line in body.splitlines():
        line = strip_comment(raw_line).strip()
        if not line:
            continue
        if line.startswith('@@'):
            block_attrs.append(line)
            continue
        # field line: name Type modifiers... attrs...
        fields.append(line)
    models[name] = {'fields': fields, 'block_attrs': block_attrs}

print(f"Parsed {len(enums)} enums and {len(models)} models", file=sys.stderr)
for n in models:
    print(f"  model {n}: {len(models[n]['fields'])} field lines, {len(models[n]['block_attrs'])} block attrs", file=sys.stderr)
