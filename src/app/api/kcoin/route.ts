import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const baoId = searchParams.get('baoId')
  if (!baoId) return NextResponse.json({ ok: false, error: 'baoId obrigatório' }, { status: 400 })
  try {
    const sent = await db.kcoinTx.findMany({ where: { fromBaoId: baoId }, orderBy: { createdAt: 'desc' } })
    const received = await db.kcoinTx.findMany({ where: { toBaoId: baoId }, orderBy: { createdAt: 'desc' } })
    const user = await db.user.findUnique({ where: { baoId } })
    return NextResponse.json({ ok: true, sent, received, balance: user?.kcoins ?? 0 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { from, to, amount, note } = await req.json()
    const amt = parseInt(amount)
    if (!from || !to || !amt || amt <= 0) return NextResponse.json({ ok: false, error: 'Dados inválidos' }, { status: 400 })

    const sender = await db.user.findUnique({ where: { baoId: from } })
    if (!sender) return NextResponse.json({ ok: false, error: 'Remetente inexistente' }, { status: 404 })
    const receiver = await db.user.findFirst({ where: { baoId: to.trim() } })
    const dest = receiver
    if (!dest) return NextResponse.json({ ok: false, error: `Conta destino "${to}" não encontrada (contas antigas e novas são válidas)` }, { status: 404 })
    if (dest.baoId === sender.baoId) return NextResponse.json({ ok: false, error: 'Não é possível enviar para você mesmo' }, { status: 400 })
    if (sender.kcoins < amt) return NextResponse.json({ ok: false, error: 'Saldo KCOIN insuficiente' }, { status: 400 })

    const tx = await db.kcoinTx.create({ data: { fromBaoId: sender.baoId, toBaoId: dest.baoId, amount: amt, note: note || '' } })
    await db.user.update({ where: { baoId: sender.baoId }, data: { kcoins: { decrement: amt } } })
    await db.user.update({ where: { baoId: dest.baoId }, data: { kcoins: { increment: amt } } })
    await db.notification.create({
      data: { toBaoId: dest.baoId, fromBaoId: sender.baoId, type: 'KCOIN', title: `Você recebeu ${amt} KCoins`, body: `${sender.name} (${sender.baoId}) enviou ${amt} KCoins${note ? ` — "${note}"` : ''}` },
    })
    return NextResponse.json({ ok: true, tx })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
