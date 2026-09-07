'use client'

import { useStore, refreshSessionLocal } from '@/lib/store'
import { LANGS, translate } from '@/lib/i18n'
import { Panel, Btn, Field, InputText, ScreenHeader, Modal, Tag, SubNav, Empty } from '@/components/tesaka/ui-kit'
import { ScanFace, FileCheck2, Coins, Send, QrCode, ShieldCheck, Star, MonitorSmartphone } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang, SessionUser } from '@/lib/i18n'

type Tx = { id: string; fromBaoId: string; toBaoId: string; amount: number; note: string; createdAt: string }

export default function BaoIdApp({ initialTab }: { initialTab?: string }) {
  const { session, setSession, go, toast, t } = useStore()
  const [tab, setTab] = useState(initialTab || (session ? 'perfil' : 'login'))

  if (!session) {
    return <AuthScreens onAuth={(u) => { setSession(u); go('home') }} />
  }

  return (
    <div>
      <ScreenHeader title="BaoID" subtitle={`${session.name} • ${session.baoId}`} icon={<ShieldCheck className="h-5 w-5 text-[#B6FF2E]" />} />
      <SubNav active={tab} onChange={setTab} tabs={[
        { id: 'perfil', label: 'Perfil & Segurança' },
        { id: 'kcoin', label: 'TELA_KCOIN' },
        { id: 'face', label: t('faceId') },
        { id: 'docs', label: t('docVerify') },
      ]} />
      {tab === 'perfil' && <PerfilTab />}
      {tab === 'kcoin' && <KcoinTab />}
      {tab === 'face' && <FaceTab />}
      {tab === 'docs' && <DocsTab />}
    </div>
  )
}

/* ---------------- Autenticação real (BaoID) ---------------- */
function AuthScreens({ onAuth }: { onAuth: (u: SessionUser) => void }) {
  const { lang, toast, t } = useStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ id: '', email: '', password: '', name: '' })
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const action = mode === 'login' ? 'login' : 'register'
      const payload = mode === 'login' ? { id: form.id || form.email, password: form.password } : { email: form.email, password: form.password, name: form.name }
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) })
      const j = await r.json()
      if (!j.ok) { toast('BaoID', j.error, 'err'); return }
      toast('BaoID', mode === 'login' ? `Bem-vindo, ${j.user.name}!` : `Conta criada! Seu ID: ${j.user.baoId}`, 'ok')
      onAuth(j.user as SessionUser)
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-md" data-testid="baoid-auth">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B6FF2E] to-[#22D3EE] text-2xl font-black text-black">B</div>
        <h1 className="mt-3 text-2xl font-black">BaoID</h1>
        <p className="text-sm text-white/50">{t('yourBaoId')} • KCOIN • FaceID • Documentos</p>
      </div>
      <Panel className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2">
          <Btn variant={mode === 'login' ? 'accent' : 'outline'} onClick={() => setMode('login')} data-testid="tab-login">{t('login')}</Btn>
          <Btn variant={mode === 'register' ? 'accent' : 'outline'} onClick={() => setMode('register')} data-testid="tab-register">{t('register')}</Btn>
        </div>
        {mode === 'login' ? (
          <>
            <Field label={`${t('email')} ou BaoID`}>
              <InputText placeholder="maria@bao.id ou MARIA.7PLAY" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} data-testid="login-id" />
            </Field>
            <Field label={t('password')}>
              <InputText type="password" placeholder="••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} data-testid="login-pass" />
            </Field>
          </>
        ) : (
          <>
            <Field label={t('name')}>
              <InputText placeholder="Maria Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="reg-name" />
            </Field>
            <Field label={t('email')}>
              <InputText placeholder="voce@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="reg-email" />
            </Field>
            <Field label={t('password')}>
              <InputText type="password" placeholder="mínimo 6 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} data-testid="reg-pass" />
            </Field>
            <p className="text-[11px] text-white/40">IDs com sufixo especial (.TezSchool, mygroup, QGROUP) são criados apenas pelo ADM no LobaiteOS (OBS 2).</p>
          </>
        )}
        <Btn variant="accent" className="w-full" onClick={submit} disabled={busy} data-testid="auth-submit">
          {mode === 'login' ? t('enter') : t('create')}
        </Btn>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-white/50">
          <p className="mb-1 font-bold text-white/70">Contas de demonstração (senha 123456):</p>
          <p>ADVENCER.QGROUP — advencer@qgroup.zip (Admin geral, vê ADM)</p>
          <p>SUBADVANCER.QGROUP — subadvancer@qgroup.zip (cria usuários/equipes)</p>
          <p>PROF ANA.TezSchool — prof.ana@qgroup.zip (professora)</p>
          <p>LUCAS ALUNO.TezSchool — aluno.lucas@qgroup.zip (estudante)</p>
          <p>MARIA.7PLAY — maria@bao.id (usuária comum)</p>
        </div>
      </Panel>
    </div>
  )
}

