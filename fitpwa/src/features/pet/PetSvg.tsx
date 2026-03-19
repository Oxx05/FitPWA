import { type PetModel, type PetMood, type PetInteraction, PET_CATALOG } from './usePetStore'

interface PetSvgProps {
  model: PetModel
  mood: PetMood
  size?: number
  isInteracting?: boolean
  interactionType?: PetInteraction | null
  milestones?: string[]
}

// ─── CSS Animations ───
const PetStyles = () => (
  <style>{`
    @keyframes pet-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02, 0.98); }
    }
    @keyframes pet-blink {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }
    @keyframes pet-wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-2deg); }
      75% { transform: rotate(2deg); }
    }
    @keyframes pet-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }
    @keyframes pet-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @keyframes mood-flash {
      0% { filter: brightness(1) white-balance(0); }
      50% { filter: brightness(2) contrast(0); opacity: 0.8; }
      100% { filter: brightness(1); }
    }
    @keyframes cat-tail-twitch {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(15deg); }
    }
    @keyframes bunny-ears {
      0%, 90%, 100% { transform: translateY(0); }
      95% { transform: translateY(-3px); }
    }
    @keyframes wolf-howl {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes hawk-wings {
      0%, 100% { transform: rotate(0); }
      50% { transform: rotate(-10deg); }
    }
    @keyframes dragon-smoke {
      0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
      50% { transform: translate(-5px, -10px) scale(1.2); opacity: 0.5; }
      100% { transform: translate(-10px, -20px) scale(1.5); opacity: 0; }
    }
    @keyframes slime-wobble {
      0%, 100% { transform: scale(1, 1); }
      50% { transform: scale(1.1, 0.9); }
    }
    @keyframes particle-float {
      0% { transform: translateY(0) scale(0) rotate(0deg); opacity: 0; }
      20% { transform: translateY(-10px) scale(1.2) rotate(10deg); opacity: 1; }
      100% { transform: translateY(-40px) scale(0.8) rotate(-10deg); opacity: 0; }
    }
    @keyframes bubble-rise {
      0% { transform: translateY(0) scale(0); opacity: 0; }
      20% { transform: translateY(-5px) scale(1); opacity: 0.8; }
      100% { transform: translateY(-30px) scale(1.2); opacity: 0; }
    }
    @keyframes muscle-pop {
      0% { transform: scale(0) rotate(-20deg); opacity: 0; }
      50% { transform: scale(1.3) rotate(0deg); opacity: 1; }
      100% { transform: scale(1) rotate(10deg); opacity: 0; }
    }
    
    .animate-breathe { animation: pet-breathe 3s ease-in-out infinite; transform-origin: bottom; }
    .animate-blink { animation: pet-blink 4s infinite; transform-origin: center; }
    .animate-wiggle { animation: pet-wiggle 2s ease-in-out infinite; }
    .animate-shake-intense { animation: pet-shake 0.2s linear infinite; }
    .animate-float { animation: pet-float 3s ease-in-out infinite; }
    .animate-flash { animation: mood-flash 0.35s ease-out; }

    /* Species Specific */
    .tail-twitch { animation: cat-tail-twitch 1.5s ease-in-out infinite; transform-origin: left bottom; }
    .ear-twitch { animation: bunny-ears 2s ease-in-out infinite; }
    .howl-breath { animation: wolf-howl 4s ease-in-out infinite; transform-origin: center; }
    .wing-flap { animation: hawk-wings 0.3s ease-in-out infinite; }
    .smoke-particle { animation: dragon-smoke 2s ease-out infinite; }
    .wobble { animation: slime-wobble 2s ease-in-out infinite; transform-origin: bottom; }

    /* Interaction Particles */
    .particle { animation: particle-float 0.8s ease-out forwards; transform-origin: center; }
    .bubble { animation: bubble-rise 1s ease-out forwards; transform-origin: center; }
    .muscle { animation: muscle-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: center; }
    
    .pet-path { transition: all 0.3s ease-in-out; }
  `}</style>
)

// ─── Shared Components ───

const Eyes = ({ mood, color = "#111" }: { mood: PetMood, color?: string }) => {
  const isClosed = mood === 'sleeping' || mood === 'atrophied'
  const isEcstatic = mood === 'ecstatic'
  const isSad = mood === 'starving' || mood === 'hungry'
  
  if (isClosed) {
    return (
      <g className="eyes">
        <path d="M35 55 Q45 60 55 55" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M65 55 Q75 60 85 55" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </g>
    )
  }

  return (
    <g className="eyes animate-blink">
      {/* Eye Whites */}
      <circle cx="42" cy="52" r="8" fill="white" className="pet-path" />
      <circle cx="78" cy="52" r="8" fill="white" className="pet-path" />
      {/* Pupils */}
      <circle cx={isEcstatic ? "42" : "44"} cy="52" r="4" fill={color} />
      <circle cx={isEcstatic ? "78" : "80"} cy="52" r="4" fill={color} />
      {/* Sparkle */}
      <circle cx="40" cy="50" r="1.5" fill="white" opacity="0.8" />
      <circle cx="76" cy="50" r="1.5" fill="white" opacity="0.8" />
      
      {isSad && (
        <path d="M38 42 Q42 45 46 42 M74 42 Q78 45 82 42" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      )}
    </g>
  )
}

