#!/usr/bin/env python3
"""
Configura nginx para WnrMidia sem tocar no site existente.
- Remove blocos wnrmidia anteriores (por comentario ou por path na URL)
- Reinjeta location blocks atualizados no wnrtecnologia
"""
import subprocess, os, sys, re

LOCATION_BLOCK = """\

    # WnrMidia admin panel e API
    location = /wnrmidia/app {
        return 301 /wnrmidia/app/;
    }
    location ^~ /wnrmidia/app/api/ {
        rewrite ^/wnrmidia/app/api/(.*)$ /api/$1 break;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;
    }
    location ^~ /wnrmidia/app/uploads/ {
        rewrite ^/wnrmidia/app/uploads/(.*)$ /uploads/$1 break;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;
    }
    location ^~ /wnrmidia/app/socket.io/ {
        rewrite ^/wnrmidia/app/socket.io/(.*)$ /socket.io/$1 break;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /wnrmidia/downloads/ {
        alias /var/www/wnrmidia/downloads/;
        add_header Content-Disposition "attachment";
        add_header Cache-Control "no-store" always;
    }
    location ^~ /wnrmidia/app/ {
        alias /var/www/wnrmidia/admin-panel/build/;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        try_files $uri $uri/ /wnrmidia-app-index.html;
    }
    location = /wnrmidia-app-index.html {
        internal;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        alias /var/www/wnrmidia/admin-panel/build/index.html;
    }
"""

def remove_wnrmidia_blocks(content):
    """
    Remove qualquer bloco wnrmidia: detecta por comentario marcador OU
    por 'location' cujo path contem 'wnrmidia'.
    """
    lines = content.split('\n')
    result = []
    skip = False
    depth = 0

    for line in lines:
        stripped = line.strip()

        if not skip:
            # Detectar inicio de bloco wnrmidia:
            # - comentario marcador antigo
            # - location cujo path contem 'wnrmidia'
            is_marker = '# WnrMidia' in line
            is_location = bool(re.match(r'location\b[^{]*wnrmidia[^{]*\{', stripped))

            if is_marker or is_location:
                skip = True
                depth = line.count('{') - line.count('}')
                # bloco de uma linha (ex: location = /x { return ...; })
                if depth <= 0:
                    skip = False
                continue

            # Remover linhas soltas de injecoes antigas
            if 'wnrmidia_spa' in line or '@wnrmidia_spa' in line:
                continue

            result.append(line)
        else:
            depth += line.count('{') - line.count('}')
            if depth <= 0:
                skip = False
            # linha de fechamento do bloco nao vai para result

    return '\n'.join(result)

# ---------------------------------------------------------------
# 1. Limpar arquivos ruins de deploys anteriores
# ---------------------------------------------------------------
print("=== Limpando deploys anteriores ===")

for path in ['/etc/nginx/sites-enabled/wnrmidia', '/etc/nginx/sites-available/wnrmidia']:
    if os.path.exists(path):
        os.remove(path)
        print(f"Removido: {path}")

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

candidates = [
    '/etc/nginx/sites-enabled/wnrtecnologia',
    '/etc/nginx/sites-available/wnrtecnologia',
]

conf_file = None
for c in candidates:
    real = os.path.realpath(c)
    if os.path.isfile(real) and 'wnrmidia' not in real:
        conf_file = real
        print(f"Config encontrada: {conf_file}")
        break

if not conf_file:
    for fname in sorted(os.listdir('/etc/nginx/sites-available')):
        if 'wnrmidia' in fname or fname == 'default' or fname.endswith('.bak'):
            continue
        fpath = os.path.realpath(os.path.join('/etc/nginx/sites-available', fname))
        if os.path.isfile(fpath):
            conf_file = fpath
            print(f"Config encontrada por varredura: {conf_file}")
            break

if not conf_file:
    print("ERRO: nenhum config do site principal encontrado.")
    sys.exit(1)

# ---------------------------------------------------------------
# 3. Ler config, remover blocos antigos, reinjetar
# ---------------------------------------------------------------
with open(conf_file) as f:
    original = f.read()

# Backup salvo em /tmp — nao pode ficar em sites-enabled pois nginx carrega tudo de la
backup_path = os.path.join('/tmp', os.path.basename(conf_file) + '.wnrmidia.bak')
with open(backup_path, 'w') as f:
    f.write(original)
print(f"Backup criado: {backup_path}")

# Remover blocos anteriores e reinjetar
cleaned = remove_wnrmidia_blocks(original)

# Encontrar posicao de insercao: antes do } que fecha o server block
lines = cleaned.split('\n')
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
# 4. Testar nginx; restaurar backup se falhar
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

print("nginx -t OK! Injecao concluida.")
