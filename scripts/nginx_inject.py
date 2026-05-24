#!/usr/bin/env python3
"""
Configura nginx para WnrMidia sem tocar no site existente.
- Limpa configuracoes ruins de deploys anteriores
- Injeta location blocks no wnrtecnologia
"""
import subprocess, os, sys

LOCATION_BLOCK = """\

    # WnrMidia admin panel e API
    location ^~ /wnrmidia/app/api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 500M;
    }
    location ^~ /wnrmidia/app/uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        client_max_body_size 500M;
    }
    location ^~ /wnrmidia/app/ {
        alias /var/www/wnrmidia/admin-panel/build/;
        index index.html;
        try_files $uri $uri/ @wnrmidia_spa;
    }
    location @wnrmidia_spa {
        root /var/www/wnrmidia/admin-panel/build;
        rewrite ^ /index.html break;
    }
    location = /wnrmidia/app {
        return 301 /wnrmidia/app/;
    }
"""

def remove_wnrmidia_lines(content):
    """Remove qualquer bloco wnrmidia injetado anteriormente."""
    lines = content.split('\n')
    result = []
    skip = False
    depth = 0
    for line in lines:
        if '# WnrMidia admin panel' in line:
            skip = True
            depth = 0
            continue
        if skip:
            depth += line.count('{') - line.count('}')
            if depth <= 0 and line.strip() == '}':
                skip = False
            continue
        # Remover linhas soltas com wnrmidia que ficaram de injecoes anteriores
        if 'wnrmidia_spa' in line or '@wnrmidia' in line:
            continue
        result.append(line)
    return '\n'.join(result)

# ---------------------------------------------------------------
# 1. Limpar arquivos ruins de deploys anteriores
# ---------------------------------------------------------------
print("=== Limpando deploys anteriores ===")

# Remover config wnrmidia na porta 8080
for path in ['/etc/nginx/sites-enabled/wnrmidia', '/etc/nginx/sites-available/wnrmidia']:
    if os.path.exists(path):
        os.remove(path)
        print(f"Removido: {path}")

# Limpar injecao ruim do default
default_path = '/etc/nginx/sites-available/default'
if os.path.isfile(default_path):
    with open(default_path) as f:
        content = f.read()
    if 'wnrmidia' in content.lower():
        clean = remove_wnrmidia_lines(content)
        with open(default_path, 'w') as f:
            f.write(clean)
        print("Config default limpo.")

# ---------------------------------------------------------------
# 2. Encontrar o config do site principal
# ---------------------------------------------------------------
print("\n=== Procurando config do site principal ===")
print("Arquivos em sites-available:")
for f in sorted(os.listdir('/etc/nginx/sites-available')):
    print(f"  {f}")

print("Arquivos em sites-enabled:")
for f in sorted(os.listdir('/etc/nginx/sites-enabled')):
    print(f"  {f}")

# Tentar wnrtecnologia primeiro (nome conhecido)
candidates = [
    '/etc/nginx/sites-available/wnrtecnologia',
    '/etc/nginx/sites-enabled/wnrtecnologia',
]

conf_file = None
for c in candidates:
    real = os.path.realpath(c)
    if os.path.isfile(real) and 'wnrmidia' not in real:
        conf_file = real
        print(f"Config encontrada por nome: {conf_file}")
        break

# Fallback: varrer sites-available
if not conf_file:
    for fname in sorted(os.listdir('/etc/nginx/sites-available')):
        if 'wnrmidia' in fname or fname == 'default':
            continue
        fpath = os.path.realpath(os.path.join('/etc/nginx/sites-available', fname))
        if os.path.isfile(fpath):
            conf_file = fpath
            print(f"Config encontrada por varredura: {conf_file}")
            break

if not conf_file:
    print("ERRO: nenhum config do site principal encontrado. Mostrando nginx -T:")
    subprocess.run(['nginx', '-T'])
    sys.exit(1)

# ---------------------------------------------------------------
# 3. Ler e mostrar o config encontrado
# ---------------------------------------------------------------
with open(conf_file) as f:
    original = f.read()

print(f"\n=== Conteudo de {conf_file} ===")
print(original)
print("=== fim do conteudo ===\n")

# ---------------------------------------------------------------
# 4. Fazer backup
# ---------------------------------------------------------------
backup_path = conf_file + '.wnrmidia.bak'
with open(backup_path, 'w') as f:
    f.write(original)
print(f"Backup criado: {backup_path}")

# ---------------------------------------------------------------
# 5. Remover injecao anterior e reinjetar
# ---------------------------------------------------------------
content = remove_wnrmidia_lines(original)

lines = content.split('\n')
brace_depth = 0
in_server = False
insert_at = None

for i, line in enumerate(lines):
    opens = line.count('{')
    closes = line.count('}')
    stripped = line.strip()

    if not in_server and stripped.startswith('server') and opens > 0:
        in_server = True
        brace_depth = opens - closes
    elif in_server:
        brace_depth += opens - closes
        if brace_depth <= 0:
            insert_at = i
            break

if insert_at is None:
    print("ERRO: nenhum server block encontrado")
    sys.exit(1)

print(f"Inserindo antes da linha {insert_at}: {lines[insert_at]!r}")
lines.insert(insert_at, LOCATION_BLOCK)
new_content = '\n'.join(lines)

with open(conf_file, 'w') as f:
    f.write(new_content)

# ---------------------------------------------------------------
# 6. Testar nginx; restaurar backup se falhar
# ---------------------------------------------------------------
result = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
if result.returncode != 0:
    print("ERRO nginx -t:")
    print(result.stderr)
    print("Restaurando backup...")
    with open(conf_file, 'w') as f:
        f.write(original)
    subprocess.run(['nginx', '-t'])
    sys.exit(1)

print("nginx -t OK!")
