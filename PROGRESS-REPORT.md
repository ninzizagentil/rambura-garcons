# Rambura Garçons — Raporo y'ibyakozwe (19 Nzeri 2026, v2)

## Ibyarangiye byose
- **oxlint (src)**: 74 → **0 warnings**. Ibyari bisigaye 21 bya `set-state-in-effect` byakemuwe
  (resetKey pattern, lazy `useState`, derived state, `.then()` + `cancelled` flag).
  Ahantu 4 gusa hasigaye `oxlint-disable-next-line` ifite comment isobanura impamvu
  (fetch nyayo ya server muri `DamageDisposal.jsx` x3, na cache→form muri `WebsiteManagement.jsx`).
- **Library (BorrowingHistory / LibraryReports)**: byari byarakosowe muri zip — byemejwe ko
  bikurikirana `rg:library-updated` kandi igishushanyo cya "Circulation" gikoresha loans nyayo.
- **Stock Management audit** — ibibazo nyakuri byabonetse kandi byakosowe:
  1. **Direct disposal ntiyakoraga**: UI yohereza izina ry'uwemeje (`approvedBy`) nk'inyandiko,
     backend igashaka ObjectId → `Cast to ObjectId failed` → 500 (yagaragajwe na test).
     Ubu ibikwa muri `approvedByName`.
  2. **Direct disposal yasigaraga "pending"** nubwo stock yamaze gukurwaho → gukanda "Approve"
     byakuragamo stock **inshuro ya kabiri**. Ubu ni `approved` guhera ku ntangiriro.
     Data yari isanzwe muri DB: `npm run fix:disposals` (dry-run), `npm run fix:disposals -- --apply`.
  3. **approveDisposal**: (a) abemeza babiri icyarimwe bashoboraga gukuraho stock kabiri →
     ubu hakoreshwa atomic claim; (b) rollback yongeragaho stock nubwo itigeze ikurwaho →
     ubu isubiza gusa icyakuwemo. `rejectDisposal` nayo ni atomic.
  4. `requestDisposal` yemeraga quantity irenze stock → ubu 409.
  5. `transfer` ntiyagenzuraga ko `fromLocation` ari ho item iri koko → ubu 409.
  6. `damaged` na `disposeDirect` byakoreshaga `...req.body` (mass-assignment) → ubu ni whitelist.
  7. `populate(..., 'name')` ariko User ifite `fullName` → "Requested By/Approved By" byagaragaraga ubusa.
  8. `Transactions.jsx` na `StockReports.jsx` ntibyahamagaraga `refreshStock()` bifunguye →
     amakuru ashaje. Ubu barayihamagara.
  9. `DamageDisposal.jsx` (7 fetch) na `StockReports.jsx` (1) byakoreshaga `fetch` isanzwe n'`/api`
     ihoraho → token yarangiye ntiyavugururwaga. Ubu bikoresha `api` (refresh + `VITE_API_URL`).
     `exportReport` (CSV/PDF) nayo: `api.download()` nshya.
- Tests nshya: `backend/test/stockDisposal.test.js` (8 tests; zose 13 zirarengana).

## Ibisigaye (bisaba environment nyayo)
- Live click-through testing (login, buto zose) — bisaba MongoDB + seed data.
- Gushyira JWT secrets kuri production; guhindura Gmail app-password muri `backend/.env`.

---

## Validation y'ama-input yose (19 Nzeri 2026, v4)

**Amategeko** (dosiye imwe: `src/utils/validators.js`, na `backend/src/utils/validators.js` kuri server):

| Ubwoko (`kind`) | Icyemewe | Aho bikoreshwa (urugero) |
|---|---|---|
| `name` | inyuguti gusa (+ akadomo, `'`, `-`, umwanya) — imibare ntiyemewe | amazina y'abantu, district, borrower, approvedBy |
| `alnum` | inyuguti **n'imibare** (+ ` . , ; : ! ? ' & ( ) # + / _ - `) | izina rya item, umutwe w'igitabo, aderesi, izina rya supplier |
| `code` | inyuguti + imibare, nta myanya | Batch number, Book code, Asset/Serial number |
| `username` | inyuguti + imibare (+ `. _ -`), nta myanya | username |
| `integer` / `decimal` | imibare gusa (`decimal` yemera akadomo rimwe) — inyuguti ntiyemewe | quantity, min level, unit value, copies |
| `phone` | imibare gusa (+ `+` ku ntangiriro), **10 kugeza kuri 12** (munsi ya 10 ntiyemewe) | telefoni zose (supplier, admissions, contact...) |
| `email` | nta myanya, ifite `@` na domain | email zose |

**Uko bikora:** (1) *igihe wandika/wandukuye* — inyuguti itemewe ntijya mu murima; (2) *ugiye kuva mu murima* — telefoni/email itari yo ihita yerekana ikosa; (3) *ukanda Save* — ifishi irahagarara igaragaza ikosa; (4) **backend** nayo irasuzuma (422), ku buryo API itabasha kwirengagizwa.
Ubutumwa buri mu ndimi 3 (en/fr/rw).

**Guhindura amategeko ya telefoni** (ubu ni 10; ushobora kuyihindura): `PHONE_MIN_DIGITS` muri `src/utils/validators.js` na `backend/src/utils/validators.js`.

**Ifishi zasuzumwe:** Stock (Item, Supplier, In, Out, Adjustment, Transfer, Damage, Dispose, Reconciliation), Library (Book, Borrow), Admin (User, Settings, Website: contact, developers, staff, programs, departments, news, gallery, hero testimonials), Equipment (register, assign, maintenance), Events, Public (Admissions, Contact), 2FA code, Forgot password.
Ntizihinduwe ku bushake: ijambobanga, ubushakashatsi (search), ibisobanuro/notes/messages (ni inyandiko y'ubuntu), amatariki.

**Tests:** `npm test` (frontend, 15) na `cd backend && npm test` (19).

### Gukosora telefoni zisanzwe muri database
`cd backend` → `npm run fix:phones` (irerekana gusa) → `npm run fix:phones -- --apply` (ikosora).
Ikuraho imyanya, utudomo, utumenyetso `-` na `( )` (`+250 788 123 456` → `+250788123456`).
Izitujuje imibare 10–12 cyangwa zirimo inyuguti zirandikwa ngo "FIX BY HAND" — zikosorwa mu ifishi.
