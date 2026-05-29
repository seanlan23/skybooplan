import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { assertAuthEnvConfigured } from '@/lib/authConfig'
import { ensureAuthEnvDefaults } from '@/lib/safeUrl'
import { verifyUserCredentials } from '@/lib/userStore'

ensureAuthEnvDefaults()

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
        // callbackUrl gradi NextAuth iz hosta zahteve (applyRequestOriginToAuthEnv v route handlerju).
      })
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manjkata — Google prijava je onemogočena.'
    )
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    })
  )

  return providers
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      if (account?.provider === 'google') {
        token.provider = 'google'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = (token.picture as string | undefined) ?? session.user.image
      }
      return session
    },
  },
}

/** Server-side session (API routes, server components). */
export function getAuthSession() {
  return getServerSession(authOptions)
}
