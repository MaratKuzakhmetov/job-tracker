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

- [x] **4. Error handling in the UI**
  The `$fetch` calls in `app/pages/index.vue` had no `try/catch`, so failures were silent.
  - Fixed: every action goes through one `run()` wrapper that shows one generic dismissible message
    ("Something went wrong. Please reload the page and try again.") and redirects to `/login` on a 401.
  - The initial list load is handled too (`useFetch` error).
  - Known gap: `ApplicationForm.vue` clears its fields as soon as you press Add, even if the save
    fails, so typed data is lost on error. Fix by clearing only after a successful save.

## MCP + Cloudflare

- [x] Cloudflare build: Nitro preset `cloudflare_module` with `nodejs_compat`, worker name `job-tracker`
      (`pnpm build` works and generates `.output/server/wrangler.json`)
- [x] MCP endpoint `POST /mcp` (stateless, official SDK web transport) with tools
      `list_applications`, `create_application`, `update_application`, `delete_application`
- [x] Bearer-token auth for `/mcp` (`NUXT_MCP_TOKEN`, 32+ chars; the route refuses to run without it)
- [x] Data logic shared between REST routes and MCP tools: `server/utils/applicationStore.ts`
- [x] Login lockout reads the client IP from `CF-Connecting-IP` first
- [x] Deployed at https://job-tracker.markgp.com (custom domain, workers.dev and preview URLs off); secrets set
- [x] Claude Desktop connected through `mcp-remote` (config in `claude_desktop_config.json`)

## Website options

- [x] ~~Live refresh~~ dropped: not needed, reload the page to see applications added through MCP
- [x] CV per application (PDF only, max 5 MB): Upload / Open (new tab) / Replace / Remove in the table
  - Files live in Cloudflare R2 (bucket `job-tracker-cv`, binding `CV`); in local dev they are plain files in `.data/cv`
  - The file is checked on the server (`%PDF-` header), not just by name or type; `/api/.../cv` needs the login
  - Deleting an application also deletes its CV; the file name is kept in the Redis field `cvName`
  - [ ] **Enable R2 in the Cloudflare dashboard**, create the bucket (`npx wrangler r2 bucket create job-tracker-cv`),
        then `pnpm build` and `npx wrangler --cwd .output deploy`

- [ ] Mention the job-tracker tools in the Claude project instructions
- [ ] Later, optional: OAuth so the server also works from the Connectors screen / claude.ai

## Before the first deploy

- [ ] Set all five as Cloudflare secrets (`npx wrangler secret put NAME`), with the `NUXT_` prefix:
  `NUXT_UPSTASH_REDIS_REST_URL`, `NUXT_UPSTASH_REDIS_REST_TOKEN`,
  `NUXT_ADMIN_PASSWORD`, `NUXT_SESSION_SECRET` (32+ random characters), `NUXT_MCP_TOKEN` (32+ characters)
- [ ] Serve over HTTPS (the session cookie is `secure` in production)
- [ ] Update Node to `^22.21.0` (or 24.11+) and `.nvmrc` to match
- [ ] Install `@types/node` (`pnpm add -D @types/node`) so the editor knows `node:crypto`
- [ ] Make the first commit (nothing is committed yet), after checking `git status` for secrets

## Nice to have

- [ ] Tests for the API routes and the auth flow
- [ ] Edit fields other than status in the UI (the API already supports it)
- [ ] Confirmation before delete
- [ ] Lockout counts IPs from `X-Forwarded-For`; check that the host overwrites that header
