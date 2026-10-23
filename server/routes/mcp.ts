import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'

// MCP endpoint for Claude. It is not under /api, so the login middleware does not
// cover it: it has its own bearer-token check.
const text = (value: unknown, isError = false) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  ...(isError && { isError }),
})

function buildServer(event: Parameters<typeof useRedis>[0]) {
  const redis = useRedis(event)
  const server = new McpServer({ name: 'job-tracker', version: '1.0.0' })

  server.registerTool(
    'list_applications',
    {
      description: 'List job applications, newest first. Optionally filter by status.',
      inputSchema: { status: z.enum(statuses).optional() },
    },
    async ({ status }) => text(await listApplications(redis, status)),
  )

  server.registerTool(
    'create_application',
    {
      description: 'Add a job application. Status defaults to Applied, language to EN, date to today (YYYY-MM-DD).',
      inputSchema: applicationSchema.shape,
    },
    async (args) => text(await createApplication(redis, applicationSchema.parse(args))),
  )

  server.registerTool(
    'update_application',
    {
      description: 'Change fields of an existing application by id. Only the fields you pass are changed.',
      inputSchema: { id: z.string(), ...applicationUpdateSchema.shape },
    },
    async ({ id, ...changes }) => {
      const record = await updateApplication(redis, id, changes)
      return record ? text(record) : text(`Application ${id} not found`, true)
    },
  )

  server.registerTool(
    'delete_application',
    {
      description: 'Delete an application by id. This cannot be undone.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      await deleteApplication(redis, id)
      return text(`Deleted application ${id}`)
    },
  )

  return server
}

export default defineEventHandler(async (event) => {
  const { mcpToken } = useRuntimeConfig(event)

  // fail closed if the token is missing or weak
  if (mcpToken.length < 32) {
    throw createError({ statusCode: 500, statusMessage: 'MCP is not configured' })
  }
  const sent = getRequestHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!safeEqual(sent, mcpToken)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // stateless: a fresh server per request, so it works on Cloudflare Workers
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await buildServer(event).connect(transport)
  return transport.handleRequest(toWebRequest(event))
})
