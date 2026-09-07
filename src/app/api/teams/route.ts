import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const teams = await db.team.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, teams })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, id, name, kind, cep, createdBy, member } = await req.json()

    if (action === 'addMember' && id && member) {
      const team = await db.team.findUnique({ where: { id } })
      if (!team) return NextResponse.json({ ok: false, error: 'Equipe não encontrada' }, { status: 404 })
      const members: string[] = JSON.parse(team.members || '[]')
      if (!members.includes(member)) members.push(member)
      const updated = await db.team.update({ where: { id }, data: { members: JSON.stringify(members) } })
      await db.user.update({ where: { baoId: member }, data: { org: team.name } }).catch(() => null)
      return NextResponse.json({ ok: true, team: updated })
    }

    if (action === 'removeMember' && id && member) {
      const team = await db.team.findUnique({ where: { id } })
      if (!team) return NextResponse.json({ ok: false, error: 'Equipe não encontrada' }, { status: 404 })
      const members: string[] = JSON.parse(team.members || '[]').filter((m: string) => m !== member)
      const updated = await db.team.update({ where: { id }, data: { members: JSON.stringify(members) } })
      return NextResponse.json({ ok: true, team: updated })
    }

    if (name && createdBy) {
      const team = await db.team.create({ data: { name, kind: kind || 'POLO', cep: cep || '', createdBy } })
      return NextResponse.json({ ok: true, team })
    }
    return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
