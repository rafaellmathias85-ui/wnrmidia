#!/usr/bin/env python3
"""
Injeta os location blocks do WnrMidia no server block nginx que serve porta 80.
Executa como: sudo python3 nginx_inject.py
"""
import subprocess, os, sys

LOCATION_BLOCK = """
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

# Achar config que serve porta 80
result = subprocess.run(
    ['grep', '-rl', 'listen 80', '/etc/nginx/sites-enabled/'],
    capture_output=True, text=True
)

files = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
if not files:
    # Fallback: procurar em sites-available
    result2 = subprocess.run(
        ['grep', '-rl', 'listen 80', '/etc/nginx/sites-available/'],
        capture_output=True, text=True
    )
    files = [f.strip() for f in result2.stdout.strip().split('\n') if f.strip()]

if not files:
    files = ['/etc/nginx/sites-available/default']

conf_file = files[0]
if os.path.islink(conf_file):
    conf_file = os.path.realpath(conf_file)

print(f"Config encontrada: {conf_file}")

with open(conf_file, 'r') as f:
    content = f.read()

print(f"Tamanho da config: {len(content)} chars")
print("--- Primeiras 800 chars ---")
print(content[:800])
print("---")

# Remover injecao anterior se existir
if 'wnrmidia' in content:
    print("=> Removendo injecao anterior...")
    new_lines = []
    skip = False
    brace_depth = 0
    for line in content.split('\n'):
        if '# WnrMidia admin panel' in line:
            skip = True
        if skip:
            brace_depth += line.count('{') - line.count('}')
            if brace_depth <= 0 and line.strip().startswith('}'):
                skip = False
                brace_depth = 0
            continue
        if 'wnrmidia_spa' in line or ('@wnrmidia' in line):
            continue
        if '/wnrmidia/app' in line and ('location' in line or 'proxy_pass' in line or 'alias' in line or 'return 301' in line):
            continue
        new_lines.append(line)
    content = '\n'.join(new_lines)

# Encontrar fechamento do server block com listen 80
lines = content.split('\n')
brace_depth = 0
in_server = False
has_port_80 = False
insert_at = None

for i, line in enumerate(lines):
    opens = line.count('{')
    closes = line.count('}')
    stripped = line.strip()

    if not in_server and stripped.startswith('server') and opens > 0:
        in_server = True
        has_port_80 = False
        brace_depth = opens - closes
    elif in_server:
        if 'listen 80' in line or 'listen [::]:80' in line:
            has_port_80 = True
        brace_depth += opens - closes
        if brace_depth <= 0:
            if has_port_80:
                insert_at = i
                break
            in_server = False

if insert_at is None:
    print("ERRO: server block porta 80 nao encontrado")
    print("Conteudo completo:")
    print(content)
    sys.exit(1)

print(f"=> Inserindo location blocks antes da linha {insert_at}: {lines[insert_at]!r}")
lines.insert(insert_at, LOCATION_BLOCK)
new_content = '\n'.join(lines)

with open(conf_file, 'w') as f:
    f.write(new_content)

print("=> Injecao concluida com sucesso!")
