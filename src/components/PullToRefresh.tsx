import { type ReactNode, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const PULL_THRESHOLD = 64
const MAX_PULL = 96

function getScrollParent(el: HTMLElement): HTMLElement {
  let node: HTMLElement | null = el.parentElement
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node
    }
    node = node.parentElement
  }
  return document.documentElement
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  disabled?: boolean
  children: ReactNode
}

export function PullToRefresh({ onRefresh, disabled = false, children }: PullToRefreshProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullDistanceRef = useRef(0)
  const refreshingRef = useRef(false)

  useEffect(() => {
    pullDistanceRef.current = pullDistance
  }, [pullDistance])

  useEffect(() => {
    refreshingRef.current = refreshing
  }, [refreshing])

  useEffect(() => {
    const root = rootRef.current
    if (!root || disabled) return

    const scrollParent = getScrollParent(root)
    let startY = 0
    let pulling = false

    function resetPull() {
      pulling = false
      setPullDistance(0)
    }

    async function triggerRefresh() {
      if (refreshingRef.current) return
      setRefreshing(true)
      setPullDistance(PULL_THRESHOLD)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    }

    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current || scrollParent.scrollTop > 0) return
      startY = e.touches[0].clientY
      pulling = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling || refreshingRef.current) return
      if (scrollParent.scrollTop > 0) {
        resetPull()
        return
      }

      const delta = e.touches[0].clientY - startY
      if (delta <= 0) {
        resetPull()
        return
      }

      e.preventDefault()
      const next = Math.min(delta * 0.45, MAX_PULL)
      pullDistanceRef.current = next
      setPullDistance(next)
    }

    function onTouchEnd() {
      if (!pulling || refreshingRef.current) return
      pulling = false
      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        void triggerRefresh()
      } else {
        resetPull()
      }
    }

    scrollParent.addEventListener('touchstart', onTouchStart, { passive: true })
    scrollParent.addEventListener('touchmove', onTouchMove, { passive: false })
    scrollParent.addEventListener('touchend', onTouchEnd)
    scrollParent.addEventListener('touchcancel', onTouchEnd)

    return () => {
      scrollParent.removeEventListener('touchstart', onTouchStart)
      scrollParent.removeEventListener('touchmove', onTouchMove)
      scrollParent.removeEventListener('touchend', onTouchEnd)
      scrollParent.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [disabled, onRefresh])

  const indicatorHeight = refreshing ? PULL_THRESHOLD : pullDistance
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const showIndicator = refreshing || pullDistance > 8

  return (
    <div ref={rootRef}>
      <div
        className="flex items-end justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: indicatorHeight }}
        aria-hidden={!showIndicator}
      >
        {showIndicator && (
          <RefreshCw
            size={18}
            className={`text-ember mb-2 ${refreshing ? 'animate-spin' : ''}`}
            style={{
              opacity: refreshing ? 1 : 0.35 + progress * 0.65,
              transform: refreshing ? undefined : `rotate(${progress * 180}deg)`,
            }}
          />
        )}
      </div>
      {children}
    </div>
  )
}
