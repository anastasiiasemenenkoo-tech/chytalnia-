# Читальня — Reader Dashboard & Book Clubs

A personal reader dashboard and online book club. Sign up, track books
across three shelves (**Want to read**, **Reading now**, **Read**),
record reading progress, search Open Library to add titles with
covers, and join or create book clubs — with discussion threads,
per-member progress, reading schedules/deadlines, and a history of
what the club has already read.

Built on Next.js 16, React 19, Prisma 7 + PostgreSQL, Auth.js v5, Tailwind v4
and shadcn/ui (base-nova style on `@base-ui/react`).

---

## Quick start

```bash
# Node 20.9+ required (Next.js 16)
npm install

# Create .env (see below) — DATABASE_URL must point at a Postgres instance
echo "DATABASE_URL=\"postgresql://user:pass@host/db?sslmode=require\"" > .env
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
echo "AUTH_TRUST_HOST=true" >> .env

# Apply migrations and generate the Prisma client
npx prisma migrate dev
npx prisma generate

npm run dev   # → http://localhost:3000
```

Sign up at `/signup`, then explore the dashboard.

> **Tip — Prisma 7 quirk:** `prisma migrate dev` does **not** regenerate
> the client automatically. Re-run `npx prisma generate` after any
> schema change, then restart the dev server.

A free Postgres instance for local dev works fine — e.g. a project on
[Neon](https://neon.tech).

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (`postgresql://user:pass@host/db?sslmode=require`). Neon's dashboard gives you this directly after creating a project. |
| `AUTH_SECRET` | yes | Used by Auth.js to sign session JWTs. Generate with `openssl rand -base64 32`. |
| `AUTH_TRUST_HOST` | yes (dev) / not needed on Vercel | Auth.js v5 requires this when not running on the default Vercel host — Vercel's own host detection covers it in prod. |

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
| DB | Prisma **7** + PostgreSQL via `@prisma/adapter-pg` |
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
│  ├─ books.ts                        # add/move/remove/manualAdd/updateReadingProgress/rating/review
│  ├─ clubs.ts                        # create/join/leave/setCurrentBook/updateClubSchedule
│  └─ club-comments.ts                # postClubComment/deleteClubComment
├─ components/
│  ├─ ui/                             # shadcn primitives
│  ├─ shell/                          # Sidebar, Topbar, MobileNav, ThemeToggle, page-skeletons
│  ├─ auth/                           # LoginForm, SignupForm (useActionState)
│  ├─ books/                          # BookCard, ShelfControls, AddToShelfButton, ReadingProgressDialog, …
│  └─ clubs/                          # ClubCard, JoinLeaveButton, SetCurrentBook, CreateClubForm,
│                                      # ClubMembers, ClubDiscussion, CommentThread, ClubSchedule,
│                                      # ClubReadingHistory
├─ lib/
│  ├─ db.ts                           # Prisma client singleton (PrismaPg adapter)
│  ├─ session.ts                      # getCurrentUser() cached with React `cache()`
│  ├─ openlibrary.ts                  # Open Library search + cover URL helper
│  ├─ shelf-labels.ts                 # Shelf enum → user-visible label
│  ├─ utils.ts                        # cn() — Tailwind class merge
│  └─ validators.ts                   # Zod schemas (signup, book add, progress, clubs, comments, schedule)
└─ types/next-auth.d.ts               # Module augmentation adding `id` to session.user
```

---

## Data model

```
User ──┬── UserBook ──── Book ───┐
       │                          │
       ├── ClubMembership ── BookClub ── currentlyReadingBook → Book
       │                          │
       └── ClubComment ───────────┴── ClubReadingHistory ── Book
```

| Model | Purpose |
|---|---|
| `User` | Email, optional name, bcrypt-hashed password. |
| `Book` | Cached Open Library metadata; `olid` is the unique key. Manual entries get `olid = "manual:<cuid>"`. |
| `UserBook` | Join row carrying shelf, `addedAt`, optional `finishedAt`, `pagesRead`, `totalPages`, `progressUpdated`, `rating`, `review`, `notes`. Unique on `(userId, bookId)`. |
| `BookClub` | Name, description, owner, optional `currentlyReadingBookId` (denormalized pointer to the active `ClubReadingHistory` row's book). |
| `ClubMembership` | `OWNER` or `MEMBER`. Unique on `(userId, clubId)`. |
| `ClubReadingHistory` | One row per reading cycle: `clubId`, `bookId`, optional `startDate`/`dueDate`, `endedAt` (null while active). `setClubCurrentBook` closes the open row and opens a new one whenever the book changes, so past reads and their date ranges are preserved. |
| `ClubComment` | Club-level discussion. Self-referencing `parentId` (one level of replies only, enforced in the action layer, not the schema). Cascade-deletes with the club or a deleted parent. |

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
| `setRating` / `clearRating` / `updateReviewAndRating` | Rating and review on a `UserBook` (rating/review UI only shows once a book is off the "Want to read" shelf). |
| `createClubAction` | Creates the club + `OWNER` membership in a transaction, redirects to the new club. |
| `joinClub` | Upserts a `MEMBER` membership. |
| `leaveClub` | Deletes the membership. Returns an error toast if you're the `OWNER`. |
| `setClubCurrentBook` | Owner-only. In a transaction: closes the club's open `ClubReadingHistory` row (if the book actually changed), opens a new one, and updates `currentlyReadingBookId`. |
| `updateClubSchedule` | Owner-only. Sets `startDate`/`dueDate` on the club's active `ClubReadingHistory` row (creates one on the fly if a legacy club doesn't have one yet). |
| `postClubComment` | Member-only (checked in-action, not by hiding the form). Optional `parentId`, rejected if it would nest more than one level deep. |
| `deleteClubComment` | Allowed for the comment's author or the club owner. |

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

## Deployment

**Recommended: Vercel (app) + Neon (Postgres).** Neon over Supabase here
because none of Supabase's auth/storage/realtime features are used
(Auth.js Credentials + JWT sessions need none of that), and Neon is a
plain managed Postgres — the smallest-diff pairing with the
`@prisma/adapter-pg` setup already in this repo.

Production env vars:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon's pooled connection string. |
| `AUTH_SECRET` | Generate a **fresh** secret for prod (`openssl rand -base64 32`) — don't reuse the dev one. |
| `AUTH_TRUST_HOST` | Not needed on Vercel (its host detection satisfies Auth.js v5 automatically). Only set it for non-Vercel hosts. |

Build/deploy pipeline (explicit steps matter here — Prisma 7 does not
regenerate the client automatically):

1. **Build command:** `npx prisma generate && next build` — plain
   `next build` alone would ship a stale/missing Prisma client.
2. **Migrations:** run `npx prisma migrate deploy` against the
   production `DATABASE_URL` as its own step (a Vercel deploy hook or a
   CI job), not inside the build command. If DDL doesn't work well over
   Neon's pooled connection, use Neon's direct (non-pooled) connection
   string via a separate `DIRECT_URL` for this step.
3. No `Account`/`Session`/`VerificationToken` migration surface from
   Auth.js — the Credentials + JWT setup needs none of those tables.

---

## Known limits / non-goals

Deliberately out of scope for this build:

- OAuth / social login (Google, GitHub, …)
- Email verification, password reset
- Real-time updates (discussion, progress, and reviews are all
  server-rendered + `revalidatePath`, not websockets/polling)
- More than one level of comment replies in club discussions
- Server-side image optimisation for Open Library covers (rendered with
  a plain `<img>` against their CDN)
- Tests (unit, e2e)
