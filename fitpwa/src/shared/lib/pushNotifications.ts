/**
 * Push Notifications Service
 * Handles Web Push API notifications for achievements and milestones
 */

export interface PushNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class PushNotificationService {
  /**
   * Request permission from user for push notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support push notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  /**
   * Send a push notification
   */
  sendNotification(options: PushNotificationOptions): void {
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted')
      return
    }

    const {
      title,
      body,
      icon = '/icons/icon-192x192.png',
      badge = '/icons/badge-72x72.png',
      tag,
      requireInteraction = false,
    } = options

    // Send via Service Worker if available
    if ('serviceWorker' in navigator && 'controller' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'PUSH_NOTIFICATION',
        payload: {
          title,
          options: {
            body,
            icon,
            badge,
            tag,
            requireInteraction,
            data: {
              timestamp: Date.now(),
            },
          },
        },
      })
    } else {
      // Fallback to standard Notification API
      new Notification(title, {
        body,
        icon,
        badge,
        tag,
        requireInteraction,
      })
    }
  }

  /**
   * Show achievement notification
   */
  showAchievementNotification(
    achievementName: string,
    description: string,
    icon: string = '🏆'
  ): void {
    this.sendNotification({
      title: `🎉 ${icon} ${achievementName}`,
      body: description,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `achievement-${achievementName}`,
      requireInteraction: false,
    })
  }

  /**
   * Show PR notification
   */
  showPRNotification(exerciseName: string, weight: number, reps: number): void {
    this.sendNotification({
      title: `🏅 Novo PR! ${exerciseName}`,
      body: `${weight}kg x ${reps} reps - Parabéns! 💪`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `pr-${exerciseName}`,
      requireInteraction: true,
    })
  }

  /**
   * Show milestone notification
   */
  showMilestoneNotification(milestone: string, count: number): void {
    const milestoneMessages: Record<string, string> = {
      workout: `Completou ${count} treinos! 💪`,
      volume: `Levantou ${Math.round(count / 1000)}T em volume total! 🔥`,
      streak: `${count} dias de treino seguido! 🔥`,
      pr: `${count} PRs alcançados! 🏆`,
    }

    this.sendNotification({
      title: '🎯 Marco Atingido!',
      body: milestoneMessages[milestone] || `Marco: ${count}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `milestone-${milestone}`,
      requireInteraction: false,
    })
  }

  /**
   * Check if notifications are supported and enabled
   */
  isSupported(): boolean {
    return 'Notification' in window
  }

  /**
   * Check if user has granted permission
   */
  isPermissionGranted(): boolean {
    return Notification.permission === 'granted'
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationService()
