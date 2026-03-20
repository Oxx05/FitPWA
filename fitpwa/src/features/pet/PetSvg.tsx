import { type PetModel, type PetMood, type PetInteraction, PET_CATALOG } from './usePetStore'

interface PetSvgProps {
  model: PetModel
  mood: PetMood
  size?: number
  isInteracting?: boolean
  interactionType?: PetInteraction | null
  milestones?: string[]
  className?: string
}

// ─── Animations ───────────────────────────────────────────────────────────────
const PetStyles = () => (
  <style>{`
    @keyframes breathe {
      0%, 100% { transform: scaleX(1) scaleY(1); }
      50% { transform: scaleX(1.03) scaleY(0.97); }
    }
    @keyframes blink {
      0%, 85%, 100% { transform: scaleY(1); }
      91% { transform: scaleY(0.06); }
    }
    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-6deg); }
      75% { transform: rotate(6deg); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes tail-swing {
      0%, 100% { transform: rotate(-5deg); }
      50% { transform: rotate(22deg); }
    }
    @keyframes ear-flick {
      0%, 80%, 100% { transform: rotate(0deg); }
      86% { transform: rotate(-12deg); }
      93% { transform: rotate(8deg); }
    }
    @keyframes slime-blob {
      0%, 100% { transform: scaleX(1) scaleY(1); }
      30% { transform: scaleX(1.10) scaleY(0.91); }
      65% { transform: scaleX(0.92) scaleY(1.08); }
    }
    @keyframes fire-flicker {
      0%, 100% { opacity: 0.8; transform: scaleY(1) scaleX(1); }
      40% { opacity: 1; transform: scaleY(1.15) scaleX(0.9); }
    }
    @keyframes wolf-pulse {
      0%, 100% { opacity: 0.15; }
      50% { opacity: 0.38; }
    }
    @keyframes wing-beat {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-18deg); }
    }
    @keyframes particle-up {
      0% { transform: translateY(0) scale(0.5); opacity: 1; }
      100% { transform: translateY(-60px) scale(1.1); opacity: 0; }
    }
    @keyframes muscle-pop {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(1); opacity: 0; }
    }
    @keyframes bounce-in {
      0% { transform: scale(0.6); opacity: 0; }
      70% { transform: scale(1.08); }
      100% { transform: scale(1); opacity: 1; }
    }

    .a-breathe { animation: breathe 2.8s ease-in-out infinite; transform-origin: center bottom; }
    .a-wiggle   { animation: wiggle 2.2s ease-in-out infinite; }
    .a-shake    { animation: shake 0.13s linear infinite; }
    .a-float    { animation: float 2.2s ease-in-out infinite; }
    .a-blink    { animation: blink 3.8s infinite; transform-origin: center; }
    .a-tail     { animation: tail-swing 1.1s ease-in-out infinite; transform-origin: 5% 90%; }
    .a-ear-l    { animation: ear-flick 3.2s ease-in-out infinite; transform-origin: 50% 100%; }
    .a-ear-r    { animation: ear-flick 3.2s ease-in-out infinite 0.55s; transform-origin: 50% 100%; }
    .a-blob     { animation: slime-blob 1.9s ease-in-out infinite; transform-origin: center bottom; }
    .a-fire     { animation: fire-flicker 0.65s ease-in-out infinite; transform-origin: center bottom; }
    .a-wolf     { animation: wolf-pulse 2.4s ease-in-out infinite; }
    .a-wing-l   { animation: wing-beat 0.42s ease-in-out infinite; transform-origin: 100% 50%; }
    .a-wing-r   { animation: wing-beat 0.42s ease-in-out infinite 0.21s; transform-origin: 0% 50%; }
    .a-particle { animation: particle-up 0.85s ease-out forwards; }
    .a-muscle   { animation: muscle-pop 0.6s ease-out forwards; }
  `}</style>
)

// ─── Shared Face ──────────────────────────────────────────────────────────────
// Duolingo-style: big outlined eyes, iris, thick expressive brows, bold mouth

interface FaceProps {
  mood: PetMood
  model: PetModel
  cx?: number
  cy?: number
  gap?: number   // half-distance between eye centers
  er?: number    // eye radius
}

