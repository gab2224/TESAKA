'use client'

import { useStore } from '@/lib/store'
import { Panel, Btn, Field, InputText, ScreenHeader, Modal, Tag, SubNav, Empty } from '@/components/tesaka/ui-kit'
import { MessageCircle, StickyNote, Plus, Send, FolderOpen, CalendarPlus, BellRing, ShieldCheck, FileUp, MonitorSmartphone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Thread = { id: string; members: string; kind: string; other: string; messages: { id: string; fromBaoId: string; body: string; createdAt: string }[] }

/* ================= CARTA ================= */
export function CartaApp() {
  const { session, toast, t } = useStore()
  const [threads, setThreads] = useState<Thread[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [tab, setTab] = useState('conversas')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteId, setInviteId] = useState('')
  const [draft, setDraft] = useState('')
  const [noteText, setNoteText] = useState('')

  const load = useCallback(async () => {
    if (!session) return
    const r = await fetch(`/api/chat?baoId=${encodeURIComponent(session.baoId)}`)
    const j = await r.json()
    if (j.ok) setThreads(j.threads)
  }, [session])

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv) }, [load])

  if (!session) return <Empty text="Faça login para usar o CARTA." />

  const chats = threads.filter(th => th.kind === 'chat')
  const notas = threads.find(th => th.kind === 'notas')
  const current = threads.find(th => th.id === active)

  const send = async () => {
    if (!draft.trim() || !current) return
    await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', threadId: current.id, from: session.baoId, text: draft }) })
    setDraft(''); load()
  }

  return (
    <div>
      <ScreenHeader title="CARTA" subtitle="Mensagens por ID público" icon={<MessageCircle className="h-5 w-5 text-[#B6FF2E]" />} />
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <Btn variant="accent" className="w-full" onClick={() => setInviteOpen(true)} data-testid="nova-conversa"><Plus className="mr-1 h-4 w-4" /> Nova Conversa</Btn>
          <Panel className="max-h-72 overflow-y-auto">
            <button className={`flex w-full items-center gap-2 border-b border-white/5 p-3 text-left text-sm hover:bg-white/5 ${tab === 'notas' ? 'bg-white/5' : ''}`} onClick={() => { setTab('notas'); setActive(notas?.id || null) }} data-testid="notas-btn">
              <StickyNote className="h-4 w-4 text-[#B6FF2E]" /> Notas
            </button>
            {chats.length === 0 && <p className="p-3 text-xs text-white/40">Nenhuma conversa ainda. Use “Nova Conversa” e informe o ID público de alguém.</p>}
            {chats.map(th => (
              <button key={th.id} onClick={() => { setTab('conversas'); setActive(th.id) }}
                className={`flex w-full items-center gap-2 border-b border-white/5 p-3 text-left text-sm hover:bg-white/5 ${active === th.id && tab === 'conversas' ? 'bg-white/5' : ''}`}>
                <MessageCircle className="h-4 w-4 shrink-0 text-white/40" />
                <span className="truncate">{th.other}</span>
              </button>
            ))}
          </Panel>
          {/* ID público do usuário no rodapé do menu (requisito CARTA) */}
          <Panel className="p-3 text-center" data-testid="carta-my-id">
            <p className="text-[10px] uppercase tracking-wider text-white/40">{t('yourBaoId')}</p>
            <p className="mt-0.5 break-all font-mono text-sm font-bold text-[#B6FF2E]">{session.baoId}</p>
          </Panel>
        </div>

        <Panel className="flex min-h-96 flex-col">
          {tab === 'notas' ? (
            <>
              <div className="border-b border-white/10 p-3 text-sm font-bold">📝 Notas — só você vê</div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {!notas && <Empty text="Nenhuma nota ainda." />}
                {notas?.messages.map(m => (
                  <div key={m.id} className="group flex items-start justify-between gap-2 rounded-lg bg-white/5 p-3 text-sm">
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <button className="shrink-0 text-[11px] text-white/30 hover:text-red-400" onClick={async () => {
                      await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'notas', from: session.baoId, deleteId: m.id }) })
                      load()
                    }}>excluir</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-white/10 p-3">
                <InputText placeholder="Nova nota…" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && noteText.trim() && (async () => { await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'notas', from: session.baoId, text: noteText }) }); setNoteText(''); load() })()} data-testid="note-input" />
                <Btn variant="accent" onClick={async () => {
                  if (!noteText.trim()) return
                  await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'notas', from: session.baoId, text: noteText }) })
                  setNoteText(''); load()
                }} data-testid="note-save"><Send className="h-4 w-4" /></Btn>
              </div>
            </>
          ) : !current ? (
            <div className="flex flex-1 items-center justify-center"><Empty text="Selecione uma conversa ou crie uma nova." /></div>
          ) : (
            <>
              <div className="border-b border-white/10 p-3 text-sm font-bold">💬 {current.other}</div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {current.messages.length === 0 && <Empty text="Diga olá! 👋" />}
                {current.messages.map(m => (
                  <div key={m.id} className={`max-w-[80%] rounded-xl p-2.5 text-sm ${m.fromBaoId === session.baoId ? 'ml-auto bg-[#B6FF2E] text-black' : 'bg-white/8 border border-white/10'}`} data-testid="carta-msg">
                    {m.body}
                    <p className={`mt-1 text-[10px] ${m.fromBaoId === session.baoId ? 'text-black/50' : 'text-white/35'}`}>{new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-white/10 p-3">
                <InputText placeholder="Mensagem…" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} data-testid="carta-input" />
                <Btn variant="accent" onClick={send} data-testid="carta-send"><Send className="h-4 w-4" /></Btn>
              </div>
            </>
          )}
        </Panel>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Nova Conversa por ID público">
        <div className="space-y-3">
          <Field label="ID público do destinatário">
            <InputText placeholder="ex: MARIA.7PLAY / CARLA LOBA.mygroup" value={inviteId} onChange={e => setInviteId(e.target.value)} data-testid="invite-input" />
          </Field>
          <p className="text-[11px] text-white/40">Um convite será enviado. Quando a pessoa aceitar (sino de notificações), a conversa é criada.</p>
          <Btn variant="accent" className="w-full" onClick={async () => {
            const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'invite', from: session.baoId, to: inviteId }) })
            const j = await r.json()
            toast('CARTA', j.ok ? j.message : j.error, j.ok ? 'ok' : 'err')
            if (j.ok) { setInviteOpen(false); setInviteId('') }
          }} data-testid="invite-send">Enviar convite</Btn>
        </div>
      </Modal>
    </div>
  )
}

