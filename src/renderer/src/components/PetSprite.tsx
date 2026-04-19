import { useState, useEffect } from 'react'
import type { PetEmotion, PetAction, PetPersona } from '../types'
import { sequenceKey, SEQUENCES, INTERVALS } from '../data/emotions'
import PERSONAS from '../data/personas'

import pigExprNormal from '../assets/pig-expr-normal.png'
import pigExprBlink  from '../assets/pig-expr-blink.png'
import pigExprAlert  from '../assets/pig-expr-alert.png'
import pigExprBored  from '../assets/pig-expr-bored.png'
import pigExprSleepy from '../assets/pig-expr-sleepy.png'
import pigBlob0      from '../assets/pig-blob-0.png'
import pigBlob1      from '../assets/pig-blob-1.png'
import pigBlob2      from '../assets/pig-blob-2.png'
import pigSleep0     from '../assets/pig-sleep-0.png'
import pigSleep1     from '../assets/pig-sleep-1.png'
import pigSleep2     from '../assets/pig-sleep-2.png'
import pigSleep3     from '../assets/pig-sleep-3.png'
import pigSleep4     from '../assets/pig-sleep-4.png'
import pigSleep5     from '../assets/pig-sleep-5.png'
import pigFront0     from '../assets/pig-front-0.png'
import pigFront1     from '../assets/pig-front-1.png'
import pigFront2     from '../assets/pig-front-2.png'
import pigFront3     from '../assets/pig-front-3.png'
import pigFront4     from '../assets/pig-front-4.png'
import pigBack0      from '../assets/pig-back-0.png'
import pigBack1      from '../assets/pig-back-1.png'
import pigBack2      from '../assets/pig-back-2.png'
import pigBack5      from '../assets/pig-back-5.png'
import pigWalk0      from '../assets/pig-walk-0.png'
import pigWalk1      from '../assets/pig-walk-1.png'
import pigWalk2      from '../assets/pig-walk-2.png'
import pigWalk3      from '../assets/pig-walk-3.png'
import pigWalk4      from '../assets/pig-walk-4.png'
import pigWalk5      from '../assets/pig-walk-5.png'

const FRAMES: Record<string, string> = {
  'pig-expr-normal': pigExprNormal,
  'pig-expr-blink':  pigExprBlink,
  'pig-expr-alert':  pigExprAlert,
  'pig-expr-bored':  pigExprBored,
  'pig-expr-sleepy': pigExprSleepy,
  'pig-blob-0':      pigBlob0,
  'pig-blob-1':      pigBlob1,
  'pig-blob-2':      pigBlob2,
  'pig-sleep-0':     pigSleep0,
  'pig-sleep-1':     pigSleep1,
  'pig-sleep-2':     pigSleep2,
  'pig-sleep-3':     pigSleep3,
  'pig-sleep-4':     pigSleep4,
  'pig-sleep-5':     pigSleep5,
  'pig-front-0':     pigFront0,
  'pig-front-1':     pigFront1,
  'pig-front-2':     pigFront2,
  'pig-front-3':     pigFront3,
  'pig-front-4':     pigFront4,
  'pig-back-0':      pigBack0,
  'pig-back-1':      pigBack1,
  'pig-back-2':      pigBack2,
  'pig-back-5':      pigBack5,
  'pig-walk-0':      pigWalk0,
  'pig-walk-1':      pigWalk1,
  'pig-walk-2':      pigWalk2,
  'pig-walk-3':      pigWalk3,
  'pig-walk-4':      pigWalk4,
  'pig-walk-5':      pigWalk5,
}

interface Props {
  emotion:     PetEmotion
  action:      PetAction
  facingRight: boolean
  persona:     PetPersona
}

export default function PetSprite({ emotion, action, facingRight, persona }: Props) {
  const [frameIdx, setFrameIdx] = useState(0)

  const seqKey  = sequenceKey(emotion, action)
  const seq     = SEQUENCES[seqKey] ?? SEQUENCES['idle']
  const interval = INTERVALS[seqKey] ?? 950
  const filter  = PERSONAS[persona].cssFilter

  // Reset frame index when the sequence changes
  useEffect(() => { setFrameIdx(0) }, [seqKey])

  useEffect(() => {
    const id = setInterval(() =>
      setFrameIdx(i => (i + 1) % seq.length), interval)
    return () => clearInterval(id)
  }, [seq, interval])

  const src = FRAMES[seq[frameIdx] ?? seq[0]]

  return (
    <img
      src={src}
      width={128}
      height={128}
      draggable={false}
      style={{
        imageRendering: 'pixelated',
        display:        'block',
        filter:         filter !== 'none' ? filter : undefined,
        transform:      facingRight ? undefined : 'scaleX(-1)',
        userSelect:     'none',
      }}
    />
  )
}
