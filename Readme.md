# PM Pro — project documentation

## Purpose

- **pm-pro** (this repo): Capacitor mobile + web shell for **team members**, scoped to **Stitch “Clean Utility” screens only** (see `frontend/src/app/stitch/README.md`: Today, Login, Inbox, Projects, project tasks, task detail, Settings). **Admins are not expected to use the mobile app** — admin / PM workflows stay on the web console (e.g. ProjectManagementAPP). The native build blocks `admin` login and clears an admin session if detected.
- **ProjectManagementAPP** (sibling folder): **Admin / manager web console** (Sequelize + Postgres): Gantt, EVM, users, etc. Member accounts are steered to **pm-pro** mobile; optional API lock: `ADMIN_WEB_DISABLE_MEMBER_LOGIN` in **ProjectManagementAPP** `backend/.env`.
- **Stitch** (`~/Downloads/stitch`): Static HTML + `DESIGN.md` (“Modern Precision”) as the mobile visual reference. Tokens live in `frontend/src/styles/stitch-tokens.css` and `frontend/src/app/stitch/tokens.ts` (primary `#6b38d4`, bg `#f6f6f8`, border `#e2e8f0`, Manrope + Inter).
- **Figma (Cursor MCP)**: Use **get_design_context** with `fileKey` + frame `nodeId` (from “Copy link to selection” → `node-id=1-99` → `1:99`). Example file: [Untitled](https://www.figma.com/design/4V7iM32yy7VhjRPva5GNsU/Untitled?node-id=0-1) — `get_metadata` on `0:1` lists frames (`1:99` Today Dashboard, `1:2` Notifications, `1:73` Login, `1:168` Projects, `1:241` Task Detail). **get_design_context** on `1:99` returns reference code + screenshot; adapted in-app via tokens + **Today** header/cards/progress bar.

Long-term direction: **Supabase** (Postgres + Auth + RLS + Realtime) as the single source of truth for tasks/projects so mobile and admin stay in sync. Phase 1 still runs on the local Express + SQLite API in `backend/`.

## Architecture (Phase 1)

```
Mobile/Web (Vite React) ──HTTPS──> Express API (pm-pro/backend) ──> SQLite (pm-pro.db)
```

## Linking the web app and the mobile app

**They already share one codebase:** the Vite app in `frontend/` is the **member UI** in the browser *and* inside the Capacitor Android shell. “Linking” means **both builds talk to the same backend** so data and JWT auth stay consistent.

| Surface | What to do |
|--------|------------|
| **Web (browser)** | Run `npm run dev` or deploy the **`npm run build`** output (`dist/`). Set **`VITE_API_BASE`** to your API origin (e.g. `http://localhost:3001` locally, `https://api.example.com` in production). See `frontend/.env.example`. |
| **Mobile (Android)** | Before `npm run build`, set the **same** `VITE_API_BASE` as production web (usually **HTTPS** public API URL). Emulator dev can use default `http://10.0.2.2:3001` or `.env.local`. Then `npx cap sync android` and build the app. |
| **Backend** | One deployed **Node + SQLite** (or later Postgres) instance. **JWT** is in `Authorization: Bearer`; no cookies — web and app are separate tabs/sessions but **same users/passwords** on the same API. |

**Not linked yet (separate project):** **ProjectManagementAPP** (admin web) uses its own stack today. True “admin web + member mobile” on one dataset means **either** migrating that app to call **pm-pro**’s `/api/*` **or** moving everyone to a shared backend (e.g. Supabase) — that is a later integration project.

### Admin assignments → member app (what works today)

- **pm-pro** shows tasks from **its own** SQLite DB via `GET /api/tasks/my` (rows where `assigneeId` equals the logged-in member’s user id). If an admin assigns work **only** inside **ProjectManagementAPP**, that data lives in **that** app’s DB (Sequelize + `database.sqlite` or Postgres) — **it will not appear on mobile** until both surfaces share one store.
- **Ordered integration options:** (1) **Single backend** — one API + DB (e.g. extend pm-pro API for admin routes, or Supabase); migrate users/projects/tasks so `assigneeId` and JWT `sub` match everywhere. (2) **Sync** — on create/update task in ProjectManagementAPP, push the same payload to pm-pro (service account + id mapping); higher ops cost. (3) **Interim** — admins assign in a **tool that writes to pm-pro** (minimal admin UI on pm-pro web or direct API) until (1) ships.
- **API guard:** In ProjectManagementAPP, set `ADMIN_WEB_DISABLE_MEMBER_LOGIN=true` so members cannot authenticate against the admin API by mistake; they must use pm-pro with **pm-pro’s** `VITE_API_BASE`.

### Unified test (admin assigns → mobile sees)

1. **pm-pro** `backend/.env`: set **`TASK_SYNC_SECRET`** (≥16 characters).
2. **ProjectManagementAPP** `backend/.env`: set **`PM_PRO_API_URL=http://localhost:3001`** (or your pm-pro host) and **`PM_PRO_SYNC_SECRET`** to the **same** string as `TASK_SYNC_SECRET`.
3. Run **pm-pro** API on **3001** and **ProjectManagementAPP** API on **3002**; assign a task to a **member** in the admin UI. The admin backend **POSTs** to **`/api/sync/upsert`** on pm-pro (project + assignee user bcrypt + task). The member logs into the **pm-pro** app with the **same email/password** as in the admin DB (same user UUID; first sync creates the row in pm-pro with that hash).
4. If sync is disabled (no env vars), the admin app behaves as before and only logs a warning on failure.
5. **Member → admin:** On pm-pro, set **`ADMIN_API_URL`** to the admin API origin (e.g. `http://localhost:3002`) and keep **`TASK_SYNC_SECRET`** the same as **`PM_PRO_SYNC_SECRET`**. When a member completes or updates a task in the app, pm-pro **POSTs** to **`/api/sync/member-task`** on the admin API; the admin DB gets status/progress/description and a **`TaskCompletion`** row with **`completedAt`**. The admin **Task detail** page shows **Completed** (date/time) and refreshes on **`task:updated` / `task:completed`** socket events.

## Runbooks

### Backend

```bash
cd backend
npm install
# optional: echo 'PORT=3001' > .env
node src/index.js
```

Health check: `GET http://localhost:3001/api/health`

### Frontend (web)

```bash
cd frontend
npm install
# Point at your API (emulator default targets Android loopback):
# echo 'VITE_API_BASE=http://10.0.2.2:3001' > .env.local
npm run dev
```

### Mobile (Capacitor)

```bash
cd frontend
npm run build
npx cap sync android
# Open Android Studio: android/ → run on device/emulator
```

- **Emulator “Failed to fetch” to `10.0.2.2`:** Capacitor defaults the WebView to **HTTPS**; calls to **HTTP** APIs are mixed content and are blocked. This repo sets `server.androidScheme: "http"` and `android.allowMixedContent` in `capacitor.config.json` — run `npx cap sync android` after pulling changes.
- **Physical device:** set `VITE_API_BASE` to `http://<your-LAN-IP>:3001` before `npm run build`, and allow cleartext HTTP if needed (`network_security_config.xml` already present for Android).
- **`adb: command not found`:** add Android SDK platform-tools to `PATH`, e.g. `export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"` (path may differ if SDK location is custom).
- **Crash right after login (“app keeps stopping”):** Push plugin calls **Firebase** on `register()`; without **`google-services.json`** the process can crash. `registerPushNotifications()` is a no-op on **Android** until FCM is configured (see Capacitor Push Notifications docs).
- **iOS:** `npx cap sync ios` and open Xcode; adjust ATS for HTTP if required.

## Task model (pm-pro API)

- Status values used in the mobile UI: `not_started`, `in_progress`, `done`, `blocked`.
- Due date field in SQLite: `dueDate` (API responses also expose `endDate` as an alias).
- **Fix applied:** `GET /api/tasks/my` orders by `dueDate` (nulls last), not the non-existent `endDate` column.

### Admin alignment (future)

ProjectManagementAPP uses different status strings (e.g. `todo`). When moving to Supabase, define **one canonical enum** and document the mapping here.

## Orchestrator + subagents

| Role | Responsibility |
|------|----------------|
| **Orchestrator** | Splits work, avoids file conflicts, merges changes, updates this doc and the agent log, runs build/smoke checks, then triggers code-simplifier on touched files |
| **Runtime / Capacitor** | Env, builds, `cap sync`, device networking |
| **Backend / API** | Express routes, SQLite, auth |
| **Mobile UX** | Screens vs Stitch / optional Figma URL |
| **Supabase** | Schema, RLS, clients (use Supabase MCP; read tool schemas first) |
| **Admin** | ProjectManagementAPP → same Supabase |
| **Code simplifier** | Clarify recently touched code without behavior changes (see code-simplifier plugin) |

Handoff protocol: brief → specialist → summary + files changed + risks → orchestrator merge → simplifier pass → **Agent log** entry.

## Agent log

| Date | Agent | Outcome |
|------|--------|---------|
| 2026-03-25 | Implementation | Admin→pm-pro **task sync**: `POST/DELETE /api/sync/*` on pm-pro (`TASK_SYNC_SECRET`); ProjectManagementAPP `pmProSync` pushes on task create/update/assign/delete. |
| 2026-03-24 | Orchestrator + 3 subagents | Parallel: (1) removed `ProjectManagementAPP` `MyWork.js` / `MyWork.css`; (2) admin stack `PORT=3002` + `frontend/.env` + `.env.example` files for pm-pro/PM-APP port split; (3) pm-pro `.env.example` cross-reference + smoke (overseer: restored `CLIENT_URL` in PM-APP example, clearer smoke `ECONNREFUSED` message). |
| 2026-03-24 | Handoff | Documented admin-assignment vs mobile data split; integration options (single backend, sync, interim); `node scripts/smoke.js` verified against running API. |
| 2026-03-23 | Implementation | Phase 1: fixed `/api/tasks/my` sort; Today screen (grouped by due date, inline complete, Manrope + Stitch-inspired styling); Layout “Today” nav + hidden duplicate mobile header on `/`; fonts/theme; `document.md` added. |
| 2026-03-24 | Orchestrator + subagents | Parallel: member `PUT /api/tasks/:id` limited to `description`/`status`/`progress` with validation; `MobileSettings` + `MobileReports` + routes; exported `getApiBase()`; push registration gated on JWT + single listener setup, called after login and on cold start when token exists. |
| 2026-03-24 | Implementation | `PATCH /member-update` + `PATCH /status`: member status whitelist includes `blocked`; `MobileTimer` wired to `/api/timer/*`, `getMyTasks`, manual `time-log`; `api/timer.ts`, `api/projects.ts`, `postTaskTimeLog`; `UpdateProgress`: blocked status + comments list/post via `api/comments.ts`. |
| 2026-03-24 | Orchestrator + 4 subagents + merge | **Infra:** `RequireAuth` gate; `apiUpload` + `api/attachments.ts`; `PATCH /api/notifications/read-all`; `getTask`; login redirect if already authed. **Parallel agents:** `Layout` (session `me()`, `listProjects` sidebar, full-bleed routes); `MyTasks` → `/task-quick-update`; `TaskQuickUpdate` full API (comments, attachments, time log, `memberUpdate`); `MobileNotifications` mark-all API. **Overseer:** `ProjectsList` from API; `ProjectDetail` replaced with API-driven task list + navigation to quick update; `Dashboard` task taps use `taskId` (subagent). |
| 2026-03-24 | Stitch + Figma MCP | UI aligned to `~/Downloads/stitch` (Today header 28px, bell, cards `border #e2e8f0`, action violet `#6b38d4`); `stitch-tokens.css` + `app/stitch/tokens.ts`; Task quick update / timer / bottom nav use same primary; Figma MCP `whoami` verified for future `get_design_context` with a file URL. |

## Plugins / MCP

- **Supabase** (Cursor MCP): schema, migrations, advice — use when starting Phase 2.
- **Figma** (Cursor MCP): optional if a `figma.com` design URL is provided; Stitch HTML remains the offline reference.
