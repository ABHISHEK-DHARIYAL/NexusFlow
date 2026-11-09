#!/usr/bin/env python3
"""
Mechanically parses prisma/schema.prisma and generates a MySQL migration.sql
following Prisma's documented, deterministic type-mapping conventions for
the mysql provider (the same conventions `prisma migrate diff --script`
would apply). Written because this sandbox cannot reach binaries.prisma.sh
to run Prisma's own engine directly (see final report for details and the
recommended verification step).

This reads schema.prisma only - it does not invent any model, field,
relation, index, or default that isn't already declared there.
"""
import re
import sys

SCHEMA_PATH = "prisma/schema.prisma"

with open(SCHEMA_PATH) as f:
    content = f.read()


def strip_comment(line):
    out = []
    in_str = False
    i = 0
    while i < len(line):
        c = line[i]
        if c == '"':
            in_str = not in_str
        if not in_str and c == '/' and i + 1 < len(line) and line[i + 1] == '/':
            break
        out.append(c)
        i += 1
    return ''.join(out)


# ---- Parse enums ----
enums = {}
for m in re.finditer(r'enum\s+(\w+)\s*\{([^}]*)\}', content):
    name = m.group(1)
    values = [strip_comment(l).strip() for l in m.group(2).splitlines()]
    values = [v for v in values if v]
    enums[name] = values

# ---- Parse models, preserving declaration order ----
models = {}
model_order = []
model_pattern = re.compile(r'model\s+(\w+)\s*\{(.*?)\n\}', re.DOTALL)
for m in model_pattern.finditer(content):
    name = m.group(1)
    model_order.append(name)
    body = m.group(2)
    fields = []
    block_attrs = []
    for raw_line in body.splitlines():
        line = strip_comment(raw_line).strip()
        if not line:
            continue
        if line.startswith('@@'):
            block_attrs.append(line)
        else:
            fields.append(line)
    models[name] = {'fields': fields, 'block_attrs': block_attrs}

model_names = set(model_order)

FIELD_RE = re.compile(r'^(\w+)\s+([A-Za-z_]\w*)(\[\])?(\?)?\s*(.*)$')
ATTR_RE = re.compile(r'@(\w+)(\(([^()]*(?:\([^()]*\)[^()]*)*)\))?')


def parse_attrs(rest):
    """Return list of (name, raw_args_string_or_None)."""
    attrs = []
    for m in ATTR_RE.finditer(rest):
        attrs.append((m.group(1), m.group(3)))
    return attrs


def sql_ident(name):
    return f"`{name}`"


def get_map_name(block_attrs, default):
    for a in block_attrs:
        m = re.match(r'@@map\("([^"]+)"\)', a)
        if m:
            return m.group(1)
    return default


def get_field_map_name(attrs, default):
    for name, args in attrs:
        if name == 'map' and args:
            m = re.match(r'"([^"]+)"', args.strip())
            if m:
                return m.group(1)
    return default


def scalar_sql_type(prisma_type, attrs, is_list):
    has_db_text = any(name == 'db' for name, _ in attrs) is False  # placeholder, real check below
    db_text = any(a[0] == 'db.Text' for a in attrs)  # not matched this way; handled separately
    return None  # unused, kept for clarity - actual mapping happens in build_column


def build_enum_sql_type(enum_name):
    vals = ", ".join(f"'{v}'" for v in enums[enum_name])
    return f"ENUM({vals})"


def default_clause(default_raw, prisma_type, is_enum):
    """default_raw is the raw string inside @default(...)."""
    d = default_raw.strip()
    if d == 'now()':
        return "DEFAULT CURRENT_TIMESTAMP(3)"
    if d == 'uuid()' or d == 'cuid()' or d == 'autoincrement()':
        return None  # application/DB-generated, no literal SQL default
    if d in ('true', 'false'):
        return f"DEFAULT {d}"
    if re.match(r'^-?\d+(\.\d+)?$', d):
        return f"DEFAULT {d}"
    if d.startswith('"') and d.endswith('"'):
        inner = d[1:-1]
        return f"DEFAULT '{inner}'"
    if is_enum:
        # bare enum member name, e.g. @default(ACTIVE)
        return f"DEFAULT '{d}'"
    # Fallback: unrecognized default expression - surface loudly rather than
    # silently guessing.
    raise ValueError(f"Unrecognized @default(...) expression: {d!r}")


