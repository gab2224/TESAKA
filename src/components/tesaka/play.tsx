'use client'

import { useStore, type Post7, type Depoimento } from '@/lib/store'
import { Panel, Btn, Field, InputText, ScreenHeader, Modal, Tag, SubNav, Empty, MediaPicker, PreviewPlayer } from '@/components/tesaka/ui-kit'
import { SEED_POSTS, SEED_DEPOIMENTOS, TAZ_CAPABILITIES, TV_SINGULAR, PONTILHISMO_ATIVIDADES, fmtTime } from '@/lib/data'
import { Plus, Star, Send, Sparkles, User as UserIcon, PlayCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MAX_VIDEO_SEC = 180 // 3 minutos

export default function SevenPlayApp() {
  const { session } = useStore()
  const [tab, setTab] = useState('play')

  useEffect(() => {
    const { posts, depoimentos, patch } = useStore.getState()
    const needsFix = posts.some(p => !p.createdAt || !p.comments || p.stars === undefined)
    const fixed = posts.map(p => ({ ...p, createdAt: p.createdAt || Date.now(), comments: p.comments || [], stars: p.stars || 0 }))
    if (posts.length === 0) patch({ posts: SEED_POSTS as Post7[] })
    else if (needsFix) patch({ posts: fixed })
    if (depoimentos.length === 0) patch({ depoimentos: SEED_DEPOIMENTOS as Depoimento[] })
  }, [])

  return (
    <div>
      <ScreenHeader title="7Play" subtitle="Rede social do universo TESAKA" icon={<PlayCircle className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tab} onChange={setTab} tabs={[
        { id: 'play', label: 'TELA_PLAY' },
        { id: 'comunidade', label: 'TELA_COMUNIDADE' },
        { id: 'taz', label: 'TELA_TAZ.AI' },
        { id: 'user', label: 'TELA_USER' },
      ]} />
      {tab === 'play' && <PlayTab />}
      {tab === 'comunidade' && <ComunidadeTab />}
      {tab === 'taz' && <TazTab />}
      {tab === 'user' && session && <UserTab baoId={session.baoId} />}
      {tab === 'user' && !session && <Empty text="Faça login para ver seu perfil." />}
    </div>
  )
}

function PostCard({ post }: { post: Post7 }) {
  const { session, toast, t } = useStore()
  const estrelado = (() => { try { return (JSON.parse(session?.estrelados || '[]') as string[]).includes(post.id) } catch { return false } })()
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')

  const estrelar = async () => {
    if (!session) return
    const list: string[] = JSON.parse(session.estrelados || '[]')
    const next = list.includes(post.id) ? list.filter(x => x !== post.id) : [...list, post.id]
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baoId: session.baoId, estrelados: JSON.stringify(next) }) })
    refresh(post.id, next.includes(post.id))
    useStore.getState().patch({ posts: useStore.getState().posts.map(p => p.id === post.id ? { ...p, stars: p.stars + (next.includes(post.id) && !list.includes(post.id) ? 1 : -1) } : p) })
    toast(t('estrelado'), next.includes(post.id) ? 'Post salvo na sua conta (TELA_USER)' : 'Removido dos ESTRELADOS', 'ok')
  }

  const refresh = (id: string, on: boolean) => {
    const s = useStore.getState()
    if (s.session) s.setSession({ ...s.session, estrelados: JSON.stringify((JSON.parse(s.session.estrelados || '[]') as string[]).filter(x => x !== id).concat(on ? [id] : [])) })
  }

  const commentar = () => {
    if (!comment.trim()) return
    const s = useStore.getState()
    s.patch({ posts: s.posts.map(p => p.id === post.id ? { ...p, comments: [...p.comments, { author: s.session?.baoId || 'ANÔNIMO', text: comment }] } : p) })
    setComment('')
  }

  return (
    <Panel className="overflow-hidden" data-testid="post-card">
      <div className="flex items-center gap-2 border-b border-white/5 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#B6FF2E] to-[#22D3EE] text-xs font-black text-black">{post.authorName.slice(0, 2).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{post.authorName} {post.estrelada && <Star className="inline h-3.5 w-3.5 fill-[#B6FF2E] text-[#B6FF2E]" />}</p>
          <p className="truncate text-[11px] text-white/40">{post.author} • {fmtTime(post.createdAt)}</p>
        </div>
      </div>
      <p className="px-4 py-3 text-sm">{post.text}</p>
      {post.media?.kind === 'image' && <img src={post.media.url} alt={post.media.name} className="max-h-80 w-full object-cover" />}
      {post.media?.kind === 'video' && <PreviewPlayer name={post.media.name} duration={post.media.url ? undefined : undefined} compact />}
      <div className="flex items-center gap-3 border-t border-white/5 px-4 py-2.5">
        <button onClick={estrelar} className={`flex items-center gap-1.5 text-xs font-bold ${estrelado ? 'text-[#B6FF2E]' : 'text-white/60 hover:text-white'}`} data-testid="estrelar-btn">
          <Star className={`h-4 w-4 ${estrelado ? 'fill-[#B6FF2E]' : ''}`} /> ESTRELADO
        </button>
        <span className="text-xs text-white/40">⭐ {post.stars}</span>
        <button onClick={() => setShowComments(s => !s)} className="ml-auto text-xs text-white/60 hover:text-white">💬 {post.comments.length}</button>
      </div>
      {showComments && (
        <div className="space-y-2 border-t border-white/5 bg-black/20 p-3">
          {post.comments.map((c, i) => (
            <div key={i} className="rounded bg-white/5 p-2 text-xs"><b className="text-[#B6FF2E]">{c.author}</b> — {c.text}</div>
          ))}
          <div className="flex gap-2">
            <InputText placeholder="Comentar…" value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && commentar()} />
            <Btn size="sm" variant="accent" onClick={commentar}><Send className="h-3.5 w-3.5" /></Btn>
          </div>
        </div>
      )}
    </Panel>
  )
}

