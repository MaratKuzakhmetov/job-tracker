import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export function useAppSession(event: H3Event) {
  const config = useRuntimeConfig(event)
  return useSession<{ loggedIn?: boolean }>(event, {
    password: config.sessionSecret,
    name: 'job-tracker-session',
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
}

// compare via hashes so length differences don't leak and timing stays constant
export function safeEqual(a: string, b: string) {
  const hash = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(hash(a), hash(b))
}
