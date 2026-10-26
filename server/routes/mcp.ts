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

  server.registerTool(
    'attach_cv',
    {
      description:
        'Attach a PDF CV (max 5 MB) to an application, replacing any existing one. Give either `url` (a public https link to the PDF) or `copy_from_id` (the id of another application whose CV should be reused). Exactly one of the two.',
      inputSchema: { id: z.string(), url: z.url({ protocol: /^https$/ }).optional(), copy_from_id: z.string().optional() },
    },
    async ({ id, url, copy_from_id }) => {
      if (!url === !copy_from_id) return text('Pass exactly one of url or copy_from_id', true)
      try {
        let bytes: Uint8Array | null
        let name: string
        if (url) {
          ;({ bytes, name } = await fetchPdf(url))
        } else {
          const source = await redis.hget<string>(`application:${parseId(copy_from_id)}`, 'cvName')
          bytes = source ? await readCv(parseId(copy_from_id)) : null
          name = source ?? ''
        }
        if (!bytes) return text(`Application ${copy_from_id} has no CV`, true)
        const record = await saveCv(redis, parseId(id), name, bytes)
        return record ? text(record) : text(`Application ${id} not found`, true)
      } catch (e: any) {
        return text(e?.statusMessage ?? 'Could not attach the CV', true)
      }
    },
  )

  server.registerTool(
    'remove_cv',
    {
      description: 'Remove the CV from an application.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const record = await removeCv(redis, parseId(id))
      return record ? text(record) : text(`Application ${id} not found`, true)
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