def build_column(model_name, field_line):
    m = FIELD_RE.match(field_line)
    if not m:
        return None  # e.g. a bare @@ line already filtered out upstream
    field_name, ftype, is_list, is_optional, rest = m.groups()
    attrs_raw = parse_attrs(rest)

    # Detect @db.XXX specially since it doesn't match the @name(args) shape
    db_native = None
    db_match = re.search(r'@db\.(\w+)(\([^)]*\))?', rest)
    if db_match:
        db_native = db_match.group(1)

    attrs = [(n, a) for n, a in attrs_raw if n != 'db']

    is_relation = any(n == 'relation' for n, _ in attrs)
    is_model_type = ftype in model_names

    if is_model_type and not is_relation:
        # Pure virtual back-relation field (e.g. `tasks Task[]`,
        # `githubAccount GitHubAccount?` with no fields:/references:) -
        # this is not a column on this table at all.
        return None

    if is_model_type and is_relation:
        # The relation() attribute itself never creates a column - the
        # actual FK column is a separate scalar field declared explicitly
        # elsewhere in the same model (e.g. `userId String` alongside
        # `user User @relation(fields: [userId], references: [id])`).
        # We still need to record the FK constraint though.
        return {'kind': 'relation', 'raw': rest, 'field_name': field_name, 'target': ftype}

    # Regular scalar/enum column
    col_name = get_field_map_name(attrs, field_name)
    is_enum_type = ftype in enums

    if is_list and not is_model_type:
        raise ValueError(f"{model_name}.{field_name}: scalar list type {ftype}[] is not supported by the mysql provider")

    if db_native == 'Text':
        sql_type = 'TEXT'
    elif is_enum_type:
        sql_type = build_enum_sql_type(ftype)
    elif ftype == 'String':
        sql_type = 'VARCHAR(191)'
    elif ftype == 'Int':
        sql_type = 'INT'
    elif ftype == 'BigInt':
        sql_type = 'BIGINT'
    elif ftype == 'Boolean':
        sql_type = 'BOOLEAN'
    elif ftype == 'DateTime':
        sql_type = 'DATETIME(3)'
    elif ftype == 'Float':
        sql_type = 'DOUBLE'
    elif ftype == 'Json':
        sql_type = 'JSON'
    else:
        raise ValueError(f"{model_name}.{field_name}: unrecognized scalar type {ftype}")

    is_id = any(n == 'id' for n, _ in attrs)
    is_unique = any(n == 'unique' for n, _ in attrs)
    is_updated_at = any(n == 'updatedAt' for n, _ in attrs)

    nullability = "NULL" if is_optional else "NOT NULL"

    default_sql = None
    for n, a in attrs:
        if n == 'default' and a is not None:
            default_sql = default_clause(a, ftype, is_enum_type)

    if is_updated_at:
        default_sql = "DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)"

    parts = [sql_ident(col_name), sql_type, nullability]
    if default_sql:
        parts.append(default_sql)

    return {
        'kind': 'column',
        'field_name': field_name,
        'col_name': col_name,
        'sql': " ".join(parts),
        'is_id': is_id,
        'is_unique': is_unique,
    }


def build_model(model_name):
    fields = models[model_name]['fields']
    block_attrs = models[model_name]['block_attrs']
    table_name = get_map_name(block_attrs, model_name)

    columns = []
    relations = []
    pk_field = None
    field_to_col = {}

    for line in fields:
        result = build_column(model_name, line)
        if result is None:
            continue
        if result['kind'] == 'column':
            columns.append(result)
            field_to_col[result['field_name']] = result['col_name']
            if result['is_id']:
                pk_field = result['col_name']
        elif result['kind'] == 'relation':
            relations.append(result)

    return {
        'table_name': table_name,
        'columns': columns,
        'relations': relations,
        'block_attrs': block_attrs,
        'pk_field': pk_field,
        'field_to_col': field_to_col,
    }


built = {name: build_model(name) for name in model_order}

