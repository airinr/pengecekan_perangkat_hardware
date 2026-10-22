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

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
