import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action as string

    if (action === 'register') {
      const { email, password, name } = body
      if (!email || !password || !name) return NextResponse.json({ ok: false, error: 'Preencha todos os campos' }, { status: 400 })
      const existsEmail = await db.user.findUnique({ where: { email } })
      if (existsEmail) return NextResponse.json({ ok: false, error: 'E-mail já cadastrado' }, { status: 409 })

      // BaoID público gerado automaticamente — IDs com sufixo especial (.TezSchool / mygroup / QGROUP)
      // só podem ser criados pelo ADM (SubAdvancer) no LobaiteOS (OBS 2 / OBS 3).
      const base = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim().slice(0, 14) || 'USER'
      let baoId = `${base}.${Math.floor(1000 + Math.random() * 9000)}.7PLAY`
      let guard = 0
      while (await db.user.findUnique({ where: { baoId } }) && guard < 20) {
        baoId = `${base}.${Math.floor(1000 + Math.random() * 9000)}.7PLAY`
        guard++
      }
      const user = await db.user.create({
        data: { email, password, name, baoId, role: 'USUAL', kcoins: 250, bio: 'Novo usuário BaoID' },
      })
      await db.notification.create({
        data: { toBaoId: baoId, fromBaoId: 'SISTEMA', type: 'SISTEMA', title: 'Bem-vindo ao BaoID!', body: `Sua conta ${baoId} foi criada. Você recebeu 250 KCoins de boas-vindas.` },
      })
      return NextResponse.json({ ok: true, user: safeUser(user) })
    }

    if (action === 'login') {
      const { id, password } = body
      if (!id || !password) return NextResponse.json({ ok: false, error: 'Informe credenciais' }, { status: 400 })
      const user = await db.user.findFirst({
        where: { OR: [{ email: id.toLowerCase().trim() }, { baoId: id.trim() }] },
      })
      if (!user || user.password !== password) return NextResponse.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 })
      return NextResponse.json({ ok: true, user: safeUser(user) })
    }

    return NextResponse.json({ ok: false, error: 'Ação desconhecida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

function safeUser(u: Record<string, unknown>) {
  const { password: _p, ...rest } = u
  return rest
}
