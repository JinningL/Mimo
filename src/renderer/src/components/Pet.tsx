import { useRef, useEffect, useCallback } from 'react'
import PetSprite    from './PetSprite'
import SpeechBubble from './SpeechBubble'
import EatFolder    from './EatFolder'
import Accessory    from './Accessory'
import PersonaTag   from './PersonaTag'
import { usePetState } from '../hooks/usePetState'
import type { SavedPetState } from '../types'

const PROXIMITY_PX  = 200   // px radius that counts as "near"
const IDLE_NEAR_MS  = 3000  // ms of mouse stillness before pig approaches

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
    handleMouseNear,
    handleMouseFar,
    handleMouseIdleNear,
    updateApproachTarget,
    wakeUp,
    cyclePersona,
  } = usePetState(initialX, initialY, screenWidth, screenHeight, saved)

  const petRef       = useRef<HTMLDivElement>(null)
  const isDragging   = useRef(false)
  const hasMoved     = useRef(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const mousePos     = useRef({ x: -9999, y: -9999 })
  const idleTimer    = useRef<ReturnType<typeof setTimeout>>()
  const isNearRef    = useRef(false)
  const clickTimer   = useRef<ReturnType<typeof setTimeout>>()  // single-click delay

  // ── Mouse passthrough + proximity detection ────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mx = e.clientX
      const my = e.clientY
      mousePos.current = { x: mx, y: my }

      // Passthrough: disable when cursor is over the pet's bounding rect
      const rect = petRef.current?.getBoundingClientRect()
      if (rect) {
        const over = mx >= rect.left && mx <= rect.right
                  && my >= rect.top  && my <= rect.bottom
        window.mimo.setIgnoreMouse(!over)
      }

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
  }, [state.position, state.action, handleMouseNear, handleMouseFar, handleMouseIdleNear, updateApproachTarget])

  // ── Global drag listeners ──────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      hasMoved.current = true
      drag(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y)
    }
    const onUp = () => { isDragging.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
  }, [drag])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isDragging.current = true
    hasMoved.current   = false
    dragOffset.current = {
      x: e.clientX - state.position.x,
      y: e.clientY - state.position.y,
    }
    onDragStart()
  }, [state.position, onDragStart])

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
      <SpeechBubble
        message={state.message ?? ''}
        visible={state.messageVisible}
      />

      {/* relative container so accessories can be absolutely positioned */}
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <EatFolder active={state.action === 'eating'} facingRight={state.facingRight} />

        <Accessory type={state.accessory} phase={state.accessoryPhase} />

        <div
          ref={petRef}
          onMouseDown={onMouseDown}
          onClick={onClick}
          onDoubleClick={onDblClick}
          onContextMenu={e => { e.preventDefault(); window.mimo.showContextMenu() }}
          className="cursor-pointer"
          style={bounceStyle}
          title="Click · Double-click: eat folder · Drag · Right-click: menu"
        >
          <PetSprite
            emotion={state.emotion}
            action={state.action}
            facingRight={state.facingRight}
            persona={state.persona}
          />
        </div>

        <PersonaTag persona={state.persona} />
      </div>
    </div>
  )
}
