import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/userStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string
      password?: string
      name?: string
    }

    const email = body.email?.trim()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }

    const result = await registerUser({ email, password, name: body.name })

    if (!result.ok) {
      const status =
        result.error === 'EMAIL_EXISTS' ? 409 : result.error === 'WEAK_PASSWORD' ? 400 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({
      ok: true,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
    })
  } catch (err) {
    console.error('[auth/register]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
