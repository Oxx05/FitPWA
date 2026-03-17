import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { Modal } from '@/shared/components/Modal'
import { Bell, Trash2, Zap, Clock, Trophy, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  body: string
  type: 'achievement' | 'pr' | 'milestone' | 'system' | 'social'
  is_read: boolean
  created_at: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Notification[]
    },
    enabled: !!profile?.id && isOpen
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile?.id)
        .eq('is_read', false)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').delete().eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-5 h-5 text-yellow-500" />
      case 'pr': return <Zap className="w-5 h-5 text-primary" />
      case 'milestone': return <Target className="w-5 h-5 text-blue-500" />
      case 'social': return <Bell className="w-5 h-5 text-purple-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notificações"
      size="md"
      closeButton
    >
      <div className="space-y-4 max-h-[70vh] flex flex-col">
        <div className="flex justify-between items-center px-1">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Histórico Recente
          </p>
          {notifications && notifications.some(n => !n.is_read) && (
            <button 
              onClick={() => markAllAsRead.mutate()}
              className="text-xs text-primary hover:underline font-bold"
            >
              Marcar lidas
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 text-center">
              <Clock className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500 italic">A carregar notificações...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {notifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`relative p-4 rounded-2xl border transition-all group ${
                    notif.is_read 
                      ? 'bg-surface-100 border-white/5 opacity-70' 
                      : 'bg-surface-200 border-primary/20 shadow-lg shadow-primary/5'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      notif.is_read ? 'bg-surface-200' : 'bg-primary/10'
                    }`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm font-bold truncate ${notif.is_read ? 'text-gray-400' : 'text-white'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap mt-0.5">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${notif.is_read ? 'text-gray-500' : 'text-gray-400'}`}>
                        {notif.body}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNotification.mutate(notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!notif.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-pulse blur-[1px]" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
              <p className="text-gray-500 text-sm">Ainda não tens notificações.</p>
              <p className="text-xs text-gray-600 mt-1">Conquistas e segredos aparecem aqui! 😉</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
