type BrowserAudioContext = typeof AudioContext

export class ColorSoundEngine {
  private context: AudioContext | null = null
  private lastFillAt = 0

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: BrowserAudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (!this.context) this.context = new AudioContextClass()
    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  private tone(frequency: number, start: number, duration: number, volume: number, type: OscillatorType) {
    const context = this.getContext()
    if (!context) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }

  playFill(colorId: number) {
    const now = performance.now()
    if (now - this.lastFillAt < 44) return
    this.lastFillAt = now
    const context = this.getContext()
    if (!context) return
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880]
    this.tone(notes[(colorId - 1) % notes.length], context.currentTime, 0.075, 0.045, 'sine')
  }

  playHint() {
    const context = this.getContext()
    if (!context) return
    this.tone(740, context.currentTime, 0.08, 0.045, 'sine')
    this.tone(988, context.currentTime + 0.07, 0.12, 0.05, 'sine')
  }

  playToggle() {
    const context = this.getContext()
    if (!context) return
    this.tone(660, context.currentTime, 0.08, 0.035, 'sine')
  }

  playCompletion() {
    const context = this.getContext()
    if (!context) return
    const start = context.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      this.tone(frequency, start + index * 0.11, 0.28, 0.055, 'triangle')
    })
  }
}
