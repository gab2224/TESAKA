'use client'

import { useStore } from '@/lib/store'
import { Panel, Btn, Field, InputText, ScreenHeader, Modal, Tag, SubNav, Empty, PreviewPlayer } from '@/components/tesaka/ui-kit'
import { SEED_TOPICOS, SEED_VAGAS, SEED_PORTAL, fmtTime } from '@/lib/data'
import { BookOpen, Newspaper, Plus, MessageSquare, Globe2, Building2, Briefcase, Mail, Users, Hammer, Layout, FileText, HardDrive } from 'lucide-react'
import { useEffect, useState } from 'react'

/* ================= TESAKAPEDIA (3 telas) ================= */
export function TesakaPediaApp() {
  const [tela, setTela] = useState<'home' | 'conteudo' | 'noticias'>('home')
  const [artigo, setArtigo] = useState<string | null>(null)
  return (
    <div>
      <ScreenHeader title="TesakaPedia" subtitle="Enciclopédia comunitária TESAKA" icon={<BookOpen className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tela} onChange={t => { setTela(t as 'home' | 'conteudo' | 'noticias'); setArtigo(null) }} tabs={[
        { id: 'home', label: 'TesakaPedia' },
        { id: 'conteudo', label: 'Conteúdo' },
        { id: 'noticias', label: 'Notícias' },
      ]} />
      {tela === 'home' && <PediaHome onOpen={a => { setArtigo(a); setTela('conteudo') }} />}
      {tela === 'conteudo' && <PediaConteudo artigoId={artigo} />}
      {tela === 'noticias' && <PediaNoticias />}
    </div>
  )
}

function PediaHome({ onOpen }: { onOpen: (id: string) => void }) {
  const { topicos, patch, session, toast } = useStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })

  useEffect(() => { if (topicos.length === 0) patch({ topicos: SEED_TOPICOS }) }, [])

  return (
    <div className="space-y-4" data-testid="pedia-home">
      <div className="flex justify-end">
        <Btn variant="accent" size="sm" onClick={() => setOpen(true)} data-testid="new-topico"><Plus className="mr-1 h-4 w-4" /> Novo tópico</Btn>
      </div>
      {topicos.map(tp => (
        <Panel key={tp.id} className="p-4 hover:border-[#B6FF2E]/40">
          <button className="w-full text-left" onClick={() => onOpen(tp.id)}>
            <h3 className="font-bold">{tp.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/60">{tp.body}</p>
            <p className="mt-2 text-[11px] text-white/40">{tp.author} • {fmtTime(tp.createdAt)} • 💬 {tp.replies.length}</p>
          </button>
        </Panel>
      ))}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo tópico (aberto a todos os usuários)">
        <div className="space-y-3">
          <Field label="Título"><InputText value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Conteúdo">
            <textarea rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm text-white" />
          </Field>
          <Btn variant="accent" className="w-full" onClick={() => {
            if (!form.title.trim()) return
            const tp = { id: `top${Date.now()}`, title: form.title, body: form.body, author: session?.baoId || 'ANÔNIMO', createdAt: Date.now(), replies: [] }
            patch({ topicos: [tp, ...topicos] })
            setForm({ title: '', body: '' }); setOpen(false)
            toast('TesakaPedia', 'Tópico publicado!', 'ok')
          }}>Publicar tópico</Btn>
        </div>
      </Modal>
    </div>
  )
}

