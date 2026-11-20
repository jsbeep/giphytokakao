import { useEffect, useRef, useState, type PointerEvent } from 'react'

const COLLAPSED_PEEK = 40
export const MID_OPEN_RATIO = 0.75
const MID_TO_COLLAPSE_THRESHOLD = 0.6
const COLLAPSED_TO_MID_THRESHOLD = 0.1

type SnapLevel = 'expanded' | 'mid' | 'collapsed'

/**
 * The height actually on screen. In-app browsers (KakaoTalk) can make 100dvh / vh / innerHeight taller than
 * what's visible, leaving the folded sheet under their toolbar; the visual viewport is what's really shown.
 * Pinch zoom shrinks the visual viewport too, so it's only trusted at normal scale.
 */
const readViewportHeight = () => {
  const viewport = window.visualViewport
  return viewport && Math.abs(viewport.scale - 1) < 0.01 ? viewport.height : window.innerHeight
}

/** the on-screen keyboard shrinks the visual viewport; the sheet stays put while something is being typed */
const isTyping = () => {
  const active = document.activeElement
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
}

type DragState = {
  active: boolean
  dragging: boolean
  pointerId: number
  startY: number
  startOffset: number
  origin: 'header' | 'grid'
  target: HTMLElement | null
}

type BottomSheetOptions = {
  onDragStart?: () => void
  /** where the sheet rests once its size is first measured */
  initialLevel?: SnapLevel
}

export const useBottomSheet = ({ onDragStart, initialLevel = 'mid' }: BottomSheetOptions = {}) => {
  const [sheetOffset, setSheetOffset] = useState(-10)
  const [maxOffset, setMaxOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [snapLevel, setSnapLevel] = useState<SnapLevel>(initialLevel)

  const sheetRef = useRef<HTMLElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)
  const snapRef = useRef(snapLevel)
  const dragRef = useRef<DragState>({
    active: false,
    dragging: false,
    pointerId: -1,
    startY: 0,
    startOffset: 0,
    origin: 'header',
    target: null,
  })

  useEffect(() => {
    offsetRef.current = sheetOffset
  }, [sheetOffset])

  useEffect(() => {
    snapRef.current = snapLevel
  }, [snapLevel])

  useEffect(() => {
    let measuredHeight = 0

    const updateBounds = () => {
      if (measuredHeight > 0 && isTyping()) {
        return
      }
      const height = Math.round(readViewportHeight())
      if (height === measuredHeight) {
        return
      }
      measuredHeight = height
      // the sheet is sized by this (h-(--app-height)), so its offsets below match what's on screen
      document.documentElement.style.setProperty('--app-height', `${height}px`)

      const nextMaxOffset = Math.max(0, height - COLLAPSED_PEEK)
      setMaxOffset(nextMaxOffset)
      const nextOffset = getOffsetForLevel(snapRef.current, nextMaxOffset)
      setSheetOffset(Math.min(nextOffset, nextMaxOffset))
    }

    updateBounds()
    // in-app browsers can settle their toolbars after load without a resize event
    const settleTimers = [300, 1000].map((ms) => window.setTimeout(updateBounds, ms))
    const viewport = window.visualViewport
    window.addEventListener('resize', updateBounds)
    viewport?.addEventListener('resize', updateBounds)
    return () => {
      settleTimers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('resize', updateBounds)
      viewport?.removeEventListener('resize', updateBounds)
    }
  }, [])

  const getOffsetForLevel = (level: SnapLevel, max: number) => {
    if (level === 'expanded') {
      return 0
    }
    if (level === 'mid') {
      return max * (1 - MID_OPEN_RATIO)
    }
    return max
  }

  const snapTo = (level: SnapLevel) => {
    setSnapLevel(level)
    setSheetOffset(getOffsetForLevel(level, maxOffset))
  }

  const moveToMid = () => {
    setSnapLevel('mid')
    setSheetOffset(getOffsetForLevel('mid', maxOffset))
  }

  const startDrag = (
    event: PointerEvent<HTMLElement>,
    origin: DragState['origin'],
  ) => {
    dragRef.current = {
      active: true,
      dragging: false,
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: offsetRef.current,
      origin,
      target: event.currentTarget,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = dragRef.current
    if (!state.active || state.pointerId !== event.pointerId) {
      return
    }

    const delta = event.clientY - state.startY
    if (!state.dragging) {
      if (Math.abs(delta) < 6) {
        return
      }

      if (state.origin === 'grid') {
        const grid = gridRef.current
        if (grid) {
          const atTop = grid.scrollTop <= 0
          const atBottom =
            grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 1
          if ((delta > 0 && !atTop) || (delta < 0 && !atBottom)) {
            return
          }
        }
      }

      state.dragging = true
      onDragStart?.()
      state.target?.setPointerCapture(event.pointerId)
      setIsDragging(true)
    }

    if (!state.dragging) {
      return
    }

    event.preventDefault()
    const nextOffset = Math.min(
      Math.max(state.startOffset + delta, 0),
      maxOffset,
    )
    setSheetOffset(nextOffset)
  }

  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    const state = dragRef.current
    if (!state.active || state.pointerId !== event.pointerId) {
      return
    }

    if (state.dragging) {
      const openRatio = maxOffset > 0 ? 1 - offsetRef.current / maxOffset : 1
      const currentSnap = snapRef.current

      if (currentSnap === 'mid' && openRatio <= MID_TO_COLLAPSE_THRESHOLD) {
        snapTo('collapsed')
      } else if (
        currentSnap === 'collapsed' &&
        openRatio >= COLLAPSED_TO_MID_THRESHOLD
      ) {
        snapTo('mid')
      } else {
        const expandedOffset = 0
        const midOffset = getOffsetForLevel('mid', maxOffset)
        const collapsedOffset = maxOffset
        const current = offsetRef.current
        const distances = [
          { level: 'expanded' as const, dist: Math.abs(current - expandedOffset) },
          { level: 'mid' as const, dist: Math.abs(current - midOffset) },
          {
            level: 'collapsed' as const,
            dist: Math.abs(current - collapsedOffset),
          },
        ]
        distances.sort((a, b) => a.dist - b.dist)
        snapTo(distances[0].level)
      }
    }

    state.target?.releasePointerCapture(event.pointerId)
    dragRef.current.active = false
    dragRef.current.dragging = false
    setIsDragging(false)
  }

  return {
    sheetOffset,
    setSheetOffset,
    maxOffset,
    isDragging,
    snapLevel,
    sheetRef,
    gridRef,
    snapTo,
    moveToMid,
    startDrag,
    handlePointerMove,
    finishDrag,
  }
}
