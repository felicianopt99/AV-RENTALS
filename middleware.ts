import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple language middleware: ensure app-language cookie is set to 'en' or 'pt'
export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const cookie = req.cookies.get('app-language')?.value
  if (cookie === 'en' || cookie === 'pt') {
    return res
  }

  // Derive from Accept-Language
  const accept = req.headers.get('accept-language') || ''
  const lower = accept.toLowerCase()
  const lang = lower.startsWith('pt') ? 'pt' : 'en'

  // Set cookie for 1 year
  res.cookies.set('app-language', lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:'
  })

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons?|manifest\.json).*)'],
}
