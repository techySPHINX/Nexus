# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only manifests first to leverage Docker layer cache
COPY package.json package-lock.json ./

RUN npm ci

# Copy the rest of the source and build
COPY . .

# Vite reads VITE_* env vars at build time; pass them as build-args if needed
ARG VITE_BACKEND_URL=http://localhost:3000
ARG VITE_WS_URL=ws://localhost:3000
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

RUN npm run build

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy bespoke nginx config optimised for SPA routing
COPY nginx.conf /etc/nginx/nginx.conf

# nginx listens on 80 (non-privileged port override not needed for alpine nginx)
EXPOSE 80

# Healthcheck - nginx serves a simple 200 on /
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
