# ✓ Everything — To-Do

A production-grade, full-stack to-do application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **PostgreSQL**. It aims to match the feel of Todoist / TickTick: fast natural-language capture, smart views, projects & labels, boards, a focus timer, a productivity dashboard, dark mode, keyboard-first navigation, and offline (PWA) support.

> Built incrementally from a phased "everything to-do app" spec. This repo delivers a polished **Phase 1–3 core** (task management, organization, multiple views, recurring tasks, focus & stats) on an architecture designed to extend into collaboration, AI, and integrations.

---

## ✨ Features

**Task management**
- Create / edit / complete / uncomplete / delete tasks with optimistic UI
- **Natural-language quick add** — type `Report tomorrow at 5pm #Work @laptop p1 every Monday` and it parses the due date, time, project, label, priority, and recurrence automatically, with a live token preview
- Subtasks with their own completion, priorities, and dates
- Rich task detail panel: notes, due date, priority (P1–P4), labels, recurrence, time estimate, project move
- **Recurring tasks** — `every day`, `every 3 days`, `every weekday`, `every Monday`, `every 2 weeks`, … (completing a recurring task advances its due date instead of closing it)
- **Bulk actions** — multi-select to complete, move, or delete
- Full-text search across titles and descriptions

**Organization**
- Projects with custom colors & emoji icons; an undeletable **Inbox**
- Sections within a project (used as Kanban columns)
- Labels / tags with colors
- **Saved filters / smart lists** with a query language — e.g. `today & p1 & @work`
- Built-in smart views: **Inbox, Today, Upcoming, Overdue, Completed**
- Favorites pinned in the sidebar

**Views**
- **List view** (with grouping in Upcoming by date)
- **Board / Kanban view** with drag-and-drop between sections
- **Dashboard** with completion rate, a 7-day activity chart, and an **Eisenhower matrix**
- Sort any view by priority, due date, or name

**Productivity**
- **Pomodoro / focus timer** with configurable work/break intervals and a circular progress ring
- **Karma** points for completing tasks
- Streak tracking

**Experience**
- **Dark / light / system** themes + **7 accent colors**
- **Command palette (⌘K / Ctrl+K)** for search and navigation
- Keyboard navigation, focus rings, ARIA labels (WCAG-minded)
- **PWA** — installable, offline-capable (network-first API cache, stale-while-revalidate shell)
- Responsive from mobile to desktop; toasts with **Undo**

---

## 🛠 Tech Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 14 (App Router, Route Handlers)            |
| Language   | TypeScript                                         |
| Styling    | Tailwind CSS (CSS-variable design tokens)          |
| State      | Zustand (optimistic client store)                  |
| Database   | PostgreSQL via Prisma ORM                          |
| Auth       | Email + password, bcrypt, JWT in an httpOnly cookie (`jose`) |
| Validation | Zod                                                |
| PWA        | Custom service worker + web manifest               |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- A **PostgreSQL** database (local, Docker, Neon, Supabase, or Vercel Postgres)

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy the example and fill in your values:
```bash
cp .env.example .env
```
```env
DATABASE_URL="postgresql://user:password@localhost:5432/todolist?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/todolist?schema=public"  # same as DATABASE_URL for local dev
JWT_SECRET="run: openssl rand -hex 32"
```

### 3. Set up the database
```bash
npm run db:migrate   # apply migrations
npm run db:seed      # optional: load demo data
```

### 4. Run
```bash
npm run dev
```
Open **http://localhost:3000**.

### Demo account
After seeding, log in with:
- **Email:** `demo@everything.app`
- **Password:** `demodemo`

Or click **“Try the demo account”** on the login screen.

---

## ☁️ Deploy to Vercel (with Supabase Postgres)

