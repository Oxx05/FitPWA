import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePetStore, PET_CATALOG, ALL_PETS, type PetModel, type PetInteraction } from './usePetStore'
import { PetSvg } from './PetSvg'
import { useAuthStore } from '@/features/auth/authStore'
import { useTranslation } from 'react-i18next'
import { Lock, Hand, Dumbbell, Feather, Droplets, Pencil } from 'lucide-react'
import { PromptModal } from '../../shared/components/PromptModal'

export function PetWidget() {
  const { t, i18n } = useTranslation()
  const { profile } = useAuthStore()
  const {
    selectedPet,
    petName,
    unlockedPets,
    hunger,
    cleanliness,
    currentStreak,
    milestones,
    setPet,
    renamePet,
    unlockPet,
    tickStats,
    getMood,
    canInteract,
    interact,
  } = usePetStore()

  const [newName, setNewName] = useState('')

  const [showSelector, setShowSelector] = useState(false)
  const [message, setMessage] = useState('')
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [isInteracting, setIsInteracting] = useState<PetInteraction | null>(null)

  const isPt = i18n.language === 'pt'
  const userLevel = profile?.level || 1
  const mood = getMood()
  const [showMilestoneToast, setShowMilestoneToast] = useState(false)
  const [lastMilestoneCount, setLastMilestoneCount] = useState(milestones.length)

  useEffect(() => {
    if (milestones.length > lastMilestoneCount) {
      setShowMilestoneToast(true)
      const timer = setTimeout(() => setShowMilestoneToast(false), 5000)
      setLastMilestoneCount(milestones.length)
      return () => clearTimeout(timer)
    }
  }, [milestones.length, lastMilestoneCount])

  // Initial message load
  useEffect(() => {
    import('./usePetStore').then(({ getPetMessage }) => {
      setMessage(getPetMessage(selectedPet, mood, isPt, petName))
    })
  }, [selectedPet, mood, isPt, petName])

  // Tick stats (hunger & cleanliness)
  useEffect(() => {
    tickStats()
    const interval = setInterval(tickStats, 60_000)
    return () => clearInterval(interval)
  }, [tickStats])

  // Auto-unlock free pets based on level
  useEffect(() => {
    ALL_PETS.forEach(pet => {
      const info = PET_CATALOG[pet]
      if (!info.premium && userLevel >= info.unlockLevel && !unlockedPets.includes(pet)) {
        unlockPet(pet)
      }
    })
    // Premium pets are unlocked via the premium feature/purchase flow
    // For now, if user is premium, unlock the titan_wolf
    if (profile?.is_premium && !unlockedPets.includes('titan_wolf')) {
      unlockPet('titan_wolf')
    }
  }, [userLevel, profile?.is_premium, unlockedPets, unlockPet])

  // Rotate passive messages every 15 seconds if not on interaction cooldown
  useEffect(() => {
    const interval = setInterval(() => {
      if (canInteract()) {
        import('./usePetStore').then(({ getPetMessage }) => {
          setMessage(getPetMessage(selectedPet, mood, isPt, petName))
        })
      }
    }, 15_000)
    return () => clearInterval(interval)
  }, [selectedPet, mood, isPt, canInteract, petName])

  const hungerPercent = Math.round(hunger)
  const hungerColor = hungerPercent >= 60 ? 'bg-primary' : hungerPercent >= 30 ? 'bg-yellow-500' : 'bg-red-500'

  const cleanlinessPercent = Math.round(cleanliness)
  const cleanlinessColor = cleanlinessPercent >= 70 ? 'bg-blue-400' : cleanlinessPercent >= 30 ? 'bg-blue-600' : 'bg-red-500'

  const handleInteract = (type: PetInteraction) => {
    const { success, message: responseMsg } = interact(type)
    if (success) {
      setIsInteracting(type)
      setMessage(responseMsg)
      setTimeout(() => setIsInteracting(null), 1000)
    } else if (responseMsg) {
      // If it failed but has a message (e.g. sleeping), show it
      setMessage(responseMsg)
    }
  }

  // Animation variants
  const petAnim: Record<PetInteraction, any> = {
    pet: {
      scale: [1, 1.05, 0.95, 1],
      rotate: [0, -3, 3, 0],
      transition: { type: "spring", stiffness: 300, damping: 15 }
    },
    flex: {
      scale: [1, 1.2, 1],
      y: [0, -5, 0],
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tickle: {
      x: [0, -3, 3, -3, 3, 0],
      scale: [1, 1.05, 1],
      transition: { duration: 0.4 }
    },
    bath: {
      rotate: [0, 5, -5, 5, 0],
      scale: [1, 0.9, 1],
      transition: { type: "spring", stiffness: 200, damping: 20 }
    }
  }

  return (
    <div className="bg-surface-200 border border-surface-100 rounded-3xl p-5 relative overflow-hidden">
      <AnimatePresence>
        {showMilestoneToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-4 left-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg border border-yellow-300 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
            <div className="bg-white/20 p-2 rounded-lg relative z-10">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="relative z-10 text-left">
              <h4 className="text-white font-black text-[10px] uppercase tracking-wider leading-none">
                {isPt ? 'Novo Milestone Alcançado!' : 'New Milestone Reached!'}
              </h4>
              <p className="text-white/90 text-[9px] font-bold mt-1">
                {isPt ? 'O teu pet evoluiu com um novo acessório!' : 'Your pet evolved with a new accessory!'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background glow based on mood */}
      <div className={`absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl transition-colors duration-1000 ${mood === 'ecstatic' ? 'bg-primary/20' :
          mood === 'happy' ? 'bg-primary/10' :
            mood === 'starving' ? 'bg-red-500/10' : 'bg-surface-100/30'
        }`} style={{ backgroundColor: `${PET_CATALOG[selectedPet as PetModel].color}20` }} />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Pet SVG with interaction animation */}
        <motion.div
          className="shrink-0 cursor-pointer relative"
          onClick={() => setShowSelector(!showSelector)}
          animate={isInteracting ? petAnim[isInteracting] : {}}
          title={t('gamification.changeMascot')}
        >
          {PET_CATALOG[selectedPet as PetModel].premium && (
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase z-10 shadow-lg border border-yellow-300">
              PRO
            </div>
          )}
          <PetSvg
            model={selectedPet as PetModel}
            mood={isInteracting ? (isInteracting === 'tickle' ? 'ecstatic' : 'happy') : mood}
            size={100}
            isInteracting={!!isInteracting}
            interactionType={isInteracting}
            milestones={milestones}
          />
          <div className="absolute inset-0 rounded-full ring-2 ring-primary/0 hover:ring-primary/50 transition-all" />
        </motion.div>

        {/* Info & Interactions */}
        <div className="flex-1 w-full min-w-0">
          {!petName && (
            <div className="mb-3 bg-primary/10 border border-primary/20 rounded-xl p-3">
              <p className="text-[10px] text-primary font-black uppercase tracking-wider mb-2">
                {t('gamification.namePartner')}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Rex, Luna..."
                  className="flex-1 bg-background/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => newName && renamePet(newName)}
                  className="bg-primary text-black font-black px-3 py-1.5 rounded-lg text-xs uppercase"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-1">
            <div className="flex flex-col">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                {petName || PET_CATALOG[selectedPet as PetModel].name}
                <button
                  onClick={() => setIsPromptOpen(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors group"
                >
                  <Pencil className="w-3 h-3 text-gray-500 group-hover:text-primary" />
                </button>
                {currentStreak > 0 && (
                  <span className="text-orange-500 flex items-center gap-0.5 text-xs">
                    🔥 <span className="font-black">{currentStreak}</span>
                  </span>
                )}
              </h3>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest -mt-1">
                {PET_CATALOG[selectedPet as PetModel].name}
              </span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${mood === 'ecstatic' ? 'bg-primary/20 text-primary' :
                mood === 'happy' ? 'bg-green-500/20 text-green-400' :
                  mood === 'neutral' ? 'bg-yellow-500/20 text-yellow-400' :
                    mood === 'hungry' ? 'bg-orange-500/20 text-orange-400' :
                      mood === 'sleeping' ? 'bg-blue-500/20 text-blue-400' :
                        mood === 'dirty' ? 'bg-amber-800/20 text-amber-600' :
                          mood === 'atrophied' ? 'bg-gray-800/50 text-gray-500' :
                            'bg-red-500/20 text-red-500'
              }`}>
              {t(`gamification.moods.${mood}`)}
            </span>
          </div>

          {/* Speech Bubble - Compact & Characterful */}
          <div className="mb-6 min-h-[48px] flex items-center">
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key={message}
                  initial={{ scale: 0.8, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-lg relative border-2 border-primary/30 w-full sm:w-fit sm:max-w-[90%] mx-auto sm:mx-0"
                >
                  {/* Speech Bubble Tail */}
                  <div className="hidden sm:block absolute bottom-[-8px] left-6 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/30 rotate-45 transform" />

                  <p className="text-xs sm:text-sm text-black font-black leading-tight tracking-tight break-words">
                    {message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bars */}
          <div className="flex flex-col gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface-100 p-2 rounded-lg">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest shrink-0 w-12 text-left">
                {t('gamification.food')}
              </span>
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hungerPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${hungerColor}`}
                />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-2 bg-surface-100 p-2 rounded-lg">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest shrink-0 w-12 text-left">
                {t('gamification.hygiene')}
              </span>
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cleanlinessPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className={`h-full rounded-full ${cleanlinessColor}`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mt-3">
            <div className={`flex gap-1.5 ${(!canInteract() || mood === 'sleeping') ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={() => handleInteract('bath')}
                className="p-2 bg-surface-100 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 transition-colors"
                title={t('gamification.interactions.bath')}
              >
                <Droplets className="w-4 h-4 relative -top-0.5" />
              </button>
              <button
                onClick={() => handleInteract('pet')}
                className="p-2 bg-surface-100 rounded-lg hover:bg-primary/20 hover:text-primary text-gray-400 transition-colors"
                title={t('gamification.interactions.pet')}
              >
                <Hand className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleInteract('flex')}
                className="p-2 bg-surface-100 rounded-lg hover:bg-primary/20 hover:text-primary text-gray-400 transition-colors"
                title={t('gamification.interactions.flex')}
              >
                <Dumbbell className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleInteract('tickle')}
                className="p-2 bg-surface-100 rounded-lg hover:bg-primary/20 hover:text-primary text-gray-400 transition-colors"
                title={t('gamification.interactions.tickle')}
              >
                <Feather className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Milestone Badge Overlay */}
        {milestones.length > 0 && (
          <div className="absolute -bottom-1 -right-1 flex gap-1 z-20">
            {milestones.map(m => (
              <div key={m} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-background shadow-lg ${m === 'legend' ? 'bg-yellow-500' : m === 'elite' ? 'bg-purple-500' : m === 'pro' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                <span className="text-[10px]">🏆</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pet Selector */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ALL_PETS.map(pet => {
                  const info = PET_CATALOG[pet as PetModel]
                  const isUnlocked = unlockedPets.includes(pet)
                  const isSelected = selectedPet === pet

                  return (
                    <button
                      key={pet}
                      onClick={() => {
                        if (isUnlocked) {
                          setPet(pet)
                          setShowSelector(false)
                        }
                      }}
                      disabled={!isUnlocked}
                      className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all ${isSelected
                          ? 'border-primary bg-primary/10 overflow-hidden'
                          : isUnlocked
                            ? 'border-surface-100 hover:border-primary/50 bg-surface-100/50 hover:bg-surface-100'
                            : 'border-surface-100 bg-surface-100/20 opacity-60 cursor-not-allowed'
                        }`}
                    >
                      {isSelected && <div className="absolute inset-0 bg-primary/5 z-0" />}
                      {info.premium && (
                        <div className="absolute top-1.5 right-1.5 z-10">
                          <div className="bg-yellow-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">PRO</div>
                        </div>
                      )}

                      <div className="relative z-10 w-[60px] h-[60px] flex items-center justify-center">
                        {isUnlocked ? (
                          <PetSvg
                            model={pet as PetModel}
                            mood={isSelected ? mood : "happy"}
                            size={60}
                            milestones={isSelected ? milestones : []}
                          />
                        ) : (
                          <Lock className="w-8 h-8 text-gray-600" />
                        )}
                      </div>

                      <span className={`text-[11px] font-bold mt-2 relative z-10 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {info.name}
                      </span>

                      {!isUnlocked && (
                        <span className="text-[9px] text-primary/70 font-bold mt-0.5 relative z-10 uppercase tracking-widest">
                          {info.premium ? 'Premium' : `Lv. ${info.unlockLevel}`}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modals */}
      <PromptModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onConfirm={(name) => renamePet(name)}
        title={t('gamification.petNamingTitle')}
        label={t('gamification.petNameLabel')}
        defaultValue={petName}
        placeholder={selectedPet}
      />
    </div>
  )
}
