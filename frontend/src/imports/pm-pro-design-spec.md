Design a professional project management web app called "PM Pro". 
Dark/light mode toggle. Clean, modern SaaS style similar to Linear 
and Notion. Primary color: deep blue (#1E3A5F). Accent: bright 
teal (#00BFA5). Font: Inter.

Design these screens at 1440px desktop width:

---

SCREEN 1 — Login Page
- Centered card on dark background
- PM Pro logo + tagline "Manage projects. Track everything."
- Email + password inputs
- "Sign In" primary button
- Subtle background gradient (dark navy)

---

SCREEN 2 — Dashboard
- Left sidebar: logo, nav links (Dashboard, Projects, Reports, Settings), 
  user avatar + name at bottom
- Top bar: search bar, notification bell with badge, user avatar
- Main content:
  - 4 KPI cards in a row: Total Projects, Tasks Due Today, 
    Overdue Tasks, Team Members. Each card has an icon, number, 
    and subtle trend indicator
  - Below: 2-column layout
    - Left: "My Projects" list with status badges and progress bars
    - Right: "Recent Activity" feed with avatar + action + timestamp

---

SCREEN 3 — Projects List
- Full-width table with columns: 
  Project Name, Status (badge), Start Date, End Date, 
  Progress (bar), Manager (avatar + name), Actions
- Status badges: Active (green), On Hold (yellow), Completed (grey)
- "New Project" button top right (teal, filled)
- Search + filter bar above table

---

SCREEN 4 — Project Detail
- Project name as page title with status badge
- Horizontal tab bar: Overview | Tasks | Gantt | EVM | Baselines | Calendar
- Active tab underlined in teal

SCREEN 4A — Tasks Tab (within Project Detail)
- Toolbar: search, filter by status, filter by assignee, "Add Task" button
- Table: checkbox, Task Name, Assignee (avatar), Status (dropdown badge), 
  Progress (mini bar + %), Due Date, Cost, Actions (3-dot menu)
- Right-click context menu design: 
  "Set Auto Schedule / Set Manual" toggle
  "Mark Inactive / Mark Active" toggle
  "Open Task Details"

SCREEN 4B — Gantt Tab (within Project Detail)
- Left panel: task name list (same rows as task table)
- Right panel: horizontal timeline with date headers (weeks/months)
- Each task: a colored horizontal bar spanning its start→end date
- Tracking mode (toggle on): 
  Grey bar = baseline, colored bar = actual
  Green bar = ahead of baseline, Red bar = behind baseline
- Toolbar above: 
  "Tracking" toggle switch
  "Baseline" dropdown (Baseline 0 to 10)
  "Save Baseline" button
  "Reschedule" button

SCREEN 4C — EVM Tab (within Project Detail)
- Top row: 7 KPI cards: CPI, SPI, CV, SV, EAC, ETC, TCPI
  Each card: label, value, colored indicator (green if healthy, red if not)
- S-Curve chart below: 3 lines (PV=blue, EV=green, AC=red), 
  X axis = time, Y axis = cost. Legend at top right
- Below chart: task breakdown table with columns:
  Task, PV, EV, AC, CPI, SV

---

SCREEN 5 — Task Info Modal (overlay)
- Slide-in panel from the right (not a popup)
- Sections:
  DETAILS: Title input, Description textarea, Assignee dropdown (with avatar), 
           Status dropdown, Progress slider (0-100%)
  SCHEDULE: Start Date, End Date, Duration, Scheduling Mode toggle (Auto/Manual),
            Constraint Type dropdown
  COST: Cost Per Hour, Fixed Cost, Actual Cost (all number inputs)
  COMMENTS: scrollable list of comments with avatar + text + timestamp,
            text input + Send button at bottom
  ATTACHMENTS: drag-and-drop upload area, list of uploaded files
- Save button fixed at bottom of panel (full width, teal)

---

SCREEN 6 — Mobile App (375px width, 5 screens)

MOBILE 1 — Login
- Full screen, PM Pro logo centered
- Email + password inputs
- Login button (full width, teal)

MOBILE 2 — My Tasks
- Top: greeting ("Good morning, Alice 👋")
- 3 pill tabs: Today | Upcoming | Overdue
- Task cards:
  - Task title (bold)
  - Project name (grey, small)
  - Due date + status badge
  - Progress bar at bottom of card

MOBILE 3 — Task Quick Update
- Task title at top
- Status selector (4 pill buttons: Not Started / In Progress / Done / Blocked)
- Progress slider with % shown
- Quick time log row: "+0.5h" "+1h" "+2h" buttons (outlined)
- Comment input + Send icon button
- Save Changes button (full width, fixed at bottom)

MOBILE 4 — Timer Screen
- Large circular timer display in center (MM:SS:HH)
- Task name below timer
- START / STOP button (large, round, teal)
- Manual Log section below: hours input, note, date, Submit button

MOBILE 5 — Notifications
- List items: colored left border by type, 
  title (bold) + body + time ago
- Unread = white background, read = light grey
- Bottom nav bar: Tasks | Timer | Notifications (with badge) | Profile

---

DESIGN SYSTEM (apply consistently):
- Border radius: 8px for cards, 6px for inputs, 24px for badges/pills
- Shadows: subtle drop shadow on cards (0 2px 8px rgba(0,0,0,0.08))
- Spacing: 8px base grid
- Input style: light grey background, 1px border, focus = teal border glow
- Primary button: teal fill, white text, slight hover darkening
- Secondary button: white fill, 1px grey border
- Table rows: hover = light grey highlight
- Sidebar width: 240px, dark navy background (#0F2035), white icons + text
- Status badges: rounded pill, color-coded background + text