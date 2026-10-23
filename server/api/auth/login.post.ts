import { z } from 'zod'

const MAX_FAILS = 5
const LOCK_SECONDS = 15 * 60

export default defineEventHandler(async (event) => {
  const { password } = await readValidatedBody(event, z.object({ password: z.string().min(1) }).parse)
  const config = useRuntimeConfig(event)

  // fail closed if the server isn't configured
  if (!config.adminPassword || config.sessionSecret.length < 32) {
    throw createError({ statusCode: 500, statusMessage: 'Auth is not configured' })
  }

  const redis = useRedis(event)
  const failKey = `login_fail:${getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'}`

  if (Number((await redis.get(failKey)) ?? 0) >= MAX_FAILS) {
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts' })
  }

  if (!safeEqual(password, config.adminPassword)) {
    await redis.incr(failKey)
    await redis.expire(failKey, LOCK_SECONDS)
    throw createError({ statusCode: 401, statusMessage: 'Wrong password' })
  }

  await redis.del(failKey)
  const session = await useAppSession(event)
  await session.update({ loggedIn: true })
  return { ok: true }
})
