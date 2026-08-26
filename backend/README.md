# Rambura Garçons API

Express + Mongoose backend for the Rambura Garçons TVET School MIS.

## Setup

1. Install MongoDB locally or provide an Atlas URI.
2. Copy `.env.example` to `.env` and set secrets.
3. From the repository root run `npm install` and `npm --prefix backend install`.
4. Seed demo data with `npm --prefix backend run seed`.
5. Run the API with `npm --prefix backend run dev`.

The API listens on `http://localhost:5000` and uses database `rambura_garcons`.

## Image uploads

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env` to enable `POST /api/uploads`. The endpoint accepts an authenticated multipart field named `image`, allows JPEG, PNG, WebP, and GIF files up to 5 MB, and returns `{ imageUrl, publicId }`. MongoDB stores only those references.

## Security

Passwords are bcrypt hashes. Access tokens are short-lived JWTs; refresh tokens are stored as bcrypt hashes. API responses omit password and token hash fields. Protected routes require `Authorization: Bearer <accessToken>`.

## Response format

Success: `{ "success": true, "message": "...", "data": {} }`.
Errors: `{ "success": false, "message": "...", "errors": [] }`.

## Current routes

- `GET /api/health`
- `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/audit-logs`, `GET /api/audit-logs/:id`

Additional domain modules are added under `src/models`, `src/controllers`, and `src/routes` while preserving the existing frontend field names.
