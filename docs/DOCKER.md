# Docker

| File | Use |
|---|---|
| `docker-compose.yml` (repository root) | Local development: MongoDB (replica set), API and website with live reload. `docker compose up`, or `docker compose up -d mongo` for the database only. |
| `deploy/aws/docker-compose.prod.yml` | Production on one EC2 machine: API, website and Caddy (HTTPS). Data lives in MongoDB Atlas and S3. See `deploy/aws/README.md`. |
| `backend/Dockerfile` | API image. Node 20, production dependencies only, runs as a non-root user, health check on `/health`. |
| `frontend/Dockerfile` | Website image. Next.js standalone server. `NEXT_PUBLIC_API_URL` is a build argument because it is baked into the browser code. |

Useful commands (production; run from `deploy/aws/`):

```bash
alias dc='docker compose --env-file .env.production -f docker-compose.prod.yml'
dc ps                 # status
dc logs -f api        # API log (sign-in codes appear here until SMS is connected)
dc restart api
dc up -d --build      # rebuild after pulling new code (or ./deploy.sh)
```
