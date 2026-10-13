# AGENTS.md

## Commands
- `npm run dev` — Vite dev server. Only dev commands: `dev`, `build`, `preview`, `lint` (`package.json`).
- `npm run build` — production build to `dist/` (gitignored, eslint-ignored). Preview SPA routing via `npm run preview`; `vercel.json` rewrites all routes to `/index.html`.
- `npm run lint` — `eslint .`. No tests, no typecheck, no formatter config in this repo.
- No test runner installed — do not add test tooling or `npm test` unless asked.

## Structure
- Plain JS + JSX (no TypeScript). React 19, `react-router-dom` v7, Vite 7.
- Import alias `@` → `src/` (`vite.config.js`). Use it: `import { apiGet } from "@/lib/apiClient"`.
- Routing lives entirely in `src/App.jsx`. Canonical routes: `/lab/:labId/:slug`, `/laporan/:labId/:slug`, `/histori/:idHistory`, `/perangkat/:labId`, plus `/dashboard_asisten`, `/dashboard_admin`, `/admin/...`. Do not remove the legacy redirects in `App.jsx` (`/lab609*`, `/form_*`, `/perangkatlab`, `/history_detail/:id`, `/admin/lab609`).
- Auth: `src/routes/RequireAuth.jsx` checks only `role` from `src/contexts/RoleContext.jsx` (localStorage `role`/`token`/`user`), not token validity. Roles are exactly `admin` | `asisten`.

## API / backend
- Base URL is `VITE_API_URL` (`.env` → `https://hardware.zabduziz.com`). All calls go through `src/lib/apiClient.js` (`apiGet`/`apiPut`/`apiUpload`) — do not call `fetch` directly in new code; it injects `Authorization: Bearer <token>` and `ngrok-skip-browser-warning: true`.
- Local dev proxy in `vite.config.js` forwards only `/auth` and `/role` to `http://localhost:3000`. All other paths hit `VITE_API_URL`, so a local backend must run on `:3000` for login/role during `npm run dev`.
- Login flow (`src/pages/Login.jsx`): `POST /auth/login` → store `token`, then `GET /role/getRole`, map `ADM`→`admin`, `AST`→`asisten` (fallback `asisten`).

## Domain constants — do not hardcode
- `src/features/praktikum/constants.js` is the single source of truth: `LABS` (`609`=LAB00001, `610`=LAB00002), `PRAKTIKUMS` slugs (`merakit-pc`=PRTK00001, `bios-partisi`=PRTK00002, `jarkom`=PRTK00003, `troubleshooting`=PRTK00004), `FORM_ITEMS_BY_CODE`, and path builders (`labPath`, `praktikumPath`, `laporanPath`, `historiPath`, `perangkatPath`). Use its `*FromCode`/`*FromSlug` converters.
- `src/features/praktikum/helpers.js` normalizes inconsistent backend field names (`getLabCode`, `getHistoryId`, `getUserName`, `getClassName`, `getDosenName`) — reuse these instead of accessing fields directly. `computeStatus` rule: `Tidak Lengkap` if any `jumlahRusak > 0` or `jumlahAkhir < jumlahAwal`.

## Styling
- Tailwind is loaded via CDN `<script>` in `index.html`, not an npm dependency — utility classes work at runtime; do not add `tailwind.config.js` or PostCSS setup.
- `src/index.css` is still the Vite template default (dark background, centered `body`) — page components override with their own classes; global CSS changes affect every page.
