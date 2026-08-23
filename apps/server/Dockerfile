FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---------------------------------------------------------
# Builder Stage: Prune the monorepo to only the server app
# ---------------------------------------------------------
FROM base AS builder
# libc6-compat is required for Prisma and Turborepo on Alpine Linux
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally to prune the workspace
RUN npm install -g turbo
COPY . .
RUN turbo prune server --docker

# ---------------------------------------------------------
# Installer Stage: Install dependencies and build the app
# ---------------------------------------------------------
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the pruned lockfile and package.jsons
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Copy the actual source code of the pruned app
COPY --from=builder /app/out/full/ .

# Generate the Prisma Client for Alpine Linux
RUN pnpm --filter server exec prisma generate

# Build the server application
RUN pnpm turbo run build --filter=server...

# ---------------------------------------------------------
# Runner Stage: Create a minimal production image
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Don't run production as root for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Copy the built application and dependencies
COPY --from=installer /app/apps/server/dist ./apps/server/dist
COPY --from=installer /app/apps/server/package.json ./apps/server/package.json
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/server/node_modules ./apps/server/node_modules

EXPOSE 6622

# Start the NestJS application
CMD ["node", "apps/server/dist/src/main.js"]