const Face = ({ mood, model, cx = 60, cy = 66, gap = 15, er = 11 }: FaceProps) => {
  const isStoic = ['titan_wolf', 'rocky_bear', 'swift_hawk'].includes(model)
  const isFierce = model === 'blaze_dragon'
  const isSmug = ['gym_cat', 'flex_fox'].includes(model)
  const isZen = ['mighty_panda', 'turbo_tortoise'].includes(model)

  const sleeping  = mood === 'sleeping'
  const atrophied = mood === 'atrophied'
  const ecstatic  = mood === 'ecstatic'
  const happy     = mood === 'happy'
  const hungry    = mood === 'hungry'
  const starving  = mood === 'starving'
  const dirty     = mood === 'dirty'
  const sad       = starving || hungry || atrophied

  const lx = cx - gap
  const rx = cx + gap
  const my = cy + 17
  const ew = er * 1.0   // half-width of each eye arc

  // ── Eyes (all closed arcs — cute / non-scary) ──
  const eyes = () => {
    if (sleeping) return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="3.5" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy} Q${lx} ${cy+er*0.9} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy+er*0.9} ${rx+ew} ${cy}`}/>
        <text x={cx+6} y={cy-16} fontSize="11" textAnchor="middle" opacity="0.5">💤</text>
      </g>
    )
    if (atrophied) return (
      <g fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" opacity="0.65">
        <path d={`M${lx-ew} ${cy} Q${lx} ${cy+er*0.45} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy+er*0.45} ${rx+ew} ${cy}`}/>
      </g>
    )
    if (ecstatic) return (
      <g fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy} Q${lx} ${cy-er*1.15} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy-er*1.15} ${rx+ew} ${cy}`}/>
      </g>
    )
    if (happy) return (
      <g fill="none" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy} Q${lx} ${cy-er*0.9} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy-er*0.9} ${rx+ew} ${cy}`}/>
      </g>
    )
    if (sad) return (
      <g fill="none" stroke="#778" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d={`M${lx-ew} ${cy-1} Q${lx} ${cy+er*0.5} ${lx+ew} ${cy-1}`}/>
        <path d={`M${rx-ew} ${cy-1} Q${rx} ${cy+er*0.5} ${rx+ew} ${cy-1}`}/>
      </g>
    )
    if (dirty) return (
      <g fill="none" stroke="#665" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
        <path d={`M${lx-ew} ${cy} Q${lx} ${cy+er*0.3} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy+er*0.3} ${rx+ew} ${cy}`}/>
      </g>
    )
    // neutral — granular variety based on personality
    if (isStoic) return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="3.5" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy-1} L${lx+ew} ${cy-1}`}/>
        <path d={`M${rx-ew} ${cy-1} L${rx+ew} ${cy-1}`}/>
      </g>
    )
    if (isSmug) return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="3" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy+1} Q${lx} ${cy-er*0.2} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy-er*0.4} ${rx+ew} ${cy-1}`}/>
      </g>
    )
    if (isZen) return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy} Q${lx} ${cy-1} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy-1} ${rx+ew} ${cy}`}/>
      </g>
    )
    if (isFierce) return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="3.5" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy-2} L${lx+ew} ${cy+1}`}/>
        <path d={`M${rx-ew} ${cy+1} L${rx+ew} ${cy-2}`}/>
      </g>
    )
    // Default / Playful
    return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="3" strokeLinecap="round">
        <path d={`M${lx-ew} ${cy} Q${lx} ${cy-er*0.6} ${lx+ew} ${cy}`}/>
        <path d={`M${rx-ew} ${cy} Q${rx} ${cy-er*0.6} ${rx+ew} ${cy}`}/>
      </g>
    )
  }

  // ── Eyebrows — light, expressive ──
  const brows = () => {
    if (sleeping || atrophied) return null
    if (sad) return (
      <g fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d={`M${lx-er*0.65} ${cy-er-4} Q${lx+er*0.12} ${cy-er-8} ${lx+er*0.6} ${cy-er-4}`}/>
        <path d={`M${rx-er*0.6} ${cy-er-4} Q${rx-er*0.12} ${cy-er-8} ${rx+er*0.65} ${cy-er-4}`}/>
      </g>
    )
    if (ecstatic || happy) return (
      <g fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" opacity="0.4">
        <path d={`M${lx-er*0.7} ${cy-er-4} Q${lx} ${cy-er-9} ${lx+er*0.7} ${cy-er-4}`}/>
        <path d={`M${rx-er*0.7} ${cy-er-4} Q${rx} ${cy-er-9} ${rx+er*0.7} ${cy-er-4}`}/>
      </g>
    )
    if (isStoic || isFierce) return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
        <path d={`M${lx-er*0.8} ${cy-er-2} L${lx+er*0.8} ${cy-er-2}`}/>
        <path d={`M${rx-er*0.8} ${cy-er-2} L${rx+er*0.8} ${cy-er-2}`}/>
      </g>
    )
    if (isSmug) return (
      <g fill="none" stroke="#2a2a2a" strokeWidth="1.8" strokeLinecap="round" opacity="0.4">
        <path d={`M${lx-er*0.7} ${cy-er-6} Q${lx} ${cy-er-3} ${lx+er*0.7} ${cy-er-4}`}/>
        <path d={`M${rx-er*0.7} ${cy-er-4} Q${rx} ${cy-er-9} ${rx+er*0.7} ${cy-er-6}`}/>
      </g>
    )
    return (
      <g fill="none" stroke="#444" strokeWidth="1.8" strokeLinecap="round" opacity="0.3">
        <path d={`M${lx-er*0.65} ${cy-er-3} Q${lx} ${cy-er-7} ${lx+er*0.65} ${cy-er-3}`}/>
        <path d={`M${rx-er*0.65} ${cy-er-3} Q${rx} ${cy-er-7} ${rx+er*0.65} ${cy-er-3}`}/>
      </g>
    )
  }

  return (
    <g>
      {brows()}
      {eyes()}

      {/* ── Mouth ── */}
      {ecstatic && (
        isStoic ? (
          <path d={`M${cx-10} ${my+2} Q${cx} ${my+12} ${cx+10} ${my+2}`}
            fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round"/>
        ) : (
          <>
            <path d={`M${cx-12} ${my} Q${cx} ${my+14} ${cx+12} ${my}`}
              fill="#ff3366" stroke="#cc0044" strokeWidth="2" strokeLinecap="round"/>
            <rect x={cx-5} y={my+1} width="10" height="5" rx="2" fill="white" opacity="0.9"/>
          </>
        )
      )}
      {happy && (
        isStoic ? (
          <path d={`M${cx-8} ${my+3} Q${cx} ${my+8} ${cx+8} ${my+3}`}
            fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        ) : isSmug ? (
          <path d={`M${cx-6} ${my+2} Q${cx+10} ${my+10} ${cx+6} ${my}`}
            fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        ) : (
          <path d={`M${cx-11} ${my} Q${cx} ${my+12} ${cx+11} ${my}`}
            fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        )
      )}
      {mood === 'neutral' && (
        isSmug ? (
          <path d={`M${cx-5} ${my+3} Q${cx+8} ${my+5} ${cx+4} ${my+1}`}
            fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        ) : isStoic || isFierce ? (
          <path d={`M${cx-6} ${my+3} L${cx+6} ${my+3}`}
            fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        ) : isZen ? (
          <path d={`M${cx-4} ${my+2} L${cx+4} ${my+2}`}
            fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
        ) : (
          <path d={`M${cx-7} ${my+2} Q${cx} ${my+6} ${cx+7} ${my+2}`}
            fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
        )
      )}
      {dirty && (
        <path d={`M${cx-6} ${my+2} Q${cx} ${my+5} ${cx+6} ${my+2}`}
          fill="none" stroke="#4a4a38" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      )}
      {hungry && (
        <path d={`M${cx-9} ${my+7} Q${cx} ${my+2} ${cx+9} ${my+7}`}
          fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
      )}
      {(starving || atrophied) && (
        <>
          <path d={`M${cx-10} ${my+8} Q${cx} ${my+2} ${cx+10} ${my+8}`}
            fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
          <path d={`M${cx+er+6} ${cy-5} Q${cx+er+10} ${cy+2} ${cx+er+6} ${cy+7} Q${cx+er+2} ${cy+2} ${cx+er+6} ${cy-5}`}
            fill="#7dd3fc" opacity="0.5"/>
        </>
      )}
      {sleeping && (
        <path d={`M${cx-4} ${my+1} Q${cx} ${my+5} ${cx+4} ${my+1}`}
          fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      )}
    </g>
  )
}

// ─── Gradient helper overlay (adds depth to any round head) ───────────────────
// Applied as a transparent overlay after the main circle fill
const HeadSheen = ({ cx=60, cy=72, r=40, id }: { cx?: number; cy?: number; r?: number; id: string }) => (
  <>
    <defs>
      <radialGradient id={id} cx="38%" cy="30%" r="70%">
        <stop offset="0%" stopColor="white" stopOpacity="0.28"/>
        <stop offset="60%" stopColor="white" stopOpacity="0.04"/>
        <stop offset="100%" stopColor="black" stopOpacity="0.18"/>
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`}/>
  </>
)

