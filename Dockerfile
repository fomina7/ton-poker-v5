FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files and install production deps only
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy built files from build stage
COPY --from=base /app/dist ./dist

# Copy drizzle SQL migration files
COPY --from=base /app/drizzle/*.sql ./drizzle/

# Copy migration script
COPY migrate.mjs ./migrate.mjs

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Expose port
EXPOSE 3000

ENV NODE_ENV=production

# Run migrations then start server
CMD ["./start.sh"]
