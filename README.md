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
This snapshot's `npm install`, `npm run build`, and `npx oxlint src` were
all run successfully in this update (0 build errors, 0 lint errors — only
the same 5 pre-existing `react/only-export-components` warnings every
other context file already has). `node_modules` and `dist` were removed
before zipping to keep the download small; run `npm install` once after
extracting.

## What's new in this update
- **Light / dark mode** — toggle button (sun/moon icon) added to the
  dashboard topbar, next to the notification bell. Preference is saved to
  `localStorage` (`rg_theme`) and respects the OS preference on first visit.
  Implemented purely through the existing `@theme` CSS variables in
  `src/index.css` (an `html.dark { --color-white: ...; }` override block),
  so no component code needed to change — every page already reads color
  through those variables. See `src/context/ThemeContext.jsx`.
- **Profile photo upload** — on `/profile`, any logged-in account (Admin,
  Librarian, Stock Manager, Director) can upload, change, or remove a
  profile photo via the camera icon on their avatar. Stored as a base64
  data URL on the session (`src/context/AuthContext.jsx` → `updateAvatar`),
  and shown in the topbar profile menu and on the Profile page
  (`src/components/common/Avatar.jsx`). 2MB file-size limit, image files
  only. Falls back to initials when no photo is set.
- **Admin/IT is now view-only on Library MIS & Stock MIS** — the IT
  Administrator can still open every Library and Stock page for oversight,
  but "Add", "Edit", "Borrow", "Return", "Notify", "Stock In", and
  "Stock Out" actions are hidden or blocked for that role; a blue
  "View-only access" banner explains why. Mutating actions stay available
  to the Librarian and Stock Manager accounts. See
  `src/hooks/useModuleAccess.js` and
  `src/components/feedback/ViewOnlyBanner.jsx`.
- **Fixed "Export" buttons** — the five report/export buttons that
  previously only showed a "(demo)" toast (Library Reports, Borrowing
  History, Stock Reports, Management → Library Reports, Management → Stock
  Reports) now generate and download a real `.csv` file with the
  currently-filtered data. See `src/utils/export.js`.
- Full sweep of every `onClick` handler across Admin, Library, Stock, and
  Management pages confirmed no other dead/placeholder actions remain.
"# rambura-garcons" 
