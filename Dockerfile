# --- Stage 1: build do site estático ---------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Instala dependências (inclui dev) para compilar/buildar.
COPY package*.json ./
RUN npm ci

COPY . .
# Build de PRODUÇÃO: o cliente conecta no backend do MESMO domínio (Nginx do
# host faz proxy de /socket.io/). `.env.*` é ignorado via .dockerignore, então
# não vaza VITE_BACKEND_URL de dev.
RUN npm run build

# --- Stage 2: runtime (Nginx servindo o SPA) -------------------------------
FROM nginx:alpine AS runner
# Config do Nginx do CONTÊINER (apenas serve o SPA com fallback de rota).
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
