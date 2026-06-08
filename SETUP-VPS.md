# Setup da VPS para o Front (uma vez) — jogar.weissmurillo.de

Front = imagem Docker (Nginx servindo o SPA), igual ao back. A VPS puxa do ghcr
e sobe via `docker compose`. O Nginx do host faz TLS e roteia para os contêineres.

## 0. DNS
Garanta um registro **A** `jogar.weissmurillo.de` → `187.124.243.193`.

## 1. Pasta de deploy + compose + .env
> ⚠️ Use uma pasta **diferente** da do backend. Os dois workflows escrevem
> `IMAGE_TAG` no `.env` da sua pasta — se back e front compartilharem a mesma,
> um sobrescreve o tag do outro. (Se preferir uma pasta só, juntar num único
> compose com `BACK_TAG`/`FRONT_TAG` — me avisa que eu monto.)

```bash
mkdir -p /opt/proexgame-deploy            # = VPS_DEPLOY_DIR do front
cd /opt/proexgame-deploy

# copie deploy/docker-compose.prod.yml do repo do front para cá como:
#   /opt/proexgame-deploy/docker-compose.yml

# .env (troque <owner>/<repo> pelo caminho real do repo do front no GitHub)
cat > .env <<'EOF'
FRONT_IMAGE=ghcr.io/<owner>/<repo>
FRONT_PORT=8080
IMAGE_TAG=latest
EOF
```

## 2. Certificado TLS (porta 80 já serve o ACME)
```bash
certbot certonly --webroot -w /var/www/html -d jogar.weissmurillo.de
```

## 3. Nginx do host
```bash
# copie deploy/nginx-host.conf do repo para:
cp deploy/nginx-host.conf /etc/nginx/sites-available/jogar
ln -s /etc/nginx/sites-available/jogar /etc/nginx/sites-enabled/jogar
nginx -t && systemctl reload nginx
```
Ele roteia `/socket.io/` → `127.0.0.1:3003` (back) e `/` → `127.0.0.1:8080` (front).

## 4. Primeiro `up` (depois o CI faz sozinho)
O deploy automático (no merge) já loga no ghcr e dá `docker compose pull && up -d`.
Para subir manual a 1ª vez:
```bash
cd /opt/proexgame-deploy
docker compose up -d
```

## 5. Secrets no repo do FRONT (GitHub → Settings → Secrets → Actions)
| Secret | Valor |
| --- | --- |
| `VPS_HOST` | `187.124.243.193` |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` |
| `VPS_DEPLOY_DIR` | `/opt/proexgame-deploy` |
| `VPS_SSH_KEY` | **chave PRIVADA** do par `github-deploy-proexgame` (a `ssh-ed25519` que está no `authorized_keys`) — começa com `-----BEGIN OPENSSH PRIVATE KEY-----`. NÃO a pública. |

> O login no ghcr é feito pelo `GITHUB_TOKEN` do job (não precisa de PAT).
