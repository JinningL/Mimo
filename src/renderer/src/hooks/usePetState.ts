import { useState, useEffect, useRef, useCallback } from 'react'
import type { PetState, PetEmotion, PetPersona, AccessoryType, SavedPetState } from '../types'
import PERSONAS from '../data/personas'
import { EMOTION_SPEED, EMOTION_WALK_FREQ } from '../data/emotions'

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_SPEED       = 1.5
const PET_W            = 128
const PET_H            = 128
const CLICK_WINDOW     = 3000
const RAPID_THRESHOLD  = 5
const BORED_MS         = 2 * 60 * 1000
const SLEEPY_MS        = 5 * 60 * 1000
const SLEEP_MS         = 8 * 60 * 1000
const APPROACH_STOP_PX = 65

// ── Persona unlock conditions (checked every 10 s) ──────────────────────────
const UNLOCK_CONDITIONS: Array<{ persona: PetPersona; check: (s: PetState) => boolean }> = [
  { persona: 'sleepy',  check: s => s.session.idleMinutes >= 5 },
  { persona: 'chaotic', check: s => s.session.rapidClickBursts >= 2 },
  { persona: 'shy',     check: s => s.session.maxHoverSeconds >= 30 },
  { persona: 'drama',   check: s => s.session.totalDrags >= 5 },
]

// ── Time-of-day emotion ──────────────────────────────────────────────────────
function timeEmotion(): PetEmotion {
  const h = new Date().getHours()
  if (h >= 6  && h < 12) return 'happy'
  if (h >= 12 && h < 18) return 'happy'
  if (h >= 18 && h < 22) return 'sleepy'
  return 'sleepy'
}

// ── Message picker ───────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

