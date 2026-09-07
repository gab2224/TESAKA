import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO = [
  { email: 'advencer@qgroup.zip', password: '123456', baoId: 'ADVENCER.QGROUP', name: 'Advancer Geral', role: 'ADVENCER', kcoins: 50000, org: 'QGroup Matriz' },
  { email: 'subadvancer@qgroup.zip', password: '123456', baoId: 'SUBADVANCER.QGROUP', name: 'SubAdvancer QGroup', role: 'SUBADVANCER', kcoins: 20000, org: 'QGroup Matriz' },
  { email: 'orther@qgroup.zip', password: '123456', baoId: 'ORTHER.QGROUP', name: 'Orther Advancer', role: 'ORTHER_ADVANCER', kcoins: 8000, org: 'QGroup Matriz' },
  { email: 'prof.ana@qgroup.zip', password: '123456', baoId: 'PROF ANA.TezSchool', name: 'Ana Professora', role: 'RESPONSAVEL', kcoins: 1200, org: 'Escola Tesaka' },
  { email: 'aluno.lucas@qgroup.zip', password: '123456', baoId: 'LUCAS ALUNO.TezSchool', name: 'Lucas Aluno', role: 'FUNCIONARIO', kcoins: 300, org: 'Turma A' },
  { email: 'aluno.bia@qgroup.zip', password: '123456', baoId: 'BIA ALUNA.TezSchool', name: 'Bia Aluna', role: 'FUNCIONARIO', kcoins: 300, org: 'Turma A' },
  { email: 'carla@qgroup.zip', password: '123456', baoId: 'CARLA LOBA.mygroup', name: 'Carla Lobaite', role: 'FUNCIONARIO', kcoins: 500, org: 'QGroup Polo Centro' },
  { email: 'maria@bao.id', password: '123456', baoId: 'MARIA.7PLAY', name: 'Maria Silva', role: 'USUAL', kcoins: 750, org: '' },
]

async function seed() {
  for (const u of DEMO) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, bio: 'Conta demonstração TESAKA' },
    })
  }
  const team = await db.team.findFirst({ where: { name: 'QGroup Polo Centro' } })
  if (!team) {
    await db.team.create({ data: { name: 'QGroup Polo Centro', kind: 'POLO', cep: '01001-000', createdBy: 'SUBADVANCER.QGROUP', members: JSON.stringify(['CARLA LOBA.mygroup']) } })
    await db.team.create({ data: { name: 'Escola Tesaka — Turma A', kind: 'ESCOLA', cep: '', createdBy: 'PROF ANA.TezSchool', members: JSON.stringify(['LUCAS ALUNO.TezSchool', 'BIA ALUNA.TezSchool']) } })
  }
}

export async function POST() {
  try {
    await seed()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
