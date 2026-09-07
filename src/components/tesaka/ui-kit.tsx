'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Play, ArrowLeft, Image as ImageIcon, Video as VideoIcon, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-xl border border-white/10 bg-[#0e0e15]/90 backdrop-blur', className)}>{children}</div>
}

export function Btn({ className, variant = 'default', ...p }: Omit<React.ComponentProps<typeof Button>, 'variant'> & { variant?: 'default' | 'ghost' | 'outline' | 'accent' | 'danger' }) {
  const styles = {
    default: 'bg-white/10 hover:bg-white/20 text-white',
    ghost: 'hover:bg-white/10 text-white/80',
    outline: 'border border-white/20 hover:bg-white/10 text-white',
    accent: 'bg-[#B6FF2E] hover:bg-[#a8f01f] text-black font-semibold',
    danger: 'bg-red-500/90 hover:bg-red-500 text-white',
  }
  return <Button className={cn('rounded-lg', styles[variant], className)} {...p} />
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-wider text-white/50">{label}</label>
      {children}
    </div>
  )
}

export function ScreenHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  const go = useStore(s => s.go)
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Btn variant="ghost" size="sm" onClick={() => go('home')} data-testid="back-tesaka" className="shrink-0">
        <ArrowLeft className="h-4 w-4 mr-1" /> TESAKA
      </Btn>
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs text-white/50 truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-white/40">{text}</div>
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70', className)}>{children}</span>
}

/** Player universal TESAKA — exibe a tela de amostra "Reproduzindo preview • X:XX:XX" (padrão YouPlay/QGroup) */
export function PreviewPlayer({ name, duration, onEnded, compact }: { name: string; duration?: string; onEnded?: () => void; compact?: boolean }) {
  const [clock, setClock] = useState(0)
  const total = (() => {
    if (duration && duration.includes(':')) {
      const parts = duration.split(':').map(Number)
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
      if (parts.length === 2) return parts[0] * 60 + parts[1]
    }
    return 3 * 60 + 24
  })()
  useEffect(() => {
    setClock(0)
    const iv = setInterval(() => {
      setClock(c => {
        if (c + 1 >= total) {
          clearInterval(iv)
          onEnded?.()
          return c
        }
        return c + 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [name, total])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
  }
  const hue = (name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7) % 360

  return (
    <div
      data-testid="preview-player"
      className={cn('relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-white/10', compact ? 'h-36' : 'h-56 md:h-72')}
      style={{ background: `radial-gradient(ellipse at 30% 20%, hsl(${hue} 60% 22%), #06060a 70%)` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,.06) 2px 4px)' }} />
      <div className="z-10 flex flex-col items-center gap-2 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur">
          <Play className="h-6 w-6 fill-white text-white" />
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/60" data-testid="preview-label">Reproduzindo preview • {fmt(clock)} / {fmt(total)}</p>
        <p className="max-w-full truncate text-sm font-semibold text-white">{name}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div className="h-full bg-[#B6FF2E] transition-all" style={{ width: `${Math.min(100, (clock / total) * 100)}%` }} />
      </div>
    </div>
  )
}

/** Upload de imagem/vídeo (arquivo local → objectURL/dataURL) */
export function MediaPicker({ value, onChange, accept = 'image/*,video/*', id }: { value: { kind: 'image' | 'video'; url: string; name: string } | undefined; onChange: (m: { kind: 'image' | 'video'; url: string; name: string; durationSec?: number } | undefined) => void; accept?: string; id: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const toast = useStore(s => s.toast)

  const handle = async (f: File | undefined) => {
    if (!f) return
    setBusy(true)
    const isVideo = f.type.startsWith('video')
    const url = URL.createObjectURL(f)
    let durationSec: number | undefined
    if (isVideo) {
      durationSec = await new Promise<number>(res => {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.onloadedmetadata = () => res(v.duration)
        v.onerror = () => res(0)
        v.src = url
      })
    }
    setBusy(false)
    onChange({ kind: isVideo ? 'video' : 'image', url, name: f.name, durationSec })
  }

  return (
    <div className="space-y-2">
      <input ref={ref} id={id} type="file" accept={accept} className="hidden" onChange={e => handle(e.target.files?.[0])} />
      <div className="flex gap-2">
        <Btn variant="outline" size="sm" type="button" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : value?.kind === 'video' ? <VideoIcon className="h-4 w-4 mr-1" /> : <ImageIcon className="h-4 w-4 mr-1" />}
          {value ? value.name.slice(0, 18) : 'Imagem ou vídeo'}
        </Btn>
        {value && <Btn variant="ghost" size="sm" type="button" onClick={() => { onChange(undefined); if (ref.current) ref.current.value = '' }}>Remover</Btn>}
      </div>
      {value?.kind === 'image' && <img src={value.url} alt={value.name} className="max-h-40 rounded-lg border border-white/10 object-cover" />}
      {value?.kind === 'video' && <video src={value.url} controls className="max-h-40 w-full rounded-lg border border-white/10" />}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="modal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative max-h-[88vh] w-full overflow-y-auto rounded-xl border border-white/15 bg-[#101018] p-5 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-bold text-white">{title}</h3>
          <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SubNav({ tabs, active, onChange }: { tabs: { id: string; label: string; badge?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn('shrink-0 rounded-lg px-3 py-1.5 text-sm transition', active === t.id ? 'bg-[#B6FF2E] font-semibold text-black' : 'bg-white/5 text-white/70 hover:bg-white/10')}
        >
          {t.label}
          {t.badge ? <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{t.badge}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function InputText(p: React.ComponentProps<typeof Input>) {
  return <Input className="border-white/15 bg-black/40 text-white placeholder:text-white/30" {...p} />
}
