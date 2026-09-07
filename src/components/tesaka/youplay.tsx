'use client'

import { useStore } from '@/lib/store'
import { Panel, Btn, Field, InputText, ScreenHeader, Modal, Tag, SubNav, Empty, PreviewPlayer } from '@/components/tesaka/ui-kit'
import { YP_CATEGORIES, titlesForCat, type YpTitle } from '@/lib/data'
import { ChevronRight, Play, Plus, Tv, Clapperboard, Upload } from 'lucide-react'
import { useState } from 'react'

export default function YouPlayApp() {
  const [tab, setTab] = useState('originais')
  return (
    <div>
      <ScreenHeader title="YouPlay" subtitle="Streaming TESAKA — Originais, FAST_TV e Creators" icon={<Clapperboard className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tab} onChange={setTab} tabs={[
        { id: 'originais', label: 'Originais' },
        { id: 'fasttv', label: 'FAST_TV' },
        { id: 'creators', label: 'YouPlay Creators' },
      ]} />
      {tab === 'originais' && <Originais />}
      {tab === 'fasttv' && <FastTv />}
      {tab === 'creators' && <CreatorsArea />}
    </div>
  )
}

function Poster({ title }: { title: YpTitle }) {
  return (
    <div className="relative flex h-28 items-end overflow-hidden rounded-lg border border-white/10 p-2"
      style={{ background: `linear-gradient(135deg, hsl(${title.hue} 65% 25%), hsl(${(title.hue + 60) % 360} 70% 12%))` }}>
      <span className="absolute right-1.5 top-1.5"><Tag>{title.kind === 'serie' ? `SÉRIE • ${title.episodes} EP` : 'FILME'}</Tag></span>
      <p className="text-xs font-bold leading-tight drop-shadow">{title.name}</p>
    </div>
  )
}