/* ---------------- Perfil ---------------- */
function PerfilTab() {
  const { session, toast, t } = useStore()
  const estrelados: string[] = (() => { try { return JSON.parse(session?.estrelados || '[]') } catch { return [] } })()
  if (!session) return null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="p-5">
        <h3 className="mb-3 font-bold">Identidade</h3>
        <div className="space-y-2 text-sm">
          <Row k="Nome" v={session.name} />
          <Row k={t('yourBaoId')} v={<span className="font-mono text-[#B6FF2E]">{session.baoId}</span>} />
          <Row k="Tipo de conta" v={<Tag>{session.role}</Tag>} />
          <Row k="E-mail" v={session.email} />
          <Row k={t('kcoins')} v={<span className="font-bold text-[#B6FF2E]">{session.kcoins}</span>} />
          <Row k="Organização" v={session.org || '—'} />
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-white/50">
          Hierarquia (OBS 3): ADVENCER → SUBADVANCER → ORTHER_ADVANCER → RESPONSAVEL → FUNCIONARIO → USUAL
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel className="p-5">
          <h3 className="mb-2 flex items-center gap-2 font-bold"><Star className="h-4 w-4 text-[#B6FF2E]" /> {t('estrelado')}</h3>
          {estrelados.length === 0 ? <Empty text="Nenhum post ESTRELADO salvo ainda — estrelar salva na sua conta." /> : (
            <ul className="space-y-1 text-sm text-white/70">{estrelados.map((e, i) => <li key={i} className="rounded bg-white/5 px-2 py-1.5">⭐ {e}</li>)}</ul>
          )}
        </Panel>
        <Panel className="p-5">
          <h3 className="mb-3 font-bold">{t('language')} (todo o sistema e micro apps)</h3>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map(l => (
              <Btn key={l.code} variant={session.language === l.code ? 'accent' : 'outline'} size="sm" onClick={async () => {
                await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baoId: session.baoId, language: l.code }) })
                refreshSessionLocal({ language: l.code })
                toast('Idioma', `${l.flag} ${l.label}`, 'ok')
              }}>{l.flag} {l.label}</Btn>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2"><span className="text-white/50">{k}</span><span className="text-right font-medium">{v}</span></div>
}

