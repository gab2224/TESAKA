'use client'

import { useStore, type FormForm, type FormResp, type Receita, type Certificado } from '@/lib/store'
import { Panel, Btn, Field, InputText, ScreenHeader, Modal, Tag, SubNav, Empty, MediaPicker, PreviewPlayer } from '@/components/tesaka/ui-kit'
import { Stethoscope, Plus, FileDown, Clapperboard, Save, Scissors, Wand2, Music, Type as TypeIcon, Sparkles, FileQuestion, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'

function openPrintWindow(title: string, html: string) {
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  w.document.write(`<html><head><title>${title}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;padding:40px;color:#111}
    h1{color:#5a8f00;border-bottom:3px solid #B6FF2E;padding-bottom:8px}
    .box{border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:16px}
    .footer{margin-top:40px;font-size:11px;color:#777;text-align:center}
    @media print{ .noprint{display:none} }
  </style></head><body>
  ${html}
  <div class="footer">TESAKA CLINICA • documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
  <button class="noprint" style="margin-top:24px;padding:10px 20px;font-size:14px;cursor:pointer" onclick="window.print()">🖨️ Salvar como PDF</button>
  </body></html>`)
  w.document.close()
}

/* ================= TESAKA CLINICA (somente desktop) ================= */
export function ClinicaApp() {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  if (!isDesktop) {
    return (
      <div>
        <ScreenHeader title="Tesaka Clinica" icon={<Stethoscope className="h-5 w-5 text-[#B6FF2E]" />} />
        <Panel className="p-10 text-center"><p className="text-white/60">🩺 A Tesaka Clinica está disponível <b>somente no desktop</b>.</p></Panel>
      </div>
    )
  }
  return <ClinicaDesktop />
}

function ClinicaDesktop() {
  const { session, consultas, receitas, certificados, patch, toast } = useStore()
  const medico = session?.name || 'Dr(a). QGroup'
  const [tab, setTab] = useState('consulta')
  const [paciente, setPaciente] = useState('')
  const [diag, setDiag] = useState('')
  const [rxOpen, setRxOpen] = useState<Receita | null>(null)
  const [certOpen, setCertOpen] = useState(false)

  const pacientes = Array.from(new Set(consultas.map(c => c.paciente)))
  const allTags = Array.from(new Set(consultas.flatMap(c => c.tags)))
  const pacienteTags = paciente ? Array.from(new Set(consultas.filter(c => c.paciente === paciente).flatMap(c => c.tags))) : []

  return (
    <div>
      <ScreenHeader title="Tesaka Clinica" subtitle={`Prontuário eletrônico • ${medico}`} icon={<Stethoscope className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tab} onChange={setTab} tabs={[
        { id: 'consulta', label: 'CONSULTA' },
        { id: 'receitas', label: 'RECEITAS' },
        { id: 'certificado', label: 'CERTIFICADO' },
      ]} />

      {tab === 'consulta' && (
        <div className="grid gap-4 md:grid-cols-2" data-testid="clinica-consulta">
          <Panel className="p-5">
            <h3 className="mb-3 font-bold">Nova consulta</h3>
            <Field label="Paciente">
              <InputText placeholder="Nome do paciente" value={paciente} onChange={e => setPaciente(e.target.value)} list="pacientes-list" />
            </Field>
            <datalist id="pacientes-list">{pacientes.map(p => <option key={p} value={p} />)}</datalist>
            <div className="mt-3">
              <Field label="Diagnóstico (vira #tag no prontuário)">
                <InputText placeholder="ex: Hipertensão" value={diag} onChange={e => setDiag(e.target.value)} data-testid="diag-input" />
              </Field>
            </div>
            {pacienteTags.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[11px] uppercase text-white/40">Tags deste paciente</p>
                <div className="flex flex-wrap gap-1">{pacienteTags.map(tg => <Tag key={tg} className="border-[#B6FF2E]/30 text-[#B6FF2E]">#{tg}</Tag>)}</div>
              </div>
            )}
            <Btn variant="accent" className="mt-4 w-full" onClick={() => {
              if (!paciente.trim() || !diag.trim()) { toast('Consulta', 'Informe paciente e diagnóstico.', 'err'); return }
              const tag = diag.trim().replace(/^#/, '')
              patch({ consultas: [{ id: `c${Date.now()}`, paciente: paciente.trim(), data: new Date().toLocaleDateString('pt-BR'), diag, tags: [tag], medico }, ...consultas] })
              toast('Consulta', `Diagnóstico salvo como #${tag} no prontuário — já disponível como sugestão!`, 'ok')
              setDiag('')
            }} data-testid="consulta-save">Registrar consulta</Btn>
            {allTags.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-[11px] uppercase text-white/40">Sugestões globais (#tags de outros pacientes também)</p>
                <div className="flex flex-wrap gap-1">{allTags.map(tg => <button key={tg} onClick={() => setDiag(tg)}><Tag className="hover:border-[#B6FF2E]/60">#{tg}</Tag></button>)}</div>
              </div>
            )}
          </Panel>
          <Panel className="p-5">
            <h3 className="mb-3 font-bold">Prontuários por paciente</h3>
            {pacientes.length === 0 && <Empty text="Nenhuma consulta registrada." />}
            {pacientes.map(p => (
              <div key={p} className="mb-3 rounded-lg border border-white/10 bg-black/30 p-3">
                <p className="font-bold">👤 {p}</p>
                {consultas.filter(c => c.paciente === p).map(c => (
                  <p key={c.id} className="mt-1 text-xs text-white/60">{c.data} — {c.diag} {c.tags.map(tg => <Tag key={tg} className="ml-1 border-[#B6FF2E]/30 text-[#B6FF2E]">#{tg}</Tag>)}</p>
                ))}
              </div>
            ))}
          </Panel>
        </div>
      )}

      {tab === 'receitas' && (
        <div className="space-y-4" data-testid="clinica-receitas">
          <Panel className="p-5">
            <h3 className="mb-3 font-bold">Nova receita</h3>
            <ReceitaForm onCreate={r => {
              patch({ receitas: [r, ...receitas] })
              toast('Receitas', 'Receita gerada! Use o botão PDF para qualquer receita do histórico.', 'ok')
            }} medico={medico} />
          </Panel>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Histórico de receitas</h3>
          {receitas.length === 0 && <Empty text="Nenhuma receita no histórico." />}
          {receitas.map(r => (
            <Panel key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-bold">💊 {r.paciente}</p>
                <p className="text-[11px] text-white/45">{r.data} • {r.meds.length} medicamento(s) • {r.medico}</p>
              </div>
              <Btn size="sm" variant="accent" onClick={() => receitaPDF(r)} data-testid="receita-pdf"><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Btn>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'certificado' && (
        <div className="space-y-4" data-testid="clinica-certificados">
          <Panel className="p-5">
            <h3 className="mb-3 font-bold">Novo certificado</h3>
            <CertForm onCreate={c => {
              patch({ certificados: [c, ...certificados] })
              toast('Certificado', 'Certificado emitido! Botão PDF disponível na lista.', 'ok')
            }} medico={medico} />
          </Panel>
          {certificados.length === 0 && <Empty text="Nenhum certificado emitido." />}
          {certificados.map(c => (
            <Panel key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-bold">📄 {c.tipo} — {c.paciente}</p>
                <p className="text-[11px] text-white/45">{c.data} {c.cid ? `• CID ${c.cid}` : ''} • {c.medico}</p>
              </div>
              <Btn size="sm" variant="accent" onClick={() => certPDF(c)} data-testid="cert-pdf"><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Btn>
            </Panel>
          ))}
        </div>
      )}

      <Modal open={!!rxOpen} onClose={() => setRxOpen(null)} title={`Receita — ${rxOpen?.paciente}`} wide>
        {rxOpen && (
          <div className="space-y-2 text-sm">
            {rxOpen.meds.map((m, i) => <p key={i} className="rounded bg-white/5 p-2">{i + 1}. <b>{m.nome}</b> — {m.dose}, {m.freq}</p>)}
          </div>
        )}
      </Modal>
    </div>
  )
}

function receitaPDF(r: Receita) {
  openPrintWindow(`Receita — ${r.paciente}`, `
    <h1>Receita Médica</h1>
    <div class="box"><b>Paciente:</b> ${r.paciente}<br/><b>Data:</b> ${r.data}</div>
    <div class="box">${r.meds.map(m => `<p>${m.nome} — ${m.dose} — ${m.freq}</p>`).join('')}</div>
    <div class="box"><b>Médico(a):</b> ${r.medico}<br/><i>(assinatura eletrônica TESAKA CLINICA)</i></div>
  `)
}

function certPDF(c: Certificado) {
  openPrintWindow(`Certificado — ${c.paciente}`, `
    <h1>Certificado Médico</h1>
    <div class="box" style="font-size:15px">
      Certifico, para os devidos fins, que <b>${c.paciente}</b> ${c.tipo === 'afastamento' ? `necessita de afastamento de <b>${c.cid || '1 dia'}</b> por motivo de saúde` : 'esteve sob cuidados médicos nesta data'}.
      <br/><br/><b>Data:</b> ${c.data}
    </div>
    <div class="box"><b>Médico(a):</b> ${c.medico}<br/><i>(assinatura eletrônica TESAKA CLINICA)</i></div>
  `)
}

function ReceitaForm({ onCreate, medico }: { onCreate: (r: Receita) => void; medico: string }) {
  const [paciente, setPaciente] = useState('')
  const [nome, setNome] = useState('')
  const [dose, setDose] = useState('')
  const [freq, setFreq] = useState('')
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Field label="Paciente"><InputText value={paciente} onChange={e => setPaciente(e.target.value)} /></Field>
      <Field label="Medicamento"><InputText value={nome} onChange={e => setNome(e.target.value)} placeholder="Dipirona 500mg" /></Field>
      <Field label="Dose"><InputText value={dose} onChange={e => setDose(e.target.value)} placeholder="1 comprimido" /></Field>
      <Field label="Frequência"><InputText value={freq} onChange={e => setFreq(e.target.value)} placeholder="a cada 8h por 5 dias" /></Field>
      <div className="sm:col-span-2">
        <Btn variant="accent" className="w-full" onClick={() => {
          if (!paciente || !nome) return
          onCreate({ id: `r${Date.now()}`, paciente, data: new Date().toLocaleDateString('pt-BR'), meds: [{ nome, dose: dose || '—', freq: freq || '—' }], medico })
          setPaciente(''); setNome(''); setDose(''); setFreq('')
        }}>Gerar receita</Btn>
      </div>
    </div>
  )
}

function CertForm({ onCreate, medico }: { onCreate: (c: Certificado) => void; medico: string }) {
  const [paciente, setPaciente] = useState('')
  const [tipo, setTipo] = useState('afastamento')
  const [cid, setCid] = useState('')
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Field label="Paciente"><InputText value={paciente} onChange={e => setPaciente(e.target.value)} /></Field>
      <Field label="Tipo">
        <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm text-white">
          <option value="afastamento">Afastamento</option>
          <option value="comparecimento">Comparecimento</option>
        </select>
      </Field>
      <Field label="CID / dias"><InputText value={cid} onChange={e => setCid(e.target.value)} placeholder="ex: 2 dias" /></Field>
      <div className="sm:col-span-3">
        <Btn variant="accent" className="w-full" onClick={() => {
          if (!paciente) return
          onCreate({ id: `ct${Date.now()}`, paciente, data: new Date().toLocaleDateString('pt-BR'), tipo, cid, medico })
          setPaciente(''); setCid('')
        }}>Emitir certificado</Btn>
      </div>
    </div>
  )
}

/* ================= TESAKA CREATORS (desktop + tablet) ================= */
export function CreatorsApp() {
  const { toast, go, session } = useStore()
  const isTabletUp = typeof window === 'undefined' || window.innerWidth >= 768
  const [media, setMedia] = useState<{ kind: 'image' | 'video'; url: string; name: string; durationSec?: number } | undefined>()
  const [title, setTitle] = useState('Meu vídeo QGroup')
  const [savedOpen, setSavedOpen] = useState(false)
  const [timeline, setTimeline] = useState(['Corte 1', 'Corte 2', 'Transição', 'Trilha'])

  if (!isTabletUp) {
    return (
      <div>
        <ScreenHeader title="Tesaka Creators" icon={<Clapperboard className="h-5 w-5 text-[#B6FF2E]" />} />
        <Panel className="p-10 text-center"><p className="text-white/60">🎛️ O editor está disponível em <b>desktop e tablet</b>.</p></Panel>
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title="Tesaka Creators" subtitle="Editor de vídeo para criadores do YouPlay" icon={<Clapperboard className="h-5 w-5 text-[#B6FF2E]" />} />
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Panel className="p-4">
            <Field label="Importar vídeo"><MediaPicker value={media} onChange={setMedia} id="creator-video" accept="video/*" /></Field>
            <div className="mt-3">
              <Field label="Título do projeto"><InputText value={title} onChange={e => setTitle(e.target.value)} /></Field>
            </div>
          </Panel>
          <Panel className="p-4">
            {media ? <PreviewPlayer name={title} duration={media.durationSec ? fmt(media.durationSec) : undefined} /> : <Empty text="Importe um vídeo para editar." />}
          </Panel>
          <Panel className="p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50"><Scissors className="h-3.5 w-3.5" /> Linha do tempo</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {timeline.map((t, i) => (
                <div key={i} className="shrink-0 rounded-lg border border-[#B6FF2E]/30 bg-[#B6FF2E]/5 px-4 py-3 text-xs font-semibold text-[#B6FF2E]">🎞️ {t}</div>
              ))}
            </div>
            <input type="range" min={0} max={100} defaultValue={60} className="mt-2 w-full accent-[#B6FF2E]" aria-label="Trim" />
          </Panel>
          <div className="flex flex-wrap gap-2">
            <Btn variant="accent" onClick={() => setSavedOpen(true)} data-testid="save-btn"><Save className="mr-1 h-4 w-4" /> SALVAR</Btn>
            <Btn variant="outline" onClick={() => toast('Creators', 'Renderização iniciada (demo).', 'ok')}><Wand2 className="mr-1 h-4 w-4" /> Exportar</Btn>
          </div>
        </div>
        <Panel className="h-fit p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Efeitos</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Corte', 'Velocidade', 'Texto', 'Música'].map(e => (
              <Btn key={e} size="sm" variant="outline" onClick={() => { setTimeline(t => [...t, e]); toast('Creators', `Efeito "${e}" adicionado à linha do tempo.`, 'ok') }}>
                {e === 'Texto' ? <TypeIcon className="mr-1 h-3.5 w-3.5" /> : e === 'Música' ? <Music className="mr-1 h-3.5 w-3.5" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />} {e}
              </Btn>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/40">Dica: depois de SALVAR, publique direto no YouPlay Creators.</p>
        </Panel>
      </div>

      {/* Modal pós-SALVAR: opção de entrar direto no YouPlay Creators */}
      <Modal open={savedOpen} onClose={() => setSavedOpen(false)} title="Projeto salvo!">
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 text-[#B6FF2E]"><CheckCircle2 className="h-5 w-5" /> “{title}” foi salvo com sucesso.</p>
          <p className="text-white/60">Quer publicar agora? Entre direto no <b>YouPlay Creators</b> com esta conta.</p>
          <div className="flex gap-2">
            <Btn variant="accent" className="flex-1" onClick={() => { setSavedOpen(false); if (session) go('youplay'); else { toast('Creators', 'Faça login para publicar no YouPlay.', 'err'); go('baoid') } }} data-testid="goto-youplay-creators">Ir ao YouPlay Creators</Btn>
            <Btn variant="outline" onClick={() => setSavedOpen(false)}>Depois</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `0:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ================= TESAKA FORM (edição desktop; resposta desktop+mobile) ================= */
export function FormApp() {
  const { forms, formResps, patch, toast } = useStore()
  const [mode, setMode] = useState<'builder' | 'responder'>('responder')
  const isDesktop = typeof window === 'undefined' || window.innerWidth >= 1024
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  return (
    <div>
      <ScreenHeader title="TESAKA FORM" subtitle="Formulários clássicos e interativos — com correção e pontuação" icon={<FileQuestion className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={mode} onChange={m => setMode(m as 'builder' | 'responder')} tabs={[
        { id: 'responder', label: 'Resposta' },
        { id: 'builder', label: isDesktop ? 'Editor' : 'Editor (desktop)' },
      ]} />

      {mode === 'builder' && !isDesktop && <Empty text="A criação/edição de formulários está disponível somente no desktop. A resposta funciona no celular também!" />}
      {mode === 'builder' && isDesktop && <Builder onCreate={(f) => { patch({ forms: [f, ...forms] }); toast('FORM', `"${f.title}" criado!`, 'ok') }} />}

      {mode === 'responder' && (
        <div className="space-y-4" data-testid="form-responder">
          {forms.length === 0 && <Empty text="Nenhum formulário publicado. Crie no Editor (desktop)." />}
          {forms.map(f => (
            <Panel key={f.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div><h3 className="font-bold">📋 {f.title}</h3><p className="text-xs text-white/45">{f.desc}</p></div>
                <Tag>{f.fields.length} campos</Tag>
              </div>
              <FormRunner form={f} answers={answers} setAnswers={setAnswers} onSubmit={() => {
                // Correção: campo com options = 1º índice marcado como correto pelo criador? Usamos radio com options e correct implícito (primeira opção marcada com *)
                let pontos = 0
                const gradable = f.fields.filter(fd => fd.type === 'radio' && fd.options?.length)
                for (const fd of gradable) {
                  const correta = fd.options!.findIndex(o => o.startsWith('*')) >= 0 ? fd.options!.findIndex(o => o.startsWith('*')) : -1
                  if (correta >= 0 && answers[fd.id] === String(correta)) pontos++
                  else if (correta >= 0) pontos += 0
                }
                const resp: FormResp = { id: `r${Date.now()}`, formId: f.id, answers, createdAt: Date.now() }
                patch({ formResps: [resp, ...formResps] })
                const hasGrading = gradable.some(fd => fd.options!.some(o => o.startsWith('*')))
                if (hasGrading) {
                  const total = gradable.filter(fd => fd.options!.some(o => o.startsWith('*'))).length
                  toast('Resultado', pontos === total && total > 0 ? `Perfeito! ${total} Ponto(s)! 🎉` : `Você fez ${pontos} Ponto(s). Revise as questões com ERROU.`, pontos === total ? 'ok' : 'err')
                } else {
                  toast('FORM', 'Respostas enviadas com sucesso!', 'ok')
                }
              }} />
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}

function Builder({ onCreate }: { onCreate: (f: FormForm) => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [fields, setFields] = useState<FormForm['fields']>([])
  const [nf, setNf] = useState({ label: '', type: 'text' as FormForm['fields'][0]['type'] })

  return (
    <div className="space-y-4" data-testid="form-builder">
      <Panel className="space-y-3 p-5">
        <Field label="Título do formulário"><InputText value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="Descrição"><InputText value={desc} onChange={e => setDesc(e.target.value)} /></Field>
      </Panel>
      <Panel className="space-y-3 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Adicionar campo</h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
          <InputText placeholder="Pergunta / rótulo" value={nf.label} onChange={e => setNf({ ...nf, label: e.target.value })} />
          <select value={nf.type} onChange={e => setNf({ ...nf, type: e.target.value as FormForm['fields'][0]['type'] })} className="rounded-lg border border-white/15 bg-black/40 p-2 text-sm text-white">
            <option value="text">Texto</option><option value="textarea">Parágrafo</option><option value="radio">Múltipla escolha (pontuável)</option><option value="checkbox">Caixas</option><option value="select">Lista</option>
          </select>
          <Btn variant="accent" onClick={() => {
            if (!nf.label.trim()) return
            setFields(f => [...f, { id: `f${Date.now()}`, label: nf.label, type: nf.type, options: nf.type === 'radio' || nf.type === 'select' || nf.type === 'checkbox' ? ['*Opção correta', 'Opção 2'] : undefined }])
            setNf({ ...nf, label: '' })
          }}><Plus className="mr-1 h-4 w-4" /> Adicionar</Btn>
        </div>
        <p className="text-[11px] text-white/40">💡 Em múltipla escolha, marque a opção correta com <b>*</b> no início. Quem acertar recebe “1 Ponto”; quem errar vê “ERROU”.</p>
      </Panel>
      {fields.map(fd => (
        <Panel key={fd.id} className="flex items-center justify-between p-3 text-sm">
          <span><Tag>{fd.type}</Tag> <b className="ml-1">{fd.label}</b></span>
          <button className="text-white/40 hover:text-red-400" onClick={() => setFields(f => f.filter(x => x.id !== fd.id))}>✕</button>
        </Panel>
      ))}
      <Btn variant="accent" className="w-full" onClick={() => {
        if (!title.trim() || fields.length === 0) return
        onCreate({ id: `ff${Date.now()}`, title, desc, fields, createdAt: Date.now() })
        setTitle(''); setDesc(''); setFields([])
      }} data-testid="form-publish">Publicar formulário</Btn>
    </div>
  )
}

function FormRunner({ form, answers, setAnswers, onSubmit }: { form: FormForm; answers: Record<string, string | string[]>; setAnswers: (a: Record<string, string | string[]>) => void; onSubmit: () => void }) {
  const correct = (id: string, fd: FormForm['fields'][0]) => {
    if (fd.type !== 'radio' || !fd.options?.length) return null
    const ci = fd.options.findIndex(o => o.startsWith('*'))
    return ci >= 0 ? ci : null
  }
  return (
    <div className="space-y-4">
      {form.fields.map(fd => {
        const val = answers[fd.id]
        const ci = correct(fd.id, fd)
        const answered = val !== undefined
        const ok = ci !== null && val === String(ci)
        return (
          <div key={fd.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
            <p className="mb-2 text-sm font-semibold">{fd.label} {ci !== null && <span className="text-[10px] text-white/30">(pontuada)</span>}</p>
            {fd.type === 'text' && <InputText value={typeof val === 'string' ? val : ''} onChange={e => setAnswers({ ...answers, [fd.id]: e.target.value })} />}
            {fd.type === 'textarea' && <textarea rows={2} className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-sm" value={typeof val === 'string' ? val : ''} onChange={e => setAnswers({ ...answers, [fd.id]: e.target.value })} />}
            {(fd.type === 'radio' || fd.type === 'select') && (
              <div className="grid gap-1.5">
                {fd.options!.map((o, oi) => (
                  <label key={oi} className={`flex items-center gap-2 rounded border p-2 text-sm ${val === String(oi) ? 'border-[#B6FF2E] bg-[#B6FF2E]/10' : 'border-white/10'}`}>
                    <input type="radio" name={fd.id} checked={val === String(oi)} onChange={() => setAnswers({ ...answers, [fd.id]: String(oi) })} />
                    {o.replace(/^\*/, '')}
                    {answered && ci === oi && <CheckCircle2 className="ml-auto h-4 w-4 text-[#B6FF2E]" />}
                    {answered && val === String(oi) && ci !== oi && <XCircle className="ml-auto h-4 w-4 text-red-400" />}
                  </label>
                ))}
              </div>
            )}
            {fd.type === 'checkbox' && (
              <div className="grid gap-1.5">
                {fd.options!.map((o, oi) => (
                  <label key={oi} className="flex items-center gap-2 rounded border border-white/10 p-2 text-sm">
                    <input type="checkbox" checked={Array.isArray(val) && val.includes(String(oi))} onChange={e => {
                      const cur = Array.isArray(val) ? val : []
                      setAnswers({ ...answers, [fd.id]: e.target.checked ? [...cur, String(oi)] : cur.filter(x => x !== String(oi)) })
                    }} />
                    {o.replace(/^\*/, '')}
                  </label>
                ))}
              </div>
            )}
            {/* Correção visível: 1 Ponto / ERROU */}
            {answered && ci !== null && (
              ok ? <p className="mt-2 rounded bg-[#B6FF2E]/10 px-2 py-1 text-xs font-bold text-[#B6FF2E]" data-testid="score-ok">✔ 1 Ponto</p>
                 : <p className="mt-2 rounded bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400" data-testid="score-err">✖ ERROU</p>
            )}
          </div>
        )
      })}
      <Btn variant="accent" className="w-full" onClick={onSubmit} data-testid="form-submit">Enviar respostas</Btn>
    </div>
  )
}
