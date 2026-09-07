'use client'

import { useStore, type Screen } from '@/lib/store'
import { translate } from '@/lib/i18n'
import { Panel, Btn, InputText } from '@/components/tesaka/ui-kit'
import { Search } from 'lucide-react'
import { useState } from 'react'

type AppDef = { id: Screen; label: string; desc: string; glyph: string; hue: string; role?: string }

const APPS: AppDef[] = [
  { id: 'baoid', label: 'BaoID', desc: 'Identidade digital, FaceID, documentos e KCOIN', glyph: '🆔', hue: 'from-emerald-500/30' },
  { id: '7play', label: '7Play', desc: 'Rede social: posts, comunidade, Taz.AI e ESTRELADOS', glyph: '▶️', hue: 'from-lime-500/30' },
  { id: 'youplay', label: 'YouPlay', desc: 'Streaming: Originais, FAST_TV e Creators', glyph: '🎬', hue: 'from-rose-500/30' },
  { id: 'tesakapedia', label: 'TesakaPedia', desc: 'Enciclopédia comunitária e notícias', glyph: '📚', hue: 'from-amber-500/30' },
  { id: 'carta', label: 'CARTA', desc: 'Mensagens por ID público, conversas e notas', glyph: '✉️', hue: 'from-sky-500/30' },
  { id: 'lobaiteos', label: 'LobaiteOS', desc: 'Gestão QGroup: arquivos, eventos, relatórios e ADM', glyph: '🖥️', hue: 'from-violet-500/30' },
  { id: 'school', label: 'Tesaka School', desc: 'Portal do professor (RESPONSAVEL)', glyph: '🏫', hue: 'from-orange-500/30' },
  { id: 'study', label: 'Tesaka Study', desc: 'Portal do estudante (FUNCIONARIO)', glyph: '🎓', hue: 'from-cyan-500/30' },
  { id: 'clinica', label: 'Tesaka Clinica', desc: 'Prontuário, consultas, receitas e certificados', glyph: '🩺', hue: 'from-teal-500/30' },
  { id: 'creators', label: 'Tesaka Creators', desc: 'Editor de vídeo para criadores', glyph: '🎛️', hue: 'from-fuchsia-500/30' },
  { id: 'form', label: 'TESAKA FORM', desc: 'Formulários clássicos e interativos com pontuação', glyph: '📝', hue: 'from-indigo-500/30' },
  { id: 'builder', label: 'Tesaka Builder', desc: 'Construtor de telas em blocos (desktop)', glyph: '🧱', hue: 'from-red-500/30' },
  { id: 'qgroup', label: 'QGROUP.ZIP', desc: 'Instituto: Vagas, Contato e Quem somos', glyph: '🌐', hue: 'from-neutral-500/30' },
  { id: 'portal', label: 'Portal da Transparência', desc: 'Usuários, casos e registros públicos', glyph: '🏛️', hue: 'from-stone-500/30' },
  { id: 'driver', label: 'Tesaka Drive', desc: 'Arquivos e armazenamento em nuvem', glyph: '🗂️', hue: 'from-blue-500/30' },
]

const FOOTER_FUNCS: { cmd: string; target: Screen; desc: string }[] = [
  { cmd: '/TezPedia', target: 'tesakapedia', desc: 'Abre a Tesakapédia no modo enciclopédia comunitária.' },
  { cmd: '/TezBuilder', target: 'builder', desc: 'Abre o Builder App (monte telas em blocos, desktop).' },
  { cmd: '/TezDriver', target: 'driver', desc: 'Abre o TESAKA DRIVE (armazenamento de arquivos).' },
  { cmd: '/TezCreator', target: 'creators', desc: 'Abre o editor de vídeo para criadores do YouPlay.' },
  { cmd: '/TezSchool', target: 'school', desc: 'Abre a área do professor (RESPONSAVEL) no Tesaka School.' },
  { cmd: '/TezStudy', target: 'study', desc: 'Abre a área do estudante (FUNCIONARIO) no Tesaka Study.' },
  { cmd: '/TezClinica', target: 'clinica', desc: 'Abre o prontuário do médico no Tesaka Clinica.' },
]

export default function HomeScreen() {
  const { session, go, lang, t } = useStore()
  const [query, setQuery] = useState('')

  const filtered = APPS.filter(a => (a.label + a.desc).toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-6" data-testid="home-screen">
      {/* Hero QGROUP.ZIP */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#B6FF2E]/15 via-transparent to-[#22D3EE]/10" />
        <div className="relative px-6 py-10 text-center md:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#B6FF2E]">QGROUP.ZIP</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{session ? `${translate(lang, 'welcome')}, ${session.name.split(' ')[0]}` : 'TESAKA'}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{translate(lang, 'systemOS')}</p>
          {!session && (
            <div className="mt-5 flex justify-center gap-2">
              <Btn variant="accent" onClick={() => go('baoid')} data-testid="hero-login">{translate(lang, 'login')}</Btn>
              <Btn variant="outline" onClick={() => go('baoid')} data-testid="hero-register">{translate(lang, 'register')}</Btn>
            </div>
          )}
          {session && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-[#B6FF2E]" /> {session.baoId} • {session.role} • {session.kcoins} KC
            </p>
          )}
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
        <InputText placeholder={translate(lang, 'search') + ' apps…'} value={query} onChange={e => setQuery(e.target.value)} className="pl-9" data-testid="home-search" />
      </div>

      {/* Grade de apps */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/40">{translate(lang, 'apps')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map(a => (
            <button key={a.id} onClick={() => go(a.id)} data-testid={`app-${a.id}`}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0e0e15] p-4 text-left transition hover:border-[#B6FF2E]/40 hover:bg-[#12121c]">
              <div className={`absolute inset-0 bg-gradient-to-br ${a.hue} to-transparent opacity-0 transition group-hover:opacity-100`} />
              <div className="relative">
                <span className="text-2xl">{a.glyph}</span>
                <p className="mt-2 text-sm font-bold">{a.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-white/50">{a.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Rodapé de funções /Tez* (requisito TESAKA HOME) */}
      <Panel className="p-4" >
        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">{translate(lang, 'footerDesc')}</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {FOOTER_FUNCS.map(f => (
            <button key={f.cmd} onClick={() => go(f.target)} data-testid={`footer-${f.cmd}`}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3 text-left transition hover:border-[#B6FF2E]/40">
              <code className="shrink-0 rounded bg-[#B6FF2E]/15 px-2 py-1 text-[11px] font-bold text-[#B6FF2E]">{f.cmd}</code>
              <span className="text-xs text-white/60">{f.desc}</span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
