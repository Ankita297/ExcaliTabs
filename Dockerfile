FROM node:20.19.2-slim AS build

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .
RUN pnpm run build

FROM nginx:1.27-alpine

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80