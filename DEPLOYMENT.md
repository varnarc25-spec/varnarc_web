# Varnarc VPS deployment (Ubuntu 24.04 + Docker Compose)

This document is the **NEW VPS CONFIGURATION**. Existing Google Cloud Run files under `deploy/gcp/`, `scripts/gcp/`, `cloudbuild.yaml`, `Dockerfile`, and `docker/docker-compose.yml` are **CURRENT CLOUD RUN CONFIGURATION** and are left in place.

Do not run `docker compose down -v` unless you intend to **destroy the PostgreSQL volume**. That command is marked destructive below.

SSH on this VPS uses port **20063**. This guide does not change SSH daemon configuration.

Secrets: never paste passwords, Auth0 secrets, or private keys into tickets, logs, or git.

## Architecture

```
Internet
  → Cloudflare (DNS + proxy + TLS at the edge)
    → VPS dedicated IPv4 :80 / :443 (Nginx container)
      → web:3000          varnarc.com
      → admin:3001        admin.varnarc.com
      → api:4000          varnarc.com/api/v1  (and admin.varnarc.com/api/v1)
      → postgres:5432     Docker-internal only
      → redis:6379        Docker-internal only
```

Application source lives in this directory (monorepo root). GitHub: `varnarc25-spec/varnarc_web`.

## Environment variables (required)

Copy `.env.production.example` to `.env.production` on the VPS. Do not commit `.env.production`.

Public (browser / Next.js build args):

- `NEXT_PUBLIC_APP_URL` — `https://varnarc.com`
- `NEXT_PUBLIC_ADMIN_URL` — `https://admin.varnarc.com`
- `NEXT_PUBLIC_API_URL` — `https://varnarc.com/api/v1` (absolute; do not use `/api/v1` alone)
- `NEXT_PUBLIC_AUTH0_CONFIGURED`, `NEXT_PUBLIC_AUTH0_CLIENT_ID`
- CMP / AdSense `NEXT_PUBLIC_*` as needed

Server-only (never `NEXT_PUBLIC_*`):

- `APP_BASE_URL`, `WEB_APP_URL`, `ADMIN_APP_URL`
- `API_URL` — **must** be `http://api:4000/api/v1` for container-to-container fetch. Relative `/api/v1` breaks Next.js server routes.
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `AUTH0_AUDIENCE`, `AUTH0_ISSUER_BASE_URL`
- `ADMIN_JWT_SECRET`, `ADMIN_BOOTSTRAP_PASSWORD`
- `DATABASE_URL` / `DATABASE_DIRECT_URL`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `REDIS_URL`
- `SEARCH_ENGINE=postgres-fts` (production defaults to OpenSearch if unset)
- Email / AI / GCS keys as used today

## DNS / Cloudflare

Create records at whichever DNS host is authoritative for `varnarc.com` (often Cloudflare). Point them at the VPS **dedicated IPv4**.

| Type | Name    | Content  | Proxy                  |
| ---- | ------- | -------- | ---------------------- |
| A    | `@`     | VPS IPv4 | Proxied (orange cloud) |
| A    | `www`   | VPS IPv4 | Proxied                |
| A    | `admin` | VPS IPv4 | Proxied                |

Do not create a public A/AAAA record for PostgreSQL. Do not expose Docker (`2375/2376`) to the internet.

Recommended Cloudflare SSL/TLS mode: **Full (strict)**.

- Place a Cloudflare **Origin Certificate** in `docker/nginx/certs/origin.crt` and `origin.key`, then enable the server blocks in `docker/nginx/conf.d/ssl.example.conf`.
- Let's Encrypt on the origin is an alternative if you are not using Cloudflare origin certs.
- Avoid **Flexible** except as a short test (browser HTTPS, origin HTTP).

Do not put Cloudflare API tokens in this repository.

Auth0 application URLs after cutover:

- Callback: `https://varnarc.com/auth/callback`
- Logout: `https://varnarc.com`

---

## 1. Prepare Ubuntu 24.04

SSH (do not change sshd):

```bash
ssh -p 20063 USER@VPS_IPV4
```

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git ufw fail2ban unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

UFW (keep SSH on 20063 before enabling):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 20063/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
sudo ufw status
```

## 2. Install Docker

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a644 /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
newgrp docker
docker version
docker compose version
```

