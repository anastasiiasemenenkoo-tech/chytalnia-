# Bookshelf — Reader Dashboard

A personal reader dashboard. Sign up, track books across three shelves
(**Want to read**, **Reading now**, **Read**), record reading progress,
search Open Library to add titles with covers, and join or create book
clubs.

Built on Next.js 16, React 19, Prisma 7 + SQLite, Auth.js v5, Tailwind v4
and shadcn/ui (base-nova style on `@base-ui/react`).

---

## Quick start

```bash
# Node 20.9+ required (Next.js 16)
npm install

# Set up the SQLite DB and generate the Prisma client
npx prisma migrate dev
npx prisma generate

# Create .env (see below)
echo "DATABASE_URL=\"file:./dev.db\"" > .env
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
echo "AUTH_TRUST_HOST=true" >> .env

npm run dev   # → http://localhost:3000
```

Sign up at `/signup`, then explore the dashboard.

> **Tip — Prisma 7 quirk:** `prisma migrate dev` does **not** regenerate
> the client automatically. Re-run `npx prisma generate` after any
> schema change, then restart the dev server.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite file path; default `file:./dev.db`. Resolved against the Node CWD, so the DB lives at the project root, not under `prisma/`. |
| `AUTH_SECRET` | yes | Used by Auth.js to sign session JWTs. Generate with `openssl rand -base64 32`. |
| `AUTH_TRUST_HOST` | yes (dev) | Auth.js v5 requires this when not running on the default Vercel host. |

