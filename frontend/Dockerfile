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
COPY frontend ./frontend
COPY shared ./shared
COPY database ./database

# Set working directory to frontend
WORKDIR /usr/src/app/frontend

# Build the Next.js app
RUN bun run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "start"]
