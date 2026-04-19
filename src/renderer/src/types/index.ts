export type PetEmotion = 'happy' | 'bored' | 'sleepy' | 'annoyed' | 'excited' | 'curious'
export type PetAction  = 'idle' | 'walking' | 'approaching' | 'reacting' | 'eating' | 'sleeping'
export type PetPersona = 'default' | 'sleepy' | 'chaotic' | 'shy' | 'drama'
export type AccessoryType = 'snack' | 'pillow' | 'crown'

export interface SessionStats {
  totalClicks:        number
  totalDrags:         number
  maxHoverSeconds:    number   // longest consecutive hover near pig
  rapidClickBursts:   number   // times 5+ clicks in 3s happened
  idleMinutes:        number   // cumulative idle minutes this session
}

export interface PetState {
  emotion:           PetEmotion
  action:            PetAction
  position:          { x: number; y: number }
  facingRight:       boolean
  lastInteraction:   number
  message:           string | null
  messageVisible:    boolean
  clickCount:        number
  clickWindowStart:  number
  walkTarget:        { x: number; y: number } | null
  approachTarget:    { x: number; y: number } | null
  persona:           PetPersona
  unlockedPersonas:  PetPersona[]
  accessory:         AccessoryType | null
  accessoryPhase:    'active' | 'reacting' | null
  session:           SessionStats
}

export interface SavedPetState {
  x:                number
  y:                number
  lastInteraction:  number
  persona:          PetPersona
  unlockedPersonas: PetPersona[]
}

declare global {
  interface Window {
    mimo: {
      setIgnoreMouse:   (ignore: boolean) => void
      loadState:        () => Promise<SavedPetState | null>
      saveState:        (data: SavedPetState) => void
      getScreenBounds:  () => Promise<{ x: number; y: number; width: number; height: number }>
      quit:             () => void
      showContextMenu:  () => void
      onNextPersona:    (cb: () => void) => void
    }
  }
}
