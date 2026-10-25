# Running the portals on separate ports (local)

The website, parent portal, tutor portal and staff console are **one Next.js app**, each on its own path: `/`, `/parent/...`, `/tutor/...`, `/admin/...`. One frontend on one port is enough.

To test several portals side by side with separate browser sessions (for example, a parent on one port and a tutor on another), `start-multi-local.sh` starts the API and the same frontend on several ports:

| Port | Use |
|---|---|
| 5000 | API |
| 3000 | Website |
| 3001 | Tutor portal |
| 3002 | Parent portal |
| 3003 | Staff console |

```bash
docker compose up -d mongo     # the API needs MongoDB
./start-multi-local.sh
```

Each port keeps its own build folder (`.next-<port>`), so the servers do not interfere. Sessions are stored per origin in the browser, so you can be signed in as a parent on 3002 and a tutor on 3001 at the same time.

Ports are listed in `.env.ports`.