`.env` is gitignored.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js **16** (App Router, Turbopack default) |
| UI runtime | React **19** |
| Styling | Tailwind v4 (`@import "tailwindcss"`) |
| Components | shadcn/ui — **base-nova** style on `@base-ui/react` (note: this style uses `render` prop, not Radix's `asChild`) |
| Icons | `lucide-react` |
| Auth | Auth.js v5 (Credentials provider, JWT sessions) |
| DB | Prisma **7** + SQLite via `@prisma/adapter-better-sqlite3` |
| Validation | Zod |
| Theming | `next-themes` (system / light / dark) |
| Notifications | `sonner` |

---

## Project layout

```
proxy.ts                              # Auth gate (Next 16 renames middleware.ts → proxy.ts)
prisma/
├─ schema.prisma                      # Prisma 7 — url lives in prisma.config.ts, not the schema
└─ migrations/
src/
├─ auth.ts                            # NextAuth full config (Prisma + bcrypt)
├─ auth.config.ts                     # Edge-safe subset imported by proxy.ts
├─ app/
│  ├─ layout.tsx                      # Root layout — ThemeProvider, Toaster
│  ├─ page.tsx                        # Marketing landing (redirects to /dashboard if session)
│  ├─ api/auth/[...nextauth]/route.ts # Re-exports Auth.js handlers
│  ├─ (auth)/                         # Login + signup (public, no chrome)
│  └─ (app)/                          # Authenticated app shell (sidebar + topbar)
│     ├─ dashboard/                   # Per-shelf counts + currently reading
│     ├─ books/                       # /books (filter by shelf) + /books/search (Open Library)
│     └─ clubs/                       # List, /new, /[id]
├─ actions/                           # 'use server' — every mutation
│  ├─ auth.ts                         # signupAction, loginAction, logoutAction
│  ├─ books.ts                        # add/move/remove/manualAdd/updateReadingProgress
│  └─ clubs.ts                        # create/join/leave/setCurrentBook
├─ components/
│  ├─ ui/                             # shadcn primitives
│  ├─ shell/                          # Sidebar, Topbar, MobileNav, ThemeToggle, page-skeletons
│  ├─ auth/                           # LoginForm, SignupForm (useActionState)
│  ├─ books/                          # BookCard, ShelfControls, AddToShelfButton, ReadingProgressDialog, …
│  └─ clubs/                          # ClubCard, JoinLeaveButton, SetCurrentBook, CreateClubForm
├─ lib/
│  ├─ db.ts                           # Prisma client singleton
│  ├─ session.ts                      # getCurrentUser() cached with React `cache()`
│  ├─ openlibrary.ts                  # Open Library search + cover URL helper
│  ├─ shelf-labels.ts                 # Shelf enum → user-visible label
│  ├─ utils.ts                        # cn() — Tailwind class merge
│  └─ validators.ts                   # Zod schemas (signup, book add, progress, clubs)
└─ types/next-auth.d.ts               # Module augmentation adding `id` to session.user
```

---

## Data model

```
User ──┬── UserBook ──── Book ───┐
       │                          │
       └── ClubMembership ── BookClub ── currentlyReadingBook → Book
```

| Model | Purpose |
|---|---|
| `User` | Email, optional name, bcrypt-hashed password. |
| `Book` | Cached Open Library metadata; `olid` is the unique key. Manual entries get `olid = "manual:<cuid>"`. |
| `UserBook` | Join row carrying shelf, `addedAt`, optional `finishedAt`, `pagesRead`, `totalPages`, `progressUpdated`. Unique on `(userId, bookId)`. |
| `BookClub` | Name, description, owner, optional `currentlyReadingBookId`. |
| `ClubMembership` | `OWNER` or `MEMBER`. Unique on `(userId, clubId)`. |

> The Auth.js `Account` / `Session` / `VerificationToken` tables are
> **deliberately omitted** — with `session: { strategy: "jwt" }` and the
> Credentials provider, Auth.js writes nothing to the DB, so the adapter
> is unnecessary.

---

## Server Actions

All under `src/actions/`. Every action runs `requireCurrentUser()` first
(defense in depth — the proxy is not the only gate) and validates input
with Zod.

| Action | What it does |
|---|---|
| `signupAction` | Validates fields, bcrypt-hashes the password, creates the user, signs in, redirects to `/dashboard`. |
| `loginAction` | Credentials sign-in via Auth.js. Surfaces "Invalid email or password." inline. |
| `logoutAction` | `signOut({ redirectTo: "/login" })`. |
| `addBookToShelf` | Upserts the `Book` by `olid`, upserts the `UserBook`. |
| `manualAddBook` | Same path with a synthetic `manual:<cuid>` olid. |
| `moveBookToShelf` | Updates `shelf`; stamps `finishedAt` when moved to `READ`. |
| `removeBookFromShelf` | Deletes the `UserBook` row. |
| `updateReadingProgress` | Saves `pagesRead`/`totalPages`. Auto-promotes to `READ` and stamps `finishedAt` at 100%. |
| `createClubAction` | Creates the club + `OWNER` membership in a transaction, redirects to the new club. |
| `joinClub` | Upserts a `MEMBER` membership. |
| `leaveClub` | Deletes the membership. Returns an error toast if you're the `OWNER`. |
| `setClubCurrentBook` | Owner-only. Sets the club's `currentlyReadingBookId`. |

Mutations return `{ ok: boolean; error?: string }`; form-state actions
return a Zod-shaped `errors` object for `useActionState` to render.

---

## Next.js 16 conventions worth knowing

Things that differ from Next.js 14/15 and would trip you up:

- **`proxy.ts` at project root replaces `middleware.ts`.** The default
  export name is `proxy` (re-exported from `NextAuth(authConfig).auth`).
- **`cookies()`, `headers()`, `params`, `searchParams` are all async.**
  Always `await`.
- **`PageProps<'/path'>` and `LayoutProps<'/path'>` are global types**
  generated by `next dev` / `next build`. Use them instead of typing
  props by hand.
- **Forms use React 19 `useActionState`** + `<form action={…}>` bound
  directly to a Server Action. No `event.preventDefault()`, no fetch.
- **Don't enable `cacheComponents`.** It changes default caching
  semantics and pulls in the `'use cache'` directive, `cacheLife`, etc.
  Keep it off unless you mean to opt in.
- **`revalidateTag('tag', cacheLifeProfile)` requires the second arg in
  v16** — only valid if Cache Components is on. We use
  `revalidatePath` instead.

## shadcn base-nova quirks

The new shadcn style is built on `@base-ui/react`, not Radix. Two gotchas:

- **No `asChild` prop.** Compose via `render={<Component .../>}`:
  ```tsx
  <DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>
  ```
- **Menu items fire `onClick`, not `onSelect`.** Radix used `onSelect`;
  base-ui uses `onClick`.

For links that should look like buttons, use the `buttonVariants()` helper
directly on the `<Link>` rather than wrapping a Button:

```tsx
<Link href="/clubs" className={buttonVariants({ variant: "outline" })}>
  Clubs
</Link>
```

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Turbopack dev server on :3000. |
| `npm run build` | Production build. |
| `npm run start` | Run the built app. |
| `npm run lint` | ESLint. |
| `npx prisma studio` | Browse the DB in a web UI. |
| `npx prisma migrate dev --name <change>` | Create + apply a migration. |
| `npx prisma generate` | Regenerate the Prisma client (do this after every migration in Prisma 7). |

---

## Known limits / non-goals (v1)

Deliberately out of scope for this build:

- OAuth / social login (Google, GitHub, …)
- Email verification, password reset
- Reviews + ratings
- Real-time chat or threaded comments in clubs
- Per-member progress aggregation on the club page (only the current
  user's progress is shown)
- Server-side image optimisation for Open Library covers (rendered with
  a plain `<img>` against their CDN)
- Tests (unit, e2e)
- Deployment configuration (the SQLite + better-sqlite3 adapter is
  local-only; a hosted deploy needs swapping to `@prisma/adapter-pg`)