# ---- Emit CREATE TABLE statements ----
out = []
out.append("-- NexusFlow initial database schema")
out.append("-- Generated from prisma/schema.prisma (mechanically, see scripts/generate_migration.py)")
out.append("-- Provider: mysql")
out.append("")

for name in model_order:
    b = built[name]
    lines = [f"CREATE TABLE {sql_ident(b['table_name'])} ("]
    col_defs = []
    for col in b['columns']:
        col_defs.append(f"    {col['sql']}")
    if b['pk_field']:
        col_defs.append(f"    PRIMARY KEY ({sql_ident(b['pk_field'])})")
    lines.append(",\n".join(col_defs))
    lines.append(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;")
    out.append("\n".join(lines))
    out.append("")

# ---- Emit unique constraints from field-level @unique and @@unique ----
for name in model_order:
    b = built[name]
    table = b['table_name']
    for col in b['columns']:
        if col['is_unique']:
            idx_name = f"{table}_{col['col_name']}_key"
            out.append(
                f"CREATE UNIQUE INDEX {sql_ident(idx_name)} ON {sql_ident(table)}({sql_ident(col['col_name'])});"
            )
    for attr in b['block_attrs']:
        m = re.match(r'@@unique\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)', attr)
        if m:
            field_list = [f.strip() for f in m.group(1).split(',')]
            col_list = [b['field_to_col'].get(f, f) for f in field_list]
            idx_name = m.group(2) or f"{table}_{'_'.join(col_list)}_key"
            cols_sql = ", ".join(sql_ident(c) for c in col_list)
            out.append(f"CREATE UNIQUE INDEX {sql_ident(idx_name)} ON {sql_ident(table)}({cols_sql});")

out.append("")

# ---- Emit regular indexes from @@index ----
for name in model_order:
    b = built[name]
    table = b['table_name']
    for attr in b['block_attrs']:
        m = re.match(r'@@index\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)', attr)
        if m:
            field_list = [f.strip() for f in m.group(1).split(',')]
            col_list = [b['field_to_col'].get(f, f) for f in field_list]
            idx_name = m.group(2) or f"{table}_{'_'.join(col_list)}_idx"
            cols_sql = ", ".join(sql_ident(c) for c in col_list)
            out.append(f"CREATE INDEX {sql_ident(idx_name)} ON {sql_ident(table)}({cols_sql});")

out.append("")

# ---- Emit foreign key constraints ----
fk_count = 0
for name in model_order:
    b = built[name]
    table = b['table_name']
    for rel in b['relations']:
        raw = rel['raw']
        fields_m = re.search(r'fields:\s*\[([^\]]+)\]', raw)
        refs_m = re.search(r'references:\s*\[([^\]]+)\]', raw)
        ondelete_m = re.search(r'onDelete:\s*(\w+)', raw)
        if not fields_m or not refs_m:
            continue
        fk_field = fields_m.group(1).strip()
        ref_field = refs_m.group(1).strip()
        fk_col = b['field_to_col'].get(fk_field, fk_field)
        target_model = rel['target']
        target_table = built[target_model]['table_name']
        target_col = built[target_model]['field_to_col'].get(ref_field, ref_field)
        ondelete = ondelete_m.group(1) if ondelete_m else 'Restrict'
        ondelete_sql = {
            'Cascade': 'CASCADE',
            'SetNull': 'SET NULL',
            'Restrict': 'RESTRICT',
            'NoAction': 'NO ACTION',
        }.get(ondelete, 'RESTRICT')
        constraint_name = f"{table}_{fk_col}_fkey"
        out.append(
            f"ALTER TABLE {sql_ident(table)} ADD CONSTRAINT {sql_ident(constraint_name)} "
            f"FOREIGN KEY ({sql_ident(fk_col)}) REFERENCES {sql_ident(target_table)}({sql_ident(target_col)}) "
            f"ON DELETE {ondelete_sql} ON UPDATE CASCADE;"
        )
        fk_count += 1

sql_text = "\n".join(out)

with open("prisma/migrations/0001_init/migration.sql", "w") as f:
    f.write(sql_text)

print(f"Generated migration.sql: {len(model_order)} tables, {fk_count} foreign keys", file=sys.stderr)
