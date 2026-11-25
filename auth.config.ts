import type { NextAuthConfig } from 'next-auth'

export function isPrivatePath(path: string) {
  return /^\/(?:account|admin|checkout)(?:\/|$)/.test(path)
}

export default {
  providers: [],
  callbacks: {
    authorized({ request, auth }) {
      return !isPrivatePath(request.nextUrl.pathname) || Boolean(auth)
    },
  },
} satisfies NextAuthConfig