function PediaConteudo({ artigoId }: { artigoId: string | null }) {
  const { topicos, patch, session } = useStore()
  const [reply, setReply] = useState('')
  const artigo = topicos.find(t => t.id === artigoId)
  if (!artigo) return <Empty text="Selecione um tópico na aba TesakaPedia." />
  return (
    <div data-testid="pedia-conteudo">
      <Panel className="p-5">
        <h2 className="text-xl font-black">{artigo.title}</h2>
        <p className="mt-1 text-xs text-white/40">{artigo.author} • {fmtTime(artigo.createdAt)}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{artigo.body}</p>
      </Panel>
      <div className="mt-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><MessageSquare className="h-4 w-4" /> Respostas ({artigo.replies.length})</h3>
        <div className="space-y-2">
          {artigo.replies.map((r, i) => (
            <Panel key={i} className="p-3 text-sm"><b className="text-[#B6FF2E]">{r.author}</b> — {r.text}</Panel>
          ))}
        </div>
        {session && (
          <div className="mt-3 flex gap-2">
            <InputText placeholder="Sua resposta…" value={reply} onChange={e => setReply(e.target.value)} />
            <Btn variant="accent" onClick={() => {
              if (!reply.trim()) return
              patch({ topicos: topicos.map(t => t.id === artigo.id ? { ...t, replies: [...t.replies, { author: session.baoId, text: reply }] } : t) })
              setReply('')
            }}>Responder</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

function PediaNoticias() {
  const { noticias, patch, session, toast } = useStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: new Date().toISOString().slice(0, 10), body: '' })
  const canPost = session?.role === 'SUBADVANCER' || session?.role === 'ADVENCER'
  return (
    <div className="space-y-4" data-testid="pedia-noticias">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">Notícias publicadas apenas por SUBADVANCER (via ADM do LobaiteOS ou aqui).</p>
        {canPost && <Btn variant="accent" size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Nova notícia</Btn>}
      </div>
      {noticias.length === 0 && <Empty text="Nenhuma notícia publicada. O SubAdvancer pode criar via ADM." />}
      {noticias.map(n => (
        <Panel key={n.id} className="p-4">
          <div className="flex items-center gap-2"><Newspaper className="h-4 w-4 text-[#B6FF2E]" /><h3 className="font-bold">{n.title}</h3></div>
          <p className="mt-1 text-[11px] text-white/40">{n.date} • por {n.author}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{n.body}</p>
        </Panel>
      ))}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova notícia (SubAdvancer)">
        <div className="space-y-3">
          <Field label="Título"><InputText value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Data"><InputText type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Conteúdo"><textarea rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm text-white" /></Field>
          <Btn variant="accent" className="w-full" onClick={() => {
            if (!form.title.trim()) return
            patch({ noticias: [{ id: `n${Date.now()}`, ...form, author: session!.baoId, createdAt: Date.now() }, ...noticias] })
            setForm({ title: '', date: new Date().toISOString().slice(0, 10), body: '' }); setOpen(false)
            toast('TesakaPedia', 'Notícia publicada!', 'ok')
          }}>Publicar</Btn>
        </div>
      </Modal>
    </div>
  )
}

/* ================= QGROUP.ZIP ================= */
export function QGroupApp() {
  const { vagas, patch, toast } = useStore()
  const [show, setShow] = useState<'vagas' | 'contato' | 'quem' | null>(null)
  useEffect(() => { if (vagas.length === 0) patch({ vagas: SEED_VAGAS }) }, [])

  return (
    <div>
      <ScreenHeader title="QGROUP.ZIP" subtitle="Instituto comunitário QGroup" icon={<Globe2 className="h-5 w-5 text-[#B6FF2E]" />} />
      <div className="space-y-4">
        <Panel className="relative overflow-hidden p-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#B6FF2E]/10 to-transparent" />
          <Building2 className="relative mx-auto h-10 w-10 text-[#B6FF2E]" />
          <h2 className="relative mt-2 text-2xl font-black">QGROUP.ZIP</h2>
          <p className="relative mx-auto mt-1 max-w-md text-sm text-white/60">O instituto que conecta pessoas, polos e oportunidades na rede TESAKA.</p>
        </Panel>
        <div className="grid gap-3 sm:grid-cols-3">
          <Btn variant="outline" className="h-24 flex-col gap-1" onClick={() => setShow('vagas')} data-testid="qg-vagas"><Briefcase className="h-6 w-6 text-[#B6FF2E]" /> Vagas</Btn>
          <Btn variant="outline" className="h-24 flex-col gap-1" onClick={() => setShow('contato')} data-testid="qg-contato"><Mail className="h-6 w-6 text-[#B6FF2E]" /> Contato</Btn>
          <Btn variant="outline" className="h-24 flex-col gap-1" onClick={() => setShow('quem')} data-testid="qg-quem"><Users className="h-6 w-6 text-[#B6FF2E]" /> Quem somos</Btn>
        </div>

        {show === 'vagas' && (
          <Panel className="p-4" data-testid="vagas-panel">
            <h3 className="mb-3 font-bold">Vagas do QServer</h3>
            {vagas.map(v => (
              <div key={v.id} className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3">
                <div><p className="text-sm font-bold">{v.title}</p><p className="text-[11px] text-white/50">{v.area} • {v.polo}</p></div>
                <Btn size="sm" variant="accent" onClick={() => toast('Vagas', `Candidatura enviada: ${v.title} (demo)`, 'ok')}>Candidatar-se</Btn>
              </div>
            ))}
          </Panel>
        )}
        {show === 'contato' && (
          <Panel className="p-6 text-center" data-testid="contato-panel">
            <Mail className="mx-auto h-8 w-8 text-white/30" />
            <h3 className="mt-2 font-bold">Contato</h3>
            <p className="mt-1 text-sm text-white/50">📧 contato@qgroup.zip<br />Central: Polo Centro, Rua das Artes, 77</p>
            <Tag className="mt-3">{useStore.getState().t('comingSoon')}</Tag>
          </Panel>
        )}
        {show === 'quem' && (
          <Panel className="p-5" data-testid="quem-panel">
            <h3 className="font-bold">Quem somos</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">O QGroup é um coletivo comunitário presente em polos urbanos, dedicado a educação, cultura e tecnologia. Mantemos o TESAKA, o TV SINGULAR, as oficinas de Pontilhismo e o portal de vagas QServer — tudo construído junto com a comunidade.</p>
          </Panel>
        )}
      </div>
    </div>
  )
}

/* ================= PORTAL DA TRANSPARÊNCIA ================= */
export function PortalApp() {
  const { portal, patch, session } = useStore()
  useEffect(() => { if (portal.length === 0) patch({ portal: SEED_PORTAL }) }, [])
  const kinds = ['USUARIOS', 'CASOS', 'POLITICOS'] as const
  return (
    <div>
      <ScreenHeader title="Portal da Transparência" subtitle="Registros públicos — leitura para todos, escrita via ADM (SubAdvancer)" icon={<FileText className="h-5 w-5 text-[#B6FF2E]" />} />
      {kinds.map(k => (
        <section key={k} className="mb-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/60">{k}</h3>
          {portal.filter(p => p.kind === k).length === 0 && <Empty text="Nenhum registro deste tipo." />}
          {portal.filter(p => p.kind === k).map(p => (
            <Panel key={p.id} className="mb-2 p-4">
              <p className="font-bold">{p.title}</p>
              <p className="mt-1 text-sm text-white/65">{p.body}</p>
              <p className="mt-1 text-[11px] text-white/35">{p.createdBy} • {fmtTime(p.createdAt)}</p>
            </Panel>
          ))}
        </section>
      ))}
      {session && (session.role === 'SUBADVANCER' || session.role === 'ADVENCER') && (
        <p className="text-xs text-[#B6FF2E]">● Você é {session.role}: adicione registros no ADM do LobaiteOS.</p>
      )}
    </div>
  )
}

/* ================= TESAKA BUILDER (somente desktop) ================= */
export function BuilderApp() {
  const { builderPages, patch, toast } = useStore()
  const [page, setPage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  if (!isDesktop) {
    return (
      <div>
        <ScreenHeader title="Tesaka Builder" icon={<Hammer className="h-5 w-5 text-[#B6FF2E]" />} />
        <Panel className="p-10 text-center"><p className="text-white/60">🧱 O Tesaka Builder está disponível <b>somente no desktop</b>. Abra o TESAKA em uma tela maior.</p></Panel>
      </div>
    )
  }

  const currentPage = builderPages.find(p => p.id === page)
  const BLOCKS = ['Título', 'Texto', 'Botão', 'Imagem', 'Vídeo', 'Campo', 'Lista']

  return (
    <div>
      <ScreenHeader title="Tesaka Builder" subtitle="Monte telas arrastando blocos — construtor visual (desktop)" icon={<Hammer className="h-5 w-5 text-[#B6FF2E]" />} />
      <div className="mb-4 flex gap-2">
        <InputText placeholder="Nome da nova tela" value={name} onChange={e => setName(e.target.value)} />
        <Btn variant="accent" onClick={() => {
          if (!name.trim()) return
          const pg = { id: `pg${Date.now()}`, name, blocks: [] }
          patch({ builderPages: [...builderPages, pg] }); setPage(pg.id); setName('')
          toast('Builder', `Tela "${name}" criada.`, 'ok')
        }} data-testid="builder-create"><Plus className="mr-1 h-4 w-4" /> Criar tela</Btn>
      </div>
      {builderPages.length === 0 && <Empty text="Crie sua primeira tela para começar." />}
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Panel className="p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Blocos</h3>
          <div className="grid grid-cols-2 gap-2">
            {BLOCKS.map(b => (
              <button key={b} disabled={!currentPage} onClick={() => {
                patch({ builderPages: builderPages.map(p => p.id === page ? { ...p, blocks: [...p.blocks, { id: `b${Date.now()}`, type: b, text: `${b} do bloco` }] } : p) })
              }} className="rounded-lg border border-white/15 bg-black/30 p-2 text-sm hover:border-[#B6FF2E]/40 disabled:opacity-40" data-testid={`block-${b}`}>
                <Layout className="mr-1 inline h-3.5 w-3.5" /> {b}
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="min-h-64 p-4">
          {!currentPage ? <Empty text="Selecione ou crie uma tela." /> : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">{currentPage.name}</p>
                <div className="flex gap-2">
                  <Btn size="sm" variant="accent" onClick={() => toast('Builder', `Tela "${currentPage.name}" publicada no Builder App!`, 'ok')} data-testid="builder-publish">Publicar</Btn>
                  <Btn size="sm" variant="danger" onClick={() => { patch({ builderPages: builderPages.filter(p => p.id !== page) }); setPage(null) }}>Excluir</Btn>
                </div>
              </div>
              {currentPage.blocks.length === 0 && <Empty text="Adicione blocos da paleta à esquerda." />}
              {currentPage.blocks.map(b => (
                <div key={b.id} className="mb-2 rounded-lg border border-dashed border-white/20 bg-black/30 p-3 text-sm" data-testid="builder-block">
                  <div className="flex items-center justify-between">
                    <Tag>{b.type}</Tag>
                    <button className="text-white/40 hover:text-red-400" onClick={() => patch({ builderPages: builderPages.map(p => p.id === page ? { ...p, blocks: p.blocks.filter(x => x.id !== b.id) } : p) })}>✕</button>
                  </div>
                  {b.type === 'Título' ? <p className="mt-2 text-lg font-black">{b.text}</p> : b.type === 'Botão' ? <Btn size="sm" className="mt-2">{b.text}</Btn> : <p className="mt-2 text-white/70">{b.text}</p>}
                </div>
              ))}
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ================= TESAKA DRIVE ================= */
export function DriverApp() {
  const { toast } = useStore()
  const [files, setFiles] = useState<{ name: string; size: string }[]>([])
  return (
    <div>
      <ScreenHeader title="Tesaka Drive" subtitle="Armazenamento em nuvem TESAKA" icon={<HardDrive className="h-5 w-5 text-[#B6FF2E]" />} />
      <Panel className="p-5" >
        <input type="file" multiple className="w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white" onChange={e => {
          const fs = Array.from(e.target.files || [])
          setFiles(f => [...f, ...fs.map(f => ({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` }))]
          )
          if (fs.length) toast('Drive', `${fs.length} arquivo(s) enviados (demo).`, 'ok')
        }} data-testid="drive-upload" />
        {files.length === 0 ? <Empty text="Nenhum arquivo enviado." /> : (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm">
                <span className="truncate">📄 {f.name}</span><span className="text-white/40">{f.size}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
