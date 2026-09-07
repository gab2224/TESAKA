import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function threadKey(a: string, b: string) {
  return JSON.stringify([a, b].sort())
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const baoId = searchParams.get('baoId')
  if (!baoId) return NextResponse.json({ ok: false, error: 'baoId obrigatório' }, { status: 400 })
  try {
    const all = await db.chatThread.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    const mine = all.filter(t => {
      if (t.kind === 'notas') return t.members.includes(baoId) && t.members === JSON.stringify([baoId, baoId])
      const m: string[] = JSON.parse(t.members)
      return m.includes(baoId)
    })
    const withMsgs = [] as Record<string, unknown>[]
    for (const t of mine) {
      const msgs = await db.chatMessage.findMany({ where: { threadId: t.id }, orderBy: { createdAt: 'asc' } })
      const members: string[] = JSON.parse(t.members)
      withMsgs.push({ ...t, other: t.kind === 'notas' ? baoId : members.find(m => m !== baoId) || baoId, messages: msgs })
    }
    return NextResponse.json({ ok: true, threads: withMsgs })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action as string

    // Convidar: usuário A informa o ID público de B → notificação de convite
    if (action === 'invite') {
      const { from, to } = body
      const target = await db.user.findFirst({ where: { baoId: (to || '').trim() } })
      if (!target) return NextResponse.json({ ok: false, error: 'ID público não encontrado' }, { status: 404 })
      if (target.baoId === from) return NextResponse.json({ ok: false, error: 'Este é o seu próprio ID' }, { status: 400 })
      const existing = await db.chatThread.findFirst({ where: { members: threadKey(from, target.baoId), kind: 'chat' } })
      if (existing) return NextResponse.json({ ok: false, error: 'Já existe uma conversa com este usuário' }, { status: 409 })
      await db.notification.create({
        data: { toBaoId: target.baoId, fromBaoId: from, type: 'CARTA_INVITE', title: 'Convite de conversa — CARTA', body: `O usuário ${from} quer iniciar uma conversa com você. Aceite para começar a conversar.` },
      })
      return NextResponse.json({ ok: true, message: `Convite enviado para ${target.baoId}` })
    }

    // Aceitar convite → cria thread
    if (action === 'accept') {
      const { from, notificationId } = body
      const notif = await db.notification.findUnique({ where: { id: notificationId } })
      if (!notif) return NextResponse.json({ ok: false, error: 'Convite não encontrado' }, { status: 404 })
      const key = threadKey(notif.fromBaoId, from)
      const existing = await db.chatThread.findFirst({ where: { members: key, kind: 'chat' } })
      if (!existing) {
        await db.chatThread.create({ data: { members: key, kind: 'chat' } })
      }
      await db.notification.create({
        data: { toBaoId: notif.fromBaoId, fromBaoId: from, type: 'CARTA_ACCEPT', title: 'Convite aceito — CARTA', body: `${from} aceitou sua conversa. Digam olá!` },
      })
      await db.notification.update({ where: { id: notificationId }, data: { read: true } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'reject') {
      await db.notification.update({ where: { id: body.notificationId }, data: { read: true } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'send') {
      const { threadId, from, text } = body
      if (!text?.trim()) return NextResponse.json({ ok: false, error: 'Mensagem vazia' }, { status: 400 })
      const msg = await db.chatMessage.create({ data: { threadId, fromBaoId: from, body: text } })
      return NextResponse.json({ ok: true, msg })
    }

    // Notas: sessão de anotações pessoal (só o próprio usuário)
    if (action === 'notas') {
      const { from, text, deleteId } = body
      if (deleteId) {
        await db.chatMessage.delete({ where: { id: deleteId } })
        return NextResponse.json({ ok: true })
      }
      if (!text?.trim()) return NextResponse.json({ ok: false, error: 'Nota vazia' }, { status: 400 })
      let thread = await db.chatThread.findFirst({ where: { members: JSON.stringify([from, from]), kind: 'notas' } })
      if (!thread) thread = await db.chatThread.create({ data: { members: JSON.stringify([from, from]), kind: 'notas' } })
      const msg = await db.chatMessage.create({ data: { threadId: thread.id, fromBaoId: from, body: text } })
      return NextResponse.json({ ok: true, msg })
    }

    return NextResponse.json({ ok: false, error: 'Ação desconhecida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