/* ---------------- TELA_KCOIN — transferências reais ---------------- */
function KcoinTab() {
  const { session, toast, t, go } = useStore()
  const [data, setData] = useState<{ sent: Tx[]; received: Tx[]; balance: number } | null>(null)
  const [form, setForm] = useState({ to: '', amount: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [historyTab, setHistoryTab] = useState<'sent' | 'received'>('sent')

  const load = useCallback(async () => {
    if (!session) return
    const r = await fetch(`/api/kcoin?baoId=${encodeURIComponent(session.baoId)}`)
    const j = await r.json()
    if (j.ok) {
      setData(j)
      refreshSessionLocal({ kcoins: j.balance })
    }
  }, [session])

  useEffect(() => { load() }, [load])

  if (!session) return null
  const isQGroup = session.baoId.toUpperCase().includes('QGROUP') || session.baoId.endsWith('mygroup')

  const send = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/kcoin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: session.baoId, to: form.to, amount: Number(form.amount), note: form.note }) })
      const j = await r.json()
      if (!j.ok) { toast('KCOIN', j.error, 'err'); return }
      toast('KCOIN', `${form.amount} KCoins enviados para ${form.to} — salvo em Enviados/Recebidos`, 'ok')
      setForm({ to: '', amount: '', note: '' })
      await load()
    } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold"><Coins className="h-4 w-4 text-[#B6FF2E]" /> TELA_KCOIN</h3>
          <Tag>{t('balance')}</Tag>
        </div>
        <p className="mt-3 text-4xl font-black text-[#B6FF2E]" data-testid="kcoin-balance">{session.kcoins} <span className="text-base font-bold text-white/40">KCoins</span></p>
        <div className="mt-4 space-y-3">
          <Field label="Conta destino (ID público — contas antigas e novas)">
            <InputText placeholder="MARIA.7PLAY / CARLA LOBA.mygroup" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} data-testid="kcoin-to" />
          </Field>
          <Field label="Quantidade">
            <InputText type="number" min={1} placeholder="100" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} data-testid="kcoin-amount" />
          </Field>
          <Field label="Nota (opcional)">
            <InputText placeholder="ex: aluguel do polo" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </Field>
          <Btn variant="accent" className="w-full" onClick={send} disabled={busy} data-testid="kcoin-send">
            <Send className="mr-1 h-4 w-4" /> {t('transfer')}
          </Btn>
        </div>
        {isQGroup && (
          <Btn variant="outline" className="mt-4 w-full" onClick={() => go('lobaiteos')} data-testid="qos-button">
            <MonitorSmartphone className="mr-1 h-4 w-4" /> QOS — abrir LobaiteOS
          </Btn>
        )}
      </Panel>
      <Panel className="p-5">
        <h3 className="mb-3 font-bold">{t('history')}</h3>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Btn size="sm" variant={historyTab === 'sent' ? 'accent' : 'outline'} onClick={() => setHistoryTab('sent')}>{t('sent')}</Btn>
          <Btn size="sm" variant={historyTab === 'received' ? 'accent' : 'outline'} onClick={() => setHistoryTab('received')}>{t('received')}</Btn>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1" data-testid="kcoin-history">
          {!data && <Empty text={t('loading') + '…'} />}
          {data && (historyTab === 'sent' ? data.sent : data.received).length === 0 && <Empty text="Nenhuma transferência ainda." />}
          {data && (historyTab === 'sent' ? data.sent : data.received).map(tx => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-2.5 text-xs">
              <div className="min-w-0">
                <p className="truncate font-semibold">{historyTab === 'sent' ? `→ ${tx.toBaoId}` : `← ${tx.fromBaoId}`}</p>
                {tx.note && <p className="truncate text-white/50">“{tx.note}”</p>}
                <p className="text-white/30">{new Date(tx.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <span className={`shrink-0 font-bold ${historyTab === 'sent' ? 'text-red-400' : 'text-[#B6FF2E]'}`}>{historyTab === 'sent' ? '−' : '+'}{tx.amount} KC</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ---------------- FaceID (simulado) ---------------- */
function FaceTab() {
  const { session, toast, t } = useStore()
  const [scanning, setScanning] = useState(false)
  const [done, setDone] = useState(session?.faceRegistered || false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const scan = async () => {
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null)
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => null)
      }
      await new Promise(r => setTimeout(r, 2600))
      stream?.getTracks().forEach(tk => tk.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      setDone(true)
      await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baoId: session!.baoId, faceRegistered: true, faceHash: `sim-${Date.now()}` }) })
      refreshSessionLocal({ faceRegistered: true })
      toast(t('faceId'), 'FaceID registrado com sucesso (simulação local).', 'ok')
    } finally { setScanning(false) }
  }

  if (!session) return null
  return (
    <Panel className="mx-auto max-w-lg p-5">
      <h3 className="mb-1 flex items-center gap-2 font-bold"><ScanFace className="h-5 w-5 text-[#B6FF2E]" /> {t('faceId')}</h3>
      <p className="mb-4 text-sm text-white/50">Tela de validação por reconhecimento facial — <b>simulação</b>: nada é enviado a servidores externos, apenas a marcação “FaceID ativo” é salva na sua conta.</p>
      <div className="relative mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-black/50">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        {!scanning && !done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
            <ScanFace className="h-12 w-12" />
            <p className="text-xs">Câmera desligada</p>
          </div>
        )}
        {scanning && (
          <div className="absolute inset-0">
            <div className="absolute left-0 right-0 h-0.5 animate-[scanline_1.6s_ease-in-out_infinite] bg-[#B6FF2E] shadow-[0_0_12px_#B6FF2E]" style={{ top: '50%' }} />
            <p className="absolute bottom-3 w-full text-center text-xs font-bold text-[#B6FF2E]">Digitalizando rosto…</p>
          </div>
        )}
        {done && !scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#B6FF2E]/10">
            <ShieldCheck className="h-12 w-12 text-[#B6FF2E]" />
            <p className="text-sm font-bold text-[#B6FF2E]">FaceID ativo</p>
          </div>
        )}
      </div>
      <style>{`@keyframes scanline { 0%{top:12%} 50%{top:84%} 100%{top:12%} }`}</style>
      <div className="mt-4 flex justify-center gap-2">
        <Btn variant={done ? 'outline' : 'accent'} onClick={scan} disabled={scanning} data-testid="faceid-scan">
          {scanning ? 'Analisando…' : done ? 'Reescanear rosto' : 'Iniciar validação facial'}
        </Btn>
      </div>
    </Panel>
  )
}

