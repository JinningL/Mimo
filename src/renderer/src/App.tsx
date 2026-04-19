import { useEffect, useState } from 'react'
import Pet from './components/Pet'
import type { SavedPetState } from './types'

interface Bounds { x: number; y: number; width: number; height: number }

export default function App() {
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [saved,  setSaved]  = useState<SavedPetState | null>(null)

  useEffect(() => {
    Promise.all([
      window.mimo.getScreenBounds(),
      window.mimo.loadState(),
    ]).then(([b, s]) => {
      setBounds(b)
      setSaved(s as SavedPetState | null)
    })
  }, [])

  if (!bounds) return null

  const initX = saved?.x ?? bounds.width  - 160
  const initY = saved?.y ?? bounds.height - 200

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'transparent' }}>
      <Pet
        screenWidth={bounds.width}
        screenHeight={bounds.height}
        initialX={initX}
        initialY={initY}
        saved={saved}
      />
    </div>
  )
}
