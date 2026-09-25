# Rambura Garçons School Management System

Rambura Garçons is a school management system for Rambura Garçons TVET School. It has a React website and administration interface, an Express API, and MongoDB for persistent data.

## What Runs In This Project

The application has three main parts:

1. **Frontend**: React 19 with Vite, Tailwind CSS, React Router, Recharts, Framer Motion, and Lucide icons. It is in `src/` and runs on port `5173` during development.
2. **Backend**: Node.js with Express and Mongoose. It is in `backend/src/` and runs on port `5000` during development.
3. **Database**: MongoDB. The default local database is `rambura_garcons`.

During local development, Vite proxies requests beginning with `/api` from the frontend to `http://localhost:5000`. The browser therefore uses URLs such as `/api/auth/login`, while the backend receives them on port `5000`.

## Project Structure

```text
src/                  React application
  components/         Shared user-interface components
  context/            Global application and notification state
  data/               Frontend constants and role data
  layouts/            Page layouts
  pages/              Public, authentication, management, stock, and equipment pages
  routes/             Frontend route definitions
  services/           API service functions
  assets/             Images and other frontend assets
backend/src/          Express API
  config/             Environment and database configuration
  controllers/        Request handling and business operations
  middleware/         Authentication, validation, and request middleware
  models/             Mongoose database models
  routes/             API route definitions
  services/           Backups, email, and audit services
  seed/               Demo or initial database data
  scripts/             Maintenance scripts
backend/test/         Backend tests
backend/backups/      Local JSON database snapshots
backend/uploads/      Locally stored uploaded files, when used
public/               Static frontend files and school branding
docker-compose.yml    Local/production multi-container setup
Dockerfile            Frontend build and Nginx image
backend/Dockerfile    Backend production image
```

## Requirements

- Node.js 22 or a compatible recent Node.js version
- npm
- MongoDB 8 locally, MongoDB Atlas, or Docker Desktop
- Docker Desktop only if using the Docker workflow

## First-Time Local Setup

1. Install the frontend dependencies:

	```powershell
	npm install
	```

2. Install the backend dependencies:

	```powershell
	npm --prefix backend install
	```

3. Copy `backend/.env.example` to `backend/.env` and fill it in (at least the two JWT secrets, and the `SMTP_*` lines if you want e-mail to work). Production must define the required secrets.

4. Start MongoDB. The default local connection is:

	```text
	mongodb://localhost:27017/rambura_garcons
	```

5. Start the frontend and backend together:

	```powershell
	npm run dev
	```

Open the frontend at `http://localhost:5173`. Check the API at `http://localhost:5000/api/health`.

## Available Commands

Run these commands from the repository root:

| Command | Action |
| --- | --- |
| `npm run dev` | Starts the frontend and backend together. |
| `npm run dev:frontend` | Starts only the Vite frontend. |
| `npm run dev:backend` | Starts only the API with Node watch mode. |
| `npm run seed` | Seeds the backend database with initial/demo data. **Deletes existing users and content.** In production it refuses to run unless `SEED_CONFIRM_WIPE=yes`, and then prints random passwords once. |
| `npm test` | Runs every frontend test file (`src/**/*.test.js`). |
| `npm run lint` | Runs Oxlint against the project. |
| `npm run build` | Creates the production frontend in `dist/`. |
| `npm run preview` | Serves the built frontend locally for review. |
| `npm run test:backend` | Runs the backend Node test suite. |

Backend-only commands can also be run directly:

```powershell
npm --prefix backend start
npm --prefix backend run seed
npm --prefix backend run clear:stock
npm --prefix backend test
```

`clear:stock` is a maintenance command. Review its behavior before running it because it changes stock data.

## Environment Variables

Create `backend/.env` for local or production settings. Never commit this file.

### Database and server

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rambura_garcons
CLIENT_URL=http://localhost:5173
TRUST_PROXY=0   # set to 1 when the API runs behind nginx / a load balancer
```

### Authentication

```env
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
SESSION_IDLE_MINUTES=30
PASSWORD_RESET_MINUTES=30
```

`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are required in production. Generate strong values with:

```powershell
openssl rand -hex 32
```

### Backups

```env
BACKUP_DIR=./backups
BACKUP_INTERVAL_HOURS=24
BACKUP_KEEP=7
```

The API saves a JSON snapshot of **every** collection on the configured schedule (at startup only if the newest backup is older than the interval) and deletes all but the newest `BACKUP_KEEP` files. Backup files contain password hashes: treat them like passwords, never share or upload them. Store copies outside the application machine as well; a local Docker volume is not a complete disaster-recovery plan.

### Email and uploads

Email features use these optional variables:

```env
CONTACT_EMAIL=info@rambura-garcons.rw
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@example.com
```

