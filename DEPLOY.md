# Deploy do Frontend (CI/CD)

Espelha o pipeline do backend (`proexGame-back`), adaptado para um **site
estático**. O backend roda em Docker (ghcr + compose); o front é o **build
estático** (`dist/`) servido pelo **Nginx do host** em `/var/www/jogo`. O mesmo
Nginx faz o proxy de `/socket.io/` para o backend — por isso, em produção, o
front conecta no **mesmo domínio** (não em `localhost:3000`).

## Workflows

- **`.github/workflows/ci.yml`** — em todo PR e push na `main`: `lint` →
  `test:run` → `build`. Barra código quebrado antes do merge.
- **`.github/workflows/release.yml`** — ao entrar na `main` (PR mergeado):
  1. cria a tag `vX.Y.Z` (Conventional Commits) + GitHub Release;
  2. faz o build de produção;
  3. envia o `dist/` para a VPS e o publica em `/var/www/jogo`.

## Como o cliente escolhe mock vs backend (`src/game/client/index.ts`)

- **Build de produção** (o que vai pra VPS): sempre backend real. Conecta no
  mesmo domínio quando `VITE_BACKEND_URL` está vazia (Nginx faz o proxy).
- **Dev** (`npm run dev`): usa o backend só se `VITE_BACKEND_URL` estiver
  definida (ex.: `.env.local` com `http://localhost:3000`); senão, roda o mock.

## Segredos do repositório (GitHub → Settings → Secrets and variables → Actions)

Os mesmos do backend (acesso SSH à VPS):

| Secret         | Descrição |
| -------------- | --------- |
| `VPS_HOST`     | IP/host da VPS. |
| `VPS_USER`     | Usuário SSH do deploy. |
| `VPS_SSH_KEY`  | Chave privada SSH (sem passphrase) desse usuário. |
| `VPS_PORT`     | Porta SSH (opcional; default 22). |
| `VPS_WEB_DIR`  | Diretório servido pelo Nginx (opcional; default `/var/www/jogo`). |

**Variável** (opcional): `VITE_BACKEND_URL` — defina **apenas** se o backend
estiver em outro domínio (ex.: `https://api.seu-dominio`). Em branco = mesmo
domínio.

## Pré-requisitos na VPS (uma vez)

1. O usuário `VPS_USER` precisa ser **dono** de `VPS_WEB_DIR` (o deploy não usa
   `sudo`):
   ```bash
   sudo mkdir -p /var/www/jogo
   sudo chown -R "$USER":www-data /var/www/jogo
   ```
2. Nginx do host configurado para servir `/var/www/jogo` como SPA e fazer proxy
   de `/socket.io/` para o backend — use o `deploy/nginx/jogo.conf` do repositório
   do **backend** (troque `SEU_DOMINIO` e rode o `certbot` para o TLS/wss).

## Fluxo completo

```
PR aberto ........... CI (lint + testes + build)
PR mergeado na main . Release: tag + GitHub Release
                      Build estático (produção, same-origin)
                      scp dist.tar.gz → VPS → extrai em /var/www/jogo
Pronto: site novo no ar; conecta no backend via Nginx (/socket.io/).
```
