import type { AccessoryType } from '../types'

interface Props {
  type:  AccessoryType | null
  phase: 'active' | 'reacting' | null
}

const EMOJI: Record<AccessoryType, string> = {
  snack:  '🍎',
  pillow: '🛌',
  crown:  '👑',
}

const POSITION: Record<AccessoryType, React.CSSProperties> = {
  snack:  { right: '-28px', bottom: '20px' },
  pillow: { left:  '50%',   bottom: '-24px', transform: 'translateX(-50%)' },
  crown:  { left:  '50%',   top:    '-28px',  transform: 'translateX(-50%)' },
}

const ANIM: Record<AccessoryType, string> = {
  snack:  'accessory-snack 0.5s ease-out forwards',
  pillow: 'accessory-pillow 0.5s ease-out forwards',
  crown:  'accessory-crown 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
}

export default function Accessory({ type, phase }: Props) {
  if (!type || !phase) return null

  return (
    <div
      style={{
        position:  'absolute',
        fontSize:  '28px',
        animation: ANIM[type],
        opacity:   phase === 'reacting' ? 1 : 0,
        ...POSITION[type],
      }}
    >
      {EMOJI[type]}
    </div>
  )
}
