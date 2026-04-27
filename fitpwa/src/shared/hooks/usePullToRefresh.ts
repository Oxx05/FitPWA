import { useRef, useCallback, useEffect } from 'react'

const THRESHOLD = 72 // px to pull before triggering
const RESISTANCE = 2.5 // divide pull distance by this for visual offset

interface Options {
  /** Called when the pull threshold is crossed. Must return a Promise. */
  onRefresh: () => Promise<unknown>
  /** Element that contains the scrollable content (defaults to window scroll). */
  scrollRef?: React.RefObject<HTMLElement | null>
}

/**
 * usePullToRefresh
 *
 * Attaches pointer/touch listeners to detect a downward pull at the top of the
 * scroll container and calls `onRefresh` when the threshold is crossed.
 *
 * Returns a `containerRef` to attach to the outermost wrapper div so the
 * indicator renders inside it.
 *
 * @example
 * const { containerRef, isRefreshing, pullProgress } = usePullToRefresh({ onRefresh })
 * return <div ref={containerRef} className="relative overflow-auto">…</div>
 */
export function usePullToRefresh({ onRefresh, scrollRef }: Options) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number | null>(null)
  const currentYRef = useRef<number>(0)
  const isRefreshingRef = useRef(false)
  const indicatorRef = useRef<HTMLDivElement | null>(null)

  const getScrollTop = useCallback(() => {
    if (scrollRef?.current) return scrollRef.current.scrollTop
    return window.scrollY
  }, [scrollRef])

  const setIndicatorOffset = useCallback((offset: number) => {
    if (!indicatorRef.current) return
    indicatorRef.current.style.transform = `translateY(${offset}px)`
    indicatorRef.current.style.opacity = String(Math.min(offset / THRESHOLD, 1))
  }, [])

  // Inject the indicator DOM node on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const el = document.createElement('div')
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText = [
      'position:absolute',
      'top:-48px',
      'left:50%',
      'transform:translateX(-50%) translateY(0)',
      'width:36px',
      'height:36px',
      'border-radius:50%',
      'background:#1a1a1a',
      'border:2px solid #c6ff3d',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'opacity:0',
      'transition:opacity 0.15s',
      'pointer-events:none',
      'z-index:50',
    ].join(';')

    // Simple SVG arrow-down icon
    el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#c6ff3d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`

    container.style.position = 'relative'
    container.prepend(el)
    indicatorRef.current = el

    return () => el.remove()
  }, [])

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshingRef.current) return
      if (getScrollTop() > 0) return
      startYRef.current = e.touches[0].clientY
    },
    [getScrollTop]
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshingRef.current) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) return
      currentYRef.current = delta
      const offset = Math.min(delta / RESISTANCE, THRESHOLD)
      setIndicatorOffset(offset)
    },
    [setIndicatorOffset]
  )

  const onTouchEnd = useCallback(async () => {
    if (startYRef.current === null || isRefreshingRef.current) return
    const pulled = currentYRef.current

    startYRef.current = null
    currentYRef.current = 0

    if (pulled < THRESHOLD * RESISTANCE) {
      setIndicatorOffset(0)
      return
    }

    isRefreshingRef.current = true

    // Spin the indicator while refreshing
    if (indicatorRef.current) {
      indicatorRef.current.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#c6ff3d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        style="animation:spin 0.8s linear infinite">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>`
      indicatorRef.current.style.transform = 'translateX(-50%) translateY(48px)'
    }

    try {
      await onRefresh()
    } finally {
      isRefreshingRef.current = false
      setIndicatorOffset(0)
      if (indicatorRef.current) {
        indicatorRef.current.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#c6ff3d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>`
      }
    }
  }, [onRefresh, setIndicatorOffset])

  useEffect(() => {
    const el = containerRef.current ?? window
    ;(el as HTMLElement).addEventListener('touchstart', onTouchStart as EventListener, { passive: true })
    ;(el as HTMLElement).addEventListener('touchmove', onTouchMove as EventListener, { passive: true })
    ;(el as HTMLElement).addEventListener('touchend', onTouchEnd as EventListener)

    return () => {
      ;(el as HTMLElement).removeEventListener('touchstart', onTouchStart as EventListener)
      ;(el as HTMLElement).removeEventListener('touchmove', onTouchMove as EventListener)
      ;(el as HTMLElement).removeEventListener('touchend', onTouchEnd as EventListener)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  return { containerRef }
}
