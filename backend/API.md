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
- `GET|POST /api/stock/suppliers`, `GET|PUT|DELETE /api/stock/suppliers/:id`

## CMS, admissions, notifications, activity, and reports

- `GET /api/public/home`, `/api/public/programs`, `/api/public/departments`, `/api/public/staff`, `/api/public/news`, `/api/public/gallery`, `/api/public/settings`
- `POST /api/public/applications`
- `GET|PUT /api/admin/settings`, `GET|PUT /api/admin/website/hero`
- `GET|POST|PUT|DELETE /api/admin/programs`, `/api/admin/departments`, `/api/admin/staff`, `/api/admin/news`, `/api/admin/gallery`
- `GET|PATCH|DELETE /api/notifications`
- `GET|POST /api/activity`
- `GET /api/reports/library/summary`, `/api/reports/library/overdue`, `/api/reports/library/circulation`
- `GET /api/reports/stock/inventory`, `/api/reports/stock/movement`, `/api/reports/stock/low-stock`, `/api/reports/stock/out-of-stock`, `/api/reports/stock/expired`, `/api/reports/stock/damaged`, `/api/reports/stock/disposed`
- `POST /api/uploads` multipart image upload; requires Cloudinary environment variables

Domain models for CMS, admissions, stock, notifications, reports, roles, permissions, and settings are under `backend/src/models`; their controllers/routes are the next integration layer.
