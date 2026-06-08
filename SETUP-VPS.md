# Setup da VPS para o Front (uma vez) — jogar.weissmurillo.de

Front = imagem Docker (Nginx servindo o SPA), igual ao back. A VPS puxa do ghcr
e sobe via `docker compose`. O Nginx do host faz TLS e roteia para os contêineres.

## 0. DNS
Garanta um registro **A** `jogar.weissmurillo.de` → `<IP_DA_VPS>`.

## 1. Pasta de deploy + compose + .env
> ⚠️ **Use uma pasta EXCLUSIVA do front — NUNCA a mesma do backend.** Cada
> workflow faz `cd "$VPS_DEPLOY_DIR"` e roda `docker compose pull/up` na pasta.
> Se o front apontar para a pasta do back (`/opt/proexgame-deploy`), o deploy do
> front sobe o **compose do back** (e dá `403 Forbidden`, pois o `GITHUB_TOKEN`
> do front não acessa o package do back). Por isso o front usa **`/opt/proexgame-front`**.

```bash
mkdir -p /opt/proexgame-front            # = VPS_DEPLOY_DIR do front (≠ do back!)
cd /opt/proexgame-front

# copie deploy/docker-compose.prod.yml do repo do front para cá como:
#   /opt/proexgame-front/docker-compose.yml

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
cd /opt/proexgame-front
docker compose up -d
```

## 5. Secrets no repo do FRONT (GitHub → Settings → Secrets → Actions)
> Os valores reais ficam **apenas nos GitHub Secrets** — não comitar aqui.

| Secret | Valor |
| --- | --- |
| `VPS_HOST` | IP da VPS (ex.: `187.124.243.193`). |
| `VPS_USER` | Usuário SSH (ex.: `root`). **Tem que ser o dono do `authorized_keys` onde a chave pública foi instalada.** |
| `VPS_DEPLOY_DIR` | `/opt/proexgame-front` — pasta **exclusiva** do front (ver §1). |
| `VPS_SSH_KEY` | **Chave PRIVADA** dedicada ao deploy. Cole o conteúdo **inteiro**, com as linhas `-----BEGIN OPENSSH PRIVATE KEY-----` / `-----END...` e todas as quebras de linha. **NÃO** é a pública (`ssh-ed25519 AAAA...`). A pública correspondente vai no `~/.ssh/authorized_keys` do `VPS_USER`. |

> ⚠️ **NÃO crie o secret `VPS_PORT`** se o SSH está na porta padrão **22** — o
> workflow usa `${{ secrets.VPS_PORT || 22 }}`, então a ausência já resolve para
> 22. Criar `VPS_PORT` com valor errado faz o deploy falhar com `dial tcp: i/o
> timeout`. Só crie esse secret se o SSH realmente usar outra porta.

> O login no ghcr é feito pelo `GITHUB_TOKEN` do job (não precisa de PAT).

### Como preparar o par de chaves (resumo)
```bash
# Na sua máquina:
ssh-keygen -t ed25519 -C "gh-deploy-proexgame-front" -f ~/.ssh/gh-deploy-front -N ""
ssh-keygen -y -f ~/.ssh/gh-deploy-front      # valida: deve imprimir a pública

# Instale a PÚBLICA na VPS (no usuário VPS_USER):
ssh-copy-id -i ~/.ssh/gh-deploy-front.pub <VPS_USER>@<VPS_HOST>
#   (ou, já logado na VPS, faça o append em ~/.ssh/authorized_keys)

# Grave a PRIVADA no secret (gh CLI):
gh secret set VPS_SSH_KEY --repo <owner>/proexGame-front < ~/.ssh/gh-deploy-front
```

## 6. Troubleshooting — erros já enfrentados neste deploy

| Erro no job "Deploy na VPS via SSH" | Causa | Correção |
| --- | --- | --- |
| `ssh.ParsePrivateKey: ssh: no key found` | `VPS_SSH_KEY` não é uma chave privada válida (colaram a pública, ou sem as quebras de linha / sem `BEGIN/END`). | Regrave o secret com a **privada inteira** (ver §5). Valide antes com `ssh-keygen -y -f <chave>`. |
| `dial tcp ***:***: i/o timeout` | `VPS_PORT` ou `VPS_HOST` com valor errado (a conexão não chega à VPS). Comum: secret `VPS_PORT` criado com valor inválido quando o SSH é 22. | **Delete** `VPS_PORT` (usa 22) ou corrija-o; confirme `VPS_HOST`. |
| `403 Forbidden` ao puxar `proexgame-back:*` | `VPS_DEPLOY_DIR` aponta para a pasta do **back** → o front roda o compose do back, cuja imagem o token do front não acessa. | Use pasta exclusiva do front (`/opt/proexgame-front`, §1) e ajuste o secret `VPS_DEPLOY_DIR`. |

> Diagnóstico útil na VPS: `docker compose ls` (mostra a pasta de cada projeto) e
> `docker ps --format '{{.Names}} -> {{.Image}}'` (mostra a imagem real rodando).
