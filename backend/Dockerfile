FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Copy root workspace files
COPY package.json bun.lock bunfig.toml ./

# Copy workspace package.jsons
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY database/package.json ./database/
COPY shared/package.json ./shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY backend ./backend
COPY shared ./shared
COPY database ./database
# We do not copy frontend source to backend image to keep it smaller

# Set working directory to backend
WORKDIR /usr/src/app/backend

# Build (if needed, but running ts with bun is fine)
# If we wanted to compile: RUN bun run build

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["bun", "src/server.ts"]