Image uploads can use Cloudinary by setting `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. The upload endpoint accepts an authenticated multipart field named `image`, with JPEG, PNG, WebP, and GIF files up to 5 MB.

## Backend API Areas

The complete endpoint list is in [`backend/API.md`](backend/API.md). The main areas are:

- Authentication and user sessions
- Users, roles, permissions, and audit logs
- Library books, loans, returns, and overdue reports
- Stock items, suppliers, transactions, damaged stock, and reports
- Public website content such as programs, departments, staff, news, and gallery items
- Admissions and public applications
- Notifications, activity, settings, and reports
- Authenticated image uploads

Successful responses use `{ success, message, data }`. List responses also include pagination. Protected endpoints require:

```text
Authorization: Bearer <accessToken>
```

## Docker Deployment

Docker Compose starts four services:

- `mongo`: MongoDB on port `27017` with the `mongo-data` named volume
- `backend`: the Node API on the internal Docker network
- `frontend`: the built React application served by Nginx on port `80`
- Named volumes for MongoDB data, uploads, and backups

Create `backend/.env`, replace all production secrets, then run:

```powershell
docker compose up -d --build
```

Open the application at `http://localhost`. Useful Docker commands:

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

`docker compose down` stops and removes containers but keeps named-volume data. Do not use `docker compose down -v` unless you intentionally want to delete the MongoDB, upload, and backup volumes.

## HTTPS and Domain Setup

For production:

1. Point the domain DNS `A` record to the deployment server.
2. Configure HTTPS with Let's Encrypt or another trusted certificate provider.
3. Set `CLIENT_URL` to the real HTTPS URL. Uploaded images are stored as `/uploads/...` (no server address), so nothing else needs the domain. If you already have images saved with `http://localhost:5000/uploads/...`, run `npm --prefix backend run fix:image-urls` (dry run) and then `npm --prefix backend run fix:image-urls -- --apply`.
4. Update the reverse-proxy configuration and the canonical URL in `index.html`.
5. Use long, unique JWT and SMTP secrets; never use the development defaults.
6. Build the frontend normally (`npm run build`). The demo one-click logins on the sign-in page exist only in development builds (or when built with `VITE_SHOW_DEMO_ACCOUNTS=true`).
7. `docker-compose.yml` already sets `NODE_ENV=production` and `TRUST_PROXY=1` for the API and keeps MongoDB private.

## Health Checks

- `GET /api/health`: API, database, uptime, and runtime details
- `GET /api/health/live`: process liveness
- `GET /api/health/ready`: database readiness

## Verification Before Delivery

Run the checks from the repository root:

```powershell
npm run lint
npm run build
npm run test:backend
```

The `build` command creates `dist/`. This is generated output and is ignored by Git. Dependency folders such as `node_modules/`, local environment files, logs, backups, and build output should not be committed.

## Important Data Rules

- Do not delete `backend/backups/` unless the backups have been copied somewhere safe.
- Do not delete `backend/uploads/` if the application stores local uploaded files there.
- Do not commit `backend/.env` or any credentials.
- Do not run seed or cleanup scripts against production without reviewing their code and confirming the target database.
# rambura-garcons"# rambura-garcons" 
"# rambura-garcons" 
"# ambura-garcons" 
"# rambura-garcons" 

## Demo data (every panel filled)

`npm --prefix backend run seed` (development) also adds demo records to **every** panel, so each screen can be tried straight away:
24 books and 21 loans (returned, borrowed, 5 overdue), 6 suppliers, 24 stock items (low stock, expiring and expired food, out-of-stock)
with 70 stock movements, damaged and disposed stock, 4 reconciliations, stock/equipment archive and retirement requests (pending, approved, rejected),
16 equipment items with assignments and maintenance, 14 admission applications in every status, 7 events, contact messages,
notifications for every role, an activity/audit log and reports. Extra accounts (password `Demo@12345`): `librarian2`, `registrar` (management), `stock2` (inactive).
All dates are relative to today. In production the demo data is skipped unless `SEED_DEMO=true`; `SEED_DEMO=false` skips it anywhere.

## Troubleshooting the terminal

| You see in the terminal | Meaning and fix |
|---|---|
| `[proxy] Cannot reach the backend at http://127.0.0.1:5000 (ECONNREFUSED)` | The frontend is running but the backend is not (or is restarting). Start it with `npm run dev:backend`. The browser shows "The backend server is not running". |
| `[dev] backend did not become ready within 120s` | The backend did not start. Read the BACKEND lines above it: MongoDB not running, missing `backend/.env`, or port 5000 already used. |
| `Database unavailable. Start MongoDB or configure MONGODB_URI` | The backend runs but cannot reach MongoDB. Start MongoDB (`docker run -d -p 27017:27017 mongo:8`) and check `MONGODB_URI` in `backend/.env`. |
| `EADDRINUSE :::5000` | Port 5000 is taken (on Mac, AirPlay uses it). Set another `PORT` in `backend/.env` and start the frontend with `BACKEND_URL=http://127.0.0.1:<port>`. |
| Vite says port 5173 is in use | Close the old terminal that is still running the frontend. |
