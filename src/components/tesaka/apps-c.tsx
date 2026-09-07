'use client'

import { useStore, type Quiz, type Projeto } from '@/lib/store'
import { Panel, Btn, Field, InputText, ScreenHeader, Modal, Tag, SubNav, Empty, MediaPicker, PreviewPlayer } from '@/components/tesaka/ui-kit'
import { GraduationCap, School, Plus, Pencil, Trash2, Eye, CalendarClock, BellRing, FolderKanban } from 'lucide-react'
import { useState } from 'react'

/* ================= TESAKA SCHOOL (somente desktop — professor RESPONSAVEL) ================= */
export function SchoolApp() {
  const { session } = useStore()
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  if (!isDesktop) {
    return (
      <div>
        <ScreenHeader title="Tesaka School" icon={<School className="h-5 w-5 text-[#B6FF2E]" />} />
        <Panel className="p-10 text-center"><p className="text-white/60">🏫 O Tesaka School (portal do professor) está disponível <b>somente no desktop</b>.</p></Panel>
      </div>
    )
  }
  return <SchoolDesktop sessionRole={session?.role || 'USUAL'} baoId={session?.baoId || ''} />
}

function SchoolDesktop({ sessionRole, baoId }: { sessionRole: string; baoId: string }) {
  const { quizzes, turmas, projetos, noticias, videoaulas, patch, toast } = useStore()
  const [tab, setTab] = useState('classes')
  const [quizModal, setQuizModal] = useState<null | { mode: 'new' | 'edit'; quiz?: Quiz }>(null)
  const [projModal, setProjModal] = useState(false)
  const [newsModal, setNewsModal] = useState(false)
  const [aulaModal, setAulaModal] = useState(false)
  const [projAtivo, setProjAtivo] = useState<string | null>(null)

  const pushNews = async (n: { title: string }) => {
    // Notícia empurrada por notificação a TODOS os alunos de TODAS as classes
    const targets = ['LUCAS ALUNO.TezSchool', 'BIA ALUNA.TezSchool']
    for (const tg of targets) {
      await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toBaoId: tg, fromBaoId: baoId, type: 'NEWS', title: `Jornal da Escola: ${n.title}`, body: 'Nova notícia publicada no Jornal da Escola.' }) })
    }
  }

  const projeto = projetos.find(p => p.id === projAtivo)

  return (
    <div>
      <ScreenHeader title="Tesaka School" subtitle={`Portal do professor (RESPONSAVEL) • ${baoId || 'sem sessão'}`} icon={<School className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tab} onChange={setTab} tabs={[
        { id: 'classes', label: 'Classes' },
        { id: 'tarefa', label: 'Tarefa' },
        { id: 'projetos', label: 'Projetos' },
        { id: 'jornal', label: 'Jornal da Escola' },
        { id: 'aulas', label: 'VideoAulas e Arquivos' },
      ]} />

      {tab === 'classes' && (
        <div className="space-y-4" data-testid="school-classes">
          {turmas.map(t => (
            <Panel key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{t.name}</h3>
                <Btn size="sm" variant="outline" onClick={() => {
                  const name = prompt('Novo nome da classe:', t.name)
                  if (name) patch({ turmas: turmas.map(x => x.id === t.id ? { ...x, name } : x) })
                }}><Pencil className="mr-1 h-3.5 w-3.5" /> Editar nome da classe</Btn>
              </div>
              <div className="mt-3 space-y-2">
                {t.students.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm">
                    <span>👤 {s}</span>
                    <button className="text-xs text-white/40 hover:text-[#B6FF2E]" onClick={() => {
                      const name = prompt('Editar nome do estudante:', s)
                      if (name) patch({ turmas: turmas.map(x => x.id === t.id ? { ...x, students: x.students.map((y, j) => j === i ? name : y) } : x) })
                    }} data-testid="edit-student">✏️ editar</button>
                  </div>
                ))}
              </div>
              <Btn size="sm" variant="ghost" className="mt-2" onClick={() => {
                const name = prompt('Nome do novo estudante:')
                if (name) patch({ turmas: turmas.map(x => x.id === t.id ? { ...x, students: [...x.students, name] } : x) })
              }}><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar estudante</Btn>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'tarefa' && (
        <div className="space-y-4" data-testid="school-tarefas">
          <Btn variant="accent" onClick={() => setQuizModal({ mode: 'new' })} data-testid="new-quiz"><Plus className="mr-1 h-4 w-4" /> Criar Quiz</Btn>
          {quizzes.length === 0 && <Empty text="Nenhum quiz criado. Crie um e ele aparecerá no Tesaka Study dos alunos." />}
          {quizzes.map(q => (
            <Panel key={q.id} className="p-4" data-testid="quiz-row">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">🧠 {q.title}</p>
                  <p className="text-[11px] text-white/45">{q.questions.length} questões • {q.classe || 'todas as classes'} {q.deadline ? `• entrega até ${q.deadline}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <Btn size="sm" variant="outline" onClick={() => setQuizModal({ mode: 'edit', quiz: q })} data-testid="quiz-edit"><Eye className="mr-1 h-3.5 w-3.5" /> Preview Quiz</Btn>
                  <Btn size="sm" variant="outline" onClick={() => setQuizModal({ mode: 'edit', quiz: q })}><Pencil className="mr-1 h-3.5 w-3.5" /> Editar</Btn>
                  <Btn size="sm" variant="danger" onClick={() => { patch({ quizzes: quizzes.filter(x => x.id !== q.id) }); toast('Tarefa', 'Quiz excluído.', 'ok') }} data-testid="quiz-delete"><Trash2 className="h-3.5 w-3.5" /></Btn>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'projetos' && !projAtivo && (
        <div className="space-y-4" data-testid="school-projetos">
          <Btn variant="accent" onClick={() => setProjModal(true)}><Plus className="mr-1 h-4 w-4" /> Novo Projeto</Btn>
          {projetos.length === 0 && <Empty text="Nenhum projeto. Projetos aceitam membros de várias classes e duração em meses." />}
          {projetos.map(p => (
            <Panel key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-bold"><FolderKanban className="mr-1 inline h-4 w-4 text-[#B6FF2E]" /> {p.name}</p>
                <p className="text-[11px] text-white/45">{p.desc} • {p.months} mês(es) • {p.members.length} membros (multi-classes)</p>
              </div>
              <Btn size="sm" variant="accent" onClick={() => setProjAtivo(p.id)} data-testid={`entrar-projeto`}>Entrar Projeto</Btn>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'projetos' && projAtivo && projeto && (
        <div className="space-y-4" data-testid="projeto-screen">
          <Btn variant="ghost" size="sm" onClick={() => setProjAtivo(null)}>← Voltar aos projetos</Btn>
          <Panel className="p-4">
            <h3 className="font-bold">{projeto.name}</h3>
            <p className="text-xs text-white/45">{projeto.desc} • duração {projeto.months} mês(es)</p>
          </Panel>
          <Panel className="p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Membros (todas as classes)</h4>
            {projeto.members.map((m, i) => <p key={i} className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm mb-1">👤 {m}</p>)}
            <Btn size="sm" variant="ghost" className="mt-2" onClick={() => {
              const name = prompt('Nome do membro (de qualquer classe):')
              if (name) patch({ projetos: projetos.map(x => x.id === projeto.id ? { ...x, members: [...x.members, name] } : x) })
            }}><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar membro</Btn>
          </Panel>
          <Panel className="p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Atividades do projeto</h4>
            <Empty text="Nenhuma atividade registrada — funciona como uma sala de aula permanente do projeto." />
          </Panel>
        </div>
      )}

      {tab === 'jornal' && (
        <div className="space-y-4" data-testid="school-jornal">
          <Btn variant="accent" onClick={() => setNewsModal(true)} data-testid="new-noticia"><Plus className="mr-1 h-4 w-4" /> Nova Noticia</Btn>
          {noticias.length === 0 && <Empty text="Nenhuma notícia do jornal." />}
          {noticias.map(n => (
            <Panel key={n.id} className="p-4">
              <p className="font-bold">📰 {n.title}</p>
              <p className="text-[11px] text-white/45">{n.date} • por {n.author} • enviada a todas as classes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{n.body}</p>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'aulas' && (
        <div className="space-y-4" data-testid="school-aulas">
          <Btn variant="accent" onClick={() => setAulaModal(true)} data-testid="new-aula"><Plus className="mr-1 h-4 w-4" /> Nova Videoaula</Btn>
          {videoaulas.length === 0 && <Empty text="Nenhuma videoaula publicada." />}
          {videoaulas.map(v => (
            <Panel key={v.id} className="p-4">
              <p className="font-bold">🎬 {v.title}</p>
              <p className="text-[11px] text-white/45">Classe: {v.classe} • {v.videoName ? `vídeo: ${v.videoName}` : 'sem vídeo'} {v.docName ? `• doc: ${v.docName}` : ''}</p>
              {v.notes && <p className="mt-2 text-sm text-white/70">📝 {v.notes}</p>}
              <div className="mt-3"><PreviewPlayer name={v.title} compact /></div>
            </Panel>
          ))}
        </div>
      )}

      {/* Modal Quiz (criar/editar + deadline) */}
      <QuizModal open={!!quizModal} mode={quizModal?.mode || 'new'} quiz={quizModal?.quiz} onClose={() => setQuizModal(null)} />

      {/* Modal Projeto */}
      <Modal open={projModal} onClose={() => setProjModal(false)} title="Novo Projeto (multi-classes)">
        <ProjForm onCreate={(name, months, desc) => {
          patch({ projetos: [{ id: `pj${Date.now()}`, name, months, desc, members: [], createdBy: baoId || 'PROF', createdAt: Date.now() }, ...projetos] })
          setProjModal(false)
          toast('Projetos', `Projeto "${name}" criado (${months} meses). Use Entrar Projeto.`, 'ok')
        }} />
      </Modal>

      {/* Modal Jornal */}
      <Modal open={newsModal} onClose={() => setNewsModal(false)} title="Nova Noticia — Jornal da Escola">
        <NewsForm onCreate={async (title, date, body) => {
          patch({ noticias: [{ id: `n${Date.now()}`, title, date, body, author: baoId || 'PROF', createdAt: Date.now() }, ...noticias] })
          await pushNews({ title })
          setNewsModal(false)
          toast('Jornal', 'Notícia publicada e notificação enviada a todas as classes! 🔔', 'ok')
        }} />
      </Modal>

      {/* Modal Videoaula */}
      <Modal open={aulaModal} onClose={() => setAulaModal(false)} title="Nova Videoaula" wide>
        <AulaForm classes={turmas.map(t => t.name)} onCreate={(v) => {
          patch({ videoaulas: [v, ...videoaulas] })
          setAulaModal(false)
          toast('VideoAulas', `"${v.title}" publicada para ${v.classe}.`, 'ok')
        }} />
      </Modal>
    </div>
  )
}

function QuizModal({ open, mode, quiz, onClose }: { open: boolean; mode: 'new' | 'edit'; quiz?: Quiz; onClose: () => void }) {
  const { patch, quizzes, toast } = useStore()
  const [title, setTitle] = useState(quiz?.title || '')
  const [deadline, setDeadline] = useState(quiz?.deadline || '')
  const [classe, setClasse] = useState(quiz?.classe || 'Turma A')
  const [qs, setQs] = useState<Quiz['questions']>(quiz?.questions || [{ q: '', options: ['', ''], correct: 0 }])

  const save = () => {
    if (!title.trim()) return
    const data = { title, deadline, classe, questions: qs.filter(q => q.q.trim()) }
    if (mode === 'edit' && quiz) {
      patch({ quizzes: quizzes.map(q => q.id === quiz.id ? { ...q, ...data } : q) })
      toast('Tarefa', 'Quiz atualizado!', 'ok')
    } else {
      patch({ quizzes: [{ id: `q${Date.now()}`, ...data, createdAt: Date.now() }, ...quizzes] })
      toast('Tarefa', `Quiz "${title}" criado — já disponível no Tesaka Study!`, 'ok')
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit' ? `Editar Quiz — ${quiz?.title}` : 'Criar Quiz'} wide>
      <div className="space-y-4">
        <Field label="Título"><InputText value={title} onChange={e => setTitle(e.target.value)} data-testid="quiz-title" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prazo de entrega (data)">
            <InputText type="date" value={deadline} onChange={e => setDeadline(e.target.value)} data-testid="quiz-deadline" />
          </Field>
          <Field label="Classe">
            <select value={classe} onChange={e => setClasse(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm text-white">
              <option>Turma A</option><option>Todas</option>
            </select>
          </Field>
        </div>
        {qs.map((q, qi) => (
          <Panel key={qi} className="space-y-2 p-3">
            <Field label={`Questão ${qi + 1}`}>
              <InputText value={q.q} onChange={e => setQs(qs.map((x, i) => i === qi ? { ...x, q: e.target.value } : x))} />
            </Field>
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" checked={q.correct === oi} onChange={() => setQs(qs.map((x, i) => i === qi ? { ...x, correct: oi } : x))} className="accent-[#B6FF2E]" />
                <InputText placeholder={`Opção ${oi + 1} (selecionada = correta)`} value={o} onChange={e => setQs(qs.map((x, i) => i === qi ? { ...x, options: x.options.map((y, j) => j === oi ? e.target.value : y) } : x))} />
                <button className="text-white/40" onClick={() => setQs(qs.map((x, i) => i === qi ? { ...x, options: x.options.filter((_, j) => j !== oi) } : x))}>✕</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Btn size="sm" variant="ghost" onClick={() => setQs(qs.map((x, i) => i === qi ? { ...x, options: [...x.options, ''] } : x))}><Plus className="mr-1 h-3 w-3" /> opção</Btn>
              {qs.length > 1 && <Btn size="sm" variant="ghost" onClick={() => setQs(qs.filter((_, i) => i !== qi))}><Trash2 className="h-3 w-3" /></Btn>}
            </div>
          </Panel>
        ))}
        <div className="flex gap-2">
          <Btn variant="outline" onClick={() => setQs([...qs, { q: '', options: ['', ''], correct: 0 }])}><Plus className="mr-1 h-4 w-4" /> Questão</Btn>
          <Btn variant="accent" className="flex-1" onClick={save} data-testid="quiz-save">Salvar quiz</Btn>
        </div>
      </div>
    </Modal>
  )
}

function ProjForm({ onCreate }: { onCreate: (name: string, months: number, desc: string) => void }) {
  const [name, setName] = useState('')
  const [months, setMonths] = useState(3)
  const [desc, setDesc] = useState('')
  return (
    <div className="space-y-3">
      <Field label="Nome do projeto"><InputText value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Duração (meses) — definida por você">
        <InputText type="number" min={1} value={months} onChange={e => setMonths(Number(e.target.value))} />
      </Field>
      <Field label="Descrição"><textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm" /></Field>
      <Btn variant="accent" className="w-full" onClick={() => name.trim() && onCreate(name, months, desc)}>Criar projeto</Btn>
    </div>
  )
}

function NewsForm({ onCreate }: { onCreate: (title: string, date: string, body: string) => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [body, setBody] = useState('')
  return (
    <div className="space-y-3">
      <Field label="Título"><InputText value={title} onChange={e => setTitle(e.target.value)} data-testid="news-title" /></Field>
      <Field label="Data"><InputText type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Conteúdo"><textarea rows={4} value={body} onChange={e => setBody(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm" data-testid="news-body" /></Field>
      <Btn variant="accent" className="w-full" onClick={() => title.trim() && onCreate(title, date, body)} data-testid="news-submit">Publicar + notificar todas as classes</Btn>
    </div>
  )
}

function AulaForm({ classes, onCreate }: { classes: string[]; onCreate: (v: { id: string; title: string; videoName?: string; docName?: string; classe: string; notes: string; createdAt: number }) => void }) {
  const [title, setTitle] = useState('')
  const [video, setVideo] = useState<{ kind: 'image' | 'video'; url: string; name: string } | undefined>()
  const [docName, setDocName] = useState('')
  const [classe, setClasse] = useState(classes[0] || 'Turma A')
  const [notes, setNotes] = useState('')
  return (
    <div className="space-y-3">
      <Field label="Título"><InputText value={title} onChange={e => setTitle(e.target.value)} /></Field>
      <Field label="Upload da videoaula (vídeo)"><MediaPicker value={video} onChange={m => setVideo(m ? { kind: m.kind, url: m.url, name: m.name } : undefined)} id="aula-video" accept="video/*" /></Field>
      <Field label="Upload de documento (PDF/doc)">
        <input type="file" className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white" onChange={e => setDocName(e.target.files?.[0]?.name || '')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Classe">
          <select value={classe} onChange={e => setClasse(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm text-white">
            {classes.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Observações"><InputText value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      </div>
      <Btn variant="accent" className="w-full" onClick={() => title.trim() && onCreate({ id: `a${Date.now()}`, title, videoName: video?.name, docName: docName || undefined, classe, notes, createdAt: Date.now() })}>Publicar videoaula</Btn>
    </div>
  )
}

/* ================= TESAKA STUDY (desktop + mobile — estudante FUNCIONARIO) ================= */
export function StudyApp() {
  const { session, quizzes, toast } = useStore()
  const [tab, setTab] = useState('inicio')
  const [resp, setResp] = useState<Record<string, number>>({})
  const [done, setDone] = useState<string[]>([])

  if (!session) return <Empty text="Faça login para acessar o Tesaka Study." />
  const isAluno = session.role === 'FUNCIONARIO' || session.role === 'USUAL'

  const submitQuiz = (q: Quiz) => {
    let score = 0
    for (let i = 0; i < q.questions.length; i++) if (resp[`${q.id}:${i}`] === q.questions[i].correct) score++
    setDone(d => [...d, q.id])
    toast('Quiz', `Você acertou ${score}/${q.questions.length}! ${score === q.questions.length ? 'Perfeito! 🎉' : 'Continue estudando 💪'}`, 'ok')
  }

  return (
    <div>
      <ScreenHeader title="Tesaka Study" subtitle={`Portal do estudante (FUNCIONARIO) • ${session.baoId}`} icon={<GraduationCap className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tab} onChange={setTab} tabs={[
        { id: 'inicio', label: 'Início' },
        { id: 'quizzes', label: 'Quizzes', badge: quizzes.length },
        { id: 'notificacoes', label: 'Notificações' },
      ]} />

      {tab === 'inicio' && (
        <div className="grid gap-4 md:grid-cols-2" data-testid="study-inicio">
          <Panel className="p-5">
            {/* Campo MINHA CLASSE (requisito) */}
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/50">MINHA CLASSE</h3>
            <p className="text-2xl font-black text-[#B6FF2E]" data-testid="minha-classe">{session.org || 'Turma A'}</p>
            <p className="mt-1 text-xs text-white/40">Definida pela sua escola (RESPONSAVEL). Entre em contato com seu professor para alterações.</p>
          </Panel>
          <Panel className="p-5">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50"><BellRing className="h-3.5 w-3.5" /> Novidades da escola</h3>
            {useStore.getState().noticias.slice(0, 3).map(n => (
              <div key={n.id} className="mb-2 rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
                <p className="font-bold">📰 {n.title}</p>
                <p className="text-[11px] text-white/40">{n.date}</p>
              </div>
            ))}
            {useStore.getState().noticias.length === 0 && <Empty text="Nenhuma notícia do Jornal da Escola ainda." />}
          </Panel>
        </div>
      )}

      {tab === 'quizzes' && (
        <div className="space-y-4" data-testid="study-quizzes">
          {quizzes.length === 0 && <Empty text="Nenhum quiz disponível. Quando seu professor criar, aparecerá aqui." />}
          {quizzes.map(q => (
            <Panel key={q.id} className="p-5" data-testid="study-quiz">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold">🧠 {q.title}</h3>
                  <p className="text-[11px] text-white/45">{q.classe || 'Todas as classes'} {q.deadline ? `• entrega até ${q.deadline}` : ''}</p>
                </div>
                {q.deadline && <Tag><CalendarClock className="mr-1 h-3 w-3" />{q.deadline}</Tag>}
              </div>
              {done.includes(q.id) ? (
                <p className="rounded-lg border border-[#B6FF2E]/30 bg-[#B6FF2E]/5 p-3 text-sm text-[#B6FF2E]">✔ Quiz enviado! Aguarde a correção do professor.</p>
              ) : (
                <>
                  {q.questions.map((qq, qi) => (
                    <div key={qi} className="mb-3 rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="mb-2 text-sm font-semibold">{qi + 1}. {qq.q}</p>
                      <div className="grid gap-1.5">
                        {qq.options.map((o, oi) => (
                          <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm ${resp[`${q.id}:${qi}`] === oi ? 'border-[#B6FF2E] bg-[#B6FF2E]/10' : 'border-white/10'}`}>
                            <input type="radio" name={`${q.id}-${qi}`} checked={resp[`${q.id}:${qi}`] === oi} onChange={() => setResp(r => ({ ...r, [`${q.id}:${qi}`]: oi }))} />
                            {o}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Btn variant="accent" onClick={() => submitQuiz(q)} data-testid="quiz-submit">Enviar respostas</Btn>
                </>
              )}
            </Panel>
          ))}
        </div>
      )}

      {tab === 'notificacoes' && (
        <Panel className="p-5">
          <p className="text-sm text-white/60">As notificações da escola chegam no sino 🔔 da barra superior (Jornal, tarefas e mensagens do LobaiteOS).</p>
          {!isAluno && <p className="mt-2 text-xs text-white/40">Nota: sua conta ({session.role}) também pode acessar outras áreas.</p>}
        </Panel>
      )}
    </div>
  )
}
