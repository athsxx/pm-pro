# Stitch — Clean Utility references

Static HTML exports live under **`~/Downloads/stitch/`** on your machine (copies may also exist under `src/app/stitch/`). This folder holds **runtime tokens** (`tokens.ts`) and maps **all in-app routes** to those references:

| App screen | Route | Reference |
|------------|-------|-----------|
| Global look & philosophy | — | `aetheric_precision/DESIGN.md` |
| Today | `/` (`MyTasks`) | `today_dashboard/code.html` |
| Login | `/login` | `login/code.html` |
| Inbox | `/notifications` | `notifications/code.html` |
| Projects list | `/projects` | `projects/code.html` |
| Project tasks (open a project) | `/projects/:id` (`ProjectDetail`) | Implied by project cards → task list |
| Task detail | `/task-quick-update` | `task_detail/code.html` |
| Settings (account / sign out) | `/settings` | Bottom tab in `today_dashboard` / `projects` HTML |

No other feature routes (timer, reports, etc.) are part of this shell.

CSS variables: `src/styles/stitch-tokens.css` (`--stitch-*`). Prefer those over one-off hex values in new UI.