1. **Create a Supabase project** at [supabase.com](https://supabase.com). Set a database password when prompted.
2. In Supabase, open **Project Settings → Database → Connection string** and copy two strings:
   - **Transaction pooler** (port `6543`) → this is your `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=1`.
   - **Direct connection / Session pooler** (port `5432`) → this is your `DIRECT_URL`.
3. Push this repo to GitHub and **Import** it in Vercel.
4. In **Vercel → Project → Settings → Environment Variables**, add (for Production **and** Preview):
   - `DATABASE_URL` — the pooler string from step 2 (…`:6543/postgres?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` — the direct string from step 2 (…`:5432/postgres`)
   - `JWT_SECRET` — a long random string (`openssl rand -hex 32`)
5. **Deploy.** `vercel.json` runs `prisma generate && prisma migrate deploy && next build`; migrations run over `DIRECT_URL`, so your tables are created automatically on the first deploy.
6. (Optional) Load demo data against Supabase from your machine:
   ```bash
   DATABASE_URL="<direct 5432 url>" DIRECT_URL="<direct 5432 url>" npm run db:seed
   ```

> Why two URLs? Serverless functions open many short-lived connections, so the app talks to Postgres through Supabase's **pooler** (`DATABASE_URL`). Prisma migrations can't run through the pooler, so they use the **direct** connection (`DIRECT_URL`).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                # Route handlers (REST)
│   │   ├── auth/           # register, login, logout, me
│   │   ├── tasks/          # list/create + [id] update/delete/get
│   │   ├── projects/       # projects + sections
│   │   ├── labels/  filters/  stats/
│   ├── login/page.tsx      # auth screen
│   ├── page.tsx            # server-guarded app entry
│   └── layout.tsx          # theme bootstrap, fonts, PWA
├── components/             # AppShell, Sidebar, MainView, TaskList/Row,
│                           # QuickAdd, TaskDetail, BoardView, Dashboard,
│                           # Pomodoro, CommandPalette, dialogs, Icons …
└── lib/
    ├── prisma.ts  auth.ts  api.ts        # server helpers
    ├── nlp.ts                            # natural-language quick-add parser
    ├── recurrence.ts                     # recurring-task date math
    ├── filterQuery.ts                    # saved-filter query evaluator
    ├── store.ts  client.ts               # Zustand store + fetch client
    ├── date.ts  types.ts  serialize.ts   # shared utilities
    └── theme.ts
prisma/
├── schema.prisma          # data model
└── seed.ts                # demo data
public/                    # manifest, service worker, icons
```

---

## 🗃 Data Model (core)

`User → Project → Section → Task` with self-referencing subtasks, plus `Label` (many-to-many via `TaskLabel`), `Filter`, `Reminder`, and `Comment`. Everything is scoped to the authenticated user. See [`prisma/schema.prisma`](prisma/schema.prisma).

---

## 🧩 Natural-Language Quick Add

The parser (`src/lib/nlp.ts`) recognizes, in any order:

| Token            | Example                    | Result                    |
| ---------------- | -------------------------- | ------------------------- |
| Date             | `today`, `tomorrow`, `next week`, `in 3 days`, `friday` | due date |
| Time             | `at 5pm`, `17:00`, `noon`  | due time                  |
| Priority         | `p1`–`p4`                  | priority                  |
| Project          | `#Work`                    | assigns to matching project |
| Label            | `@laptop`                  | adds label (created if new) |
| Recurrence       | `every day`, `every 2 weeks`, `every Monday` | repeat rule |

Everything else becomes the task title.

---

## 🔌 REST API (summary)

All endpoints require the session cookie and return JSON.

| Method | Path                    | Purpose                          |
| ------ | ----------------------- | -------------------------------- |
| POST   | `/api/auth/register`    | Create account + session         |
| POST   | `/api/auth/login`       | Log in                           |
| POST   | `/api/auth/logout`      | Log out                          |
| GET    | `/api/tasks?view=…`     | List (smart views, filters)      |
| POST   | `/api/tasks`            | Create task                      |
| GET/PATCH/DELETE | `/api/tasks/[id]` | Read (+subtasks) / update / delete |
| GET/POST | `/api/projects`       | List / create projects           |
| PATCH/DELETE | `/api/projects/[id]` | Update / delete                |
| POST   | `/api/sections`         | Create section                   |
| GET/POST | `/api/labels`         | List / create labels             |
| GET/POST | `/api/filters`        | List / create saved filters      |
| GET    | `/api/stats`            | Dashboard stats                  |

---

## 🧪 Scripts

```bash
npm run dev        # start dev server
npm run build      # prisma generate + next build
npm run start      # run the production build
npm run db:migrate # prisma migrate dev
npm run db:deploy  # prisma migrate deploy (prod)
npm run db:seed    # load demo data
npm run db:studio  # open Prisma Studio
npm run lint       # eslint
```

---

## 🗺 Roadmap (from the phased spec)

- ✅ **Phase 1 — MVP:** auth, projects, tasks, subtasks, priorities, labels, due dates, Inbox/Today/Upcoming, list view, persistence
- ✅ **Phase 2 — Organization & views:** filters, sections, board view, search
- ✅ **Phase 3 (partial) — Productivity:** recurring tasks, Pomodoro, stats, Eisenhower matrix
- ⏳ **Phase 4 — Collaboration:** sharing, assignment, workspaces, comments, real-time sync
- ⏳ **Phase 5 — AI & integrations:** AI breakdown, calendar sync, email-to-task, public API, templates
- ✅/⏳ **Phase 6 — Polish:** PWA/offline ✅, themes ✅, ⌘K ✅, keyboard/accessibility ✅, gamification (karma) ✅; i18n/RTL & drag-reorder everywhere ⏳

---

## 📝 Architecture Notes & Assumptions

- **Auth** uses a signed JWT stored in an httpOnly cookie rather than a full OAuth stack, to keep the app self-contained and deployable without third-party provider secrets. OAuth/magic-links can be layered on with NextAuth without changing the data model.
- **Saved filters** are evaluated client-side against the active task set, which keeps the query language flexible without a server-side parser.
- **Offline** uses a hand-rolled service worker (network-first for `/api`, stale-while-revalidate for the shell) instead of a plugin, so there are no build-tool lock-ins.
- The client store applies **optimistic updates** and rolls back on error, surfacing failures as toasts.

## 📄 License

MIT.
