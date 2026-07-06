# Multi-stage build for apps/api. Produces a slim, non-root image.
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable

# --- deps: install the whole workspace (api needs @pulse/* workspace deps) ---
FROM base AS build
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @pulse/api build

# --- deploy: prune to a production node_modules for just the api ---
FROM base AS deploy
WORKDIR /repo
COPY --from=build /repo ./
RUN pnpm --filter @pulse/api deploy --prod /app

# --- runtime ---
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deploy /app/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
