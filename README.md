# Job tracker

A personal job-application tracker. Nuxt 4, Nuxt UI, Upstash Redis, Cloudflare Workers + R2.

- One password protects the site (session cookie).
- Claude Desktop can manage applications through an MCP server at `/mcp` (bearer token).
- Each application can have a PDF CV (stored in Cloudflare R2) and a pasted job description.

## Run locally

```bash
pnpm install
cp .env-example .env   # then fill in the values (see below)
pnpm dev               # http://localhost:3000
```

In development, CV files are saved as plain files in `.data/cv`.

## Environment variables

All names start with `NUXT_`. Locally they live in `.env`; in production they are Cloudflare secrets.

| Name                                                            | What it is                                         |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `NUXT_UPSTASH_REDIS_REST_URL` / `NUXT_UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis database                        |
| `NUXT_ADMIN_PASSWORD`                                           | The password you type on the login page            |
| `NUXT_SESSION_SECRET`                                           | 32+ random characters, signs the session cookie    |
| `NUXT_MCP_TOKEN`                                                | 32+ random characters, the bearer token for `/mcp` |

## Deploy to Cloudflare

Deploying is manual. A git commit or push does not publish anything.

```bash
pnpm deploy:cf
```

This builds the app and uploads it with Wrangler. (`pnpm deploy` without `:cf` is a different,
built-in pnpm command, so the script has its own name.)

### First-time setup

1. `npx wrangler login`
2. Enable R2 in the Cloudflare dashboard, then `npx wrangler r2 bucket create job-tracker-cv`
3. Set the five secrets, one at a time (it asks for the value):
   `npx wrangler secret put NUXT_ADMIN_PASSWORD --name job-tracker` (same for the other four)
4. `pnpm deploy:cf`

The worker name, R2 bucket and custom domain are in `nuxt.config.ts` under `nitro.cloudflare.wrangler`.

## Connect Claude Desktop

Add the server to `claude_desktop_config.json` with `mcp-remote`, pointing at
`https://<your-domain>/mcp` and sending the header `Authorization: Bearer <NUXT_MCP_TOKEN>`.