/* ---------- TELA_PLAY ---------- */
function PlayTab() {
  const { posts, patch, session, toast, t } = useStore()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [media, setMedia] = useState<{ kind: 'image' | 'video'; url: string; name: string; durationSec?: number } | undefined>()

  const publish = () => {
    if (!text.trim() && !media) { toast(t('newPost'), 'Escreva algo ou escolha uma arte (imagem/vídeo).', 'err'); return }
    if (media?.kind === 'video' && (media.durationSec || 0) > MAX_VIDEO_SEC) {
      toast('Vídeo longo', 'Limite de 3 minutos no 7Play. Recomendamos enviar este vídeo ao YouPlay!', 'err')
      return
    }
    if (!media?.url) {
      // URL de objeto não persiste entre sessões — para o feed, guardamos vídeo só nesta sessão
    }
    const post: Post7 = {
      id: `p${Date.now()}`,
      author: session?.baoId || 'ANÔNIMO',
      authorName: session?.name || 'Visitante',
      text,
      media: media ? { kind: media.kind, url: media.url, name: media.name } : undefined,
      stars: 0,
      createdAt: Date.now(),
      comments: [],
    }
    patch({ posts: [post, ...posts] })
    setText(''); setMedia(undefined); setOpen(false)
    toast(t('newPost'), media?.kind === 'video' ? 'Publicado! (dica: vídeos longos → YouPlay)' : 'Publicado no feed!', 'ok')
  }

  const featured = posts.filter(p => p.estrelada)
  return (
    <div className="space-y-4" data-testid="tela-play">
      <Btn variant="accent" onClick={() => setOpen(true)} data-testid="new-post-btn"><Plus className="mr-1 h-4 w-4" /> {t('newPost')}</Btn>

      {/* ESTRELADOS = DESTACADOS */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
          <Star className="h-3.5 w-3.5 fill-[#B6FF2E] text-[#B6FF2E]" /> {t('featured')}
        </h3>
        {featured.length === 0 ? <Empty text="Contas ESTRELADAS sem publicações no momento." /> : (
          <div className="space-y-3">{featured.map(p => <PostCard key={p.id} post={p} />)}</div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-white/40">Feed</h3>
        {posts.length === 0 ? <Empty text="Nada no feed ainda. Crie o primeiro post!" /> : (
          <div className="space-y-3" data-testid="feed">{posts.map(p => <PostCard key={p.id} post={p} />)}</div>
        )}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title={t('newPost')}>
        <div className="space-y-4">
          <Field label="Texto">
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="No que você está pensando?" className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm text-white placeholder:text-white/30" data-testid="post-text" />
          </Field>
          <Field label="Escolha a arte do post (imagem ou vídeo — máx. 3 min)">
            <MediaPicker value={media} onChange={m => {
              if (m?.kind === 'video' && (m.durationSec || 0) > MAX_VIDEO_SEC) {
                toast('Vídeo longo', '7Play aceita até 3 minutos. Recomendamos enviar ao YouPlay.', 'err')
                return
              }
              setMedia(m)
            }} id="post-media" />
          </Field>
          <Btn variant="accent" className="w-full" onClick={publish} data-testid="publish-post">Publicar</Btn>
        </div>
      </Modal>
    </div>
  )
}

/* ---------- TELA_COMUNIDADE ---------- */
function ComunidadeTab() {
  const { depoimentos, patch, session, toast, t } = useStore()
  const [text, setText] = useState('')
  const [media, setMedia] = useState<{ kind: 'image' | 'video'; url: string; name: string; durationSec?: number } | undefined>()

  const send = () => {
    if (!text.trim() && !media) return
    const d: Depoimento = {
      id: `d${Date.now()}`,
      author: session?.baoId || 'ANÔNIMO',
      authorName: session?.name || 'Visitante',
      text,
      media: media ? { kind: media.kind, url: media.url, name: media.name } : undefined,
      createdAt: Date.now(),
    }
    patch({ depoimentos: [d, ...depoimentos] })
    setText(''); setMedia(undefined)
    toast('Comunidade', 'Depoimento publicado!', 'ok')
  }

  return (
    <div className="space-y-4" data-testid="tela-comunidade">
      <Panel className="space-y-3 p-4">
        <Field label="Seu depoimento">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Compartilhe sua experiência com o 7Play…" className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm text-white placeholder:text-white/30" />
        </Field>
        <div className="flex items-end gap-2">
          <div className="flex-1"><MediaPicker value={media} onChange={setMedia} id="depo-media" /></div>
        </div>
        <div className="flex gap-2">
          <Btn variant="accent" onClick={send} data-testid="depo-send"><Send className="mr-1 h-4 w-4" /> Enviar</Btn>
        </div>
      </Panel>
      {depoimentos.map(d => (
        <Panel key={d.id} className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">{d.authorName.slice(0, 2).toUpperCase()}</div>
            <div><p className="text-sm font-bold">{d.authorName}</p><p className="text-[11px] text-white/40">{d.author} • {fmtTime(d.createdAt)}</p></div>
          </div>
          <p className="mt-2 text-sm text-white/80">{d.text}</p>
          {d.media?.kind === 'image' && <img src={d.media.url} alt={d.media.name} className="mt-2 max-h-64 rounded-lg object-cover" />}
          {d.media?.kind === 'video' && <div className="mt-2"><PreviewPlayer name={d.media.name} compact /></div>}
        </Panel>
      ))}
    </div>
  )
}

/* ---------- TELA_TAZ.AI ---------- */
function TazTab() {
  const { session, patch } = useStore()
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: 'Olá! Eu sou a Taz.AI, agente oficial do TV SINGULAR e do ecossistema TESAKA. Veja o que posso fazer:\n\n' + TAZ_CAPABILITIES.join('\n') },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const answer = (q: string): string => {
    const l = q.toLowerCase()
    // Comando de voto (apenas texto)
    if (l.includes('taz no reality') || (l.includes('voto') && l.includes('programa'))) {
      const m = q.match(/pra\s+(?:o\s+|a\s+)?(?:programa\s+)?(.+)/i)
      const prog = m ? m[1].trim() : 'TV Singular'
      return `🗳️ Voto registrado (participação apenas por texto, como manda a casa): **"${prog}"** no TV SINGULAR!\n\nPlacar atual:\n${TV_SINGULAR.placar.map(p => `• ${p.nome} — ${p.pts} pts`).join('\n')}\n\nA votação ao vivo abre todos os dias às 19h30.`
    }
    // Publicar frase (FRASE)
    if (l.includes('publicar frase') || l.includes('frase)')) {
      const m = q.match(/publicar frase\s*\((.+)\)/i)
      const frase = m ? m[1] : q.replace(/publicar frase/i, '').trim()
      if (frase) {
        const post: Post7 = {
          id: `p${Date.now()}`, author: session?.baoId || 'ANÔNIMO', authorName: (session?.name || 'Visitante') + ' • via Taz.AI',
          text: `✍️ ${frase}`, stars: 0, createdAt: Date.now(), comments: [],
        }
        patch({ posts: [post, ...useStore.getState().posts] })
        return `✍️ Frase publicada no painel Texts da TELA_PLAY: "${frase}". Confira no feed!`
      }
    }
    // Programação / novelas / placar
    if (l.includes('programa') || l.includes('hoje') || l.includes('grade')) {
      return `📺 Programação TV SINGULAR de hoje:\n${TV_SINGULAR.programas.map(p => `• ${p}`).join('\n')}`
    }
    if (l.includes('novela')) {
      return `🍿 Novelas em cartaz:\n${TV_SINGULAR.novelas.map(n => `• ${n}`).join('\n')}`
    }
    if (l.includes('placar') || l.includes('ponto')) {
      return `📊 Placar TV SINGULAR:\n${TV_SINGULAR.placar.map((p, i) => `${i + 1}º ${p.nome} — ${p.pts} pts`).join('\n')}`
    }
    // Pontilhismo
    if (l.includes('pontilhismo')) {
      return `🎨 Atividades Pontilhismo perto de você:\n${PONTILHISMO_ATIVIDADES.map(a => `• ${a.nome} — ${a.quando} (${a.local})`).join('\n')}`
    }
    // Vagas QServer
    if (l.includes('vaga') || l.includes('qserver') || l.includes('emprego')) {
      return `💼 Vagas do QServer:\n• Monitor Comunitário — Pontilhismo (Polo Centro)\n• Editor de Vídeo — YouPlay Creators (Matriz)\n• Professor Voluntário — Tesaka School\nAbra o app QGROUP.ZIP → Vagas para se candidatar.`
    }
    // YouPlay notificações
    if (l.includes('youplay')) {
      return `🔔 Canal monitorado: "YouPlay Originais" publicou "Órbita Q — T2 E5" ontem às 20h. Assinantes receberam aviso no sino. Quer dicas de categorias? Temos AÇÃO, AVENTURA, COMÉDIA, DANÇA, DOCUMENTARIO, ESPORTE, DRAMA, SCIFY, FICÇÃO, MISTÉRIO, MUSICAL, ROMANCE e TERROR!`
    }
    // ESTRELADAS
    if (l.includes('estrelada') || l.includes('destacad')) {
      return `⭐ Contas ESTRELADAS (DESTACADOS) do 7Play com publicação nova: Maria Silva ("Acabei de assistir Órbita Q") e SubAdvancer QGroup (novas vagas). Ative o sino para não perder!`
    }
    if (l.includes('7play')) {
      return `▶️ No 7Play você publica posts com imagem ou vídeo (até 3 min — vídeos longos vão para o YouPlay), estrela publicações e acompanha os DESTACADOS (ESTRELADOS). A Tela Comunidade aceita depoimentos com foto/vídeo!`
    }
    if (l.includes('baoid')) {
      return `🆔 O BaoID é sua identidade: cadastro real, FaceID simulado, verificação de documentos e KCOIN com transferências reais entre contas. IDs QGROUP ainda têm o botão QOS para o LobaiteOS!`
    }
    return `Sou a Taz.AI — agente do TV SINGULAR 📺. Posso: registrar seu voto por texto ("Taz no Reality — quero meu voto pra programa X"), publicar frases ("Publicar frase (…)"), trazer programação, novelas e placar do TV Singular, atividades Pontilhismo, Vagas do QServer e avisos de YouPlay e contas ESTRELADAS. O que você quer?`
  }

  const sendMsg = () => {
    if (!input.trim()) return
    const q = input
    setMsgs(m => [...m, { me: true, text: q }])
    setInput('')
    setTimeout(() => setMsgs(m => [...m, { me: false, text: answer(q) }]), 500)
  }

  return (
    <div className="mx-auto max-w-2xl" data-testid="tela-taz">
      <Panel className="flex h-[60vh] flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <Sparkles className="h-5 w-5 text-[#B6FF2E]" />
          <div><p className="text-sm font-bold">Taz.AI</p><p className="text-[11px] text-white/40">Agente oficial do TV SINGULAR</p></div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          {msgs.map((m, i) => (
            <div key={i} className={`whitespace-pre-wrap rounded-xl p-3 max-w-[85%] ${m.me ? 'ml-auto bg-[#B6FF2E] text-black' : 'bg-white/8 border border-white/10'}`} data-testid={m.me ? 'taz-msg-me' : 'taz-msg-ai'}>{m.text}</div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t border-white/10 p-3">
          <InputText placeholder="Ex: Taz no Reality — quero meu voto pra programa A Casa Q" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} data-testid="taz-input" />
          <Btn variant="accent" onClick={sendMsg} data-testid="taz-send"><Send className="h-4 w-4" /></Btn>
        </div>
      </Panel>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Taz no Reality — quero meu voto pra programa A Casa Q', 'Publicar frase (a arte muda quem assiste)', 'Qual a programação de hoje?', 'Pontilhismo perto de mim', 'Vagas do QServer'].map(s => (
          <button key={s} onClick={() => setInput(s)} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] hover:border-[#B6FF2E]/50">{s}</button>
        ))}
      </div>
    </div>
  )
}

/* ---------- TELA_USER ---------- */
function UserTab({ baoId }: { baoId: string }) {
  const { posts, t } = useStore()
  const estrelados: string[] = (() => { try { return JSON.parse(useStore.getState().session?.estrelados || '[]') } catch { return [] } })()
  const my = posts.filter(p => p.author === baoId)
  const starred = posts.filter(p => estrelados.includes(p.id))
  return (
    <div className="space-y-4" data-testid="tela-user">
      <Panel className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B6FF2E] to-[#22D3EE] text-xl font-black text-black"><UserIcon className="h-7 w-7" /></div>
          <div>
            <p className="text-lg font-bold">{useStore.getState().session?.name}</p>
            <p className="text-sm text-white/50">{baoId}</p>
            <div className="mt-1 flex gap-2">
              <Tag>{my.length} posts</Tag>
              <Tag>⭐ {estrelados.length} {t('estrelado')}</Tag>
            </div>
          </div>
        </div>
      </Panel>
      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-white/40">Publicações</h3>
        {my.length === 0 ? <Empty text="Você ainda não publicou nada." /> : <div className="space-y-3">{my.map(p => <PostCard key={p.id} post={p} />)}</div>}
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-white/40">{t('estrelado')} (salvo na conta)</h3>
        {starred.length === 0 ? <Empty text="Estrelar posts no feed para salvá-los aqui." /> : <div className="space-y-3">{starred.map(p => <PostCard key={p.id} post={p} />)}</div>}
      </section>
    </div>
  )
}
