# Stage 1: build SPA statis (tanpa PHP/CI4)
FROM node:24-bookworm-slim AS build

WORKDIR /src/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ENV VITE_BUILD_BASE=/ \
    VITE_BUILD_HTML=1 \
    VITE_BUILD_OUTDIR=dist \
    VITE_DATA_SOURCE=local \
    VITE_AI_URL=/ai/analyze-vehicle

RUN npm run build

# Aset PWA disalin dari public/ (nanti saat CI4 aktif, ini dilayani PHP).
COPY public/manifest.webmanifest public/sw.js public/favicon.ico /src/public-root/
COPY public/icons /src/public-root/icons
RUN cp /src/public-root/manifest.webmanifest /src/public-root/sw.js /src/public-root/favicon.ico dist/ \
    && cp -r /src/public-root/icons dist/icons

# Stage 2: server statis + proxy /ai
FROM caddy:2-alpine

WORKDIR /srv
COPY --from=build /src/frontend/dist/ /srv/
COPY frontend/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
