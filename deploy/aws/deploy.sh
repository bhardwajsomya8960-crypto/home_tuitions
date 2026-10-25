#!/usr/bin/env bash
# Pulls the latest code and rebuilds the containers. Run on the server from deploy/aws/.
set -euo pipefail
cd "$(dirname "$0")"
git pull --ff-only
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker image prune -f
docker compose --env-file .env.production -f docker-compose.prod.yml ps