// ── Build initial state ──────────────────────────────────────────────────────
function buildInitial(
  x: number, y: number,
  saved: SavedPetState | null,
): PetState {
  return {
    emotion:          timeEmotion(),
    action:           'idle',
    position:         { x, y },
    facingRight:      true,
    lastInteraction:  saved?.lastInteraction ?? Date.now(),
    message:          null,
    messageVisible:   false,
    clickCount:       0,
    clickWindowStart: Date.now(),
    walkTarget:       null,
    approachTarget:   null,
    persona:          saved?.persona          ?? 'default',
    unlockedPersonas: saved?.unlockedPersonas ?? ['default'],
    accessory:        null,
    accessoryPhase:   null,
    session: {
      totalClicks:      0,
      totalDrags:       0,
      maxHoverSeconds:  0,
      rapidClickBursts: 0,
      idleMinutes:      0,
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
export function usePetState(
  initialX: number,
  initialY: number,
  screenW:  number,
  screenH:  number,
  saved:    SavedPetState | null,
) {
  const [state, setState] = useState<PetState>(() =>
    buildInitial(initialX, initialY, saved),
  )

  const stateRef      = useRef(state)
  stateRef.current    = state

  const msgTimer      = useRef<ReturnType<typeof setTimeout>>()
  const reactionTimer = useRef<ReturnType<typeof setTimeout>>()
  const scheduleTimer = useRef<ReturnType<typeof setTimeout>>()
  const eatTimers     = useRef<ReturnType<typeof setTimeout>[]>([])
  const accessTimer   = useRef<ReturnType<typeof setTimeout>>()
  const rafRef        = useRef<number>()
  const hoverRef      = useRef<{ seconds: number; timer?: ReturnType<typeof setInterval> }>({ seconds: 0 })
  // When non-null, the current walk is a "go sleep in corner" walk
  const cornerTarget  = useRef<{ x: number; y: number } | null>(null)

  // ── Show speech bubble ────────────────────────────────────────────────────
  const say = useCallback((text: string, duration = 3200) => {
    clearTimeout(msgTimer.current)
    setState(s => ({ ...s, message: text, messageVisible: true }))
    msgTimer.current = setTimeout(() =>
      setState(s => ({ ...s, messageVisible: false })), duration)
  }, [])

  const sayFor = useCallback((key: keyof typeof PERSONAS['default']['messages']) => {
    const persona = stateRef.current.persona
    const lines = PERSONAS[persona].messages[key]
    say(pick(lines))
  }, [say])

  // ── Handle single click ───────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    const now = Date.now()
    const s   = stateRef.current
    const cfg = PERSONAS[s.persona]
    const elapsed    = now - s.clickWindowStart
    const newCount   = elapsed > CLICK_WINDOW ? 1 : s.clickCount + 1
    const newWinStart = elapsed > CLICK_WINDOW ? now : s.clickWindowStart
    const isRapid    = newCount >= RAPID_THRESHOLD

    cornerTarget.current = null
    clearTimeout(reactionTimer.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    setState(prev => {
      const newBursts = isRapid && prev.clickCount < RAPID_THRESHOLD
        ? prev.session.rapidClickBursts + 1
        : prev.session.rapidClickBursts
      return {
        ...prev,
        emotion:          isRapid ? 'annoyed' : 'excited',
        action:           'reacting',
        clickCount:       newCount,
        clickWindowStart: newWinStart,
        lastInteraction:  now,
        walkTarget:       null,
        approachTarget:   null,
        session: { ...prev.session, totalClicks: prev.session.totalClicks + 1, rapidClickBursts: newBursts },
      }
    })

    say(pick(isRapid ? cfg.messages.annoyed : cfg.messages.click))

    reactionTimer.current = setTimeout(() =>
      setState(s => ({ ...s, action: 'idle', emotion: timeEmotion() })), 1400)
  }, [say])

  // ── Handle double click (eat-folder gag) ─────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    const s   = stateRef.current
    const cfg = PERSONAS[s.persona]
    if (s.action === 'eating') return

    cornerTarget.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setState(prev => ({ ...prev, action: 'eating', walkTarget: null, approachTarget: null }))
    say(pick(cfg.messages.eat), 2400)

    const t1 = setTimeout(() => say(pick(cfg.messages.burp), 2800), 2800)
    const t2 = setTimeout(() =>
      setState(s => ({ ...s, action: 'idle', emotion: 'happy' })), 5200)

    eatTimers.current.forEach(clearTimeout)
    eatTimers.current = [t1, t2]
  }, [say])

  // ── Handle drag ────────────────────────────────────────────────────────────
  const drag = useCallback((x: number, y: number) => {
    cornerTarget.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setState(prev => ({
      ...prev,
      position:      { x, y },
      action:        'idle',
      walkTarget:    null,
      approachTarget:null,
      session:       { ...prev.session, totalDrags: prev.session.totalDrags + 1 },
    }))
  }, [])

  const onDragStart = useCallback(() => {
    sayFor('drag')
  }, [sayFor])

  // ── Mouse proximity callbacks (called from Pet.tsx) ───────────────────────
  const handleMouseNear = useCallback(() => {
    const s = stateRef.current
    if (s.action !== 'idle' && s.action !== 'walking') return
    if (s.emotion === 'curious') return

    setState(prev => ({ ...prev, emotion: 'curious' }))

    // Start counting hover seconds for shy-pig unlock
    clearInterval(hoverRef.current.timer)
    hoverRef.current.seconds = 0
    hoverRef.current.timer = setInterval(() => {
      hoverRef.current.seconds++
      setState(prev => ({
        ...prev,
        session: {
          ...prev.session,
          maxHoverSeconds: Math.max(prev.session.maxHoverSeconds, hoverRef.current.seconds),
        },
      }))
    }, 1000)
  }, [])

  const handleMouseFar = useCallback(() => {
    clearInterval(hoverRef.current.timer)
    hoverRef.current.seconds = 0
    setState(prev => {
      if (prev.emotion !== 'curious') return prev
      return { ...prev, emotion: timeEmotion() }
    })
  }, [])

  // Mouse idle nearby → pig approaches
  const handleMouseIdleNear = useCallback((mx: number, my: number) => {
    const s = stateRef.current
    if (s.action === 'sleeping' || s.action === 'eating' || s.action === 'reacting') return

    const cfg = PERSONAS[s.persona]
    say(pick(cfg.messages.mouseNear))

    setState(prev => ({
      ...prev,
      action:        'approaching',
      approachTarget:{ x: mx - PET_W / 2, y: my - PET_H / 2 },
      facingRight:   mx >= prev.position.x + PET_W / 2,
    }))
  }, [say])

  // Called from Pet.tsx every frame while approaching; RAF owns facingRight
  const updateApproachTarget = useCallback((mx: number, my: number) => {
    setState(prev => {
      if (prev.action !== 'approaching') return prev
      return { ...prev, approachTarget: { x: mx - PET_W / 2, y: my - PET_H / 2 } }
    })
  }, [])

  // ── Persona cycling (from context menu IPC) ────────────────────────────────
  const cyclePersona = useCallback(() => {
    setState(prev => {
      const unlocked = prev.unlockedPersonas
      const idx      = unlocked.indexOf(prev.persona)
      const next     = unlocked[(idx + 1) % unlocked.length]
      return { ...prev, persona: next }
    })
  }, [])

  useEffect(() => {
    window.mimo.onNextPersona(cyclePersona)
  }, [cyclePersona])

  // ── Persona unlock checker ────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current
      for (const { persona, check } of UNLOCK_CONDITIONS) {
        if (!s.unlockedPersonas.includes(persona) && check(s)) {
          const cfg = PERSONAS[persona]
          setState(prev => ({
            ...prev,
            persona,
            unlockedPersonas: [...prev.unlockedPersonas, persona],
            action:  'reacting',
            emotion: 'excited',
          }))
          say(cfg.unlockBanner, 5000)
          reactionTimer.current = setTimeout(() =>
            setState(s => ({ ...s, action: 'idle' })), 1600)
          break  // unlock one at a time
        }
      }
    }, 10_000)
    return () => clearInterval(interval)
  }, [say])

  // ── Idle-minutes + emotion updates ───────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const s    = stateRef.current
      const idle = Date.now() - s.lastInteraction

      setState(prev => {
        const newIdleMin = prev.session.idleMinutes + (s.action === 'idle' ? 1 : 0)

        // Walk to nearest corner and sleep when idle long enough
        if (idle >= SLEEP_MS && s.action === 'idle' && cornerTarget.current === null) {
          const corners = [
            { x: 10,                    y: 10 },
            { x: screenW - PET_W - 10,  y: 10 },
            { x: 10,                    y: screenH - PET_H - 10 },
            { x: screenW - PET_W - 10,  y: screenH - PET_H - 10 },
          ]
          const nearest = corners.reduce((a, b) =>
            Math.hypot(a.x - prev.position.x, a.y - prev.position.y) <=
            Math.hypot(b.x - prev.position.x, b.y - prev.position.y) ? a : b
          )
          cornerTarget.current = nearest
          return {
            ...prev,
            emotion:    'sleepy',
            action:     'walking',
            walkTarget: nearest,
            session:    { ...prev.session, idleMinutes: newIdleMin },
          }
        }

        // Normal emotion decay (only update when idle/walking, not during activities)
        if (s.action === 'idle' || s.action === 'walking') {
          let emotion: PetEmotion = prev.emotion
          if      (idle >= SLEEPY_MS) emotion = 'sleepy'
          else if (idle >= BORED_MS)  emotion = 'bored'
          else                        emotion = timeEmotion()
          return { ...prev, emotion, session: { ...prev.session, idleMinutes: newIdleMin } }
        }

        return { ...prev, session: { ...prev.session, idleMinutes: newIdleMin } }
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [screenW, screenH])

  // ── Accessory spawner ─────────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const TYPES: AccessoryType[] = ['snack', 'pillow', 'crown']
    const KEY_MAP: Record<AccessoryType, keyof typeof PERSONAS['default']['messages']> = {
      snack: 'snack', pillow: 'pillow', crown: 'crown',
    }

    function schedule() {
      const delay = 90_000 + Math.random() * 60_000
      t = setTimeout(() => {
        const s = stateRef.current
        if (s.action === 'idle') {
          const type = pick(TYPES)
          setState(prev => ({ ...prev, accessory: type, accessoryPhase: 'active' }))
          say(pick(PERSONAS[s.persona].messages[KEY_MAP[type]]), 2500)
          setState(prev => ({ ...prev, accessoryPhase: 'reacting' }))
          accessTimer.current = setTimeout(() => {
            setState(prev => ({ ...prev, accessory: null, accessoryPhase: null }))
          }, 8000)
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => { clearTimeout(t); clearTimeout(accessTimer.current) }
  }, [say])

  // ── Random walk scheduler ────────────────────────────────────────────────
  useEffect(() => {
    function schedule() {
      const s   = stateRef.current
      const cfg = PERSONAS[s.persona]
      const [mn, mx] = cfg.walkFreqMs
      const [emn, emx] = EMOTION_WALK_FREQ[s.emotion] ?? [4000, 12000]
      const delay = Math.max(mn, emn) + Math.random() * Math.min(mx, emx)

      scheduleTimer.current = setTimeout(() => {
        const cur = stateRef.current
        if (cur.action === 'idle') {
          cornerTarget.current = null  // normal walk, not a sleep walk
          const tx = Math.max(10, Math.random() * (screenW - PET_W - 10))
          const ty = Math.max(10, Math.random() * (screenH - PET_H - 60))
          setState(prev => ({
            ...prev,
            action:     'walking',
            walkTarget: { x: tx, y: ty },
            // facingRight set by RAF on first frame — no idle snap-flip
          }))
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(scheduleTimer.current)
  }, [screenW, screenH])

  // ── Movement RAF (walking + approaching) ─────────────────────────────────
  useEffect(() => {
    const isMoving = state.action === 'walking' || state.action === 'approaching'
    if (!isMoving) return

    const tick = () => {
      setState(prev => {
        const target = prev.action === 'approaching' ? prev.approachTarget : prev.walkTarget
        if (!target) return prev

        const dx   = target.x - prev.position.x
        const dy   = target.y - prev.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const stopDist = prev.action === 'approaching' ? APPROACH_STOP_PX : BASE_SPEED + 1

        if (dist <= stopDist) {
          const goSleep = prev.action === 'walking' && cornerTarget.current !== null
          if (goSleep) cornerTarget.current = null
          return {
            ...prev,
            action:    goSleep ? 'sleeping' : 'idle',
            emotion:   goSleep ? 'sleepy'
                     : prev.action === 'approaching' ? 'curious'
                     : timeEmotion(),
            position:       prev.action === 'approaching' ? prev.position : target,
            walkTarget:     null,
            approachTarget: null,
          }
        }

        const personaSpeed = PERSONAS[prev.persona].walkSpeedMult
        const emotionSpeed = EMOTION_SPEED[prev.emotion]
        const approachMult = prev.action === 'approaching' ? 0.65 : 1.0
        const speed        = BASE_SPEED * personaSpeed * emotionSpeed * approachMult
        const r            = speed / dist

        return {
          ...prev,
          position: { x: prev.position.x + dx * r, y: prev.position.y + dy * r },
          facingRight: dx > 0,
        }
      })
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [state.action, state.walkTarget, state.approachTarget])

  // ── Wake from sleep on interaction ───────────────────────────────────────
  const wakeUp = useCallback(() => {
    cornerTarget.current = null
    setState(prev => {
      if (prev.action !== 'sleeping') return prev
      return { ...prev, action: 'idle', emotion: 'happy', lastInteraction: Date.now() }
    })
  }, [])

  // ── Persist state ─────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current
      window.mimo.saveState({
        x: s.position.x,
        y: s.position.y,
        lastInteraction:  s.lastInteraction,
        persona:          s.persona,
        unlockedPersonas: s.unlockedPersonas,
      })
    }, 5_000)
    return () => clearInterval(interval)
  }, [])

  return {
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
  }
}
