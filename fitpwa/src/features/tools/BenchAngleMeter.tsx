import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Smartphone,
  Lock,
  Unlock,
  Target,
  Info,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/shared/components/Button'

// ============================================================
// Bench Angle Meter
// ------------------------------------------------------------
// Use the phone (laid flat against the bench backrest, screen
// facing the lifter) as a digital inclinometer. Reads the
// DeviceOrientationEvent.beta value (front-back tilt) and maps
// it to bench-press incline degrees (0° = flat, 90° = upright).
//
// Common preset targets:
//   • Flat            =  0°
//   • Low Incline     = 15°
//   • Standard Incline= 30°
//   • Steep Incline   = 45°
//   • Shoulder Press  = 75°  (near-vertical)
//   • Decline         = -15° (negative)
//
// Tolerance ±2° → green pulse + haptic + optional voice cue.
// ============================================================

interface IPreset {
  id: string
  label: string
  angle: number
  description: string
}

const PRESETS: IPreset[] = [
  { id: 'decline', label: 'Decline', angle: -15, description: 'Lower-chest emphasis' },
  { id: 'flat', label: 'Flat', angle: 0, description: 'Mid-chest, balanced' },
  { id: 'low', label: 'Low Incline', angle: 15, description: 'Mid/upper chest' },
  { id: 'std', label: 'Standard Incline', angle: 30, description: 'Classic upper chest' },
  { id: 'steep', label: 'Steep Incline', angle: 45, description: 'Upper chest + delts' },
  { id: 'shoulder', label: 'Shoulder Press', angle: 75, description: 'Near-vertical, delts' },
]

const TOLERANCE = 2 // degrees of error considered "on target"

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

