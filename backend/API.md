# API surface

All responses use `{ success, message, data }`; list endpoints also return `pagination`. Private endpoints require `Authorization: Bearer <accessToken>`.

## System and auth

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

## Users and audit

- `GET|POST /api/users`
- `GET|PUT|DELETE /api/users/:id`
- `PATCH /api/users/:id/status`
- `GET /api/audit-logs`, `GET /api/audit-logs/:id`
- `GET /api/roles`, `GET /api/permissions`, `PUT /api/roles/:name`

## Library

- `GET|POST /api/library/books`
- `GET|PUT|DELETE /api/library/books/:id`
- `POST /api/library/loans`
- `GET /api/library/loans`
- `GET /api/library/loans/overdue`
- `POST /api/library/loans/:id/return`

## Stock and suppliers

- `GET|POST /api/stock/items`
- `GET|PUT|DELETE /api/stock/items/:id`
- `POST /api/stock/transactions/in`, `POST /api/stock/transactions/out`
- `POST /api/stock/transactions/adjustment`, `POST /api/stock/transactions/transfer`
- `GET /api/stock/transactions`, `GET /api/stock/dashboard`
- `GET|POST /api/stock/damaged`, `GET|POST /api/stock/disposed`
- `GET /api/stock/expired`, `GET /api/stock/expiring-soon`
- `GET|POST /api/stock/suppliers`, `GET|PUT|DELETE /api/stock/suppliers/:id` (reading needs `stock.view`)
- `DELETE /api/stock/items/:id` always answers 403: items are archived through requests, not deleted.
- Archive requests (zero-quantity items only):
  - `POST /api/stock/archive-requests` `{ itemId, reason, notes? }` (`stock.archive.request`)
  - `GET /api/stock/archive-requests/my` (`stock.archive.request`)
  - `GET /api/stock/archive-requests?status=pending&page=&limit=` (`stock.archive.approve`)
  - `POST /api/stock/archive-requests/:id/approve` `{ approvalNotes? }` and `/reject` `{ rejectionReason }` (`stock.archive.approve`)
- Reconciliations: `POST /api/stock/reconciliations/:id/approve|reject` need `stock.reconcile.approve` (management); the creator cannot approve their own count unless admin.

## CMS, admissions, notifications, activity, and reports

- `GET /api/public/home`, `/api/public/programs`, `/api/public/departments`, `/api/public/staff`, `/api/public/news`, `/api/public/gallery`, `/api/public/settings`
- `POST /api/public/applications` (returns only `{ referenceNumber, ... }`, not the uploaded files)
- `GET /api/public/track-application?ref=RG-2026-XXXXXX&contact=<email or phone>`: BOTH values are required. Returns the status and, if the school attached a file, a 15-minute `attachmentToken`.
- `GET /api/public/track-attachment/:ref?token=<attachmentToken>`: downloads the attachment (403 without a valid token).
- `GET /api/applications` (list, without photos/documents) and `GET /api/applications/:id` (full record with files).
- `GET|PUT /api/admin/settings`, `GET|PUT /api/admin/website/hero`
- `GET|POST|PUT|DELETE /api/admin/programs`, `/api/admin/departments`, `/api/admin/staff`, `/api/admin/news`, `/api/admin/gallery`
- `GET|PATCH|DELETE /api/notifications`
- `GET|POST /api/activity`
- `GET /api/reports/library/summary`, `/api/reports/library/overdue`, `/api/reports/library/circulation`
- `GET /api/reports/stock/inventory`, `/api/reports/stock/movement`, `/api/reports/stock/low-stock`, `/api/reports/stock/out-of-stock`, `/api/reports/stock/expired`, `/api/reports/stock/damaged`, `/api/reports/stock/disposed`
- `POST /api/uploads` multipart image upload (max 5 MB, answers 413 when larger). Returns `imageUrl` as `/uploads/...` without a server address.

Domain models for CMS, admissions, stock, notifications, reports, roles, permissions, and settings are under `backend/src/models`; their controllers/routes are the next integration layer.

## Sessions and security notes

- `POST /api/auth/login` accepts only string `identifier` and `password` (400 otherwise). Each device gets its own refresh token (up to 5 devices; SHA-256 hashed in `users.refreshTokens`).
- `POST /api/auth/refresh` does not count as activity: after `SESSION_IDLE_MINUTES` without requests it answers 401.
- `POST /api/auth/logout` `{ refreshToken? }` signs out that device only; without it, every device.
- `POST /api/auth/password-reset/request` always answers 200, whether or not the account exists.
- Set `TRUST_PROXY=1` when the API is behind nginx so rate limits use the real client IP.
- E-mail settings: `GET|PUT /api/admin/email-settings`. Complete settings saved here win over `SMTP_*` in `.env`; the password is stored encrypted.
