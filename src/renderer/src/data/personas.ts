import type { PetPersona } from '../types'

export interface PersonaConfig {
  id:              PetPersona
  name:            string
  emoji:           string
  cssFilter:       string           // visual tint applied to the sprite
  walkSpeedMult:   number           // multiplier on WALK_SPEED
  walkFreqMs:      [number, number] // [min, max] ms between walks
  unlockHint:      string           // shown before unlock
  unlockBanner:    string           // shown on unlock
  messages: {
    idle:        string[]
    click:       string[]
    dblClick:    string[]
    drag:        string[]
    mouseNear:   string[]
    snack:       string[]
    pillow:      string[]
    sleepTalk:   string[]
    crown:       string[]
    eat:         string[]
    burp:        string[]
    lonely:      string[]
    annoyed:     string[]
  }
}

const PERSONAS: Record<PetPersona, PersonaConfig> = {
  default: {
    id: 'default', name: 'Mimo', emoji: '🐷',
    cssFilter: 'none',
    walkSpeedMult: 1, walkFreqMs: [4000, 12000],
    unlockHint: '', unlockBanner: '',
    messages: {
      idle:      ['Oink~', '*snuffles*', 'Hmm...', '🐷'],
      click:     ['Oink!', 'Hehe~', 'Again!', 'Oink oink!'],
      dblClick:  ['📁 Yummy!', 'Nom nom!', '*chomp*', 'Oink! Folder!'],
      drag:      ['Weee~', 'So high!', 'Oink!', 'Wheee!'],
      mouseNear: ['Hmm? 👀', '...sniff', 'Oh! Hi!', '*perks up*'],
      snack:     ['🍎 Yesss!!', 'Om nom nom!', 'Snack time! 🎉'],
      pillow:    ['💤 Nap time~', 'Oink... zzz', 'So comfy...'],
      sleepTalk: ['...tiny apple...', 'zz... warm mud...', '*sleepy oink*', 'five more minutes...'],
      crown:     ['👑 I am king!', 'Royal oink!', 'Bow before me~'],
      eat:       ['Om nom nom!', '*chomp chomp*', 'Folder = snack?'],
      burp:      ['*BURP* 💨', 'Delicious data!', 'Oink. *pats belly*'],
      lonely:    ['Oink? 🥺', 'Miss you!', '*pokes you*'],
      annoyed:   ['OINK!', 'Stop that!', 'TOO MUCH!'],
    },
  },

  sleepy: {
    id: 'sleepy', name: 'Sleepy Pig', emoji: '💤',
    cssFilter: 'brightness(0.82) saturate(0.5)',
    walkSpeedMult: 0.5, walkFreqMs: [12000, 25000],
    unlockHint: 'Leave Mimo alone for 5 minutes...',
    unlockBanner: '💤 Sleepy Pig unlocked! So tired...',
    messages: {
      idle:      ['Zzz...', '*snores*', 'zz oink zz', '...hm?', '*yawns*'],
      click:     ['Whu...?', 'Zzz... oh.', '*half asleep*', 'Go away... zzz'],
      dblClick:  ['No...nap...', 'Zzz nom...', '*sleepy chomp*'],
      drag:      ['Ugh..', 'Nooo sleep...', '*dozes mid-air*'],
      mouseNear: ['...zzz', 'hm?', '*barely opens eye*'],
      snack:     ['zz... nom?', '*eats half asleep*', 'oh food... zzz'],
      pillow:    ['Finally... zzz', 'My precious...', '*immediately naps*'],
      sleepTalk: ['...zz... blanket...', 'no alarm... please...', '*soft snore*', 'mmm... cozy...'],
      crown:     ['...king? sure... zzz', '*naps in crown*'],
      eat:       ['Nom... zzz', '*sleepy chomp*', 'Zz nom nom...'],
      burp:      ['...urp', '*sleepy burp* zzz', 'Oink... zzz'],
      lonely:    ['...zzz', 'Too tired to care', '...oink'],
      annoyed:   ['WAKE ME NOT.', 'Zzz... OINK!', '...seriously?'],
    },
  },

  chaotic: {
    id: 'chaotic', name: 'Chaotic Pig', emoji: '🌪️',
    cssFilter: 'saturate(2.5) hue-rotate(15deg) contrast(1.15)',
    walkSpeedMult: 2.2, walkFreqMs: [800, 3000],
    unlockHint: 'Click Mimo rapidly, many times...',
    unlockBanner: '🌪️ Chaotic Pig UNLEASHED! OINK OINK OINK!!',
    messages: {
      idle:      ['OINK', 'WHEEE', 'CHAOS!', 'I go BRRR', '*vibrates*'],
      click:     ['OINK!', 'MORE!', 'AGAIN AGAIN!', 'YESSS!', 'OwO'],
      dblClick:  ['FOLDER DESTROYER!', 'CHOMP CHOMP CHOMP!', 'NOM AT MAX SPEED!'],
      drag:      ['YEEEE!', 'FASTER!', 'OINK AT MACH 10!', 'WHEEEEE!'],
      mouseNear: ['I SEE YOU!', 'HI HI HI!', 'FRIEND!!', '👀👀👀'],
      snack:     ['SNACK ATTACK!', 'CONSUMED!', 'INHALED!', 'GONE!'],
      pillow:    ['NO TIME FOR SLEEP!', 'CHAOS NEVER RESTS!', 'PILLOW FIGHT!'],
      sleepTalk: ['...MORE LASERS...', 'ZZZ OF CHAOS!', 'I AM SPEED... zzz', '*tiny battle noises*'],
      crown:     ['CHAOS KING!', 'ALL HAIL OINK!', 'UNLIMITED POWER!'],
      eat:       ['CHOMP CHOMP CHOMP!', 'DIGITAL FEAST!', 'FOLDER DESTROYED!'],
      burp:      ['BELCH OF POWER!', '*MEGA BURP*', 'THE CHAOS BURP!'],
      lonely:    ['ENTERTAIN ME!', 'WHY U LEAVE!', 'OINK OINK OINK!'],
      annoyed:   ['...', 'actually fine', 'chaos is calm'],
    },
  },

  shy: {
    id: 'shy', name: 'Shy Pig', emoji: '🙈',
    cssFilter: 'saturate(0.55) opacity(0.82)',
    walkSpeedMult: 0.7, walkFreqMs: [15000, 30000],
    unlockHint: 'Stay near Mimo without touching for a while...',
    unlockBanner: '🙈 Shy Pig found you! ...please be gentle',
    messages: {
      idle:      ['...', '...oink?', '*hides*', 'o-oink', '...hi'],
      click:     ['eek!', 'o-oh!', '...again?', '*flinches*'],
      dblClick:  ['a-ahh!', '...n-nom', '*shy eating*'],
      drag:      ['...!', 'oh no...', '*quiet distress*'],
      mouseNear: ['...hi', '*peeks*', 'oh... hello', '...it sees me'],
      snack:     ['...thank you', '*tiny bite*', 'o-oh, snack?'],
      pillow:    ['...safe here', '*hides under pillow*', 'o-okay...'],
      sleepTalk: ['...don’t look at me...', '...tiny oink...', '*sleepy mumble*', '...is it morning yet...'],
      crown:     ['m-me?', '...I am not worthy', '*blushes oink*'],
      eat:       ['...nom?', '*quiet chomp*', 'o-okay...'],
      burp:      ['e-excuse me...', '*mortified oink*', 'sorrysorrysorry'],
      lonely:    ['...that is fine', '...okay', '*gets smaller*'],
      annoyed:   ['...please stop', '...', '*retreats further*'],
    },
  },

  drama: {
    id: 'drama', name: 'Drama Pig', emoji: '🎭',
    cssFilter: 'contrast(1.3) saturate(1.6) drop-shadow(0 0 8px gold)',
    walkSpeedMult: 0.85, walkFreqMs: [6000, 14000],
    unlockHint: 'Drag Mimo dramatically across the screen...',
    unlockBanner: '🎭 Drama Pig has ARRIVED. Applause, please.',
    messages: {
      idle:      ['*gazes into distance*', 'My story... is complex', 'I feel everything.', '*dramatic sigh*'],
      click:     ['THE AUDACITY!', 'I am SHOOK.', 'How DARE you.', 'I cannot. I simply CANNOT.'],
      dblClick:  ['You DARE feed me?!', 'A FOLDER? For ME?', '*faints* ...but still eats'],
      drag:      ['THIS IS MY MOMENT!', 'Catch me if you can!', 'Like a leaf in the wind...'],
      mouseNear: ['You... came for me?', 'I sensed your presence.', '*meaningful eye contact*'],
      snack:     ['A gift? For MEEEE?', '*eats theatrically*', 'This... changes everything.'],
      pillow:    ['At last... rest.', 'The drama never sleeps.', '*collapses dramatically*'],
      sleepTalk: ['...my final monologue...', '*dramatic snore*', 'the spotlight... mine...', 'bravo... zzz...'],
      crown:     ['AS IT SHOULD BE.', 'Finally. Recognition.', 'I was BORN for this.'],
      eat:       ['*eats passionately*', 'Even eating... is an art.', 'Delicieux!'],
      burp:      ['*burps with flair*', 'Even THAT was beautiful.', 'A natural phenomenon.'],
      lonely:    ['You left me. I shall remember this.', 'The silence is deafening.', '*stares*'],
      annoyed:   ['I am LIVID.', 'You think this a GAME?', 'I have NEVER been so insulted!'],
    },
  },
}

export default PERSONAS