export function BenchAngleMeter() {
  const navigate = useNavigate()

  const [permission, setPermission] = useState<PermissionState>('idle')
  const [, setAngle] = useState<number>(0)
  const [smoothedAngle, setSmoothedAngle] = useState<number>(0)
  const [lockedReading, setLockedReading] = useState<number | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [target, setTarget] = useState<IPreset>(PRESETS[3]) // 30° default
  const [calibrationOffset, setCalibrationOffset] = useState<number>(0)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [hasAnnouncedOnTarget, setHasAnnouncedOnTarget] = useState(false)

  // smoothing buffer
  const bufferRef = useRef<number[]>([])
  const lastSpokeRef = useRef<number>(0)

  // ---------- Permission / Sensor ----------
  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setPermission('unsupported')
      return
    }
    setPermission('requesting')

    // iOS 13+ requires explicit permission
    const anyEvent = DeviceOrientationEvent as any
    if (typeof anyEvent.requestPermission === 'function') {
      try {
        const result: 'granted' | 'denied' = await anyEvent.requestPermission()
        setPermission(result === 'granted' ? 'granted' : 'denied')
      } catch {
        setPermission('denied')
      }
    } else {
      // Android / Desktop — assume granted
      setPermission('granted')
    }
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return

    const handler = (e: DeviceOrientationEvent) => {
      // beta = front-to-back tilt in degrees. Range typically -180..180
      // When phone lies flat on its back, beta ≈ 0. When stood up
      // vertically against a backrest, beta ≈ 90.
      if (e.beta == null) return
      const raw = e.beta
      const adjusted = raw - calibrationOffset

      // Rolling average of last 6 samples for jitter reduction
      const buf = bufferRef.current
      buf.push(adjusted)
      if (buf.length > 6) buf.shift()
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length

      setAngle(adjusted)
      setSmoothedAngle(avg)
    }

    window.addEventListener('deviceorientation', handler, true)
    return () => window.removeEventListener('deviceorientation', handler, true)
  }, [permission, calibrationOffset])

  // ---------- On-target detection: haptic + voice ----------
  const delta = smoothedAngle - target.angle
  const absDelta = Math.abs(delta)
  const isOnTarget = absDelta <= TOLERANCE

  useEffect(() => {
    if (isLocked) return

    if (isOnTarget && !hasAnnouncedOnTarget) {
      // Haptic
      if ('vibrate' in navigator) navigator.vibrate([40, 30, 40])

      // Voice
      if (voiceEnabled && Date.now() - lastSpokeRef.current > 2000) {
        lastSpokeRef.current = Date.now()
        speak(`On target. ${Math.round(target.angle)} degrees.`)
      }

      setHasAnnouncedOnTarget(true)
    } else if (!isOnTarget && hasAnnouncedOnTarget) {
      setHasAnnouncedOnTarget(false)
    }
  }, [isOnTarget, hasAnnouncedOnTarget, isLocked, target.angle, voiceEnabled])

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return
    try {
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate = 1.05
      utt.pitch = 1
      utt.volume = 0.9
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utt)
    } catch { /* ignore */ }
  }

  // ---------- Actions ----------
  function handleCalibrate() {
    // Whatever the phone is currently reading becomes the new "0"
    setCalibrationOffset((prev) => prev + smoothedAngle)
    bufferRef.current = []
    if ('vibrate' in navigator) navigator.vibrate(60)
  }

  function handleResetCalibration() {
    setCalibrationOffset(0)
    bufferRef.current = []
  }

  function handleLockToggle() {
    if (isLocked) {
      setIsLocked(false)
      setLockedReading(null)
    } else {
      setIsLocked(true)
      setLockedReading(smoothedAngle)
      if ('vibrate' in navigator) navigator.vibrate(80)
    }
  }

  // ---------- Display values ----------
  const displayAngle = isLocked && lockedReading != null ? lockedReading : smoothedAngle
  const displayDelta = isLocked && lockedReading != null ? lockedReading - target.angle : delta

  // Status colour for the giant readout
  const statusColor = isOnTarget
    ? 'text-primary'
    : absDelta < 5
    ? 'text-warn'
    : 'text-ink'

  // ============================================================
  // Render
  // ============================================================

  if (permission === 'idle' || permission === 'requesting') {
    return (
      <Gate
        onAllow={requestPermission}
        loading={permission === 'requesting'}
        onBack={() => navigate(-1)}
      />
    )
  }

  if (permission === 'denied' || permission === 'unsupported') {
    return (
      <Unsupported
        reason={permission}
        onBack={() => navigate(-1)}
        onRetry={requestPermission}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 bg-mesh-primary opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto pb-nav">
        {/* ======= Top bar ======= */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-ink-muted" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className="p-2 rounded-xl hover:bg-white/5 transition text-ink-muted hover:text-white"
              aria-label={voiceEnabled ? 'Silenciar voz' : 'Ativar voz'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowHelp((s) => !s)}
              className="p-2 rounded-xl hover:bg-white/5 transition text-ink-muted hover:text-white"
              aria-label="Ajuda"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======= Title ======= */}
        <header className="mb-8">
          <p className="badge-tag border-primary/30 text-primary mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Bench Tools
          </p>
          <h1 className="text-display text-5xl md:text-7xl text-white mb-2">
            BENCH<br />
            <span className="text-primary">ANGLE</span>
          </h1>
          <p className="text-ink-muted text-sm max-w-md">
            Encosta o telemóvel ao banco com o ecrã virado para ti. Ajusta o banco até atingires o ângulo alvo.
          </p>
        </header>

        {/* ======= Help panel ======= */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="card-surface p-5 text-sm text-ink-muted leading-relaxed space-y-2">
                <p className="text-white font-bold mb-2">Como usar:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Coloca o banco aproximadamente no ângulo desejado.</li>
                  <li>Encosta o telemóvel <strong className="text-white">vertical</strong>, com a parte de trás contra o encosto.</li>
                  <li>Espera 1 segundo até a leitura estabilizar.</li>
                  <li>Ajusta o banco até veres o anel <span className="text-primary font-bold">verde</span> e ouvires o sinal.</li>
                </ol>
                <p className="pt-2 text-ink-dim italic">
                  Dica: se o telemóvel não estiver perfeitamente plano contra o banco, usa "Calibrar" depois de o encostar para reiniciar a leitura.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======= Main gauge ======= */}
        <div className="card-surface bg-atmos with-grain relative p-6 md:p-10 mb-6 overflow-hidden">
          <Gauge angle={displayAngle} target={target.angle} isOnTarget={isOnTarget} isLocked={isLocked} />

          {/* Numeric readout */}
          <div className="text-center mt-2">
            <div className="text-ink-dim text-[10px] font-bold uppercase tracking-tightest mb-1">
              {isLocked ? 'Leitura travada' : 'Ângulo medido'}
            </div>
            <div
              data-numeric
              className={`font-mono font-bold text-6xl md:text-7xl ${statusColor} transition-colors duration-200`}
            >
              {displayAngle >= 0 ? '+' : ''}
              {displayAngle.toFixed(1)}
              <span className="text-3xl ml-1 text-ink-muted">°</span>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-200 border border-white/[0.06]">
              <Target className="w-3.5 h-3.5 text-ink-muted" />
              <span className="text-[11px] font-bold uppercase tracking-tightest text-ink-muted">
                Alvo {target.angle >= 0 ? '+' : ''}{target.angle}° → diff
              </span>
              <span
                data-numeric
                className={`font-mono font-bold text-[12px] ${
                  isOnTarget ? 'text-primary' : Math.abs(displayDelta) < 5 ? 'text-warn' : 'text-white'
                }`}
              >
                {displayDelta >= 0 ? '+' : ''}{displayDelta.toFixed(1)}°
              </span>
            </div>
          </div>

          {/* Lock + Calibrate row */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button
              variant={isLocked ? 'accent' : 'outline'}
              onClick={handleLockToggle}
              className="h-12"
            >
              {isLocked ? (
                <><Unlock className="w-4 h-4" /> Destravar</>
              ) : (
                <><Lock className="w-4 h-4" /> Travar leitura</>
              )}
            </Button>
            <Button variant="outline" onClick={handleCalibrate} className="h-12">
              <Target className="w-4 h-4" /> Calibrar zero
            </Button>
          </div>
          {calibrationOffset !== 0 && (
            <button
              onClick={handleResetCalibration}
              className="block mx-auto mt-3 text-[11px] text-ink-dim hover:text-white underline underline-offset-2"
            >
              Calibração: {calibrationOffset.toFixed(1)}° aplicada — repor
            </button>
          )}
        </div>

        {/* ======= Preset targets ======= */}
        <div>
          <h2 className="text-display text-2xl text-white mb-3">Predefinições</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {PRESETS.map((p) => {
              const active = p.id === target.id
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setTarget(p)
                    setHasAnnouncedOnTarget(false)
                  }}
                  className={`relative text-left p-4 rounded-2xl border transition-all duration-200 ${
                    active
                      ? 'bg-primary/[0.08] border-primary/50 shadow-[0_0_24px_-8px_theme(colors.primary.glow)]'
                      : 'bg-surface-100 border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-baseline gap-1">
                    <span
                      data-numeric
                      className={`font-mono font-bold text-2xl ${active ? 'text-primary' : 'text-white'}`}
                    >
                      {p.angle >= 0 ? '+' : ''}{p.angle}
                    </span>
                    <span className={`text-sm ${active ? 'text-primary' : 'text-ink-muted'}`}>°</span>
                  </div>
                  <div className={`text-[12px] font-bold uppercase tracking-tightest mt-1 ${active ? 'text-white' : 'text-ink'}`}>
                    {p.label}
                  </div>
                  <div className="text-[10px] text-ink-dim mt-0.5 leading-tight">
                    {p.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-dim mt-8 max-w-md mx-auto">
          Os sensores do telemóvel têm uma margem típica de ±1°. Para máxima precisão, calibra com o telemóvel encostado plano antes de ajustares o banco.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Visual gauge — circular dial with target arc
// ============================================================

function Gauge({
  angle,
  target,
  isOnTarget,
  isLocked,
}: {
  angle: number
  target: number
  isOnTarget: boolean
  isLocked: boolean
}) {
  // Map angle -30..90 to ring rotation
  const clamped = Math.max(-30, Math.min(90, angle))
  const targetClamped = Math.max(-30, Math.min(90, target))

  return (
    <div className="relative aspect-square max-w-[280px] mx-auto">
      {/* Outer ticks */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c6ff3d" />
            <stop offset="100%" stopColor="#82b800" />
          </linearGradient>
        </defs>

        {/* Tick marks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const tickAngle = (i / 24) * 360
          const isMajor = i % 6 === 0
          return (
            <line
              key={i}
              x1="100"
              y1="6"
              x2="100"
              y2={isMajor ? 16 : 11}
              stroke={isMajor ? '#52525b' : '#27272a'}
              strokeWidth={isMajor ? 1.5 : 1}
              transform={`rotate(${tickAngle} 100 100)`}
            />
          )
        })}

        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="14"
        />

        {/* Progress arc — from -30 (start) to current angle */}
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${((clamped + 30) / 120) * 490} 490`}
          style={{ transition: 'stroke-dasharray 200ms ease-out' }}
          opacity={isOnTarget ? 1 : 0.6}
        />

        {/* Target marker — small notch on the ring */}
        <line
          x1="100"
          y1="14"
          x2="100"
          y2="32"
          stroke="#ff2d75"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${((targetClamped + 30) / 120) * 360} 100 100)`}
        />
      </svg>

      {/* Center indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: isOnTarget ? [1, 1.06, 1] : 1,
            opacity: isLocked ? 0.7 : 1,
          }}
          transition={{ duration: 1, repeat: isOnTarget ? Infinity : 0 }}
          className={`w-32 h-32 rounded-full flex items-center justify-center
                      ${isOnTarget ? 'bg-primary/10 border-2 border-primary' : 'bg-surface-200 border-2 border-white/5'}
                      transition-colors duration-300`}
        >
          {isOnTarget ? (
            <div className="text-primary text-[10px] font-bold uppercase tracking-tightest">
              On target
            </div>
          ) : (
            <Smartphone
              className={`w-10 h-10 ${absDeltaIcon(angle - target) ? 'text-warn' : 'text-ink-dim'}`}
              style={{ transform: `rotate(${angle * 0.6}deg)` }}
            />
          )}
        </motion.div>
      </div>

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-2 right-2 bg-accent text-white text-[10px] font-bold uppercase tracking-tightest px-2 py-1 rounded-full flex items-center gap-1">
          <Lock className="w-3 h-3" /> Lock
        </div>
      )}
    </div>
  )
}

function absDeltaIcon(d: number): boolean {
  return Math.abs(d) < 5
}

// ============================================================
// Permission gate
// ============================================================

function Gate({
  onAllow,
  loading,
  onBack,
}: {
  onAllow: () => void
  loading: boolean
  onBack: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col p-6 max-w-md mx-auto">
      <button
        onClick={onBack}
        className="self-start p-2 -ml-2 rounded-xl hover:bg-white/5 transition mb-8"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5 text-ink-muted" />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <p className="badge-tag border-primary/30 text-primary mb-4 self-start">New tool</p>
        <h1 className="text-display text-5xl text-white mb-3">
          BENCH<br /><span className="text-primary">ANGLE</span> METER
        </h1>
        <p className="text-ink-muted mb-8 leading-relaxed">
          Transforma o teu telemóvel num inclinómetro digital. Mede e ajusta o ângulo do banco com precisão, antes de cada série.
        </p>

        <div className="card-surface p-5 mb-6 space-y-3">
          <Bullet num="01" text="Encosta o telemóvel ao banco com o ecrã virado para ti" />
          <Bullet num="02" text="Escolhe um ângulo alvo (15°, 30°, 45°…)" />
          <Bullet num="03" text="Ajusta o banco até veres o anel verde e ouvires o sinal" />
        </div>

        <Button onClick={onAllow} isLoading={loading} size="lg" className="w-full">
          Permitir acesso aos sensores
        </Button>

        <p className="text-[11px] text-ink-dim text-center mt-4">
          O RepTrack só usa os sensores enquanto este ecrã estiver aberto.
        </p>
      </div>
    </div>
  )
}

function Bullet({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-mono font-bold text-primary text-sm shrink-0 w-6">{num}</span>
      <span className="text-sm text-ink leading-snug">{text}</span>
    </div>
  )
}

function Unsupported({
  reason,
  onBack,
  onRetry,
}: {
  reason: 'denied' | 'unsupported'
  onBack: () => void
  onRetry: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col p-6 max-w-md mx-auto">
      <button
        onClick={onBack}
        className="self-start p-2 -ml-2 rounded-xl hover:bg-white/5 transition mb-8"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5 text-ink-muted" />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 rounded-2xl bg-warn/10 border border-warn/30 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-warn" />
        </div>
        <h1 className="text-display text-4xl text-white mb-3">
          {reason === 'denied' ? 'Acesso negado' : 'Não suportado'}
        </h1>
        <p className="text-ink-muted mb-8 leading-relaxed">
          {reason === 'denied'
            ? 'Para usar o medidor de ângulo, precisamos de permissão para aceder aos sensores de movimento. Verifica as definições do teu browser.'
            : 'O teu dispositivo ou browser não expõe os sensores de movimento necessários. Tenta abrir esta página no Safari (iOS) ou Chrome (Android).'}
        </p>
        {reason === 'denied' && (
          <Button onClick={onRetry} size="lg" className="w-full">
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  )
}
