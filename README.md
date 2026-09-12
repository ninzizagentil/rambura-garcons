# Rambura Garçons School Management System

Production-ready React/Vite frontend and Express/MongoDB API for Rambura Garçons TVET School.

## Local Development

1. Copy `backend/.env.example` to `backend/.env` and set local values.
2. Start MongoDB. The app expects `mongodb://localhost:27017/rambura_garcons` locally.
3. Run:

```powershell
npm install
npm --prefix backend install
npm run dev:all
```

Frontend: `http://localhost:5173`  
API health: `http://localhost:5000/api/health`

## Docker Deployment

Create `backend/.env` from `backend/.env.example`, replace all secrets, then run:

```bash
docker compose up -d --build
```

The production stack includes:

- `frontend`: Nginx-served Vite build on port 80
- `backend`: Node API on the internal Docker network
- `mongo`: MongoDB with a persistent named volume
- Persistent upload and backup volumes

Stop the stack with `docker compose down`. Data remains in named volumes unless they are explicitly removed.

## Environment and Secrets

Never commit `backend/.env`. In production, set:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- `CLIENT_URL` and `SERVER_URL` to the real HTTPS domain
- `SMTP_*` and `CONTACT_EMAIL` for password resets, alerts, and contact messages
- `BACKUP_DIR` and `BACKUP_INTERVAL_HOURS`

Generate strong secrets with:

```bash
openssl rand -hex 32
```

## HTTPS and Custom Domain

Point the domain's DNS `A` record to the deployment server and configure HTTPS with certificates from Let's Encrypt or another trusted CA.

Update `CLIENT_URL`, `SERVER_URL`, the reverse-proxy host configuration, and the canonical URL in `index.html` to match the domain.

## Backups

The API creates a JSON MongoDB snapshot after startup and repeats it every 24 hours. Configure `BACKUP_INTERVAL_HOURS` and persist `BACKUP_DIR` on a volume. Copy the backup volume to off-site storage regularly; local Docker volumes alone are not a disaster-recovery plan.

## Verification

```bash
npm run lint
npm run build
npm test --prefix backend
```

Health endpoints:

- `/api/health`: API, database, uptime, and runtime details
- `/api/health/live`: process liveness
- `/api/health/ready`: database readiness
# rambura-garcons"# rambura-garcons" 
"# rambura-garcons" 