// ─── Pet Head Designs ──────────────────────────────────────────────────────────
// viewBox 0 0 120 120. Standard head: cx=60, cy=72, r=40

const SlimeHead = ({ color, accent, mood, gid }: any) => (
  <g className="a-blob">
    <ellipse cx="60" cy="116" rx="22" ry="4" fill="black" opacity="0.1"/>
    {/* Body blob */}
    <path d="M20 72 C17 50,24 28,60 24 C96 28,103 50,100 72 C102 94,86 114,60 114 C34 114,18 94,20 72Z"
      fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={70} r={42}/>
    {/* Highlight shine arc */}
    <path d="M34 36 Q46 24 70 30" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.38"/>
    {/* Glossy inner glow */}
    <ellipse cx="60" cy="88" rx="20" ry="12" fill="white" opacity="0.08"/>
    {/* Arm nubs */}
    <ellipse cx="14" cy="75" rx="11" ry="8" fill={color} stroke={accent} strokeWidth="2.5" transform="rotate(-22,14,75)"/>
    <ellipse cx="106" cy="75" rx="11" ry="8" fill={color} stroke={accent} strokeWidth="2.5" transform="rotate(22,106,75)"/>
    {/* Arm outline sheen */}
    <ellipse cx="14" cy="73" rx="6" ry="4" fill="white" opacity="0.18" transform="rotate(-22,14,73)"/>
    <ellipse cx="106" cy="73" rx="6" ry="4" fill="white" opacity="0.18" transform="rotate(22,106,73)"/>
    <Face mood={mood} model="buff_slime" cx={60} cy={67} er={12}/>
  </g>
)

const BunnyHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="22" ry="4" fill="black" opacity="0.1"/>
    {/* Tall ears */}
    <ellipse cx="37" cy="23" rx="13" ry="28" fill={color} stroke={accent} strokeWidth="3" className="a-ear-l"/>
    <ellipse cx="83" cy="23" rx="13" ry="28" fill={color} stroke={accent} strokeWidth="3" className="a-ear-r"/>
    {/* Inner ear */}
    <ellipse cx="37" cy="23" rx="7" ry="20" fill={accent} opacity="0.55" className="a-ear-l"/>
    <ellipse cx="83" cy="23" rx="7" ry="20" fill={accent} opacity="0.55" className="a-ear-r"/>
    {/* Ear shine */}
    <path d="M32 10 Q37 4 42 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" className="a-ear-l"/>
    <path d="M78 10 Q83 4 88 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" className="a-ear-r"/>
    {/* Head */}
    <circle cx="60" cy="72" r="41" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={72} r={41}/>
    {/* Shine */}
    <path d="M38 48 Q52 38 72 44" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* Bunny nose */}
    <ellipse cx="60" cy="86" rx="4.5" ry="3.2" fill={accent} opacity="0.9"/>
    <circle cx="58.5" cy="85" r="1.2" fill="white" opacity="0.6"/>
    {/* Cheek puffs */}
    <ellipse cx="36" cy="81" rx="9" ry="6" fill={accent} opacity="0.22"/>
    <ellipse cx="84" cy="81" rx="9" ry="6" fill={accent} opacity="0.22"/>
    <Face mood={mood} model="power_bunny" cx={60} cy={65} er={11}/>
  </g>
)

const CatHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="22" ry="4" fill="black" opacity="0.1"/>
    {/* Pointy ears */}
    <polygon points="32,50 22,14 54,43" fill={color} stroke={accent} strokeWidth="3"
      strokeLinejoin="round" className="a-ear-l"/>
    <polygon points="88,50 98,14 66,43" fill={color} stroke={accent} strokeWidth="3"
      strokeLinejoin="round" className="a-ear-r"/>
    {/* Inner ear */}
    <polygon points="34,48 27,18 52,42" fill={accent} opacity="0.7" className="a-ear-l"/>
    <polygon points="86,48 93,18 68,42" fill={accent} opacity="0.7" className="a-ear-r"/>
    {/* Head */}
    <circle cx="60" cy="72" r="40" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={72} r={40}/>
    {/* Shine */}
    <path d="M38 50 Q52 39 72 45" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* Cat nose */}
    <path d="M57 82 L60 87 L63 82 Q60 78.5 57 82Z" fill={accent} opacity="0.9"/>
    {/* Whiskers */}
    <path d="M18 77 L44 75 M18 82 L44 80" stroke={accent} strokeWidth="1.2" opacity="0.45" strokeLinecap="round"/>
    <path d="M102 77 L76 75 M102 82 L76 80" stroke={accent} strokeWidth="1.2" opacity="0.45" strokeLinecap="round"/>
    {/* Tail curling around */}
    <path d="M88 104 Q102 84 98 110" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" className="a-tail"/>
    <path d="M88 104 Q102 84 98 110" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" className="a-tail" opacity="0.55"/>
    <path d="M90 105 Q101 87 98 110" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="a-tail" opacity="0.25"/>
    <Face mood={mood} model="gym_cat" cx={60} cy={65} er={11}/>
  </g>
)

const DogHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="23" ry="4" fill="black" opacity="0.1"/>
    {/* Floppy ears */}
    <path d="M20 56 C8 32,12 16,36 28 L42 66 C33 70,20 68,20 56Z"
      fill={accent} stroke={color} strokeWidth="2" opacity="0.95"/>
    <path d="M100 56 C112 32,108 16,84 28 L78 66 C87 70,100 68,100 56Z"
      fill={accent} stroke={color} strokeWidth="2" opacity="0.95"/>
    {/* Ear shine */}
    <path d="M24 36 Q30 24 38 30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    <path d="M96 36 Q90 24 82 30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    {/* Head */}
    <circle cx="60" cy="72" r="40" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={72} r={40}/>
    {/* Shine */}
    <path d="M38 50 Q52 40 70 46" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* Muzzle */}
    <ellipse cx="60" cy="85" rx="16" ry="11" fill="white" opacity="0.48" stroke={accent} strokeWidth="1.5"/>
    {/* Nose */}
    <ellipse cx="60" cy="80" rx="6" ry="4.5" fill="#111"/>
    <circle cx="58.5" cy="79" r="1.8" fill="white" opacity="0.7"/>
    {/* Collar */}
    <path d="M33 96 Q60 107 87 96" fill="none" stroke="#e53e3e" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
    <circle cx="60" cy="103" r="4" fill="#fbbf24" opacity="0.95"/>
    {/* Spot marking */}
    <circle cx="47" cy="64" r="7" fill={accent} opacity="0.28"/>
    <Face mood={mood} model="iron_pup" cx={60} cy={63} er={10}/>
  </g>
)

const FoxHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="22" ry="4" fill="black" opacity="0.1"/>
    {/* Pointy ears */}
    <polygon points="32,50 23,10 54,43" fill={color} stroke={accent} strokeWidth="3"
      strokeLinejoin="round" className="a-ear-l"/>
    <polygon points="88,50 97,10 66,43" fill={color} stroke={accent} strokeWidth="3"
      strokeLinejoin="round" className="a-ear-r"/>
    {/* Inner ear */}
    <polygon points="34,48 29,14 52,41" fill={accent} opacity="0.65" className="a-ear-l"/>
    <polygon points="86,48 91,14 68,41" fill={accent} opacity="0.65" className="a-ear-r"/>
    {/* Head */}
    <circle cx="60" cy="72" r="40" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={72} r={40}/>
    {/* Shine */}
    <path d="M38 50 Q52 40 72 46" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* White muzzle */}
    <ellipse cx="60" cy="83" rx="18" ry="13" fill="white" opacity="0.75"/>
    {/* Nose */}
    <ellipse cx="60" cy="78" rx="5" ry="3.5" fill="#111"/>
    <circle cx="58.5" cy="77" r="1.4" fill="white" opacity="0.7"/>
    {/* Cheek tufts */}
    <ellipse cx="34" cy="76" rx="7" ry="4.5" fill={accent} opacity="0.3"/>
    <ellipse cx="86" cy="76" rx="7" ry="4.5" fill={accent} opacity="0.3"/>
    {/* Tail tip peeking at side */}
    <path d="M86 105 Q100 86 98 110" fill={color} stroke={accent} strokeWidth="2.5" className="a-tail"/>
    <path d="M89 109 Q99 92 98 110" fill="white" opacity="0.6" className="a-tail"/>
    <Face mood={mood} model="flex_fox" cx={60} cy={64} er={11}/>
  </g>
)

const PandaHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="23" ry="4" fill="black" opacity="0.1"/>
    {/* Round ears */}
    <circle cx="32" cy="35" r="16" fill={accent} stroke={accent} strokeWidth="1.5"/>
    <circle cx="88" cy="35" r="16" fill={accent} stroke={accent} strokeWidth="1.5"/>
    {/* Ear inner */}
    <circle cx="32" cy="35" r="9" fill={color} opacity="0.5"/>
    <circle cx="88" cy="35" r="9" fill={color} opacity="0.5"/>
    {/* Head */}
    <circle cx="60" cy="72" r="41" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={72} r={41}/>
    {/* Shine */}
    <path d="M37 50 Q52 40 72 46" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* Eye patches — panda's signature */}
    <ellipse cx="43" cy="65" rx="15" ry="14" fill={accent} opacity="0.94"/>
    <ellipse cx="77" cy="65" rx="15" ry="14" fill={accent} opacity="0.94"/>
    {/* Nose */}
    <ellipse cx="60" cy="85" rx="5.5" ry="4" fill={accent} opacity="0.9"/>
    <circle cx="58.5" cy="84" r="1.4" fill="white" opacity="0.5"/>
    {/* Tummy patch */}
    <ellipse cx="60" cy="100" rx="12" ry="8" fill={color} opacity="0.6"/>
    <Face mood={mood} model="mighty_panda" cx={60} cy={63} er={9}/>
  </g>
)

const TortoiseHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="21" ry="4" fill="black" opacity="0.1"/>
    {/* Shell dome on top */}
    <path d="M28 70 C26 46,37 30,60 28 C83 30,94 46,92 70Z"
      fill={accent} stroke="#047857" strokeWidth="3"/>
    {/* Shell pattern hexagons */}
    <path d="M60 34 L74 48 L70 64 L50 64 L46 48Z"
      fill="none" stroke={color} strokeWidth="1.8" opacity="0.55"/>
    <path d="M38 58 Q37 45 46 40 Q53 47 50 60Z" fill="none" stroke={color} strokeWidth="1.2" opacity="0.45"/>
    <path d="M82 58 Q83 45 74 40 Q67 47 70 60Z" fill="none" stroke={color} strokeWidth="1.2" opacity="0.45"/>
    {/* Shell shine */}
    <path d="M40 40 Q56 30 74 36" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.38"/>
    {/* Head */}
    <circle cx="60" cy="82" r="33" fill={color} stroke="#047857" strokeWidth="3"/>
    <HeadSheen id={gid} cx={60} cy={82} r={33}/>
    {/* Head shine */}
    <path d="M44 66 Q54 58 70 63" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.33"/>
    {/* Nostril dots */}
    <circle cx="57" cy="92" r="1.5" fill="#047857" opacity="0.7"/>
    <circle cx="63" cy="92" r="1.5" fill="#047857" opacity="0.7"/>
    <Face mood={mood} model="turbo_tortoise" cx={60} cy={79} er={9}/>
  </g>
)

const HawkHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="21" ry="4" fill="black" opacity="0.1"/>
    {/* Wings framing head */}
    <path d="M24 74 Q6 55,10 76 Q12 87,26 86"
      fill={color} stroke={accent} strokeWidth="2.5" className="a-wing-l"/>
    <path d="M96 74 Q114 55,110 76 Q108 87,94 86"
      fill={color} stroke={accent} strokeWidth="2.5" className="a-wing-r"/>
    {/* Wing feather details */}
    <path d="M14 66 Q18 60,22 68" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" className="a-wing-l"/>
    <path d="M106 66 Q102 60,98 68" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" className="a-wing-r"/>
    {/* Head crest */}
    <path d="M46 34 Q54 18 60 26 Q66 18 74 34"
      fill={accent} opacity="0.9"/>
    <path d="M50 32 Q58 12,60 22 Q62 12,70 32"
      fill={accent} opacity="0.65"/>
    {/* Head */}
    <circle cx="60" cy="74" r="38" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={74} r={38}/>
    {/* Shine */}
    <path d="M38 54 Q52 44 72 50" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* Stripe eye markings */}
    <path d="M28 62 L44 67" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
    <path d="M92 62 L76 67" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
    {/* Beak (hooked) */}
    <path d="M50 84 Q56 80 60 84 Q64 80 70 84 Q65 94 60 96 Q55 94 50 84Z"
      fill="#FBBF24" stroke="#d97706" strokeWidth="1.5"/>
    <Face mood={mood} model="swift_hawk" cx={60} cy={67} er={10}/>
  </g>
)

const DragonHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="22" ry="4" fill="black" opacity="0.1"/>
    {/* Fire glow underbelly */}
    <ellipse cx="60" cy="100" rx="18" ry="9" fill="#ff6b35" opacity="0.15" className="a-fire"/>
    {/* Horns */}
    <path d="M35 52 L26 12 L48 40" fill={accent} stroke={accent} strokeWidth="2"
      strokeLinejoin="round" className="a-ear-l"/>
    <path d="M85 52 L94 12 L72 40" fill={accent} stroke={accent} strokeWidth="2"
      strokeLinejoin="round" className="a-ear-r"/>
    {/* Spine ridge spikes */}
    <path d="M46 36 L42 20 M55 31 L53 14 M65 31 L67 14 M74 36 L78 20"
      stroke={accent} strokeWidth="3.5" strokeLinecap="round" opacity="0.8"/>
    {/* Head */}
    <circle cx="60" cy="72" r="40" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={72} r={40}/>
    {/* Shine */}
    <path d="M38 50 Q52 40 72 46" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* Scale texture */}
    <path d="M42 58 Q50 54 58 58 M50 67 Q58 63 66 67"
      fill="none" stroke={accent} strokeWidth="1.2" opacity="0.3" strokeLinecap="round"/>
    {/* Snout */}
    <ellipse cx="60" cy="85" rx="14" ry="8" fill={accent} opacity="0.4"/>
    {/* Nostrils */}
    <circle cx="54.5" cy="84" r="2.8" fill={accent} opacity="0.85"/>
    <circle cx="65.5" cy="84" r="2.8" fill={accent} opacity="0.85"/>
    {/* Fire breath */}
    <path d="M50 92 Q57 84,60 92 Q63 84,70 92"
      fill="#ff6b35" className="a-fire" opacity="0.8"/>
    <Face mood={mood} model="blaze_dragon" cx={60} cy={65} er={10}/>
  </g>
)

const BearHead = ({ color, accent, mood, gid }: any) => (
  <g>
    <ellipse cx="60" cy="116" rx="24" ry="4" fill="black" opacity="0.1"/>
    {/* Round ears */}
    <circle cx="31" cy="35" r="17" fill={color} stroke={accent} strokeWidth="3"/>
    <circle cx="89" cy="35" r="17" fill={color} stroke={accent} strokeWidth="3"/>
    <circle cx="31" cy="35" r="10" fill={accent} opacity="0.55"/>
    <circle cx="89" cy="35" r="10" fill={accent} opacity="0.55"/>
    {/* Ear shine */}
    <path d="M26 26 Q31 20 36 26" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M84 26 Q89 20 94 26" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
    {/* Head */}
    <circle cx="60" cy="73" r="41" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={73} r={41}/>
    {/* Shine */}
    <path d="M38 50 Q52 40 72 46" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* Muzzle */}
    <ellipse cx="60" cy="87" rx="17" ry="12" fill="white" opacity="0.42" stroke={accent} strokeWidth="1.5"/>
    {/* Nose */}
    <ellipse cx="60" cy="82" rx="6" ry="4.5" fill="#111"/>
    <circle cx="58.5" cy="81" r="1.8" fill="white" opacity="0.7"/>
    {/* Belly patch hint */}
    <ellipse cx="60" cy="104" rx="13" ry="8" fill="white" opacity="0.15"/>
    <Face mood={mood} model="rocky_bear" cx={60} cy={66} er={11}/>
  </g>
)