/* ================= LOBAITEOS (somente desktop) ================= */
type Arquivo = { id: string; name: string; from: string; kind: 'arquivo' | 'relatorio'; date: number }

export function LobaiteOSApp() {
  const { session } = useStore()
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  if (!isDesktop) {
    return (
      <div>
        <ScreenHeader title="LobaiteOS" icon={<MonitorSmartphone className="h-5 w-5 text-[#B6FF2E]" />} />
        <Panel className="p-10 text-center"><p className="text-white/60">🖥️ O LobaiteOS está disponível <b>somente no desktop</b>.</p></Panel>
      </div>
    )
  }
  if (!session) return <Empty text="Faça login para acessar o LobaiteOS." />
  return <LobaiteOSDesktop baoId={session.baoId} role={session.role} />
}

function LobaiteOSDesktop({ baoId, role }: { baoId: string; role: string }) {
  const { toast } = useStore()
  const [tab, setTab] = useState('arquivos')
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [eventos, setEventos] = useState<{ id: string; title: string; date: string; createdBy: string }[]>([])
  const [equipes, setEquipes] = useState<{ id: string; name: string; kind: string; cep: string; createdBy: string; members: string }[]>([])
  const [users, setUsers] = useState<{ baoId: string; name: string; role: string; email: string; org?: string | null }[]>([])

  const isResponsavel = role === 'RESPONSAVEL' || role === 'ADVENCER' || role === 'SUBADVANCER' || role === 'ORTHER_ADVANCER'
  const isAdmin = role === 'SUBADVANCER' || role === 'ADVENCER'

  const loadAll = useCallback(async () => {
    const r = await fetch('/api/teams'); const j = await r.json()
    if (j.ok) setEquipes(j.teams)
    const u = await fetch('/api/users'); const ju = await u.json()
    if (ju.ok) setUsers(ju.users)
  }, [])
  useEffect(() => { loadAll() }, [loadAll])

  const teamsList: { id: string; name: string; kind: string; cep: string; createdBy: string; members: string }[] = equipes

  return (
    <div>
      <ScreenHeader title="LobaiteOS" subtitle={`Sistema de gestão QGroup • ${baoId} • ${role}`} icon={<ShieldCheck className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tab} onChange={setTab} tabs={[
        { id: 'arquivos', label: 'Meus Arquivos' },
        ...(isResponsavel ? [{ id: 'eventos', label: 'Eventos' }, { id: 'notificacao', label: 'Notificação' }] : [{ id: 'eventos', label: 'Eventos' }]),
        { id: 'equipes', label: 'Equipes / Polos' },
        ...(isAdmin ? [{ id: 'adm', label: 'ADM' }] : []),
      ]} />

      {tab === 'arquivos' && (
        <Panel className="p-5" data-testid="loba-arquivos">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold"><FolderOpen className="h-4 w-4 text-[#B6FF2E]" /> Meus Arquivos</h3>
            <label className="cursor-pointer rounded-lg bg-[#B6FF2E] px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#a8f01f]">
              <FileUp className="mr-1 inline h-4 w-4" /> Enviar arquivo
              <input type="file" multiple className="hidden" onChange={e => {
                const fs = Array.from(e.target.files || [])
                if (!fs.length) return
                setArquivos(a => [...a, ...fs.map(f => ({ id: `a${Date.now()}${f.name}`, name: f.name, from: baoId, kind: 'arquivo' as const, date: Date.now() }))])
                toast('LobaiteOS', `${fs.length} arquivo(s) enviados — visíveis para os usuários RESPONSAVEL.`, 'ok')
              }} data-testid="loba-upload" />
            </label>
          </div>
          <p className="mb-3 text-xs text-white/40">Todos os arquivos enviados são encaminhados aos usuários do tipo <b>RESPONSAVEL</b>.</p>
          {arquivos.length === 0 && <Empty text="Nenhum arquivo. Relatórios da Notificação também aparecem aqui." />}
          {arquivos.map(a => (
            <div key={a.id} className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
              <span className="truncate">{a.kind === 'relatorio' ? '📋' : '📄'} {a.name}</span>
              <span className="text-[11px] text-white/40">de {a.from} • {new Date(a.date).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </Panel>
      )}

      {tab === 'eventos' && (
        <Panel className="p-5" data-testid="loba-eventos">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold"><CalendarPlus className="h-4 w-4 text-[#B6FF2E]" /> Eventos da equipe</h3>
          </div>
          {isResponsavel && (
            <EventoForm onCreate={(title, date) => {
              setEventos(ev => [...ev, { id: `e${Date.now()}`, title, date, createdBy: baoId }])
              toast('LobaiteOS', 'Evento criado — visível para todos os funcionários!', 'ok')
            }} />
          )}
          {eventos.length === 0 && <Empty text="Nenhum evento criado." />}
          {eventos.map(ev => (
            <div key={ev.id} className="mb-2 rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
              <p className="font-bold">📌 {ev.title}</p>
              <p className="text-[11px] text-white/40">{ev.date} • por {ev.createdBy}</p>
            </div>
          ))}
        </Panel>
      )}

      {tab === 'notificacao' && isResponsavel && (
        <NotificacaoTab baoId={baoId} onRelatorio={(name) => setArquivos(a => [...a, { id: `r${Date.now()}`, name, from: baoId, kind: 'relatorio', date: Date.now() }])} />
      )}

      {tab === 'equipes' && (
        <Panel className="p-5">
          <h3 className="mb-3 font-bold">Equipes, Polos e Salas</h3>
          {teamsList.length === 0 && <Empty text="Nenhuma equipe. O SubAdvancer cria polos no ADM." />}
          {teamsList.map(t => {
            let members: string[] = []
            try { members = JSON.parse(t.members || '[]') } catch { }
            return (
              <div key={t.id} className="mb-2 rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{t.name}</p>
                  <Tag>{t.kind}{t.cep ? ` • CEP ${t.cep}` : ''}</Tag>
                </div>
                <p className="mt-1 text-[11px] text-white/45">Criado por {t.createdBy} • {members.length} membro(s)</p>
                {members.length > 0 && <p className="mt-1 text-xs text-white/60">{members.join(', ')}</p>}
              </div>
            )
          })}
        </Panel>
      )}

      {tab === 'adm' && isAdmin && (
        <AdmTab baoId={baoId} role={role} users={users} teams={teamsList} reload={loadAll} />
      )}
    </div>
  )
}

function EventoForm({ onCreate }: { onCreate: (title: string, date: string) => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_160px_auto]">
      <InputText placeholder="Nome do evento" value={title} onChange={e => setTitle(e.target.value)} />
      <InputText type="date" value={date} onChange={e => setDate(e.target.value)} />
      <Btn variant="accent" onClick={() => { if (title.trim()) { onCreate(title, date || 'sem data'); setTitle(''); setDate('') } }} data-testid="evento-create">Criar evento</Btn>
    </div>
  )
}

function NotificacaoTab({ baoId, onRelatorio }: { baoId: string; onRelatorio: (name: string) => void }) {
  const { toast } = useStore()
  const [msg, setMsg] = useState('')
  const [relName, setRelName] = useState('')
  const [to, setTo] = useState('TODOS')
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><BellRing className="h-4 w-4 text-[#B6FF2E]" /> Enviar mensagem aos funcionários</h3>
        <Field label="Destinatário">
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm text-white">
            <option value="TODOS">TODOS os funcionários</option>
            <option value="CARLA LOBA.mygroup">CARLA LOBA.mygroup</option>
          </select>
        </Field>
        <div className="mt-3">
          <Field label="Mensagem"><textarea rows={3} value={msg} onChange={e => setMsg(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm text-white" /></Field>
        </div>
        <Btn variant="accent" className="mt-3 w-full" onClick={async () => {
          if (!msg.trim()) return
          const targets = to === 'TODOS'
            ? ['CARLA LOBA.mygroup', 'LUCAS ALUNO.TezSchool', 'BIA ALUNA.TezSchool']
            : [to]
          for (const tg of targets) {
            await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toBaoId: tg, fromBaoId: baoId, type: 'LOBAITE', title: 'Mensagem do LobaiteOS', body: msg }) })
          }
          setMsg('')
          toast('LobaiteOS', `Mensagem enviada para ${targets.length} funcionário(s) (sino 🔔).`, 'ok')
        }} data-testid="loba-send-msg">Enviar</Btn>
      </Panel>
      <Panel className="p-5">
        <h3 className="mb-3 font-bold">Criar novo Relatório</h3>
        <p className="mb-3 text-xs text-white/40">O relatório é entregue no “Meus Arquivos” (dos funcionários e o seu) e exibido na mesma tela.</p>
        <Field label="Nome do relatório"><InputText placeholder="Relatório mensal — Polo Centro" value={relName} onChange={e => setRelName(e.target.value)} /></Field>
        <Btn variant="accent" className="mt-3 w-full" onClick={() => {
          if (!relName.trim()) return
          onRelatorio(relName)
          toast('LobaiteOS', `Relatório "${relName}" criado e entregue em Meus Arquivos.`, 'ok')
          setRelName('')
        }} data-testid="loba-relatorio">Gerar relatório</Btn>
      </Panel>
    </div>
  )
}

function AdmTab({ baoId, role, users, teams, reload }: { baoId: string; role: string; users: { baoId: string; name: string; role: string; email: string; org?: string | null }[]; teams: { id: string; name: string; kind: string; cep: string; members: string }[]; reload: () => void }) {
  const { toast } = useStore()
  const [sec, setSec] = useState<'criar' | 'equipes' | 'portal' | 'vagas' | 'pontilhismo'>('criar')
  const [nu, setNu] = useState({ name: '', email: '', password: '123456', kind: 'RESPONSAVEL' })
  const [team, setTeam] = useState({ name: '', cep: '', kind: 'POLO' })
  const [portal, setPortal] = useState({ kind: 'CASOS', title: '', body: '' })
  const [vaga, setVaga] = useState({ title: '', area: '', polo: '' })
  const [polo, setPolo] = useState({ name: '', cep: '' })

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {([['criar', 'Criar usuários'], ['equipes', 'Equipes / Polos (CEP)'], ['portal', 'Portal da Transparência'], ['vagas', 'Vagas QServer'], ['pontilhismo', 'Polos Pontilhismo']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSec(id)} className={`rounded-lg px-3 py-1.5 text-xs ${sec === id ? 'bg-[#B6FF2E] font-bold text-black' : 'bg-white/5 text-white/70'}`}>{label}</button>
        ))}
      </div>

      {sec === 'criar' && (
        <Panel className="p-5" data-testid="adm-users">
          <h3 className="mb-1 font-bold">Criar usuários com e-mail</h3>
          <p className="mb-3 text-xs text-white/40">RESPONSAVEL/FUNCIONARIO ganham IDs terminados em <b>.TezSchool</b> (escola) ou <b>.mygroup</b> (QGroup). OBS 2: só o SubAdvancer cria IDs especiais.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Nome"><InputText value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} /></Field>
            <Field label="E-mail institucional"><InputText value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} placeholder="novo@qgroup.zip" /></Field>
            <Field label="Senha"><InputText value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} /></Field>
            <Field label="Tipo">
              <select value={nu.kind} onChange={e => setNu({ ...nu, kind: e.target.value })} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm">
                <option>RESPONSAVEL</option><option>FUNCIONARIO</option>
              </select>
            </Field>
          </div>
          <Btn variant="accent" className="mt-3" onClick={async () => {
            if (!nu.name || !nu.email) { toast('ADM', 'Preencha nome e e-mail.', 'err'); return }
            const suffix = nu.email.includes('school') || nu.email.includes('escola') ? 'TezSchool' : 'mygroup'
            const baoIdNew = `${nu.name.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()}.${suffix}`
            const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', email: nu.email, password: nu.password, name: nu.name }) })
            const j = await r.json()
            if (!j.ok) { toast('ADM', j.error, 'err'); return }
            await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baoId: j.user.baoId, role: nu.kind }) })
            toast('ADM', `Usuário criado: ${baoIdNew} (${nu.kind}) — recomende atualizar o ID para ${baoIdNew} no perfil.`, 'ok')
            reload()
          }} data-testid="adm-create-user">Criar usuário</Btn>
          <h4 className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Todos os usuários ({users.length})</h4>
          <div className="max-h-64 overflow-y-auto">
            {users.map(u => (
              <div key={u.baoId} className="mb-1 flex items-center justify-between rounded border border-white/10 bg-black/20 p-2 text-xs">
                <span className="truncate"><b>{u.name}</b> — {u.baoId}</span>
                <Tag>{u.role}</Tag>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {sec === 'equipes' && (
        <Panel className="p-5">
          <h3 className="mb-3 font-bold">Criar QGroup Polo por CEP</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Nome do polo"><InputText value={team.name} onChange={e => setTeam({ ...team, name: e.target.value })} /></Field>
            <Field label="CEP"><InputText placeholder="01001-000" value={team.cep} onChange={e => setTeam({ ...team, cep: e.target.value })} /></Field>
            <Field label="Tipo">
              <select value={team.kind} onChange={e => setTeam({ ...team, kind: e.target.value })} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm">
                <option>POLO</option><option>EQUIPE</option><option>SALA</option><option>ESCOLA</option>
              </select>
            </Field>
          </div>
          <Btn variant="accent" className="mt-3" onClick={async () => {
            if (!team.name) return
            await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...team, createdBy: baoId }) })
            toast('ADM', `Equipe "${team.name}" criada (CEP ${team.cep || '—'}).`, 'ok')
            setTeam({ name: '', cep: '', kind: 'POLO' }); reload()
          }} data-testid="adm-create-team">Criar</Btn>
        </Panel>
      )}

      {sec === 'portal' && (
        <Panel className="p-5">
          <h3 className="mb-3 font-bold">Adicionar ao Portal da Transparência</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Tipo">
              <select value={portal.kind} onChange={e => setPortal({ ...portal, kind: e.target.value })} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm">
                <option>USUARIOS</option><option>CASOS</option><option>POLITICOS</option>
              </select>
            </Field>
            <Field label="Título"><InputText value={portal.title} onChange={e => setPortal({ ...portal, title: e.target.value })} /></Field>
          </div>
          <div className="mt-2"><Field label="Descrição"><textarea rows={3} value={portal.body} onChange={e => setPortal({ ...portal, body: e.target.value })} className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm" /></Field></div>
          <Btn variant="accent" className="mt-3" onClick={() => {
            if (!portal.title) return
            useStore.getState().patch({ portal: [{ id: `pt${Date.now()}`, kind: portal.kind as 'USUARIOS' | 'CASOS' | 'POLITICOS', title: portal.title, body: portal.body, createdBy: baoId, createdAt: Date.now() }, ...useStore.getState().portal] })
            toast('ADM', 'Registro adicionado ao Portal!', 'ok')
            setPortal({ kind: 'CASOS', title: '', body: '' })
          }} data-testid="adm-portal">Publicar no portal</Btn>
        </Panel>
      )}

      {sec === 'vagas' && (
        <Panel className="p-5">
          <h3 className="mb-3 font-bold">Criar Vaga (QServer)</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Cargo"><InputText value={vaga.title} onChange={e => setVaga({ ...vaga, title: e.target.value })} /></Field>
            <Field label="Área"><InputText value={vaga.area} onChange={e => setVaga({ ...vaga, area: e.target.value })} /></Field>
            <Field label="Polo"><InputText value={vaga.polo} onChange={e => setVaga({ ...vaga, polo: e.target.value })} /></Field>
          </div>
          <Btn variant="accent" className="mt-3" onClick={() => {
            if (!vaga.title) return
            useStore.getState().patch({ vagas: [{ id: `v${Date.now()}`, ...vaga, createdAt: Date.now() }, ...useStore.getState().vagas] })
            toast('ADM', 'Vaga publicada no QGroup/Vagas!', 'ok')
            setVaga({ title: '', area: '', polo: '' })
          }} data-testid="adm-vaga">Publicar vaga</Btn>
        </Panel>
      )}

      {sec === 'pontilhismo' && (
        <Panel className="p-5">
          <h3 className="mb-3 font-bold">Criar Polo Pontilhismo (nome + CEP)</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Nome do polo"><InputText value={polo.name} onChange={e => setPolo({ ...polo, name: e.target.value })} /></Field>
            <Field label="CEP"><InputText value={polo.cep} onChange={e => setPolo({ ...polo, cep: e.target.value })} /></Field>
          </div>
          <Btn variant="accent" className="mt-3" onClick={async () => {
            if (!polo.name) return
            await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Pontilhismo ${polo.name}`, kind: 'POLO', cep: polo.cep, createdBy: baoId }) })
            toast('ADM', `Polo Pontilhismo "${polo.name}" criado (CEP ${polo.cep || '—'}).`, 'ok')
            setPolo({ name: '', cep: '' }); reload()
          }} data-testid="adm-pontilhismo">Criar polo</Btn>
        </Panel>
      )}

      {/* OBS 6 — visão do Advancer sobre todas as equipes */}
      {role === 'ADVENCER' && (
        <Panel className="mt-4 p-5" data-testid="advencer-teams">
          <h3 className="mb-2 font-bold">👑 Visão ADVENCER — todas as equipes criadas</h3>
          {teams.map(t => (
            <AdmTeamRow key={t.id} team={t} users={users} reload={reload} />
          ))}
        </Panel>
      )}
    </div>
  )
}

function AdmTeamRow({ team, users, reload }: { team: { id: string; name: string; members: string }; users: { baoId: string; role: string }[]; reload: () => void }) {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState('')
  const [roleTo, setRoleTo] = useState<'RESPONSAVEL' | 'FUNCIONARIO'>('FUNCIONARIO')
  let members: string[] = []
  try { members = JSON.parse(team.members || '[]') } catch { }
  return (
    <div className="mb-2 rounded-lg border border-white/10 bg-black/30">
      <button className="flex w-full items-center justify-between p-3 text-sm" onClick={() => setOpen(o => !o)}>
        <span className="font-bold">{team.name}</span>
        <span className="text-white/40">{members.length} membro(s) {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-white/10 p-3">
          {members.map(m => <p key={m} className="text-xs text-white/70">• {m}</p>)}
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
            <select value={sel} onChange={e => setSel(e.target.value)} className="rounded-lg border border-white/15 bg-black/40 p-2 text-xs text-white">
              <option value="">— atribuir usuário —</option>
              {users.map(u => <option key={u.baoId} value={u.baoId}>{u.baoId} ({u.role})</option>)}
            </select>
            <select value={roleTo} onChange={e => setRoleTo(e.target.value as 'RESPONSAVEL' | 'FUNCIONARIO')} className="rounded-lg border border-white/15 bg-black/40 p-2 text-xs text-white">
              <option>FUNCIONARIO</option><option>RESPONSAVEL</option>
            </select>
            <Btn size="sm" variant="accent" onClick={async () => {
              if (!sel) return
              await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addMember', id: team.id, member: sel }) })
              await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baoId: sel, role: roleTo }) })
              reload()
            }}>Atribuir</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