Do not expose the Docker socket. Do not enable TCP Docker API.

## 3. Install Git and Node (for Prisma migrations)

```bash
sudo apt-get install -y git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@9.6.0 --activate
node -v
pnpm -v
```

## 4. Clone the repository

```bash
sudo mkdir -p /opt/varnarc
sudo chown "$USER":"$USER" /opt/varnarc
cd /opt/varnarc
git clone git@github.com:varnarc25-spec/varnarc_web.git
cd varnarc_web
# If this clone has a nested project/ directory, use that as the compose root:
#   cd project
```

## 5. Create production environment files

```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Fill secrets on the server only. First boot may keep `DATABASE_URL` pointing at Neon until you restore a dump into VPS Postgres.

## 6. Building images

```bash
export DOCKER_BUILDKIT=1
cd /opt/varnarc/varnarc_web   # or .../project
docker compose -f docker/docker-compose.vps.yml --env-file .env.production build
```

Rebuild web/admin after changing any `NEXT_PUBLIC_*` value (they are compile-time).

## 7. Starting the stack

```bash
docker compose -f docker/docker-compose.vps.yml --env-file .env.production up -d
```

## 8. Checking container status

```bash
docker compose -f docker/docker-compose.vps.yml --env-file .env.production ps
docker stats
```

## 9. Viewing logs

```bash
docker compose -f docker/docker-compose.vps.yml --env-file .env.production logs -f --tail=200
docker compose -f docker/docker-compose.vps.yml --env-file .env.production logs web
docker compose -f docker/docker-compose.vps.yml --env-file .env.production logs admin
docker compose -f docker/docker-compose.vps.yml --env-file .env.production logs api
docker compose -f docker/docker-compose.vps.yml --env-file .env.production logs postgres
docker compose -f docker/docker-compose.vps.yml --env-file .env.production logs nginx
```

## 10. Running database migrations

```bash
pnpm install --frozen-lockfile
bash scripts/vps/migrate.sh
```

This uses `DATABASE_URL` from `.env.production`. It does **not** drop Neon. If that URL still points at Neon, migrations run on Neon.

## 11. Creating PostgreSQL backups (VPS volume)

```bash
chmod +x scripts/vps/*.sh
bash scripts/vps/backup-postgres.sh
```

Copy `backups/*.sql.gz` off the server.

Dump Neon (from a trusted machine, using your existing scripts — does not delete Neon):

```bash
pnpm db:backup
```

## 12. Restoring PostgreSQL backups

**Destructive for the target database inside the VPS container.** Does not delete Neon.

```bash
bash scripts/vps/restore-postgres.sh backups/varnarc-YYYYMMDDTHHMMSSZ.sql.gz
docker compose -f docker/docker-compose.vps.yml --env-file .env.production restart api
```

Neon → VPS cutover outline:

1. Deploy the stack with `DATABASE_URL` still on Neon; confirm Web/Admin/API.
2. Put the site in a short write-quiet window.
3. `pnpm db:backup` against Neon (direct/non-pooler URL).
4. Restore the dump into VPS Postgres.
5. Point `DATABASE_URL` / `DATABASE_DIRECT_URL` at `postgres:5432`.
6. `bash scripts/vps/migrate.sh`
7. Recreate API: `docker compose ... up -d api`
8. Smoke-test. Keep Neon until you are sure; do not drop the Neon project from this repo.

## 13. Updating from GitHub

```bash
cd /opt/varnarc/varnarc_web   # or project/
git fetch origin
git pull --ff-only origin main
```

## 14. Rebuilding containers

```bash
export DOCKER_BUILDKIT=1
docker compose -f docker/docker-compose.vps.yml --env-file .env.production build
docker compose -f docker/docker-compose.vps.yml --env-file .env.production up -d
```

## 15. Rolling back to a previous Git commit

```bash
git log --oneline -n 20
git checkout COMMIT_SHA
export DOCKER_BUILDKIT=1
docker compose -f docker/docker-compose.vps.yml --env-file .env.production build
docker compose -f docker/docker-compose.vps.yml --env-file .env.production up -d
# Return to main later:
# git checkout main
```

## 16. Restarting individual services

```bash
docker compose -f docker/docker-compose.vps.yml --env-file .env.production restart web
docker compose -f docker/docker-compose.vps.yml --env-file .env.production restart admin
docker compose -f docker/docker-compose.vps.yml --env-file .env.production restart api
docker compose -f docker/docker-compose.vps.yml --env-file .env.production restart nginx
```

## 17. Restarting the complete stack

```bash
docker compose -f docker/docker-compose.vps.yml --env-file .env.production up -d
# Recreate without deleting volumes:
docker compose -f docker/docker-compose.vps.yml --env-file .env.production up -d --force-recreate
```

**Destructive (deletes the Postgres volume):**

```bash
# docker compose -f docker/docker-compose.vps.yml --env-file .env.production down -v
```

## 18. Checking Nginx

```bash
docker compose -f docker/docker-compose.vps.yml --env-file .env.production exec nginx nginx -t
curl -sS -D- http://127.0.0.1/nginx-health
curl -sS -D- -H 'Host: varnarc.com' http://127.0.0.1/
curl -sS -D- -H 'Host: admin.varnarc.com' http://127.0.0.1/
curl -sS http://127.0.0.1/api/v1/health -H 'Host: varnarc.com'
```

## 19. Checking DNS

```bash
dig +short varnarc.com A
dig +short www.varnarc.com A
dig +short admin.varnarc.com A
```

Expect Cloudflare anycast IPs if the records are proxied, not necessarily the VPS IP.

## 20. Checking HTTPS

```bash
curl -sS -D- https://varnarc.com/ | head
curl -sS -D- https://admin.varnarc.com/ | head
curl -sS https://varnarc.com/api/v1/health
curl -sS https://varnarc.com/api/v1/ready
```

## 21. Troubleshooting Web / Admin / API

| Symptom                 | Check                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| API crash loop          | `logs api` — `DATABASE_URL`, Auth0, `SEARCH_ENGINE=postgres-fts`                       |
| Web builds old API host | Rebuild web after `NEXT_PUBLIC_*` changes                                              |
| Admin cannot load data  | `API_URL=http://api:4000/api/v1` inside containers; browser uses `NEXT_PUBLIC_API_URL` |
| 502 from Nginx          | `ps` health of web/admin/api; `nginx -t`                                               |
| CORS errors             | `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_ADMIN_URL` must match the browser origin          |
| Auth0 callback mismatch | Update Auth0 dashboard to `https://varnarc.com/auth/callback`                          |
| Empty search            | `SEARCH_ENGINE=postgres-fts` then reindex from admin                                   |

---

## Health checks

```bash
docker compose -f docker/docker-compose.vps.yml --env-file .env.production ps
curl -sS https://varnarc.com/api/v1/health
curl -sS https://varnarc.com/api/v1/ready
curl -sS -o /dev/null -w '%{http_code}\n' https://varnarc.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://admin.varnarc.com/
```

API liveness: `GET /api/v1/health`. Readiness (DB/Redis): `GET /api/v1/ready`.

## Security checklist

- UFW: 20063, 80, 443 only. No 5432, 3000, 3001, 4000, 2375.
- SSH: keep port 20063; key-based auth; do not edit sshd from this repo.
- Docker: no public daemon socket; `restart: unless-stopped`; Postgres not published.
- Nginx: `server_tokens off`; 50m body limit; only 80/443 published.
- PostgreSQL: strong `POSTGRES_PASSWORD`; backups off-box; no public bind.
- fail2ban: default ssh jail is appropriate for port 20063 if `Port 20063` is in sshd (do not change sshd here).
- Unattended security updates enabled.
- `.env.production` mode `600`, owned by the deploy user.
- Rotate Auth0 and DB credentials if they were ever committed (see Problems in the audit).
- Log rotation: Compose `json-file` 10m × 5.

## Optional GitHub Actions

`.github/workflows/vps-deploy.optional.yml` is `workflow_dispatch` only. Store `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY` in GitHub Environment secrets. Create a deploy-only key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/varnarc_vps_deploy -C varnarc-github-deploy -N ""
# Install the .pub into the VPS user's ~/.ssh/authorized_keys
# Put the private key only in GitHub Actions secrets
```

Manual deploy remains: `git pull` → `docker compose build` → `docker compose up -d`.
