# The API is a plain Node service with one dependency (pg), so the image is
# small and the build is boring on purpose. Nothing here needs a build platform;
# it needs somewhere to run and a Postgres to point at.
FROM node:22-slim AS build
WORKDIR /repo
RUN corepack enable

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json tsconfig.build.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @attestci/api... --filter @attestci/core...

COPY packages/core packages/core
COPY apps/api apps/api
RUN pnpm --filter @attestci/core build && pnpm --filter @attestci/api build
RUN pnpm --filter @attestci/api --prod deploy /app

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
COPY --from=build /repo/apps/api/migrations ./migrations
# Run as a non-root user; the base image ships one.
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
