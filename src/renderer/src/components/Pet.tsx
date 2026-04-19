import { useRef, useEffect, useCallback, useState } from 'react'
import PetSprite    from './PetSprite'
import SpeechBubble from './SpeechBubble'
import EatFolder    from './EatFolder'
import Accessory    from './Accessory'
import PersonaTag   from './PersonaTag'
import { usePetState } from '../hooks/usePetState'
import type { SavedPetState } from '../types'

const PROXIMITY_PX  = 200   // px radius that counts as "near"
const IDLE_NEAR_MS  = 3000  // ms of mouse stillness before pig approaches
const PET_SIZE      = 128
const DRAG_START_PX = 6
const SLEEP_ZONE_W  = 176
const SLEEP_ZONE_H  = 176
const SLEEP_ZONE_GAP = 18

interface Props {
  screenWidth:  number
  screenHeight: number
  initialX:     number
  initialY:     number
  saved:        SavedPetState | null
}

export default function Pet({ screenWidth, screenHeight, initialX, initialY, saved }: Props) {
  const {
    state,
    handleClick,
    handleDoubleClick,
    drag,
    onDragStart,
    onDragEnd,
    handleMouseNear,
    handleMouseFar,
    handleMouseIdleNear,
    updateApproachTarget,
    wakeUp,
  } = usePetState(initialX, initialY, screenWidth, screenHeight, saved)

  const petRef       = useRef<HTMLDivElement>(null)
  const pointerDown  = useRef(false)
  const dragStarted  = useRef(false)
  const hasMoved     = useRef(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const dragOrigin   = useRef({ x: 0, y: 0 })
  const mousePos     = useRef({ x: -9999, y: -9999 })
  const idleTimer    = useRef<ReturnType<typeof setTimeout>>()
  const isNearRef    = useRef(false)
  const clickTimer   = useRef<ReturnType<typeof setTimeout>>()  // single-click delay
  const dropTimer    = useRef<ReturnType<typeof setTimeout>>()
  const [dragging, setDragging] = useState(false)
  const [dropAnimation, setDropAnimation] = useState<null | 'drop' | 'sleep-drop'>(null)

  const sleepZoneLeft = Math.max(0, screenWidth - SLEEP_ZONE_W - SLEEP_ZONE_GAP)
  const sleepZoneTop  = Math.max(0, screenHeight - SLEEP_ZONE_H - SLEEP_ZONE_GAP)

  const clampPosition = useCallback((x: number, y: number) => ({
    x: Math.max(0, Math.min(x, screenWidth - PET_SIZE)),
    y: Math.max(0, Math.min(y, screenHeight - PET_SIZE)),
  }), [screenWidth, screenHeight])

  const isSleepDropPosition = useCallback((x: number, y: number) => {
    const bellyX = x + PET_SIZE * 0.72
    const bellyY = y + PET_SIZE * 0.82
    return bellyX >= sleepZoneLeft && bellyY >= sleepZoneTop
  }, [sleepZoneLeft, sleepZoneTop])

  const syncMousePassthrough = useCallback((mx: number, my: number) => {
    const rect = petRef.current?.getBoundingClientRect()
    if (!rect) {
      window.mimo.setIgnoreMouse(true)
      return
    }

    const over = mx >= rect.left && mx <= rect.right
              && my >= rect.top  && my <= rect.bottom
    window.mimo.setIgnoreMouse(!over)
  }, [])

  const playDropAnimation = useCallback((kind: 'drop' | 'sleep-drop') => {
    clearTimeout(dropTimer.current)
    setDropAnimation(kind)
    dropTimer.current = setTimeout(() => setDropAnimation(null), kind === 'sleep-drop' ? 560 : 420)
  }, [])

  const sleepZoneHot = dragging && isSleepDropPosition(state.position.x, state.position.y)

  // ── Mouse passthrough + proximity detection ────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mx = e.clientX
      const my = e.clientY
      mousePos.current = { x: mx, y: my }

      if (pointerDown.current) {
        window.mimo.setIgnoreMouse(false)
        return
      }

      // Passthrough: disable when cursor is over the pet's bounding rect
      syncMousePassthrough(mx, my)

      // Proximity: check distance to pig center
      const cx = state.position.x + 64
      const cy = state.position.y + 64
      const dist = Math.hypot(mx - cx, my - cy)
      const near = dist < PROXIMITY_PX

      if (near && !isNearRef.current) {
        isNearRef.current = true
        handleMouseNear()
      } else if (!near && isNearRef.current) {
        isNearRef.current = false
        handleMouseFar()
        clearTimeout(idleTimer.current)
      }

      // While approaching, keep approach target updated
      if (state.action === 'approaching') {
        updateApproachTarget(mx, my)
      }

      // Reset idle-near timer on every move
      if (near) {
        clearTimeout(idleTimer.current)
        idleTimer.current = setTimeout(() => {
          handleMouseIdleNear(mousePos.current.x, mousePos.current.y)
        }, IDLE_NEAR_MS)
      }
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      clearTimeout(idleTimer.current)
    }
  }, [state.position, state.action, handleMouseNear, handleMouseFar, handleMouseIdleNear, updateApproachTarget, syncMousePassthrough])

  // ── Global drag listeners ──────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!pointerDown.current) return

      const dx = e.clientX - dragOrigin.current.x
      const dy = e.clientY - dragOrigin.current.y

      if (!dragStarted.current) {
        if (Math.hypot(dx, dy) < DRAG_START_PX) return
        dragStarted.current = true
        hasMoved.current = true
        setDragging(true)
        onDragStart()
      }

      const next = clampPosition(
        e.clientX - dragOffset.current.x,
        e.clientY - dragOffset.current.y,
      )
      drag(next.x, next.y)
    }

    const onUp = (e: MouseEvent) => {
      if (!pointerDown.current) return
      pointerDown.current = false

      if (!dragStarted.current) {
        syncMousePassthrough(e.clientX, e.clientY)
        return
      }

      dragStarted.current = false
      setDragging(false)

      const next = clampPosition(
        e.clientX - dragOffset.current.x,
        e.clientY - dragOffset.current.y,
      )
      const shouldSleep = isSleepDropPosition(next.x, next.y)

      onDragEnd(next.x, next.y, shouldSleep)
      playDropAnimation(shouldSleep ? 'sleep-drop' : 'drop')

      requestAnimationFrame(() => syncMousePassthrough(e.clientX, e.clientY))
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
  }, [clampPosition, drag, isSleepDropPosition, onDragEnd, onDragStart, playDropAnimation, syncMousePassthrough])

  useEffect(() => () => clearTimeout(dropTimer.current), [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    pointerDown.current = true
    dragStarted.current = false
    hasMoved.current = false
    clearTimeout(idleTimer.current)
    dragOrigin.current = { x: e.clientX, y: e.clientY }
    dragOffset.current = {
      x: e.clientX - state.position.x,
      y: e.clientY - state.position.y,
    }
    window.mimo.setIgnoreMouse(false)
  }, [state.position])

  // Delay single-click by 220 ms so a double-click can cancel it first
  const onClick = useCallback(() => {
    if (hasMoved.current) return
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      if (state.action === 'sleeping') { wakeUp(); return }
      handleClick()
    }, 220)
  }, [state.action, handleClick, wakeUp])

  const onDblClick = useCallback(() => {
    clearTimeout(clickTimer.current)   // cancel pending single-click
    if (state.action === 'sleeping') return
    handleDoubleClick()
  }, [state.action, handleDoubleClick])

  // Animation class driven by action/emotion
  const bounceStyle: React.CSSProperties =
    state.action === 'reacting' ? { animation: 'pet-bounce 0.35s ease-in-out' }      :
    state.action === 'eating'   ? { animation: 'pet-eat-bob 0.5s ease-in-out infinite' } :
    state.action === 'sleeping' ? { animation: 'pet-breathe 3s ease-in-out infinite' } :
    {}

  const shellStyle: React.CSSProperties =
    dropAnimation === 'sleep-drop' ? { animation: 'pet-sleep-drop 0.56s cubic-bezier(0.2, 0.85, 0.25, 1)' } :
    dropAnimation === 'drop'       ? { animation: 'pet-drop 0.42s cubic-bezier(0.2, 0.8, 0.2, 1)' } :
    dragging ? {
      transform: sleepZoneHot
        ? 'translateY(-12px) scale(1.08) rotate(-5deg)'
        : 'translateY(-8px) scale(1.05) rotate(-3deg)',
      filter: sleepZoneHot
        ? 'drop-shadow(0 18px 18px rgba(0,0,0,0.26)) drop-shadow(0 0 18px rgba(255, 194, 214, 0.65))'
        : 'drop-shadow(0 16px 16px rgba(0,0,0,0.22))',
      transition: 'transform 90ms ease-out, filter 120ms ease-out',
    } :
    { transition: 'transform 120ms ease-out, filter 120ms ease-out' }

  return (
    <div
      className="fixed"
      style={{
        left:        Math.round(state.position.x),
        top:         Math.round(state.position.y),
        userSelect:  'none',
        zIndex:      9999,
        position:    'fixed',
      }}
    >
      {dragging && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: sleepZoneLeft,
            top: sleepZoneTop,
            width: SLEEP_ZONE_W,
            height: SLEEP_ZONE_H,
            pointerEvents: 'none',
            zIndex: 9997,
            borderRadius: 28,
            border: `3px dashed ${sleepZoneHot ? 'rgba(209, 83, 127, 0.95)' : 'rgba(160, 108, 128, 0.65)'}`,
            background: sleepZoneHot
              ? 'radial-gradient(circle at top, rgba(255, 234, 242, 0.98), rgba(255, 199, 219, 0.88))'
              : 'radial-gradient(circle at top, rgba(255, 252, 253, 0.9), rgba(252, 228, 238, 0.72))',
            boxShadow: sleepZoneHot
              ? '0 18px 32px rgba(163, 78, 115, 0.28)'
              : '0 12px 24px rgba(120, 94, 108, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 18,
            animation: sleepZoneHot ? 'sleep-zone-pulse 1s ease-in-out infinite' : undefined,
          }}
        >
          <div
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 11,
              lineHeight: 1.7,
              color: sleepZoneHot ? '#8a3657' : '#7f5f6c',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ marginBottom: 12, fontSize: 12 }}>zzz</div>
            <div>{sleepZoneHot ? 'release to snooze' : 'drag here to sleep'}</div>
          </div>
        </div>
      )}

      <SpeechBubble
        message={state.message ?? ''}
        visible={state.messageVisible}
      />

      {/* relative container so accessories can be absolutely positioned */}
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <EatFolder active={state.action === 'eating'} facingRight={state.facingRight} />

        <Accessory type={state.accessory} phase={state.accessoryPhase} />

        {(dragging || dropAnimation) && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              bottom: 10,
              height: 18,
              borderRadius: 999,
              background: sleepZoneHot ? 'rgba(153, 77, 109, 0.28)' : 'rgba(0, 0, 0, 0.18)',
              filter: 'blur(6px)',
              transform: dragging ? 'scale(1.08)' : 'scale(0.92)',
              opacity: dragging ? 0.95 : 0.72,
              transition: 'transform 90ms ease-out, opacity 90ms ease-out, background 90ms ease-out',
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          ref={petRef}
          onMouseDown={onMouseDown}
          onClick={onClick}
          onDoubleClick={onDblClick}
          onContextMenu={e => { e.preventDefault(); window.mimo.showContextMenu() }}
          className={dragging ? 'cursor-grabbing' : 'cursor-pointer'}
          style={shellStyle}
          title="Click · Double-click: eat folder · Drag · Right-click: menu"
        >
          <div
            style={{
              ...bounceStyle,
              borderRadius: 24,
              outline: dragging
                ? `3px solid ${sleepZoneHot ? 'rgba(219, 106, 151, 0.9)' : 'rgba(255, 255, 255, 0.8)'}`
                : undefined,
              background: dragging
                ? sleepZoneHot
                  ? 'radial-gradient(circle at 50% 45%, rgba(255, 216, 230, 0.5), rgba(255, 216, 230, 0))'
                  : 'radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0))'
                : undefined,
              transition: 'outline-color 120ms ease-out, background 120ms ease-out',
            }}
          >
            <PetSprite
              emotion={state.emotion}
              action={state.action}
              facingRight={state.facingRight}
              persona={state.persona}
            />
          </div>
        </div>

        <PersonaTag persona={state.persona} />
      </div>
    </div>
  )
}