/* ---------------- Verificação de documentos (upload simulado) ---------------- */
function DocsTab() {
  const { session, toast, t } = useStore()
  const [docType, setDocType] = useState('RG')
  const [docNumber, setDocNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(session?.docVerified || false)

  if (!session) return null
  const send = async () => {
    if (!file) { toast(t('docVerify'), 'Envie uma foto do documento.', 'err'); return }
    setBusy(true)
    await new Promise(r => setTimeout(r, 1800))
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baoId: session.baoId, docVerified: true, docType, docNumber }) })
    refreshSessionLocal({ docVerified: true, docType, docNumber })
    setVerified(true)
    setBusy(false)
    toast(t('docVerify'), `Documento ${docType} verificado (simulação). Nada é armazenado fora do seu dispositivo.`, 'ok')
  }

  return (
    <Panel className="mx-auto max-w-lg space-y-4 p-5">
      <h3 className="flex items-center gap-2 font-bold"><FileCheck2 className="h-5 w-5 text-[#B6FF2E]" /> {t('docVerify')}</h3>
      <p className="text-sm text-white/50">Envie uma foto do documento para validar sua conta (simulação de análise automática).</p>
      {verified ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#B6FF2E]/30 bg-[#B6FF2E]/5 p-4">
          <ShieldCheck className="h-8 w-8 text-[#B6FF2E]" />
          <div className="text-sm"><p className="font-bold text-[#B6FF2E]">Documento verificado</p><p className="text-white/60">{session.docType} • {session.docNumber || '—'}</p></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {['RG', 'CNH', 'Passaporte', 'CTPS'].map(d => (
              <Btn key={d} size="sm" variant={docType === d ? 'accent' : 'outline'} onClick={() => setDocType(d)}>{d}</Btn>
            ))}
          </div>
          <Field label="Número do documento">
            <InputText placeholder="00.000.000-0" value={docNumber} onChange={e => setDocNumber(e.target.value)} />
          </Field>
          <Field label="Foto do documento">
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white" data-testid="doc-file" />
          </Field>
          {file && <img src={URL.createObjectURL(file)} alt="documento" className="max-h-40 rounded-lg border border-white/10" />}
          <Btn variant="accent" className="w-full" onClick={send} disabled={busy} data-testid="doc-submit">{busy ? 'Analisando documento…' : 'Enviar para verificação'}</Btn>
        </>
      )}
    </Panel>
  )
}
