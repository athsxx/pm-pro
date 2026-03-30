# pm-pro

**Member-facing** PM experience: Vite + React UI (Stitch “Clean Utility” screens) packaged with **Capacitor** for Android, plus the same app in the browser. It talks to the API in `backend/` (Express; SQLite in Phase 1).

## Related repository (admin console)

**Managers and admins** use the separate **Project ManagementAPP** repo — full web console (Gantt, EVM, baselines, users, reports, Intelligence Hub):

**[github.com/athsxx/ProjectManagementAPP](https://github.com/athsxx/ProjectManagementAPP)** (private)

| Repo | Audience | Role |
|------|----------|------|
| **pm-pro** (this repo) | `member` | Today, projects, inbox, tasks, settings on mobile/web |
| **ProjectManagementAPP** | `admin`, `manager` | Scheduling, baselines, cost/EVM, user admin |

Both are part of the same **PM Pro** product split; they are **not** submodules — two remotes, two clones, intentional boundaries.

## Documentation

- **[document.md](./document.md)** — architecture, env vars, how web/mobile hit the same API, Stitch/Figma notes, roadmap (e.g. Supabase).

## Quick start

```bash
cd backend && npm i && npm start   # API (see backend/.env.example)
cd frontend && npm i && npm run dev
```

Android: see Capacitor docs in `frontend/` after `npm run build` and `npx cap sync android`.
