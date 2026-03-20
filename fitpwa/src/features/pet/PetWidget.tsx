import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePetStore, PET_CATALOG, ALL_PETS, getPetDailySuggestion, type PetModel, type PetInteraction } from './usePetStore'
import { PetSvg } from './PetSvg'
import { useAuthStore } from '@/features/auth/authStore'
import { useTranslation } from 'react-i18next'
import { Lock, Hand, Dumbbell, Feather, Droplets, Pencil, Zap } from 'lucide-react'
import { PromptModal } from '../../shared/components/PromptModal'

const MOOD_META: Record<string, { label: string; labelPt: string; color: string; bg: string }> = {
  ecstatic: { label: 'Ecstatic',  labelPt: 'Extasiado',  color: 'text-primary',    bg: 'bg-primary/20' },
  happy:    { label: 'Happy',     labelPt: 'Feliz',      color: 'text-green-400',  bg: 'bg-green-500/20' },
  neutral:  { label: 'Neutral',   labelPt: 'Normal',     color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  hungry:   { label: 'Hungry',    labelPt: 'Com Fome',   color: 'text-orange-400', bg: 'bg-orange-500/20' },
  sleeping: { label: 'Sleeping',  labelPt: 'A dormir',   color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  dirty:    { label: 'Dirty',     labelPt: 'Sujo',       color: 'text-amber-600',  bg: 'bg-amber-800/20' },
  atrophied:{ label: 'Atrophied', labelPt: 'Atrofiado',  color: 'text-gray-500',   bg: 'bg-gray-800/50' },
  starving: { label: 'Starving',  labelPt: 'Esfomeado',  color: 'text-red-500',    bg: 'bg-red-500/20' },
}

const INTERACTION_EMOJIS: Record<PetInteraction, string[]> = {
  pet:    ['❤️','💕','🥰','💗'],
  bath:   ['💧','🫧','✨','💦'],
  flex:   ['💪','🔥','⚡','🏋️'],
  tickle: ['⭐','😄','✨','🎉'],
}

export function PetWidget() {
  const { t, i18n } = useTranslation()
  const { profile } = useAuthStore()
  const {
    selectedPet, petName, unlockedPets, hunger, cleanliness, currentStreak, milestones,
    setPet, renamePet, unlockPet, tickStats, getMood, canInteract, interact,
  } = usePetStore()

  const [newName, setNewName]           = useState('')
  const [showSelector, setShowSelector] = useState(false)
  const [message, setMessage]           = useState('')
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [isInteracting, setIsInteracting] = useState<PetInteraction | null>(null)
  const [particles, setParticles]       = useState<{ id: number; x: number; y: number; emoji: string }[]>([])
  const [showMilestoneToast, setShowMilestoneToast] = useState(false)
  const [lastMilestoneCount, setLastMilestoneCount] = useState(milestones.length)
  const [cooldownRemaining, setCooldownRemaining]   = useState(false)

  const isPt      = i18n.language === 'pt'
  const userLevel = profile?.level || 1
  const mood      = getMood()
  const dailySuggestion = getPetDailySuggestion(selectedPet as PetModel, isPt)
  const petInfo   = PET_CATALOG[selectedPet as PetModel]
  const moodMeta  = MOOD_META[mood] || MOOD_META.neutral

  // Milestone toast
  useEffect(() => {
    if (milestones.length > lastMilestoneCount) {
      setShowMilestoneToast(true)
      const timer = setTimeout(() => setShowMilestoneToast(false), 5000)
      setLastMilestoneCount(milestones.length)
      return () => clearTimeout(timer)
    }
  }, [milestones.length, lastMilestoneCount])

  // Initial message
  useEffect(() => {
    import('./usePetStore').then(({ getPetMessage }) => {
      setMessage(getPetMessage(selectedPet, mood, isPt, petName))
    })
  }, [selectedPet, mood, isPt, petName])

  // Tick stats
  useEffect(() => {
    tickStats()
    const iv = setInterval(tickStats, 60_000)
    return () => clearInterval(iv)
  }, [tickStats])

  // Auto-unlock free pets
  useEffect(() => {
    ALL_PETS.forEach(pet => {
      const info = PET_CATALOG[pet as PetModel]
      if (!info.premium && userLevel >= info.unlockLevel && !unlockedPets.includes(pet)) {
        unlockPet(pet)
      }
    })
    if (profile?.is_premium && !unlockedPets.includes('titan_wolf')) {
      unlockPet('titan_wolf')
    }
  }, [userLevel, profile?.is_premium, unlockedPets, unlockPet])

  // Rotate passive messages
  useEffect(() => {
    const iv = setInterval(() => {
      if (canInteract()) {
        import('./usePetStore').then(({ getPetMessage }) => {
          setMessage(getPetMessage(selectedPet, mood, isPt, petName))
        })
      }
    }, 15_000)
    return () => clearInterval(iv)
  }, [selectedPet, mood, isPt, canInteract, petName])

  // Cooldown indicator
  useEffect(() => {
    setCooldownRemaining(!canInteract())
    const iv = setInterval(() => setCooldownRemaining(!canInteract()), 5_000)
    return () => clearInterval(iv)
  }, [canInteract])

  const hungerPercent      = Math.round(hunger)
  const cleanlinessPercent = Math.round(cleanliness)

  const hungerColor = hungerPercent >= 60 ? 'bg-primary'
    : hungerPercent >= 30 ? 'bg-yellow-500' : 'bg-red-500'
  const cleanlinessColor = cleanlinessPercent >= 70 ? 'bg-blue-400'
    : cleanlinessPercent >= 30 ? 'bg-blue-600' : 'bg-red-500'

  const spawnParticles = (type: PetInteraction) => {
    const emojis = INTERACTION_EMOJIS[type]
    const newP = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 40,
      emoji: emojis[i % emojis.length],
    }))
    setParticles(newP)
    setTimeout(() => setParticles([]), 900)
  }

  const handleInteract = (type: PetInteraction) => {
    const { success, message: msg } = interact(type)
    if (success) {
      setIsInteracting(type)
      setMessage(msg)
      spawnParticles(type)
      setTimeout(() => setIsInteracting(null), 1100)
    } else if (msg) {
      setMessage(msg)
    }
  }

  const petAnim: Record<PetInteraction, any> = {
    pet:    { scale:[1,1.06,0.95,1], rotate:[0,-4,4,0], transition:{type:'spring',stiffness:300,damping:12} },
    flex:   { scale:[1,1.22,1],      y:[0,-8,0],         transition:{type:'spring',stiffness:400,damping:10} },
    tickle: { x:[0,-4,4,-4,4,0],    scale:[1,1.06,1],    transition:{duration:0.4} },
    bath:   { rotate:[0,6,-6,6,0],   scale:[1,0.88,1],   transition:{type:'spring',stiffness:200,damping:18} },
  }

  const interactionButtons: { type: PetInteraction; icon: React.ReactNode; labelPt: string; labelEn: string; hoverColor: string }[] = [
    { type:'bath',   icon:<Droplets className="w-4 h-4"/>, labelPt:'Banho',    labelEn:'Bath',    hoverColor:'hover:bg-blue-500/25 hover:text-blue-400' },
    { type:'pet',    icon:<Hand      className="w-4 h-4"/>, labelPt:'Festinha', labelEn:'Pet',     hoverColor:'hover:bg-pink-500/25 hover:text-pink-400' },
    { type:'flex',   icon:<Dumbbell  className="w-4 h-4"/>, labelPt:'Treinar',  labelEn:'Flex',    hoverColor:'hover:bg-primary/25 hover:text-primary' },
    { type:'tickle', icon:<Feather   className="w-4 h-4"/>, labelPt:'Cócegas', labelEn:'Tickle',  hoverColor:'hover:bg-yellow-500/25 hover:text-yellow-400' },
  ]

  const isSleeping      = mood === 'sleeping'
  const interactDisabled = cooldownRemaining || isSleeping

  return (
    <div className="bg-surface-200 border border-surface-100 rounded-3xl p-5 relative overflow-hidden">
      {/* Milestone toast */}
      <AnimatePresence>
        {showMilestoneToast && (
          <motion.div
            initial={{ opacity:0, y:-20, scale:0.9 }}
            animate={{ opacity:1, y:0,   scale:1 }}
            exit={{   opacity:0, y:-20, scale:0.9 }}
            className="absolute top-4 left-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl shadow-xl border border-yellow-300 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 animate-pulse"/>
            <div className="bg-white/25 p-2 rounded-lg relative z-10 text-xl">🏆</div>
            <div className="relative z-10">
              <p className="text-white font-black text-[10px] uppercase tracking-wider leading-none">
                {isPt ? 'Novo Marco Alcançado!' : 'New Milestone Reached!'}
              </p>
              <p className="text-white/85 text-[9px] font-bold mt-0.5">
                {isPt ? 'O teu pet evoluiu com um novo acessório!' : 'Your pet evolved with a new accessory!'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood background glow */}
      <div
        className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl transition-colors duration-1000 opacity-60"
        style={{ backgroundColor: `${petInfo.color}18` }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">

        {/* Pet display */}
        <motion.div
          className="shrink-0 cursor-pointer relative"
          onClick={() => setShowSelector(s => !s)}
          animate={isInteracting ? petAnim[isInteracting] : {}}
          title={t('gamification.changeMascot')}
        >
          {/* Floating particles */}
          <AnimatePresence>
            {particles.map(p => (
              <motion.span
                key={p.id}
                initial={{ opacity:1, y:0,    x:0,              scale:0.5 }}
                animate={{ opacity:0, y:-52,  x:(p.x-50)*0.6,  scale:1.2 }}
                exit={{    opacity:0 }}
                transition={{ duration:0.82, ease:'easeOut' }}
                className="absolute pointer-events-none text-lg select-none"
                style={{ left:`${p.x}%`, top:`${p.y}%`, zIndex:30 }}
              >
                {p.emoji}
              </motion.span>
            ))}
          </AnimatePresence>

          {petInfo.premium && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase z-10 shadow-lg border border-yellow-300">
              PRO
            </div>
          )}

          <PetSvg
            model={selectedPet as PetModel}
            mood={isInteracting ? (isInteracting === 'tickle' ? 'ecstatic' : 'happy') : mood}
            size={110}
            isInteracting={!!isInteracting}
            interactionType={isInteracting}
            milestones={milestones}
          />
        </motion.div>

        {/* Info panel */}
        <div className="flex-1 w-full min-w-0">

          {/* Name prompt (first time) */}
          {!petName && (
            <div className="mb-3 bg-primary/10 border border-primary/20 rounded-xl p-3">
              <p className="text-[10px] text-primary font-black uppercase tracking-wider mb-2">
                {t('gamification.namePartner')}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Rex, Luna..."
                  className="flex-1 bg-background/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => newName && renamePet(newName)}
                  className="bg-primary text-black font-black px-3 py-1.5 rounded-lg text-xs uppercase"
                >OK</button>
              </div>
            </div>
          )}

          {/* Name + mood row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                {petName || petInfo.name}
                <button
                  onClick={() => setIsPromptOpen(true)}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors group"
                >
                  <Pencil className="w-3 h-3 text-gray-500 group-hover:text-primary"/>
                </button>
                {currentStreak > 0 && (
                  <span className="text-orange-500 flex items-center gap-0.5 text-xs font-black">
                    🔥{currentStreak}
                  </span>
                )}
              </h3>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest -mt-0.5">
                {petInfo.name}
              </span>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${moodMeta.bg} ${moodMeta.color}`}>
              {isPt ? moodMeta.labelPt : moodMeta.label}
            </span>
          </div>

          {/* Speech bubble */}
          <div className="mb-4 min-h-[46px] flex items-start">
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key={message}
                  initial={{ scale:0.85, opacity:0, y:8 }}
                  animate={{ scale:1,    opacity:1, y:0 }}
                  exit={{   scale:0.85, opacity:0, y:-8 }}
                  className="relative bg-white rounded-2xl px-3 py-2 shadow-md border-2 border-primary/25 w-full"
                >
                  {/* Bubble tail */}
                  <div className="absolute -top-2 left-6 w-3.5 h-3.5 bg-white border-l-2 border-t-2 border-primary/25 rotate-45"/>
                  <p className="text-xs text-black font-black leading-snug tracking-tight break-words">
                    {message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Daily workout suggestion */}
          {mood !== 'sleeping' && mood !== 'starving' && mood !== 'atrophied' && (
            <div className="mt-2 mx-1 text-[10px] text-gray-500 font-medium italic text-center leading-relaxed">
              {dailySuggestion}
            </div>
          )}

          {/* Stat bars */}
          <div className="flex flex-col gap-1.5 mb-3">
            {/* Hunger */}
            <div className="flex items-center gap-2 bg-surface-100/60 px-2.5 py-1.5 rounded-xl">
              <span className="text-base leading-none">🍗</span>
              <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${hungerPercent}%` }}
                  transition={{ duration:0.8, ease:'easeOut' }}
                  className={`h-full rounded-full ${hungerColor}`}
                />
              </div>
              <span className="text-[9px] text-gray-500 font-bold w-6 text-right">{hungerPercent}%</span>
            </div>
            {/* Cleanliness */}
            <div className="flex items-center gap-2 bg-surface-100/60 px-2.5 py-1.5 rounded-xl">
              <span className="text-base leading-none">🛁</span>
              <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${cleanlinessPercent}%` }}
                  transition={{ duration:0.8, ease:'easeOut', delay:0.1 }}
                  className={`h-full rounded-full ${cleanlinessColor}`}
                />
              </div>
              <span className="text-[9px] text-gray-500 font-bold w-6 text-right">{cleanlinessPercent}%</span>
            </div>
          </div>

          {/* Interaction buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className={`flex gap-1.5 ${interactDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
              {interactionButtons.map(btn => (
                <motion.button
                  key={btn.type}
                  onClick={() => handleInteract(btn.type)}
                  whileTap={{ scale:0.88 }}
                  className={`flex flex-col items-center gap-0.5 p-2 bg-surface-100 rounded-xl text-gray-400 transition-colors ${btn.hoverColor}`}
                  title={isPt ? btn.labelPt : btn.labelEn}
                >
                  {btn.icon}
                  <span className="text-[7px] font-bold uppercase tracking-wider leading-none">
                    {isPt ? btn.labelPt : btn.labelEn}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Workout motivator or cooldown */}
            <div className="flex items-center gap-2">
              {isSleeping ? (
                <span className="text-[9px] text-blue-400 font-bold px-2 py-1 bg-blue-500/10 rounded-lg">
                  💤 {isPt ? 'A dormir...' : 'Sleeping...'}
                </span>
              ) : interactDisabled ? (
                <span className="text-[9px] text-gray-500 font-bold px-2 py-1 bg-surface-100 rounded-lg">
                  ⏳ {isPt ? 'Cooldown...' : 'Cooldown...'}
                </span>
              ) : hunger < 50 ? (
                <motion.div
                  animate={{ scale:[1,1.03,1] }}
                  transition={{ repeat:Infinity, duration:2 }}
                  className="flex items-center gap-1 px-2 py-1 bg-primary/15 rounded-lg border border-primary/20"
                >
                  <Zap className="w-3 h-3 text-primary"/>
                  <span className="text-[9px] text-primary font-black uppercase tracking-wider">
                    {isPt ? 'Treina!' : 'Go train!'}
                  </span>
                </motion.div>
              ) : null}

              <button
                onClick={() => setShowSelector(s => !s)}
                className="text-[9px] uppercase font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl border border-surface-100 bg-surface-100/50 hover:bg-surface-100 transition-colors"
              >
                {t('gamification.changeMascot')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Selector */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{   height:0, opacity:0 }}
            transition={{ duration:0.28 }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-5 border-t border-surface-100">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {t('gamification.chooseMascot')}
                </p>
                <p className="text-[10px] text-gray-500">
                  {unlockedPets.length} / {ALL_PETS.length} {t('gamification.unlockedItems')}
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {ALL_PETS.map(pet => {
                  const info      = PET_CATALOG[pet as PetModel]
                  const isUnlocked = unlockedPets.includes(pet)
                  const isSelected = selectedPet === pet

                  return (
                    <motion.button
                      key={pet}
                      onClick={() => { if (isUnlocked) { setPet(pet); setShowSelector(false) } }}
                      disabled={!isUnlocked}
                      whileTap={isUnlocked ? { scale:0.93 } : {}}
                      className={`relative flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : isUnlocked
                            ? 'border-surface-100 hover:border-primary/50 bg-surface-100/50 hover:bg-surface-100'
                            : 'border-surface-100 bg-surface-100/20 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      {isSelected && <div className="absolute inset-0 rounded-2xl bg-primary/5"/>}

                      {info.premium && (
                        <div className="absolute top-1.5 right-1.5 bg-gradient-to-br from-yellow-400 to-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase z-10">
                          PRO
                        </div>
                      )}

                      <div className="relative z-10 w-[64px] h-[64px] flex items-center justify-center">
                        {isUnlocked ? (
                          <PetSvg
                            model={pet as PetModel}
                            mood={isSelected ? mood : 'happy'}
                            size={64}
                            milestones={isSelected ? milestones : []}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Lock className="w-7 h-7 text-gray-600"/>
                          </div>
                        )}
                      </div>

                      <span className={`text-[10px] font-bold mt-1 relative z-10 leading-tight text-center ${
                        isSelected ? 'text-white' : 'text-gray-400'
                      }`}>
                        {info.name}
                      </span>

                      {!isUnlocked && (
                        <span className="text-[8px] text-primary/60 font-bold mt-0.5 relative z-10 uppercase tracking-widest">
                          {info.premium ? '★ Premium' : `Lv.${info.unlockLevel}`}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename modal */}
      <PromptModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onConfirm={name => renamePet(name)}
        title={t('gamification.petNamingTitle')}
        label={t('gamification.petNameLabel')}
        defaultValue={petName}
        placeholder={selectedPet}
      />
    </div>
  )
}