function PlayerModal({ title, onClose }: { title: YpTitle | null; onClose: () => void }) {
  const [ep, setEp] = useState(1)
  const pool = title ? titlesForCat(title.cat).filter(t => t.kind === (title.kind === 'serie' ? 'serie' : 'filme')) : []
  const next = title ? pool[(pool.findIndex(t => t.id === title.id) + 1) % pool.length] : null
  if (!title) return null
  const dur = title.kind === 'serie' ? '0:42:15' : `1:${String(20 + (title.hue % 30)).padStart(2, '0')}:00`
  return (
    <Modal open onClose={onClose} title={title.kind === 'serie' ? `${title.name} — Ep. ${ep}/${title.episodes}` : title.name} wide>
      <div data-testid="yp-player">
        <PreviewPlayer name={title.kind === 'serie' ? `${title.name} — Ep. ${ep}` : title.name} duration={dur} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tag>{title.cat}</Tag><Tag>{title.kind === 'serie' ? `Série • ${title.episodes} episódios` : `Filme • ${title.duration}`}</Tag>
          {title.kind === 'serie' && (
            <Btn size="sm" variant="outline" onClick={() => setEp(e => Math.min(title.episodes!, e + 1))}>Próximo episódio</Btn>
          )}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
            {title.kind === 'serie' ? 'Próximo da série (ao terminar)' : 'A seguir — mesmo gênero'}
          </p>
          {next && (
            <button className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-2 text-left hover:border-[#B6FF2E]/40" data-testid="next-video">
              <div className="w-28 shrink-0"><Poster title={next} /></div>
              <div>
                <p className="text-sm font-bold">{next.name}</p>
                <p className="text-[11px] text-white/50">{next.kind === 'serie' ? `Série • ${next.episodes} EP` : `Filme • ${next.duration}`}</p>
              </div>
              <Play className="ml-auto h-4 w-4 text-[#B6FF2E]" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Originais() {
  const [playing, setPlaying] = useState<YpTitle | null>(null)
  const [catalog, setCatalog] = useState<{ cat: string; items: YpTitle[] } | null>(null)
  const [row, setRow] = useState<{ cat: string; base: number } | null>(null)

  return (
    <div className="space-y-6" data-testid="yp-originais">
      {YP_CATEGORIES.map(cat => {
        const titles = titlesForCat(cat)
        return (
          <section key={cat}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">{cat}</h3>
              <button onClick={() => setCatalog({ cat, items: titles })} className="flex items-center gap-1 text-xs font-bold text-[#B6FF2E]" data-testid={`more-${cat}`}>
                Ver tudo <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {(row?.cat === cat ? titles : titles.slice(0, 4)).map(t => (
                <button key={t.id} onClick={() => { setRow({ cat, base: 0 }); setPlaying(t) }} data-testid={`yp-title-${t.name}`}>
                  <Poster title={t} />
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <Modal open={!!catalog} onClose={() => setCatalog(null)} title={`Categoria ${catalog?.cat} — catálogo completo`} wide>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="yp-catalog">
          {catalog?.items.map(t => (
            <button key={t.id} onClick={() => { setCatalog(null); setPlaying(t) }}>
              <Poster title={t} />
              <p className="mt-1 text-[11px] text-white/50">{t.duration}</p>
            </button>
          ))}
        </div>
      </Modal>
      <PlayerModal title={playing} onClose={() => setPlaying(null)} />
    </div>
  )
}

function FastTv() {
  const { fastTvPrograms, patch, toast } = useStore()
  const [playing, setPlaying] = useState<string | null>(null)
  const [newProg, setNewProg] = useState('')
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-4" data-testid="fast-tv">
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2"><Tv className="h-5 w-5 text-[#B6FF2E]" /><p className="font-bold">FAST_TV — canais ao vivo</p></div>
        <Btn size="sm" variant="accent" onClick={() => setAdding(a => !a)} data-testid="add-program"><Plus className="mr-1 h-4 w-4" /> Adicionar programa</Btn>
      </Panel>
      {adding && (
        <Panel className="flex gap-2 p-4">
          <InputText placeholder="Nome do programa (ex: Talk Q 22h)" value={newProg} onChange={e => setNewProg(e.target.value)} data-testid="program-name" />
          <Btn variant="accent" onClick={() => {
            if (!newProg.trim()) return
            patch({ fastTvPrograms: [newProg, ...fastTvPrograms] })
            toast('FAST_TV', `Programa "${newProg}" adicionado à grade!`, 'ok')
            setNewProg(''); setAdding(false)
          }} data-testid="confirm-program">Adicionar</Btn>
        </Panel>
      )}
      {playing && (
        <Panel className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">AO VIVO — {playing}</p>
            <Btn size="sm" variant="ghost" onClick={() => setPlaying(null)}>Fechar player</Btn>
          </div>
          <PreviewPlayer name={`FAST_TV • ${playing}`} duration="0:59:59" />
        </Panel>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {fastTvPrograms.map(p => (
          <Panel key={p} className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <p className="truncate text-sm font-bold">{p}</p>
            </div>
            <button onClick={() => setPlaying(p)} className="w-full" data-testid={`fasttv-play-${p}`}>
              <PreviewPlayer name={p} duration="0:59:59" compact />
            </button>
            <p className="mt-1.5 text-center text-[10px] text-white/40">Toque no player — preview no próprio card, sem sair da tela</p>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function CreatorsArea() {
  const { session, go, toast } = useStore()
  return (
    <div className="mx-auto max-w-2xl space-y-4" data-testid="yp-creators">
      <Panel className="p-5 text-center">
        <Upload className="mx-auto h-10 w-10 text-[#B6FF2E]" />
        <h3 className="mt-2 font-bold">YouPlay Creators</h3>
        <p className="text-sm text-white/50">Publique vídeos longos, séries e aulas. Edite no Tesaka Creators e salve direto aqui.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Btn variant="accent" onClick={() => { if (session) go('creators'); else toast('YouPlay', 'Faça login para publicar como criador.', 'err') }}>Abrir editor no Tesaka Creators</Btn>
          <Btn variant="outline" onClick={() => toast('YouPlay Creators', 'Canal: ' + (session?.baoId || 'visitante') + ' — 0 inscritos, 0 vídeos (demo).')}>Meu canal</Btn>
        </div>
      </Panel>
      <Panel className="p-4">
        <p className="text-xs text-white/50">Dica da Taz.AI: vídeos enviados ao 7Play com mais de 3 minutos são automaticamente recomendados ao YouPlay. 📺</p>
      </Panel>
    </div>
  )
}
