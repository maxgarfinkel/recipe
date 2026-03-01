# Build context: project root (so we can COPY Caddyfile from root)
FROM node:20-alpine AS builder
WORKDIR /app
COPY recipe-ui/package*.json ./
RUN npm ci
COPY recipe-ui/ .

# Auth0 vars are baked into the bundle at build time
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN \
    VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID \
    VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /app/dist /srv/ui
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
