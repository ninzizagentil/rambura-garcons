# Rambura Garçons — School Management System (Frontend)

React + Vite + Tailwind CSS v4 frontend, built in 5 phases per the project spec.

## Status: Phases 1–4 complete. Phase 5 (integration/persistence/responsiveness/testing) in progress.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to /dist
```

## Demo accounts (Login page)
| Username   | Password      | Role                     |
|------------|---------------|--------------------------|
| admin      | Admin@123     | IT / System Administrator|
| librarian  | Library@123   | Librarian                |
| stock      | Stock@123     | Stock Manager            |
| director   | Director@123  | School Management        |

## Visual style
The design system was restyled to match the reference "phase 2" build's look:
**Sora** for headings (was Fraunces), a flatter, cooler green palette, and
0.75rem card radii. All of this lives in one place —
`src/index.css` (`@theme` tokens) and the Google Fonts link in
`index.html` — so the whole app (public site, dashboards, forms, tables)
re-skins from those two files. Component code was not touched for this,
since every component already reads color/font/radius via these shared
CSS variables.

## Website images — how to change them
Every photo on the **public website** (Home, About, Academics, Departments,
Staff, News, Gallery, Admissions) is sourced from one file:

```
src/data/images.js
```

Each entry is a URL. To swap any picture, replace its URL in that file —
no need to edit any page component. By default the URLs point to
[picsum.photos](https://picsum.photos), a free service that returns real
photographs; each URL has a unique "seed" that keeps the same photo stable
until you change it. You can replace any entry with:
- A different picsum seed (`https://picsum.photos/seed/<any-text>/<w>/<h>`)
- A direct link to any image hosted online (make sure it's a direct image
  URL, not a webpage)
- A local file: drop it in `src/assets/` and `import` it at the top of
  `images.js`, then reference the imported variable instead of a URL string

## What's built

### Phase 1 — Foundation
Design system (Tailwind v4 tokens, green/gold palette, Fraunces + Inter +
JetBrains Mono, Nyabihu hill-ridge SVG divider), ~25 reusable components,
PublicLayout + DashboardLayout, folder architecture.

### Phase 2 — Auth, Roles, Public Website
AuthContext with demo login + localStorage persistence, 4 role-based
dashboards, RBAC route guards, full public website (Home, About, Academics,
Departments, Staff, News + details, Gallery + lightbox, Admissions form,
Contact form + embedded location map).

### Phase 3 — Administration & Library MIS
- **Admin:** Users & Roles (create/edit/deactivate, validated form, unique
  username/email checks), Roles & Permissions (per-role module toggles),
  Website Management (Pages/News/Gallery/Admissions/Contact tabs),
  Activity/Audit log, Reports (charts), Settings.
- **Library:** Books catalogue (search/filter/add/edit), Book Details page
  with borrow flow (2-step confirm, insufficient-availability guard),
  Borrowed Books + Return flow, Overdue Books (with days-overdue + notify),
  Returns workflow, Borrowing History, Library Reports (circulation +
  category charts, most-borrowed list).

### Phase 4 — Stock MIS & Management MIS
- **Stock:** All Items (search/filter/add/edit), Add Item (Foods /
  Electronic Devices only — enforced in the service layer, never just the
  UI), Stock In / Stock Out with confirmation flow and quantity math,
  Low Stock (quantity ≤ minimum), Transactions log, Item Details, Usage
  Analytics (most/least used), Stock Reports.
- **Management:** Dashboard combining Library + Stock KPIs, Management
  Insights (most used / least used / low stock / most borrowed / overdue),
  Library Reports view, Stock Reports view.
- All CRUD is backed by a mock service layer (`src/services/`) persisted to
  `localStorage`, ready to be swapped for real API calls later.

### Phase 5 — Integration, Persistence, Responsiveness & Testing (in progress)
- AuthContext / AppContext / NotificationContext / ToastContext wired at
  the root (`main.jsx`), providing global auth, UI, notification, and
  feedback state.
- Full route map in `App.jsx` with `ProtectedRoute` (any authenticated
  role) and `RoleProtectedRoute` (role allow-list) guards; unauthorized
  access routes to `/access-restricted`.
- Central, easily-editable image configuration for the public site
  (`src/data/images.js`) — see above.
- Remaining Phase 5 work: full responsive/accessibility audit pass,
  exhaustive dead-link/dead-button sweep, empty/loading state coverage
  review across every table and list, and final end-to-end test pass
  across all four role flows.

## Project structure
See `src/` — organized per the spec into `components/`, `context/`,
`data/`, `layouts/`, `pages/{public,auth,admin,library,stock,management,
shared}/`, `routes/`, `services/`, `utils/`.

## Note on this environment
This project was assembled without network access to npm, so
`npm install` / `npm run build` have **not** been run against this exact
snapshot. Please run both locally after downloading to confirm a clean
build before deploying.