const Mouth = ({ mood }: { mood: PetMood }) => {
  switch (mood) {
    case 'ecstatic': return <path d="M50 75 Q60 85 70 75" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    case 'happy': return <path d="M52 72 Q60 78 68 72" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
    case 'hungry':
    case 'starving': return <path d="M54 78 Q60 74 66 78" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
    case 'atrophied': return <path d="M55 75 L65 75" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    case 'sleeping': return <circle cx="60" cy="75" r="3" fill="#111" opacity="0.3" />
    default: return <path d="M55 75 Q60 76 65 75" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
  }
}

const Accessory = ({ milestones }: { milestones: string[] }) => {
  if (!milestones.length) return null
  return (
    <g className="accessories" style={{ overflow: 'visible' }}>
      {/* starter: sweatband */}
      {milestones.includes('starter') && (
        <rect x="35" y="25" width="50" height="8" rx="2" fill="#ef4444" opacity="0.9" />
      )}
      {/* beginner: star badge */}
      {milestones.includes('beginner') && (
        <text x="90" y="30" fontSize="12">⭐</text>
      )}
      {/* regular: dumbbell */}
      {milestones.includes('regular') && (
        <g transform="translate(10, 80)">
           <rect x="0" y="0" width="12" height="4" rx="1" fill="#4b5563" />
           <circle cx="0" cy="2" r="4" fill="#374151" />
           <circle cx="12" cy="2" r="4" fill="#374151" />
        </g>
      )}
      {/* committed: gym belt */}
      {milestones.includes('committed') && (
        <rect x="30" y="95" width="60" height="6" rx="2" fill="#92400e" stroke="#78350f" strokeWidth="1" />
      )}
      {/* dedicated: medal */}
      {milestones.includes('dedicated') && (
        <g transform="translate(55, 100)">
          <path d="M0 0 L10 0 L5 10 Z" fill="#ef4444" />
          <circle cx="5" cy="12" r="5" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        </g>
      )}
      {/* veteran: crown */}
      {milestones.includes('veteran') && (
        <path d="M45 20 L50 10 L60 20 L70 10 L75 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      )}
      {/* legend: golden aura */}
      {milestones.includes('legend') && (
        <circle cx="60" cy="65" r="55" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" opacity="0.6" />
      )}
    </g>
  )
}

// ─── Individual Pet Shapes ───

const SlimeBody = ({ color, accent }: any) => (
  <g className="wobble">
    <path d="M20 90 Q20 40 60 30 Q100 40 100 90 Q100 110 60 110 Q20 110 20 90Z" fill={color} className="pet-path" />
    <path d="M30 95 Q60 105 90 95" fill={accent} opacity="0.3" />
  </g>
)

const CatBody = ({ color, accent }: any) => (
  <g>
    <path d="M25 40 L35 20 L50 40 Z" fill={accent} className="ear-twitch" /> 
    <path d="M95 40 L85 20 L70 40 Z" fill={accent} className="ear-twitch" style={{ animationDelay: '0.5s' }} />
    <path d="M100 85 Q115 70 110 100" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" className="tail-twitch" />
    <rect x="25" y="40" width="70" height="70" rx="30" fill={color} className="pet-path" />
  </g>
)

const DogBody = ({ color, accent }: any) => (
  <g>
    <path d="M20 45 Q15 20 40 35 L40 60 Z" fill={accent} /> {/* Floppy Ear L */}
    <path d="M100 45 Q105 20 80 35 L80 60 Z" fill={accent} /> {/* Floppy Ear R */}
    <rect x="25" y="40" width="70" height="70" rx="35" fill={color} className="pet-path" />
    <circle cx="50" cy="70" r="3" fill={accent} opacity="0.4" /> {/* Spot */}
  </g>
)

const BunnyBody = ({ color, accent }: any) => (
  <g>
    <rect x="35" y="10" width="15" height="50" rx="7.5" fill={accent} className="ear-twitch" />
    <rect x="70" y="10" width="15" height="50" rx="7.5" fill={accent} className="ear-twitch" style={{ animationDelay: '0.3s' }} />
    <rect x="25" y="45" width="70" height="65" rx="32" fill={color} className="pet-path" />
    <circle cx="95" cy="95" r="8" fill={color} opacity="0.8" className="wobble" /> {/* Tail */}
  </g>
)

const FoxBody = ({ color, accent }: any) => (
  <g>
    <path d="M25 45 L35 20 L55 50" fill={accent} className="ear-twitch" />
    <path d="M95 45 L85 20 L65 50" fill={accent} className="ear-twitch" style={{ animationDelay: '0.8s' }} />
    <path d="M95 80 Q120 70 110 100 L95 100 Z" fill={color} className="tail-twitch" />
    <path d="M25 50 Q60 35 95 50 L95 100 Q60 115 25 100 Z" fill={color} className="pet-path" />
    <path d="M60 115 L45 95 L75 95 Z" fill="white" opacity="0.9" />
  </g>
)

const PandaBody = ({ color, accent }: any) => (
  <g>
    <circle cx="35" cy="40" r="10" fill={accent} />
    <circle cx="85" cy="40" r="10" fill={accent} />
    <rect x="25" y="40" width="70" height="70" rx="35" fill={color} className="pet-path" />
    <circle cx="42" cy="52" r="12" fill={accent} /> {/* Eye patch L */}
    <circle cx="78" cy="52" r="12" fill={accent} /> {/* Eye patch R */}
  </g>
)

const TortoiseBody = ({ color, accent }: any) => (
  <g>
    <path d="M20 90 Q60 60 100 90 L100 110 L20 110 Z" fill={accent} /> {/* Shell */}
    <rect x="35" y="40" width="50" height="60" rx="25" fill={color} className="pet-path" />
    <path d="M60 70 L70 80 M50 70 L60 80" stroke={color} strokeWidth="2" opacity="0.3" /> {/* Shell pattern */}
  </g>
)

const HawkBody = ({ color, accent }: any) => (
  <g>
    <path d="M10 70 Q30 50 50 70 L40 100 L20 100 Z" fill={accent} className="wing-flap" />
    <path d="M110 70 Q90 50 70 70 L80 100 L100 100 Z" fill={accent} className="wing-flap" style={{ transformOrigin: '70px 70px', animationDelay: '0.15s' }} />
    <rect x="35" y="40" width="50" height="70" rx="25" fill={color} className="pet-path" />
    <path d="M55 70 L65 70 L60 80 Z" fill="#FBBF24" />
  </g>
)

const DragonBody = ({ color, accent }: any) => (
  <g>
    <circle cx="45" cy="75" r="3" fill="gray" opacity="0" className="smoke-particle" />
    <circle cx="55" cy="75" r="3" fill="gray" opacity="0" className="smoke-particle" style={{ animationDelay: '1s' }} />
    <path d="M20 50 L10 30 L40 40 Z" fill={accent} className="ear-twitch" />
    <path d="M100 50 L110 30 L80 40 Z" fill={accent} className="ear-twitch" style={{ animationDelay: '0.4s' }} />
    <rect x="25" y="40" width="70" height="70" rx="30" fill={color} className="pet-path" />
    <path d="M50 40 L60 25 L70 40" fill={accent} />
  </g>
)

const BearBody = ({ color, accent }: any) => (
  <g>
    <circle cx="35" cy="40" r="12" fill={accent} />
    <circle cx="85" cy="40" r="12" fill={accent} />
    <rect x="25" y="45" width="70" height="65" rx="30" fill={color} className="pet-path" />
    <ellipse cx="60" cy="75" rx="15" ry="12" fill="white" opacity="0.2" />
  </g>
)

const WolfBody = ({ color, accent }: any) => (
  <g className="howl-breath">
    {/* Premium Aura */}
    <circle cx="60" cy="70" r="55" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" className="animate-pulse" />
    
    {/* Sharp Ears */}
    <path d="M30 40 L35 15 L50 40" fill={accent} className="ear-twitch" />
    <path d="M90 40 L85 15 L70 40" fill={accent} className="ear-twitch" style={{ animationDelay: '0.2s' }} />
    
    {/* Main Body - Sharper corners for a tougher look */}
    <rect x="25" y="40" width="70" height="70" rx="10" fill={color} className="pet-path" />
    
    {/* Chest Fur */}
    <path d="M60 110 L40 90 L80 90 Z" fill="white" opacity="0.8" />
    
    {/* Battle Scars / Ancestral Markings */}
    <path d="M45 50 L35 60 M40 45 L30 55" stroke={accent} strokeWidth="2" opacity="0.5" strokeLinecap="round" />
  </g>
)

const InteractionEffect = ({ type }: { type: PetInteraction | null }) => {
  if (!type) return null

  switch (type) {
    case 'pet':
      return (
        <g className="hearts">
          {[
            { x: 30, y: 40, d: 0 },
            { x: 90, y: 35, d: 0.2 },
            { x: 60, y: 20, d: 0.4 },
          ].map((p, i) => (
            <text key={i} x={p.x} y={p.y} fontSize="16" className="particle" style={{ animationDelay: `${p.d}s` }}>❤️</text>
          ))}
        </g>
      )
    case 'bath':
      return (
        <g className="bubbles">
          {[
            { x: 20, y: 80, d: 0 },
            { x: 100, y: 90, d: 0.1 },
            { x: 40, y: 100, d: 0.2 },
            { x: 80, y: 95, d: 0.3 },
            { x: 50, y: 85, d: 0.4 },
          ].map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={Math.random() * 4 + 2} fill="#bae6fd" opacity="0.6" className="bubble" style={{ animationDelay: `${b.d}s` }} />
          ))}
          <path d="M20 110 Q60 100 100 110" fill="none" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" opacity="0.4" className="animate-wiggle" />
        </g>
      )
    case 'flex':
      return (
        <g className="muscles">
          <text x="15" y="60" fontSize="20" className="muscle">💪</text>
          <text x="85" y="60" fontSize="20" className="muscle" style={{ animationDelay: '0.1s' }}>💪</text>
          <circle cx="60" cy="60" r="50" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="10 5" opacity="0.3" className="animate-wiggle" />
        </g>
      )
    case 'tickle':
      return (
        <g className="stars">
          {[
            { x: 40, y: 40, d: 0 },
            { x: 80, y: 40, d: 0.1 },
            { x: 60, y: 30, d: 0.2 },
          ].map((s, i) => (
            <text key={i} x={s.x} y={s.y} fontSize="14" className="particle" style={{ animationDelay: `${s.d}s` }}>⭐</text>
          ))}
          <path d="M45 75 Q60 85 75 75" fill="none" stroke="#111" strokeWidth="2" opacity="0.5" className="animate-shake-intense" />
        </g>
      )
    default:
      return null
  }
}

