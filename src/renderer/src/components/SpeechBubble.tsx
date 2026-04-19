import { useEffect, useState } from 'react'

interface Props {
  message: string
  visible: boolean
}

export default function SpeechBubble({ message, visible }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (visible) {
      setMounted(true)
    } else {
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [visible])

  if (!mounted) return null

  return (
    <div
      style={{
        position:   'absolute',
        bottom:     '100%',
        left:       '50%',
        marginBottom: '10px',
        pointerEvents: 'none',
        animation:  visible
          ? 'bubble-in 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards'
          : 'bubble-out 0.25s ease-in forwards',
      }}
    >
      <div
        style={{
          position:        'relative',
          padding:         '6px 10px',
          borderRadius:    '8px',
          backgroundColor: '#FFFDE7',
          border:          '2px solid #F9A825',
          fontFamily:      '"Press Start 2P", monospace',
          fontSize:        '7px',
          lineHeight:      '1.7',
          color:           '#1a1a2e',
          whiteSpace:      'nowrap',
          minWidth:        '60px',
          textAlign:       'center',
          boxShadow:       '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {message}
        {/* Tail border */}
        <div style={{
          position:    'absolute',
          top:         '100%',
          left:        '50%',
          transform:   'translateX(-50%)',
          width:       0,
          height:      0,
          borderLeft:  '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop:   '9px solid #F9A825',
        }} />
        {/* Tail fill */}
        <div style={{
          position:    'absolute',
          top:         'calc(100% - 2px)',
          left:        '50%',
          transform:   'translateX(-50%)',
          width:       0,
          height:      0,
          borderLeft:  '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop:   '7px solid #FFFDE7',
        }} />
      </div>
    </div>
  )
}
