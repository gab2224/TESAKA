'use client'

import { useStore } from '@/lib/store'
import { LANGS, translate } from '@/lib/i18n'
import { Btn, Panel } from '@/components/tesaka/ui-kit'
import { Bell, Globe, LogOut, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import HomeScreen from '@/components/tesaka/home'
import BaoIdApp from '@/components/tesaka/baoid'
import SevenPlayApp from '@/components/tesaka/play'
import YouPlayApp from '@/components/tesaka/youplay'
import { TesakaPediaApp, QGroupApp, PortalApp, BuilderApp, DriverApp } from '@/components/tesaka/apps-a'
import { CartaApp, LobaiteOSApp } from '@/components/tesaka/apps-b'
import { SchoolApp, StudyApp } from '@/components/tesaka/apps-c'
import { ClinicaApp, CreatorsApp, FormApp } from '@/components/tesaka/apps-d'
import type { Notification } from '@prisma/client'

type Notif = Pick<Notification, 'id' | 'toBaoId' | 'fromBaoId' | 'type' | 'title' | 'body' | 'read' | 'createdAt'>

export default function TesakaRoot() {
  const { screen, session, lang, setLang, go, toasts, dismissToast, toast, setSession } = useStore()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k)

  useEffect(() => {
    fetch('/api/seed').catch(() => null)
  }, [])

  useEffect(() => {
    if (!session) { setNotifs([]); return }
    let alive = true
    const load = async () => {
      try {
        const r = await fetch(`/api/notifications?baoId=${encodeURIComponent(session.baoId)}`)
        const j = await r.json()
        if (alive && j.ok) setNotifs(j.items)
      } catch { /* silencioso */ }
    }
    load()
    const iv = setInterval(load, 8000)
    return () => { alive = false; clearInterval(iv) }
  }, [session, screen])

  const unread = notifs.filter(n => !n.read).length

  const acceptInvite = async (n: Notif) => {
    if (!session) return
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: n.title.includes('KCoins') ? 'noop' : 'accept', from: session.baoId, notificationId: n.id }),
    })
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) })
    toast('CARTA', 'Conversa criada! Abra o CARTA para conversar.', 'ok')
    go('carta')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07070b] text-white" style={{ backgroundImage: 'radial-gradient(1200px 500px at 80% -10%, rgba(182,255,46,.07), transparent), radial-gradient(900px 400px at 0% 0%, rgba(34,211,238,.06), transparent)' }}>
      {/* Barra global */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <button onClick={() => go('home')} className="flex items-center gap-2" data-testid="logo-tesaka">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B6FF2E] font-black text-black">Q</span>
            <span className="text-sm font-black tracking-widest">TESAKA</span>
          </button>
          <div className="flex-1" />
          <div className="relative">
            <Btn variant="ghost" size="sm" onClick={() => setLangOpen(o => !o)} aria-label={t('language')} data-testid="lang-btn">
              <Globe className="h-4 w-4" /> <span className="hidden text-xs uppercase sm:inline">{lang}</span>
            </Btn>
            {langOpen && (
              <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-white/15 bg-[#101018] p-1 shadow-xl">
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); if (session) fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baoId: session.baoId, language: l.code }) }) }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/10 ${lang === l.code ? 'text-[#B6FF2E]' : 'text-white/80'}`} data-testid={`lang-${l.code}`}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {session && (
            <div className="relative">
              <Btn variant="ghost" size="sm" onClick={() => setBellOpen(o => !o)} aria-label={t('notifications')} data-testid="bell-btn">
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white" data-testid="unread-count">{unread}</span>}
              </Btn>
              {bellOpen && (
                <div className="absolute right-0 top-10 z-50 max-h-96 w-80 overflow-y-auto rounded-lg border border-white/15 bg-[#101018] p-2 shadow-xl" data-testid="notif-drawer">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/50">{t('notifications')}</span>
                    {notifs.length > 0 && (
                      <button className="text-[11px] text-[#B6FF2E]" onClick={async () => {
                        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readAllFor: session.baoId }) })
                        setNotifs(ns => ns.map(n => ({ ...n, read: true })))
                      }}>{lang === 'pt' ? 'marcar todas como lidas' : lang === 'en' ? 'mark all as read' : lang === 'es' ? 'marcar todas como leídas' : 'tout marquer comme lu'}</button>
                    )}
                  </div>
                  {notifs.length === 0 && <p className="px-2 py-6 text-center text-xs text-white/40">{t('noNotifications')}</p>}
                  {notifs.map(n => (
                    <div key={n.id} className={`mb-1 rounded-lg border p-2.5 text-xs ${n.read ? 'border-white/5 bg-white/[.02] text-white/60' : 'border-[#B6FF2E]/30 bg-[#B6FF2E]/5'}`} data-testid="notif-item">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-white/60">{n.body}</p>}
                          <p className="mt-1 text-[10px] text-white/30">{n.type} • {new Date(n.createdAt).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}</p>
                        </div>
                        {n.type === 'CARTA_INVITE' && !n.read && (
                          <div className="flex shrink-0 flex-col gap-1">
                            <button className="rounded bg-[#B6FF2E] px-2 py-0.5 font-bold text-black" onClick={() => acceptInvite(n)} data-testid="accept-carta">{t('accept')}</button>
                            <button className="rounded bg-white/10 px-2 py-0.5" onClick={async () => { await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', notificationId: n.id }) }); setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x)) }}>{t('reject')}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {session ? (
            <div className="flex items-center gap-2">
              <button onClick={() => go('account')} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 hover:bg-white/10" data-testid="user-chip">
                <User className="h-4 w-4 text-[#B6FF2E]" />
                <span className="max-w-[120px] truncate text-xs font-semibold">{session.baoId}</span>
                <span className="hidden rounded-full bg-[#B6FF2E]/15 px-2 py-0.5 text-[10px] font-bold text-[#B6FF2E] sm:inline">{session.kcoins} KC</span>
              </button>
              <Btn variant="ghost" size="sm" onClick={() => { setSession(null); go('home') }} aria-label={t('logout')}><LogOut className="h-4 w-4" /></Btn>
            </div>
          ) : (
            <Btn variant="accent" size="sm" onClick={() => go('baoid')} data-testid="header-login">{t('login')}</Btn>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {screen === 'home' && <HomeScreen />}
        {screen === 'baoid' && <BaoIdApp />}
        {screen === 'account' && <BaoIdApp initialTab="perfil" />}
        {screen === '7play' && <SevenPlayApp />}
        {screen === 'youplay' && <YouPlayApp />}
        {screen === 'tesakapedia' && <TesakaPediaApp />}
        {screen === 'qgroup' && <QGroupApp />}
        {screen === 'portal' && <PortalApp />}
        {screen === 'builder' && <BuilderApp />}
        {screen === 'driver' && <DriverApp />}
        {screen === 'carta' && <CartaApp />}
        {screen === 'lobaiteos' && <LobaiteOSApp />}
        {screen === 'study' && <StudyApp />}
        {screen === 'school' && <SchoolApp />}
        {screen === 'clinica' && <ClinicaApp />}
        {screen === 'creators' && <CreatorsApp />}
        {screen === 'form' && <FormApp />}
      </main>

      <footer className="mt-auto border-t border-white/10 py-4 text-center text-[11px] text-white/30">
        TESAKA • QGROUP.ZIP © 2026 — SISTEMA WEB 7PLAY
      </footer>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map(tst => (
          <div key={tst.id} onClick={() => dismissToast(tst.id)}
            className={`pointer-events-auto cursor-pointer rounded-lg border p-3 text-sm shadow-xl backdrop-blur ${tst.kind === 'ok' ? 'border-[#B6FF2E]/40 bg-[#12200a]/95' : tst.kind === 'err' ? 'border-red-500/40 bg-[#250a0a]/95' : 'border-white/15 bg-[#101018]/95'}`}
            data-testid="toast">
            <p className="font-semibold text-white">{tst.title}</p>
            {tst.body && <p className="mt-0.5 text-white/70">{tst.body}</p>}
          </div>
        ))}
      </div>

      {/* Aviso de login */}
      {!session && screen !== 'home' && screen !== 'baoid' && (
        <Panel className="pointer-events-none fixed inset-x-4 bottom-4 z-30 mx-auto max-w-md border-[#B6FF2E]/30 bg-black/90 p-3 text-center text-xs">
          <span className="text-[#B6FF2E]">●</span> {t('needLogin')} — <button className="underline" onClick={() => go('baoid')}>{t('login')}</button>
        </Panel>
      )}
    </div>
  )
}
