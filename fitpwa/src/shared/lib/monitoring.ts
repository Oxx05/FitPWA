/**
 * Monitoring Service for TitanPulse
 *
 * A lightweight wrapper around error/event tracking that can be plugged
 * into an external service (e.g. Sentry, LogRocket, Posthog) when ready.
 *
 * Current implementation: logs to console in development, stores recent
 * errors in memory for inspection.
 */

interface MonitoringEvent {
  type: 'error' | 'warning' | 'info'
  message: string
  context?: Record<string, unknown>
  timestamp: string
  stack?: string
}

const MAX_STORED_EVENTS = 50
const storedEvents: MonitoringEvent[] = []

const isDev = import.meta.env.DEV

/**
 * Initialize the monitoring service.
 * Call this once at app startup (e.g. in main.tsx).
 *
 * When integrating Sentry, add:
 *   Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })
 */
export function initMonitoring(): void {
  if (isDev) {
    console.log('[Monitoring] Initialized in development mode')
  }

  // Register global error handler
  window.addEventListener('error', (event) => {
    captureError(event.error ?? new Error(event.message), {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
    })
  })

  // Register unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    captureError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { source: 'unhandledrejection' }
    )
  })
}

/**
 * Capture an error with optional context.
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  const event: MonitoringEvent = {
    type: 'error',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  pushEvent(event)

  if (isDev) {
    console.error('[Monitoring] Error captured:', error.message, context)
  }

  // External Service Integration Point (e.g. Sentry)
  // if (!isDev) {
  //   Sentry.captureException(error, { extra: context })
  // }
}

/**
 * Log a warning event.
 */
export function captureWarning(message: string, context?: Record<string, unknown>): void {
  const event: MonitoringEvent = {
    type: 'warning',
    message,
    context,
    timestamp: new Date().toISOString(),
  }

  pushEvent(event)

  if (isDev) {
    console.warn('[Monitoring] Warning:', message, context)
  }
}

/**
 * Log an informational event (e.g. user journey milestone).
 */
export function captureInfo(message: string, context?: Record<string, unknown>): void {
  const event: MonitoringEvent = {
    type: 'info',
    message,
    context,
    timestamp: new Date().toISOString(),
  }

  pushEvent(event)

  if (isDev) {
    console.info('[Monitoring] Info:', message, context)
  }
}

/**
 * Retrieve the most recent monitoring events (useful for debugging).
 */
export function getRecentEvents(): ReadonlyArray<MonitoringEvent> {
  return [...storedEvents]
}

function pushEvent(event: MonitoringEvent): void {
  storedEvents.push(event)
  if (storedEvents.length > MAX_STORED_EVENTS) {
    storedEvents.shift()
  }
}
