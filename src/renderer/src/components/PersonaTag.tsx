import PERSONAS from '../data/personas'
import type { PetPersona } from '../types'

interface Props { persona: PetPersona }

export default function PersonaTag({ persona }: Props) {
  if (persona === 'default') return null

  const cfg = PERSONAS[persona]

  return (
    <div
      style={{
        position:       'absolute',
        bottom:         '-22px',
        left:           '50%',
        transform:      'translateX(-50%)',
        background:     'rgba(0,0,0,0.55)',
        color:          '#fff',
        fontSize:       '9px',
        fontFamily:     '"Press Start 2P", monospace',
        padding:        '2px 6px',
        borderRadius:   '4px',
        whiteSpace:     'nowrap',
        pointerEvents:  'none',
        userSelect:     'none',
      }}
    >
      {cfg.emoji} {cfg.name}
    </div>
  )
}
