import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const baoId = searchParams.get('baoId')
  if (!baoId) return NextResponse.json({ ok: false, error: 'baoId obrigatório' }, { status: 400 })
  try {
    const items = await db.notification.findMany({ where: { toBaoId: baoId }, orderBy: { createdAt: 'desc' }, take: 60 })
    return NextResponse.json({ ok: true, items })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { toBaoId, fromBaoId, type, title, body } = await req.json()
    if (!toBaoId || !title) return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 })
    const item = await db.notification.create({
      data: { toBaoId, fromBaoId: fromBaoId || 'SISTEMA', type: type || 'SISTEMA', title, body: body || '' },
    })
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, readAllFor } = await req.json()
    if (id) {
      await db.notification.update({ where: { id }, data: { read: true } })
    } else if (readAllFor) {
      await db.notification.updateMany({ where: { toBaoId: readAllFor }, data: { read: true } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
