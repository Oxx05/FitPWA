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
      icon = '/logo.png',
      badge = '/logo.png',
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
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `achievement-${achievementName}`,
      requireInteraction: false,
    })
  }

  /**
   * Show PR notification
   */
  showPRNotification(title: string, body: string, exerciseName: string): void {
    this.sendNotification({
      title,
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `pr-${exerciseName}`,
      requireInteraction: true,
    })
  }

  /**
   * Show milestone notification
   */
  showMilestoneNotification(title: string, body: string, milestone: string): void {
    this.sendNotification({
      title,
      body,
      icon: '/logo.png',
      badge: '/logo.png',
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
