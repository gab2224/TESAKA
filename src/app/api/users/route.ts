import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const baoId = searchParams.get('baoId')
  const q = searchParams.get('q')
  try {
    if (baoId) {
      const user = await db.user.findUnique({ where: { baoId } })
      if (!user) return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
      return NextResponse.json({ ok: true, user: safe(user) })
    }
    if (q !== null) {
      const users = await db.user.findMany({
        where: { baoId: { contains: q.toUpperCase() } },
        take: 20,
      })
      return NextResponse.json({ ok: true, users: users.map(safe) })
    }
    const users = await db.user.findMany({ take: 100 })
    return NextResponse.json({ ok: true, users: users.map(safe) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const baoId = body.baoId as string
    if (!baoId) return NextResponse.json({ ok: false, error: 'baoId obrigatório' }, { status: 400 })
    const data: Record<string, unknown> = {}
    for (const k of ['language', 'faceRegistered', 'faceHash', 'docVerified', 'docType', 'docNumber', 'estrelados', 'org', 'bio', 'name', 'kcoins']) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    const user = await db.user.update({ where: { baoId }, data })
    return NextResponse.json({ ok: true, user: safe(user) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

function safe(u: Record<string, unknown>) {
  const { password: _p, ...rest } = u
  return rest
}
