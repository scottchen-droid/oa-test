# ============================================================
# Stage 1: Build Frontend
# ============================================================
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY oa-frontend/package*.json ./
RUN npm ci
COPY oa-frontend/ .
RUN npx vite build

# ============================================================
# Stage 2: Build Backend
# ============================================================
FROM node:20-slim AS backend-builder
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY oa-backend/package*.json ./
RUN npm ci
COPY oa-backend/ .
RUN npx prisma generate
RUN npm run build

# ============================================================
# Stage 3: Production Image
# ============================================================
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
        openssl \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default \
    && mkdir -p /usr/share/nginx/html /var/log/supervisor

WORKDIR /app

ENV NODE_ENV=production

# Backend: production deps only
COPY oa-backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Backend: compiled output + prisma generated client + schema
COPY --from=backend-builder /app/dist ./backend/dist
COPY --from=backend-builder /app/node_modules/.prisma ./backend/node_modules/.prisma
COPY oa-backend/prisma ./backend/prisma

# Frontend: static files served by nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Configs
COPY nginx-combined.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/supervisord.conf

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
