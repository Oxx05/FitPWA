import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Lock, Trophy, Star, Zap, Target, History, Users, HelpCircle } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { useNavigate } from 'react-router-dom'
import { useAchievementsStore, type Achievement } from './useAchievementsStore'
import { useAuthStore } from '@/features/auth/authStore'

export function AchievementsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { achievements, unlockedIds, fetchAchievements, fetchRarityStats } = useAchievementsStore()
  const isPt = i18n.language === 'pt'

  useEffect(() => {
    if (user?.id) {
      fetchAchievements(user.id)
      fetchRarityStats()
    }
  }, [user?.id, fetchAchievements, fetchRarityStats])

  const categories = [
    { id: 'streak', icon: <Zap className="w-4 h-4" />, label: t('gamification.categories.streak') },
    { id: 'workouts', icon: <History className="w-4 h-4" />, label: t('gamification.categories.workouts') },
    { id: 'volume', icon: <Target className="w-4 h-4" />, label: t('gamification.categories.volume') },
    { id: 'level', icon: <Star className="w-4 h-4" />, label: t('gamification.categories.level') },
    { id: 'social', icon: <Users className="w-4 h-4" />, label: t('gamification.categories.social') },
    { id: 'secret', icon: <HelpCircle className="w-4 h-4" />, label: t('gamification.categories.secrets') }
  ];

  // Group achievements by groupId to show levels/tiers
  const groupedAchievements = useMemo(() => {
    return achievements.reduce((acc, curr) => {
      if (!acc[curr.groupId]) {
        acc[curr.groupId] = []
      }
      acc[curr.groupId].push(curr)
      return acc
    }, {} as Record<string, Achievement[]>)
  }, [achievements])

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-surface-200/90 backdrop-blur border-b border-surface-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {t('gamification.listTitle')}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-200 p-6 rounded-3xl border border-surface-100 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Trophy className="w-16 h-16 text-primary" />
            </div>
            <p className="text-4xl font-black text-primary mb-1">{unlockedIds.length}</p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t('gamification.unlocked')}</p>
          </div>
          <div className="bg-surface-200 p-6 rounded-3xl border border-surface-100 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Lock className="w-16 h-16 text-gray-500" />
            </div>
            <p className="text-4xl font-black text-white mb-1">
              {achievements.length - unlockedIds.length}
            </p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t('gamification.toEarn')}</p>
          </div>
        </div>

        {/* Categories / Medals Grid */}
        <div className="space-y-16">
          {categories.map((category) => {
            const catGroups = Object.entries(groupedAchievements).filter(([_, list]) => 
              (category.id === 'secret' ? list[0].secret : list[0].groupId === category.id && !list[0].secret)
            )
            
            // if (catGroups.length === 0) return null

            return (
              <section key={category.id} className="space-y-8">
                <div className="flex items-center gap-2 px-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {category.icon}
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter">{category.label}</h2>
                  <div className="flex-grow h-px bg-surface-100 ml-2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {catGroups.length === 0 ? (
                    <div className="col-span-full py-8 text-center bg-surface-200/20 rounded-3xl border border-dashed border-white/5">
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-widest leading-loose">
                        {t('gamification.categoryEmpty')}
                      </p>
                    </div>
                  ) : (
                    catGroups.map(([groupId, list], gIdx) => {
                      // ... existing mapping logic ...
                      // Sort by level to find current progress
                      const sorted = [...list].sort((a, b) => a.level - b.level)
                      const lastUnlocked = [...sorted].reverse().find(a => unlockedIds.includes(a.id))
                      
                      const nextToEarn = sorted.find(a => !unlockedIds.includes(a.id))
                      const displayed = lastUnlocked || nextToEarn || sorted[0]
                      
                      const isFullyLocked = !lastUnlocked
                      const isSecret = displayed.secret && isFullyLocked

                      return (
                        <motion.div
                          key={groupId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: gIdx * 0.05 }}
                          className={`relative p-6 rounded-[32px] border transition-all duration-500 flex flex-col items-center text-center gap-4 overflow-hidden ${
                            !isFullyLocked 
                              ? (displayed.level === 5 ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30' : displayed.level === 4 ? 'bg-cyan-500/10 border-cyan-400/30' : 'bg-surface-200 border-primary/20 hover:border-primary/40 shadow-xl') 
                              : 'bg-surface-200/40 border-white/5 opacity-50'
                          }`}
                        >
                          {/* Rarity Badge */}
                          {!isSecret && displayed.rarity !== undefined && (
                            <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                              <Users className="w-2.5 h-2.5 text-gray-500" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{displayed.rarity}%</span>
                            </div>
                          )}

                          {/* Background Rank Indicator */}
                          {!isFullyLocked && (
                            <div className={`absolute -top-1 -right-1 w-12 h-12 flex items-center justify-center rotate-12 opacity-20 text-white font-black text-xl`}>
                              {displayed.level === 5 ? 'PLAT' : displayed.level === 4 ? 'DIAM' : displayed.level === 3 ? 'GOLD' : displayed.level === 2 ? 'SILV' : 'BRNZ'}
                            </div>
                          )}

                          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner relative z-10 ${
                            !isFullyLocked 
                              ? (displayed.level === 5 ? 'bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse-slow' : displayed.level === 4 ? 'bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-primary/10 animate-float') 
                              : 'bg-surface-100'
                          }`}>
                            {isSecret ? <HelpCircle className="w-10 h-10 text-gray-600" /> : displayed.icon}
                            {isFullyLocked && !isSecret && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                <Lock className="w-6 h-6 text-white/50" />
                              </div>
                            )}
                          </div>
                          
                          <div className="relative z-10 w-full">
                            <h3 className={`text-base font-black tracking-tight mb-1 ${!isFullyLocked ? 'text-white' : 'text-gray-500'}`}>
                              {isSecret ? '???' : (isPt ? displayed.title_pt : displayed.title)}
                            </h3>
                            <p className="text-xs text-gray-500 leading-snug px-2">
                              {isSecret ? t('gamification.keepTraining') : (isPt ? displayed.description_pt : displayed.description)}
                            </p>
                          </div>

                          {/* Level Progress dots */}
                          {list.length > 1 && !isSecret && (
                            <div className="flex gap-1.5 mt-2">
                              {list.map(a => (
                                <div 
                                  key={a.id} 
                                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                    unlockedIds.includes(a.id) ? 'bg-primary scale-110 shadow-[0_0_8px_rgba(var(--color-primary),0.5)]' : 'bg-surface-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          )}

                          {/* Secret Glow */}
                          {isSecret && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none" />
                          )}
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
