FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Copy package.json files first
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
COPY database/package.json ./database/

# Copy source code (needed for workspace resolution)
COPY backend ./backend
COPY shared ./shared
COPY database ./database

# Create workspace package.json
RUN echo '{"name":"daadaar-backend-docker","workspaces":["backend","shared","database"]}' > package.json

# Install all dependencies from workspace root
WORKDIR /usr/src/app
RUN bun install --frozen-lockfile

# Set working directory to backend for runtime
WORKDIR /usr/src/app/backend

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["bun", "src/server.ts"]
