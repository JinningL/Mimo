import type { PetEmotion, PetAction } from '../types'

// ── Frame sequences ─────────────────────────────────────────────────────────
// Each string is a filename in src/renderer/src/assets/ (no extension)
export const SEQUENCES: Record<string, string[]> = {
  idle:     ['pig-front-0', 'pig-front-1'],
  happy:    ['pig-front-0', 'pig-blob-0', 'pig-front-1', 'pig-blob-1'],
  excited:  ['pig-blob-0', 'pig-blob-1', 'pig-blob-2', 'pig-blob-1'],
  bored:    ['pig-expr-bored', 'pig-expr-normal'],
  sleepy:   ['pig-expr-sleepy', 'pig-expr-bored'],
  sleeping: ['pig-sleep-0','pig-sleep-1','pig-sleep-2','pig-sleep-3','pig-sleep-4','pig-sleep-5'],
  curious:  ['pig-expr-alert', 'pig-expr-normal', 'pig-expr-alert', 'pig-front-0'],
  annoyed:  ['pig-expr-alert', 'pig-expr-bored', 'pig-expr-alert'],
  reacting: ['pig-blob-0', 'pig-blob-1', 'pig-blob-2', 'pig-blob-1', 'pig-blob-0'],
  eating:   ['pig-front-0', 'pig-blob-0', 'pig-blob-1', 'pig-front-1'],
  walk:     ['pig-walk-0','pig-walk-1','pig-walk-2','pig-walk-3','pig-walk-4','pig-walk-5'],
}

// ── Frame intervals (ms per frame) ──────────────────────────────────────────
export const INTERVALS: Record<string, number> = {
  idle:     950,
  happy:    380,
  excited:  110,
  bored:    1600,
  sleepy:   2400,
  sleeping: 650,
  curious:  480,
  annoyed:  160,
  reacting: 90,
  eating:   210,
  walk:     105,
}

// ── Pick sequence key from (emotion, action) ────────────────────────────────
export function sequenceKey(emotion: PetEmotion, action: PetAction): string {
  if (action === 'sleeping')                        return 'sleeping'
  if (action === 'eating')                          return 'eating'
  if (action === 'reacting')                        return 'reacting'
  if (action === 'walking' || action === 'approaching') return 'walk'
  switch (emotion) {
    case 'excited': return 'excited'
    case 'bored':   return 'bored'
    case 'sleepy':  return 'sleepy'
    case 'annoyed': return 'annoyed'
    case 'curious': return 'curious'
    case 'happy':   return 'happy'
    default:        return 'idle'
  }
}

// ── Emotion → walk speed multiplier ─────────────────────────────────────────
export const EMOTION_SPEED: Record<PetEmotion, number> = {
  happy:   1.0,
  bored:   0.7,
  sleepy:  0.4,
  annoyed: 1.3,
  excited: 1.6,
  curious: 0.65,
}

// ── Emotion → walk frequency range [min, max] ms ────────────────────────────
export const EMOTION_WALK_FREQ: Record<PetEmotion, [number, number]> = {
  happy:   [4000,  10000],
  bored:   [2000,   5000],  // bored pigs wander more
  sleepy:  [15000, 30000],  // sleepy pigs barely move
  annoyed: [1500,   4000],  // annoyed pigs pace
  excited: [1000,   3000],  // excited pigs can't stay still
  curious: [6000,  12000],
}
