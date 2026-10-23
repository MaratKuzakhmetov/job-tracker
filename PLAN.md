# Pre-deploy plan

Things to fix before putting the job tracker on a public host.

## Must fix

- [x] **1. Authentication**
  Single-password login. Signed, HttpOnly session cookie. Server middleware returns 401 for every
  `/api/*` route except `/api/auth/*`. Login is locked for 15 minutes after 5 wrong attempts per IP.
  - Files: `server/utils/session.ts`, `server/middleware/auth.ts`, `server/api/auth/*`,
    `app/pages/login.vue`, `app/middleware/auth.global.ts`
  - TODO: set your own `NUXT_ADMIN_PASSWORD` in `.env` (currently `change-me-please`)

- [x] **2. Restrict link scheme (XSS)**
  `z.string().url()` accepts `javascript:alert(1)`. If `link` is rendered as `<a href>`, that is an XSS hole.
  - Fixed in `server/utils/applications.ts`: `z.url({ protocol: /^https?$/ })`, empty string still allowed.
    Create and update both use this schema.
  - Confirmed `ApplicationTable.vue` renders `link` as `<a :href>`, so the hole was real.
  - Checked: `javascript:`, `data:`, `ftp:` and mixed-case `JaVaScRiPt:` are rejected.

- [x] **3. Secrets stay out of git**
  `.env` is ignored (`.gitignore` line 25, confirmed with `git check-ignore`).
  - Note: `.gitignore` has `!.env.example` but the file is named `.env-example` (with a dash), so it is
    caught by no rule. It is safe to commit, since it holds only placeholders.

- [ ] **4. Error handling in the UI**
  The `$fetch` calls in `app/pages/index.vue` (`create`, `updateStatus`, `remove`) have no `try/catch`.
  If Redis or the network fails, the user sees nothing.
  - Fix: wrap each call, show a short error message on the page.
  - Also handle an expired session: on a 401, redirect to `/login`.

## Before the first deploy

- [ ] Set all four env vars on the host with the `NUXT_` prefix:
  `NUXT_UPSTASH_REDIS_REST_URL`, `NUXT_UPSTASH_REDIS_REST_TOKEN`,
  `NUXT_ADMIN_PASSWORD`, `NUXT_SESSION_SECRET` (32+ random characters)
- [ ] Serve over HTTPS (the session cookie is `secure` in production)
- [ ] Update Node to `^22.21.0` (or 24.11+) and `.nvmrc` to match
- [ ] Install `@types/node` (`pnpm add -D @types/node`) so the editor knows `node:crypto`
- [ ] Make the first commit (nothing is committed yet), after checking `git status` for secrets

## Nice to have

- [ ] Tests for the API routes and the auth flow
- [ ] Edit fields other than status in the UI (the API already supports it)
- [ ] Confirmation before delete
- [ ] Lockout counts IPs from `X-Forwarded-For`; check that the host overwrites that header
