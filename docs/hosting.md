# Hosting ProTrack (protrack-desktop + pm-pro backend)

## Stack

- **API:** Node.js Express in `pm-pro/backend/`, SQLite file (`DB_PATH`, default `./pm-pro.db`).
- **Desktop UI:** Static SPA from the sibling app `protrack-desktop/dist` after `npm run build` in that folder.

## Local or VM (Linux)

1. Install Node 20+.
2. Set `JWT_SECRET`, optional `POC_DEFAULT_PASSWORD` for fresh seeds, `PORT` (default 3001).
3. `cd backend && npm ci && npm start` (or use `pm2` / `systemd`).
4. Build the desktop app (path depends where you cloned it), e.g. `cd ../protrack-desktop && npm ci && npm run build`.
5. Serve `protrack-desktop/dist` with nginx (or Caddy) and proxy `/api` to `http://127.0.0.1:3001`:

```nginx
server {
  listen 443 ssl;
  server_name your.domain;
  root /var/www/protrack-desktop/dist;
  location / { try_files $uri $uri/ /index.html; }
  location /api/ { proxy_pass http://127.0.0.1:3001; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
}
```

6. Back up the SQLite file regularly.

## AWS (minimal)

- **EC2:** Same as VM; attach EBS for the database path.
- **Optional:** S3 + CloudFront for the SPA; API on EC2 behind security group allowing CloudFront or ALB only.

## POC reset

From `backend/`: `npm run db:reset` — if the script is named `db:reset`, use that to delete the DB file; restart the server to re-seed eight POC users.

