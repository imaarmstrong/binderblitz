import { H3Event, setCookie } from 'h3'

export default async function (event: H3Event) {
  const isProd = process.env.NODE_ENV === 'production'

  // Clear the auth cookie
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 0,
  })

  return { ok: true, message: 'Logged out' }
}
