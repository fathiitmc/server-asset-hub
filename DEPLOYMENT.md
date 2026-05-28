# Server Asset Hub Deployment

Server Asset Hub is a Next.js production app packaged with Docker. The current MVP stores data in `data/assets.json`, mounted into the container as `/app/data`.

## Local Docker Test

Use the local compose file to test the container on host port `3010`.
The local compose file also starts PostgreSQL for Prisma development. The
current app runtime still reads and writes `data/assets.json`.

```bash
docker compose build
docker compose up -d
docker compose ps
```

Open:

```text
http://localhost:3010/dashboard
```

Stop the local container:

```bash
docker compose down
```

## Database Environment

Prisma uses `DATABASE_URL` for migrations, Studio, and future database-backed
code paths. For local development, copy `.env.example` to `.env` if you want to
run Prisma commands directly on the host:

```text
DATABASE_URL="postgresql://server_asset_hub:server_asset_hub_dev@localhost:5432/server_asset_hub?schema=public"
```

Inside Docker Compose, the app container uses the `postgres` service hostname.

Production PostgreSQL is included in `docker-compose.prod.yml` behind the
`postgres` profile. It is not required for the current JSON-backed runtime. To
start it intentionally, replace the placeholder password first, then run:

```bash
docker compose -f docker-compose.prod.yml --profile postgres up -d
```

## Production Build Commands

Validate the app before deploying:

```bash
npm run lint
npm run build
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml build
```

Start production locally or on the VPS:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Iran VPS Deployment Steps Placeholder

1. Provision the VPS and install Docker with the Compose plugin.
2. Copy or clone this repository into the deployment directory.
3. Confirm `data/assets.json` exists before starting the container.
4. Run `docker compose -f docker-compose.prod.yml build`.
5. Run `docker compose -f docker-compose.prod.yml up -d`.
6. Verify the app responds on `http://SERVER_IP:3000/dashboard`.

Nginx, SSL, domain connection, and firewall hardening are intentionally not configured in this phase.

## Persistent Data Warning

The app uses local JSON storage at `data/assets.json`. Production compose mounts `./data:/app/data`, so the VPS `data` directory is the source of truth.

Do not delete or replace the `data` directory during deployment unless you have a verified backup.

## Backup Warning

Back up `data/assets.json` before deployments, server maintenance, or manual edits.

Use:

```bash
sh scripts/backup-data.sh
```

The script creates timestamped copies in `backups/`. It does not delete old backups.

## Troubleshooting

Check container status:

```bash
docker compose -f docker-compose.prod.yml ps
```

View logs:

```bash
docker compose -f docker-compose.prod.yml logs -f server-asset-hub
```

Restart the app:

```bash
docker compose -f docker-compose.prod.yml restart server-asset-hub
```

Rebuild and restart:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check the mounted data file:

```bash
ls -la data
cat data/assets.json
```

Validate compose files:

```bash
docker compose config
docker compose -f docker-compose.prod.yml config
```
