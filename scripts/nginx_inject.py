#!/usr/bin/env python3
"""
Injeta os location blocks do WnrMidia no server block nginx que serve porta 80.
Executa como: sudo python3 nginx_inject.py
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

# --- Limpar config wnrmidia antiga (porta 8080 do deploy anterior) ---
old_wnrmidia = '/etc/nginx/sites-available/wnrmidia'
old_link = '/etc/nginx/sites-enabled/wnrmidia'
if os.path.exists(old_link):
    os.remove(old_link)
    print(f"Removido link: {old_link}")
if os.path.exists(old_wnrmidia):
    os.remove(old_wnrmidia)
    print(f"Removido config antigo: {old_wnrmidia}")

# --- Limpar injecoes ruins no default ---
default_conf = '/etc/nginx/sites-available/default'
if os.path.exists(default_conf):
    with open(default_conf) as f:
        content = f.read()
    if 'wnrmidia' in content:
        print("Removendo injecao incorreta do default...")
        new_lines = []
        skip = False
        depth = 0
        for line in content.split('\n'):
            if '# WnrMidia' in line:
                skip = True
            if skip:
                depth += line.count('{') - line.count('}')
                if depth <= 0 and ('}' in line or line.strip() == ''):
                    if '}' in line:
                        skip = False
                        depth = 0
                    continue
                continue
            if 'wnrmidia' in line.lower():
                continue
            new_lines.append(line)
        with open(default_conf, 'w') as f:
            f.write('\n'.join(new_lines))
        print("Default limpo.")

# --- Encontrar o config do site principal (wnrtecnologia) ---
# Estrategia 1: arquivo wnrtecnologia diretamente
candidates = [
    '/etc/nginx/sites-available/wnrtecnologia',
    '/etc/nginx/sites-enabled/wnrtecnologia',
]

conf_file = None
for c in candidates:
    real = os.path.realpath(c)
    if os.path.isfile(real):
        conf_file = real
        print(f"Config encontrada (por nome): {conf_file}")
        break

# Estrategia 2: varrer sites-available procurando listen 80 ou listen.*80
if not conf_file:
    sites_available = '/etc/nginx/sites-available'
    for fname in os.listdir(sites_available):
        if 'wnrmidia' in fname:
            continue
        fpath = os.path.join(sites_available, fname)
        real = os.path.realpath(fpath)
        try:
            with open(real) as f:
                content = f.read()
            if 'listen 80' in content or 'listen\t80' in content or ':80' in content:
                conf_file = real
                print(f"Config encontrada (por listen 80): {conf_file}")
                break
        except Exception as e:
            print(f"Erro lendo {real}: {e}")

if not conf_file:
    print("ERRO: nao foi possivel encontrar o config nginx do site principal")
    print("Arquivos em sites-available:")
    subprocess.run(['ls', '-la', '/etc/nginx/sites-available/'])
    print("Arquivos em sites-enabled:")
    subprocess.run(['ls', '-la', '/etc/nginx/sites-enabled/'])
    sys.exit(1)

with open(conf_file, 'r') as f:
    content = f.read()

print(f"Tamanho da config: {len(content)} chars")
print("--- Conteudo completo ---")
print(content)
print("---")

# Remover injecao anterior se existir
if 'wnrmidia' in content:
    print("=> Removendo injecao anterior...")
    new_lines = []
    skip = False
    depth = 0
    for line in content.split('\n'):
        if '# WnrMidia' in line:
            skip = True
            depth = 0
        if skip:
            depth += line.count('{') - line.count('}')
            if depth <= 0 and line.strip().startswith('}'):
                skip = False
                depth = 0
            continue
        if 'wnrmidia_spa' in line or '@wnrmidia' in line:
            continue
        if '/wnrmidia/app' in line and any(k in line for k in ['location', 'proxy_pass', 'alias', 'return 301', 'root', 'rewrite']):
            continue
        new_lines.append(line)
    content = '\n'.join(new_lines)

# Encontrar o server block com listen 80 usando contagem de chaves
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
        if 'listen 80' in line or 'listen\t80' in line or ':80' in line:
            has_port_80 = True
        brace_depth += opens - closes
        if brace_depth <= 0:
            if has_port_80:
                insert_at = i
                break
            in_server = False

# Se nao achou server block com listen 80, usar o primeiro server block
if insert_at is None:
    print("Aviso: server block com listen 80 nao encontrado, usando primeiro server block")
    brace_depth = 0
    in_server = False
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
    print("ERRO: nenhum server block encontrado no arquivo")
    sys.exit(1)

print(f"=> Inserindo location blocks antes da linha {insert_at}: {lines[insert_at]!r}")
lines.insert(insert_at, LOCATION_BLOCK)
new_content = '\n'.join(lines)

with open(conf_file, 'w') as f:
    f.write(new_content)

print("=> Injecao concluida com sucesso!")
print("--- Config final (ultimas 600 chars) ---")
print(new_content[-600:])
