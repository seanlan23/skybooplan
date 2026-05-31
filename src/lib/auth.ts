import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { assertAuthEnvConfigured } from '@/lib/authConfig'
import { verifyUserCredentials } from '@/lib/userStore'

export { assertAuthEnvConfigured, getAuthConfigIssues, isAuthConfigured } from '@/lib/authConfig'

function buildProviders(): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = []

  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

  if (googleClientId && googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        authorization: {
          params: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      })
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manjkata.')
  }

  providers.push(
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim()
        const password = credentials?.password
        if (!email || !password) return null
        const user = await verifyUserCredentials(email, password)
        if (!user) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    })
  )

  return providers
}

const useSecureCookies = process.env.NODE_ENV === 'production'
const cookiePrefix = useSecureCookies ? '__Secure-' : ''

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/', error: '/' },
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: { sameSite: 'lax', path: '/', secure: useSecureCookies },
    },
    csrfToken: {
      name: `${useSecureCookies ? '__Host-' : ''}next-auth.csrf-token`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies, maxAge: 900 },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies, maxAge: 900 },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      if (account?.provider) token.provider = account.provider
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = (token.email as string) ?? session.user.email
        session.user.name = (token.name as string) ?? session.user.name
        session.user.image = (token.picture as string | undefined) ?? session.user.image
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl)
        const base = new URL(baseUrl)
        if (target.origin === base.origin) return target.toString()
        if (target.pathname.startsWith('/')) return `${base.origin}${target.pathname}${target.search}`
        return baseUrl
      } catch {
        return baseUrl
      }
    },
  },
}

export function getAuthSession() {
  if (process.env.NODE_ENV !== 'production') assertAuthEnvConfigured()
  return getServerSession(authOptions)
}
