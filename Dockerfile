# Cloud Run "Deploy from source" entrypoint for the public web app.
# Build context should be the monorepo root. If Cloud Run uses docker/ as context,
# use docker/Dockerfile.web instead (it auto-fetches the full repo).
#
# Local/CI: docker build -f Dockerfile -t varnarc-web:local .
FROM alpine AS src
RUN apk add --no-cache curl tar git
WORKDIR /work
COPY . .
ARG REPO_URL=https://github.com/varnarc25-spec/varnarc_web
ARG GIT_REF=main
RUN if [ ! -f package.json ]; then \
      echo "package.json not in build context; fetching ${REPO_URL}@${GIT_REF}"; \
      rm -rf /work/* /work/.[!.]* 2>/dev/null || true; \
      if curl -fsSL "${REPO_URL}/archive/${GIT_REF}.tar.gz" | tar xz --strip-components=1; then \
        echo "Fetched source archive"; \
      else \
        git clone --depth 1 "${REPO_URL}.git" . && \
        (git fetch --depth 1 origin "${GIT_REF}" && git checkout FETCH_HEAD) || git checkout "${GIT_REF}"; \
      fi; \
    fi

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate
WORKDIR /app

FROM base AS deps
COPY --from=src /work/package.json /work/pnpm-workspace.yaml /work/pnpm-lock.yaml* /work/turbo.json /work/tsconfig.base.json /work/.npmrc ./
COPY --from=src /work/apps/web/package.json apps/web/
COPY --from=src /work/packages ./packages
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=src /work .
RUN pnpm --filter @varnarc/web... build

FROM node:20-alpine AS runner
RUN addgroup -S varnarc && adduser -S varnarc -G varnarc
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=varnarc:varnarc /app/apps/web/.next/standalone ./
COPY --from=build --chown=varnarc:varnarc /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=varnarc:varnarc /app/apps/web/public ./apps/web/public

USER varnarc
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
