# Deploy do Frontend (CI/CD)

**Mesmo modelo do backend** (`proexGame-back`): o front vira uma **imagem Docker**
(Nginx servindo o SPA) publicada no **ghcr.io**; a VPS puxa a imagem e sobe via
`docker compose`. Sem copiar arquivos, sem gerenciar `/var/www/jogo`.

O **Nginx do host** faz o TLS e roteia:

- `/socket.io/` → contêiner do **backend** (`127.0.0.1:3003`)
- `/` → contêiner do **front** (`127.0.0.1:8080`)

Assim o front conecta no backend pelo **mesmo domínio** (o build de produção usa
same-origin; o Nginx encaminha o socket). Sem CORS.

## Workflows

- **`.github/workflows/ci.yml`** — em PR e push na `main`: `lint` → `test:run` → `build`.
- **`.github/workflows/release.yml`** — ao mergear na `main`:
  1. cria tag `vX.Y.Z` + GitHub Release (Conventional Commits);
  2. builda a imagem Docker e publica no ghcr (`:vX.Y.Z` + `:latest`);
  3. SSH na VPS: `docker compose pull` + `up -d` (mesmo passo do back).

## Arquivos de deploy (no repo)

- `Dockerfile` — build do Vite + Nginx servindo o `dist/`.
- `deploy/nginx.conf` — Nginx **do contêiner** (serve o SPA com fallback de rota).
- `deploy/docker-compose.prod.yml` — serviço `frontend` (imagem do ghcr, exposto
  em `127.0.0.1:${FRONT_PORT:-8080}`).
- `deploy/nginx-host.conf` — **referência** do Nginx do HOST (TLS + roteamento).

## Segredos do repositório (GitHub → Settings → Secrets and variables → Actions)

Os mesmos do backend:

| Secret           | Descrição |
| ---------------- | --------- |
| `VPS_HOST`       | IP/host da VPS. |
| `VPS_USER`       | Usuário SSH do deploy. |
| `VPS_SSH_KEY`    | Chave privada SSH desse usuário. |
| `VPS_PORT`       | Porta SSH (opcional; default 22). |
| `VPS_DEPLOY_DIR` | Pasta na VPS onde fica o compose do front (ex.: `/opt/proexgame-front`). |

> O login no ghcr usa o `GITHUB_TOKEN` do próprio job (precisa de
> `packages: write`, já configurado no workflow). Não precisa de PAT.

## Pré-requisitos na VPS (uma vez)

1. Criar a pasta do deploy e colocar o compose:
   ```bash
   mkdir -p /opt/proexgame-front           # = VPS_DEPLOY_DIR
   # copie deploy/docker-compose.prod.yml do repo para lá como docker-compose.yml
   ```
2. Atualizar o **Nginx do host** para apontar `/` ao contêiner do front (em vez
   de servir `/var/www/jogo`). Use `deploy/nginx-host.conf` como referência
   (mantém o bloco `/socket.io/` → backend) e rode o `certbot` para o TLS/wss.

Depois disso, **todo merge na main** publica a imagem e atualiza o contêiner do
front automaticamente.

## Modo do cliente (`src/game/client/index.ts`)

- **Build de produção** (a imagem): sempre backend real, **same-origin** (Nginx
  faz o proxy). Para apontar a outro domínio, passar `VITE_BACKEND_URL` como
  build-arg (não necessário no setup atual).
- **Dev** (`npm run dev`): usa o backend só se `VITE_BACKEND_URL` estiver definida
  (`.env.local`); senão, roda o mock (modo demonstração).