export function PetSvg({ model, mood, size = 120, isInteracting, interactionType, milestones = [] }: PetSvgProps) {
  const info = PET_CATALOG[model as PetModel]
  
  const isAtrophied = mood === 'atrophied'
  const isDirty = mood === 'dirty'
  const isStarving = mood === 'starving'
  const isEcstatic = mood === 'ecstatic'

  const baseColor = isAtrophied ? '#9ca3af' : isStarving ? '#6b7280' : isDirty ? '#8b9a89' : info.color
  const accentColor = isAtrophied ? '#4b5563' : isStarving ? '#374151' : isDirty ? '#4b534a' : info.accentColor

  const animationClass = isAtrophied || isStarving ? 'animate-shake-intense' : isEcstatic ? 'animate-float' : 'animate-breathe'

  const renderBody = () => {
    const props = { color: baseColor, accent: accentColor }
    switch (model) {
      case 'buff_slime': return <SlimeBody {...props} />
      case 'gym_cat': return <CatBody {...props} />
      case 'iron_pup': return <DogBody {...props} />
      case 'power_bunny': return <BunnyBody {...props} />
      case 'flex_fox': return <FoxBody {...props} />
      case 'mighty_panda': return <PandaBody {...props} />
      case 'turbo_tortoise': return <TortoiseBody {...props} />
      case 'swift_hawk': return <HawkBody {...props} />
      case 'blaze_dragon': return <DragonBody {...props} />
      case 'rocky_bear': return <BearBody {...props} />
      case 'titan_wolf': return <WolfBody {...props} />
      default: return <SlimeBody {...props} />
    }
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${isInteracting ? 'animate-flash' : ''}`} style={{ width: size, height: size }}>
      <PetStyles />
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        className={animationClass}
        style={{ overflow: 'visible' }}
      >
        {/* Shadow */}
        <ellipse cx="60" cy="115" rx="30" ry="5" fill="black" opacity="0.1" />

        {/* Base Body */}
        {renderBody()}

        {/* Face Elements */}
        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {/* Interaction Effects */}
        <InteractionEffect type={interactionType || null} />

        {/* Passive Mood Effects (only if not currently interacting) */}
        {!interactionType && (
          <>
            {isEcstatic && (
              <g className="particles">
                <circle cx="20" cy="30" r="2" fill="#FBBF24" className="animate-pulse" />
                <circle cx="100" cy="40" r="2" fill="#FBBF24" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                <circle cx="60" cy="10" r="3" fill="#FBBF24" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
              </g>
            )}
            {isDirty && (
              <g className="flies animate-wiggle">
                <text x="15" y="40" fontSize="12">🪰</text>
                <text x="95" y="35" fontSize="10">🪰</text>
                <path d="M50 20 Q60 10 70 20" fill="none" stroke="#4b534a" strokeWidth="1" opacity="0.5" />
              </g>
            )}
          </>
        )}

        {/* Milestone Accessories */}
        <Accessory milestones={milestones} />
      </svg>
    </div>
  )
}
