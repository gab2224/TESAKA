'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang, SessionUser } from '@/lib/i18n'
import { translate } from '@/lib/i18n'

export type Screen =
  | 'home' | 'baoid' | '7play' | 'youplay' | 'tesakapedia' | 'qgroup'
  | 'carta' | 'lobaiteos' | 'study' | 'school' | 'clinica' | 'creators'
  | 'form' | 'builder' | 'portal' | 'driver' | 'account'

export type Toast = { id: string; title: string; body?: string; kind?: 'ok' | 'err' | 'info' }

export type Post7 = {
  id: string
  author: string
  authorName: string
  text: string
  media?: { kind: 'image' | 'video'; url: string; name: string }
  stars: number
  estrelada?: boolean
  createdAt: number
  comments: { author: string; text: string }[]
}

export type Depoimento = {
  id: string
  author: string
  authorName: string
  text: string
  media?: { kind: 'image' | 'video'; url: string; name: string }
  createdAt: number
}

export type Quiz = {
  id: string
  title: string
  questions: { q: string; options: string[]; correct: number }[]
  deadline?: string
  classe?: string
  createdAt: number
}

export type Turma = { id: string; name: string; students: string[] }

export type Projeto = { id: string; name: string; months: number; members: string[]; createdBy: string; desc: string; createdAt: number }

export type Noticia = { id: string; title: string; date: string; body: string; author: string; createdAt: number }

export type Videoaula = { id: string; title: string; videoName?: string; docName?: string; classe: string; notes: string; createdAt: number }

export type Topico = { id: string; title: string; body: string; author: string; createdAt: number; replies: { author: string; text: string }[] }

export type Consulta = { id: string; paciente: string; data: string; diag: string; tags: string[]; medico: string }

export type Receita = { id: string; paciente: string; data: string; meds: { nome: string; dose: string; freq: string }[]; medico: string }

export type Certificado = { id: string; paciente: string; data: string; tipo: string; cid?: string; medico: string }

export type Vaga = { id: string; title: string; area: string; polo: string; createdAt: number }

export type PortalItem = { id: string; kind: 'USUARIOS' | 'CASOS' | 'POLITICOS'; title: string; body: string; createdBy: string; createdAt: number }

export type FormForm = {
  id: string
  title: string
  desc: string
  fields: { id: string; label: string; type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select'; options?: string[]; required?: boolean }[]
  createdAt: number
}
export type FormResp = { id: string; formId: string; answers: Record<string, string | string[]>; createdAt: number }

type LocalState = {
  lang: Lang
  session: SessionUser | null
  screen: Screen
  posts: Post7[]
  depoimentos: Depoimento[]
  quizzes: Quiz[]
  turmas: Turma[]
  projetos: Projeto[]
  noticias: Noticia[]
  videoaulas: Videoaula[]
  topicos: Topico[]
  consultas: Consulta[]
  receitas: Receita[]
  certificados: Certificado[]
  vagas: Vaga[]
  portal: PortalItem[]
  forms: FormForm[]
  formResps: FormResp[]
  fastTvPrograms: string[]
  builderPages: { id: string; name: string; blocks: { id: string; type: string; text: string }[] }[]
  toasts: Toast[]
  setLang: (l: Lang) => void
  setSession: (u: SessionUser | null) => void
  go: (s: Screen) => void
  t: (k: Parameters<typeof translate>[1]) => string
  toast: (title: string, body?: string, kind?: Toast['kind']) => void
  dismissToast: (id: string) => void
  patch: (p: Partial<LocalState>) => void
}

export const useStore = create<LocalState>()(
  persist(
    (set, get) => ({
      lang: 'pt',
      session: null,
      screen: 'home',
      posts: [],
      depoimentos: [],
      quizzes: [],
      turmas: [{ id: 't1', name: 'Turma A', students: ['Lucas Aluno', 'Bia Aluna', 'Caio Souza'] }],
      projetos: [],
      noticias: [],
      videoaulas: [],
      topicos: [],
      consultas: [],
      receitas: [],
      certificados: [],
      vagas: [],
      portal: [],
      forms: [],
      formResps: [],
      fastTvPrograms: ['QNews 24h', 'TV Singular — Ao Vivo', 'Cine QGroup', 'Documenta Q', 'Esporte Total'],
      builderPages: [],
      toasts: [],
      setLang: lang => set({ lang }),
      setSession: session => set({ session }),
      go: screen => set({ screen }),
      t: k => translate(get().lang, k),
      toast: (title, body, kind = 'info') => {
        const id = Math.random().toString(36).slice(2)
        set(s => ({ toasts: [...s.toasts, { id, title, body, kind }] }))
        setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4200)
      },
      dismissToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
      patch: p => set(p as LocalState),
    }),
    {
      name: 'tesaka-os-v3',
      partialize: s => ({
        lang: s.lang, session: s.session, posts: s.posts, depoimentos: s.depoimentos, quizzes: s.quizzes,
        turmas: s.turmas, projetos: s.projetos, noticias: s.noticias, videoaulas: s.videoaulas,
        topicos: s.topicos, consultas: s.consultas, receitas: s.receitas, certificados: s.certificados,
        vagas: s.vagas, portal: s.portal, forms: s.forms, formResps: s.formResps,
        fastTvPrograms: s.fastTvPrograms, builderPages: s.builderPages,
      }),
    },
  ),
)

export function refreshSessionLocal(patch: Partial<SessionUser>) {
  const s = useStore.getState()
  if (s.session) s.setSession({ ...s.session, ...patch })
}
