interface CustomWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const W = window as unknown as CustomWindow
    const AudioContextClass = window.AudioContext || W.webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported')
    }
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playDraw(enabled: boolean) {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  } catch (e) {
    console.warn('Audio playback failed', e)
  }
}

export function playStep(enabled: boolean) {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, now)

    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.1)
  } catch (e) {
    console.warn('Audio playback failed', e)
  }
}

export function playSuccess(enabled: boolean) {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Play a lovely major arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5]

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const noteTime = now + idx * 0.12

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(0.12, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.4)
    })
  } catch (e) {
    console.warn('Audio playback failed', e)
  }
}

export function playCollision(enabled: boolean) {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.linearRampToValueAtTime(80, now + 0.45)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.linearRampToValueAtTime(0.01, now + 0.45)

    // Add a simple low-pass filter to soften the sawtooth
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(300, now)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.45)
  } catch (e) {
    console.warn('Audio playback failed', e)
  }
}

export function playTick(enabled: boolean) {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)

    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.04)
  } catch (e) {
    console.warn('Audio playback failed', e)
  }
}