const WolfHead = ({ color, accent, mood, gid }: any) => (
  <g>
    {/* Premium contained rings — close to the head */}
    <circle cx="60" cy="72" r="46" fill="none" stroke={accent} strokeWidth="2.5" opacity="0.28" strokeDasharray="5 4"/>
    <circle cx="60" cy="72" r="43" fill="none" stroke={accent} strokeWidth="1" opacity="0.15"/>
    <ellipse cx="60" cy="116" rx="24" ry="4" fill="black" opacity="0.1"/>
    {/* Sharp pointy ears */}
    <polygon points="31,52 22,8 54,43" fill={color} stroke={accent} strokeWidth="3"
      strokeLinejoin="round" className="a-ear-l"/>
    <polygon points="89,52 98,8 66,43" fill={color} stroke={accent} strokeWidth="3"
      strokeLinejoin="round" className="a-ear-r"/>
    <polygon points="33,50 26,12 52,41" fill={accent} opacity="0.48" className="a-ear-l"/>
    <polygon points="87,50 94,12 68,41" fill={accent} opacity="0.48" className="a-ear-r"/>
    {/* Head */}
    <circle cx="60" cy="72" r="40" fill={color} stroke={accent} strokeWidth="3.5"/>
    <HeadSheen id={gid} cx={60} cy={72} r={40}/>
    {/* Shine */}
    <path d="M38 50 Q52 40 72 46" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.36"/>
    {/* White muzzle */}
    <ellipse cx="60" cy="84" rx="17" ry="12" fill="white" opacity="0.58"/>
    {/* Nose */}
    <ellipse cx="60" cy="79" rx="5.5" ry="4" fill="#111"/>
    <circle cx="58.5" cy="78" r="1.5" fill="white" opacity="0.75"/>
    {/* Battle scar */}
    <path d="M40 61 L34 72" stroke={accent} strokeWidth="2.5" opacity="0.55" strokeLinecap="round"/>
    {/* Crescent mark on forehead — premium signature */}
    <path d="M55 46 Q60 38 65 46 Q60 42 55 46Z" fill={accent} opacity="0.55"/>
    <Face mood={mood} model="titan_wolf" cx={60} cy={64} er={11}/>
  </g>
)

// ─── Interaction Effects ───────────────────────────────────────────────────────

const InteractionEffect = ({ type }: { type: PetInteraction | null }) => {
  if (!type) return null
  switch (type) {
    case 'pet':
      return (
        <g>
          {[{x:18,y:36,d:0},{x:88,y:30,d:0.15},{x:54,y:12,d:0.3}].map((p,i) => (
            <text key={i} x={p.x} y={p.y} fontSize="16" className="a-particle"
              style={{animationDelay:`${p.d}s`}}>❤️</text>
          ))}
        </g>
      )
    case 'bath':
      return (
        <g>
          {[{x:12,y:84,d:0},{x:100,y:90,d:0.12},{x:34,y:96,d:0.24},{x:78,y:88,d:0.36}].map((b,i) => (
            <circle key={i} cx={b.x} cy={b.y} r={3+i%2} fill="#7dd3fc" opacity="0.75"
              className="a-particle" style={{animationDelay:`${b.d}s`}}/>
          ))}
          <text x="40" y="106" fontSize="14" className="a-particle" style={{animationDelay:'0.08s'}}>🛁</text>
        </g>
      )
    case 'flex':
      return (
        <g>
          <text x="6" y="56" fontSize="22" className="a-muscle">💪</text>
          <text x="82" y="50" fontSize="22" className="a-muscle" style={{animationDelay:'0.12s'}}>💪</text>
          {[{x:16,y:28,d:0.1},{x:88,y:34,d:0.25},{x:50,y:6,d:0.4}].map((p,i) => (
            <text key={i} x={p.x} y={p.y} fontSize="12" className="a-particle"
              style={{animationDelay:`${p.d}s`}}>⚡</text>
          ))}
        </g>
      )
    case 'tickle':
      return (
        <g>
          {[{x:30,y:40,d:0},{x:76,y:36,d:0.1},{x:53,y:18,d:0.22},{x:18,y:54,d:0.34},{x:94,y:48,d:0.45}].map((s,i) => (
            <text key={i} x={s.x} y={s.y} fontSize="13" className="a-particle"
              style={{animationDelay:`${s.d}s`}}>⭐</text>
          ))}
        </g>
      )
    default: return null
  }
}

// ─── Accessories ──────────────────────────────────────────────────────────────

