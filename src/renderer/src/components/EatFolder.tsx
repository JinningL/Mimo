/**
 * EatFolder — a purely visual gag.
 * No files are read, written, moved, or deleted.
 * A 📁 emoji rockets into the pig's face, then a big BURP floats up.
 */
import { useEffect, useState } from 'react'

type Phase = 'hidden' | 'chomping' | 'burp'

interface Props {
  active:      boolean
  facingRight: boolean
}

export default function EatFolder({ active, facingRight }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden')

  useEffect(() => {
    if (!active) { setPhase('hidden'); return }
    setPhase('chomping')
    const t1 = setTimeout(() => setPhase('burp'),   1800)
    const t2 = setTimeout(() => setPhase('hidden'), 3600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])

  if (phase === 'hidden') return null

  const nomAnim = facingRight ? 'folder-nom-right' : 'folder-nom-left'

  return (
    <>
      {/* Big folder rocketing into the pig */}
      {phase === 'chomping' && (
        <div
          style={{
            position:      'absolute',
            top:           '30%',
            left:          facingRight ? '110%' : undefined,
            right:         facingRight ? undefined : '110%',
            fontSize:      '52px',
            animation:     `${nomAnim} 1.8s cubic-bezier(0.36,0,0.66,-0.56) forwards`,
            pointerEvents: 'none',
            zIndex:        10,
            filter:        'drop-shadow(0 0 6px rgba(255,200,0,0.8))',
          }}
        >
          📁
        </div>
      )}

      {/* Dramatic BURP overlay */}
      {phase === 'burp' && (
        <div
          style={{
            position:      'absolute',
            bottom:        '110%',
            left:          '50%',
            transform:     'translateX(-50%)',
            pointerEvents: 'none',
            zIndex:        20,
            animation:     'burp-pop 1.8s ease-out forwards',
            textAlign:     'center',
            whiteSpace:    'nowrap',
          }}
        >
          <div style={{
            fontFamily:   '"Press Start 2P", monospace',
            fontSize:     '16px',
            color:        '#FF6B00',
            textShadow:   '0 0 8px #FFD700, 2px 2px 0 #8B0000',
            lineHeight:   1.4,
          }}>
            *BURP* 💨
          </div>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize:   '8px',
            color:      '#888',
            marginTop:  '4px',
          }}>
            📁 Delicious data!
          </div>
        </div>
      )}
    </>
  )
}