const Accessory = ({ milestones }: { milestones: string[] }) => {
  if (!milestones.length) return null
  const thresh = (n: number) => milestones.some(m => parseInt(m) >= n)
  return (
    <g style={{overflow:'visible'}}>
      {/* 1 workout → sweatband */}
      {thresh(1) && (
        <g>
          <path d="M20 58 Q60 50 100 58 Q100 68 60 70 Q20 68 20 58Z"
            fill="#ef4444" opacity="0.96"/>
          <path d="M22 62 Q60 55 98 62" fill="none" stroke="white" strokeWidth="2.5" opacity="0.2"/>
        </g>
      )}
      {/* 5 → star badge */}
      {thresh(5) && (
        <text x="88" y="26" fontSize="15">⭐</text>
      )}
      {/* 10 → mini dumbbell */}
      {thresh(10) && (
        <g transform="translate(3,84)">
          <rect x="0" y="2" width="14" height="4" rx="2" fill="#6b7280"/>
          <circle cx="0" cy="4" r="5.5" fill="#374151" stroke="#4b5563" strokeWidth="1.2"/>
          <circle cx="14" cy="4" r="5.5" fill="#374151" stroke="#4b5563" strokeWidth="1.2"/>
        </g>
      )}
      {/* 25 → gym belt */}
      {thresh(25) && (
        <rect x="26" y="103" width="68" height="8" rx="4" fill="#92400e" stroke="#78350f" strokeWidth="1.5"/>
      )}
      {/* 50 → medal on ribbon */}
      {thresh(50) && (
        <g transform="translate(52,104)">
          <path d="M0 0 L14 0 L7 12Z" fill="#dc2626"/>
          <circle cx="7" cy="15" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5"/>
          <text x="7" y="19" fontSize="8" textAnchor="middle" fill="#d97706">★</text>
        </g>
      )}
      {/* 100 → crown */}
      {thresh(100) && (
        <g>
          <path d="M34 22 L40 6 L60 18 L80 6 L86 22Z"
            fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="40" cy="6" r="3" fill="#ef4444"/>
          <circle cx="60" cy="18" r="3" fill="#ef4444"/>
          <circle cx="80" cy="6" r="3" fill="#ef4444"/>
          {/* Crown shine */}
          <path d="M42 14 Q60 10 78 14" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"/>
        </g>
      )}
      {/* 200 → legend aura */}
      {thresh(200) && (
        <>
          <circle cx="60" cy="72" r="58" fill="none" stroke="#fbbf24"
            strokeWidth="2.5" strokeDasharray="5 4" opacity="0.6" className="a-wiggle"/>
          <circle cx="60" cy="72" r="62" fill="none" stroke="#fbbf24"
            strokeWidth="1" opacity="0.22" className="a-wolf"/>
        </>
      )}
    </g>
  )
}

// ─── Mood Overlays ────────────────────────────────────────────────────────────

const MoodOverlay = ({ mood }: { mood: PetMood }) => {
  if (mood === 'dirty') return (
    <g className="a-wiggle">
      <text x="8" y="38" fontSize="13">🪰</text>
      <text x="92" y="32" fontSize="11">🪰</text>
      <path d="M44 18 Q54 10,64 18" fill="none" stroke="#6b7a5a" strokeWidth="1.5" opacity="0.5" strokeLinecap="round"/>
    </g>
  )
  if (mood === 'ecstatic') return (
    <g>
      <circle cx="14" cy="28" r="3"   fill="#FBBF24" className="a-wolf" opacity="0.85"/>
      <circle cx="106" cy="34" r="2.5" fill="#FBBF24" className="a-wolf" style={{animationDelay:'0.3s'}} opacity="0.75"/>
      <circle cx="60"  cy="6"  r="3.5" fill="#FBBF24" className="a-wolf" style={{animationDelay:'0.6s'}} opacity="0.8"/>
      <text x="88" y="14" fontSize="10" className="a-particle" style={{animationDelay:'0.2s'}}>✨</text>
    </g>
  )
  return null
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function PetSvg({ model, mood, size = 120, isInteracting, interactionType, milestones = [], className }: PetSvgProps) {
  const info = PET_CATALOG[model]
  const isAtrophied = mood === 'atrophied'
  const isDirty     = mood === 'dirty'
  const isStarving  = mood === 'starving'
  const isEcstatic  = mood === 'ecstatic'

  const baseColor   = isAtrophied ? '#9ca3af' : isStarving ? '#6b7280' : isDirty ? '#8da48b' : info.color
  const accentColor = isAtrophied ? '#4b5563' : isStarving ? '#374151' : isDirty ? '#4b5348' : info.accentColor

  const animClass = isAtrophied || isStarving
    ? 'a-shake' : isEcstatic ? 'a-float' : 'a-breathe'

  // Stable gradient ID per model (avoids conflicts in same SVG context)
  const gid = `sh_${model}`

  const p = { color: baseColor, accent: accentColor, mood, gid }

  const renderHead = () => {
    switch (model) {
      case 'buff_slime':     return <SlimeHead {...p}/>
      case 'gym_cat':        return <CatHead {...p}/>
      case 'iron_pup':       return <DogHead {...p}/>
      case 'power_bunny':    return <BunnyHead {...p}/>
      case 'flex_fox':       return <FoxHead {...p}/>
      case 'mighty_panda':   return <PandaHead {...p}/>
      case 'turbo_tortoise': return <TortoiseHead {...p}/>
      case 'swift_hawk':     return <HawkHead {...p}/>
      case 'blaze_dragon':   return <DragonHead {...p}/>
      case 'rocky_bear':     return <BearHead {...p}/>
      case 'titan_wolf':     return <WolfHead {...p}/>
      default:               return <SlimeHead {...p}/>
    }
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className || ''}`} style={{ width: size, height: size }}>
      <PetStyles/>
      <svg viewBox="0 0 120 120" width="100%" height="100%"
        className={animClass} style={{ overflow: 'visible' }}>
        {renderHead()}
        <MoodOverlay mood={mood}/>
        {interactionType && <InteractionEffect type={interactionType}/>}
        <Accessory milestones={milestones}/>
      </svg>
    </div>
  )
}
