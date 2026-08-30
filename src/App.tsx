import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { ColorSoundEngine } from './audio/sounds'
import {
  ColorCanvas,
  type CanvasStats,
  type ColorCanvasHandle,
  type FillSource,
} from './canvas/ColorCanvas'
import { cupcakeArtwork, totalColorableCells } from './game/artwork'

type GamePhase = 'playing' | 'replaying' | 'celebrating'

const confettiColors = ['#ff5f8f', '#ffd166', '#3ec6b2', '#6f63d9', '#ff914d', '#55a7ff']
const confettiPieces = Array.from({ length: 72 }, (_, index) => ({
  id: index,
  left: (index * 37 + 9) % 100,
  delay: -((index * 17) % 90) / 100,
  duration: 2.4 + ((index * 13) % 18) / 10,
  drift: ((index * 29) % 160) - 80,
  color: confettiColors[index % confettiColors.length],
  shape: index % 3,
}))

function initialSoundSetting(): boolean {
  try {
    return window.localStorage.getItem('arya-color:sound') !== 'off'
  } catch {
    return true
  }
}

function RoseMascot() {
  return (
    <div className="rose-mascot" aria-hidden="true">
      <span className="rose-gills rose-gills-left" />
      <span className="rose-gills rose-gills-right" />
      <span className="rose-face">
        <i className="rose-eye rose-eye-left" />
        <i className="rose-eye rose-eye-right" />
        <i className="rose-smile" />
      </span>
    </div>
  )
}

function RainbowConfetti() {
  return (
    <div className="confetti-field" aria-hidden="true">
      {confettiPieces.map((piece) => (
        <i
          key={piece.id}
          className={`confetti-piece shape-${piece.shape}`}
          style={{
            '--confetti-left': `${piece.left}%`,
            '--confetti-delay': `${piece.delay}s`,
            '--confetti-duration': `${piece.duration}s`,
            '--confetti-drift': `${piece.drift}px`,
            '--confetti-color': piece.color,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}

function App() {
  const artwork = cupcakeArtwork
  const total = totalColorableCells(artwork)
  const canvasRef = useRef<ColorCanvasHandle>(null)
  const soundEngineRef = useRef(new ColorSoundEngine())
  const phaseRef = useRef<GamePhase>('playing')
  const completionTimerRef = useRef<number | null>(null)
  const [selectedColor, setSelectedColor] = useState(2)
  const [soundEnabled, setSoundEnabled] = useState(initialSoundSetting)
  const [resetViewNonce, setResetViewNonce] = useState(0)
  const [resetProgressNonce, setResetProgressNonce] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [stats, setStats] = useState<CanvasStats>({ filled: 0, total, completedColors: [] })
  const soundEnabledRef = useRef(soundEnabled)

  soundEnabledRef.current = soundEnabled

  const percent = Math.round((stats.filled / Math.max(1, stats.total)) * 100)
  const completedColors = useMemo(() => new Set(stats.completedColors), [stats.completedColors])
  const selectedColorComplete = completedColors.has(selectedColor)

  const changePhase = (nextPhase: GamePhase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }

  const runCompletionReplay = async () => {
    changePhase('replaying')
    await canvasRef.current?.replayCompletion()
    if (soundEnabledRef.current) soundEngineRef.current.playCompletion()
    changePhase('celebrating')
  }

  const handleStatsChange = (nextStats: CanvasStats) => {
    setStats(nextStats)
    const justCompleted = nextStats.total > 0 && nextStats.filled === nextStats.total
    if (!justCompleted || phaseRef.current !== 'playing' || completionTimerRef.current !== null) return
    completionTimerRef.current = window.setTimeout(() => {
      completionTimerRef.current = null
      if (canvasRef.current?.isComplete()) void runCompletionReplay()
    }, 360)
  }

  const handleCellFilled = (_cellIndex: number, colorId: number, source: FillSource) => {
    if (!soundEnabledRef.current || source === 'hint') return
    soundEngineRef.current.playFill(colorId)
  }

  const handleHint = () => {
    if (!canvasRef.current?.fillHint()) return
    if (soundEnabledRef.current) soundEngineRef.current.playHint()
  }

  const handleSoundToggle = () => {
    const nextEnabled = !soundEnabled
    setSoundEnabled(nextEnabled)
    if (nextEnabled) soundEngineRef.current.playToggle()
  }

  const handleStartOver = () => {
    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current)
      completionTimerRef.current = null
    }
    changePhase('playing')
    setSelectedColor(2)
    setResetViewNonce((nonce) => nonce + 1)
    setResetProgressNonce((nonce) => nonce + 1)
  }

  useEffect(() => {
    try {
      window.localStorage.setItem('arya-color:sound', soundEnabled ? 'on' : 'off')
    } catch {
      // The game still works if private browsing blocks preference storage.
    }
  }, [soundEnabled])

  useEffect(
    () => () => {
      if (completionTimerRef.current !== null) window.clearTimeout(completionTimerRef.current)
    },
    [],
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <RoseMascot />
          <div>
            <p className="brand-name">Arya Color</p>
            <p className="brand-subtitle">Made for colorful moments</p>
          </div>
        </div>

        <div className="picture-heading">
          <span className="difficulty-pill">Medium · 2 stars</span>
          <h1>{artwork.title}</h1>
        </div>

        <div className="topbar-actions">
          <div className="progress-copy" aria-label={`${percent}% complete`}>
            <strong>{percent}%</strong>
            <span>{stats.filled} colored</span>
          </div>
          <button
            type="button"
            className={`sound-button ${soundEnabled ? 'is-on' : ''}`}
            aria-pressed={soundEnabled}
            onClick={handleSoundToggle}
          >
            <span aria-hidden="true">{soundEnabled ? '♪' : '×'}</span>
            Sound
          </button>
        </div>
      </header>

      <section className="prototype-layout">
        <aside className="guide-panel">
          <div className="prototype-badge">
            <span className="pulse-dot" />
            Playable preview
          </div>
          <div className="guide-copy">
            <p className="eyebrow">Rose has a tip</p>
            <h2>Choose a number, then color.</h2>
            <p>Wrong numbers stay blank, so you can relax and have fun.</p>
          </div>

          <div className="gesture-list compact-gestures">
            <div className="gesture-card">
              <span className="gesture-icon pencil-icon">✎</span>
              <div><strong>Pencil or one finger</strong><span>Tap or drag to color</span></div>
            </div>
            <div className="gesture-card">
              <span className="gesture-icon fingers-icon">••</span>
              <div><strong>Two fingers</strong><span>Move and pinch-zoom</span></div>
            </div>
          </div>

          <div className="hint-panel">
            <span className="hint-sparkle" aria-hidden="true">✦</span>
            <div>
              <strong>Can’t find one?</strong>
              <span>Hints color one square.</span>
            </div>
            <button
              type="button"
              className="hint-button"
              disabled={selectedColorComplete || phase !== 'playing'}
              onClick={handleHint}
            >
              {selectedColorComplete ? 'Choose a color' : 'Use a hint'}
            </button>
            <small>Unlimited hints</small>
          </div>

          <div className="guide-actions">
            <button type="button" className="secondary-button" onClick={() => setResetViewNonce((n) => n + 1)}>
              Center picture
            </button>
            <button type="button" className="text-button" onClick={handleStartOver}>
              Start this picture over
            </button>
          </div>
        </aside>

        <section className="play-area" aria-label="Coloring area">
          <div className={`canvas-card ${phase !== 'playing' ? 'is-locked' : ''}`}>
            <ColorCanvas
              ref={canvasRef}
              artwork={artwork}
              selectedColor={selectedColor}
              resetViewNonce={resetViewNonce}
              resetProgressNonce={resetProgressNonce}
              interactionLocked={phase !== 'playing'}
              cleanReveal={phase === 'celebrating'}
              onStatsChange={handleStatsChange}
              onCellFilled={handleCellFilled}
            />
            <div className={`canvas-tip ${phase === 'replaying' ? 'is-replaying' : ''}`} aria-live="polite">
              {phase === 'replaying'
                ? 'Replaying your coloring magic…'
                : phase === 'celebrating'
                  ? 'Your masterpiece is finished!'
                  : 'Pick a number, then tap or drag'}
            </div>

            {phase === 'replaying' && (
              <div className="replay-badge" aria-hidden="true">
                <span />
                <strong>Time-lapse</strong>
              </div>
            )}

            {phase === 'celebrating' && (
              <div className="completion-overlay" role="dialog" aria-modal="true" aria-labelledby="completion-title">
                <RainbowConfetti />
                <div className="completion-card">
                  <div className="completion-rose"><RoseMascot /></div>
                  <p className="completion-kicker">Cupcake complete!</p>
                  <h2 id="completion-title">You colored it!</h2>
                  <div className="completion-stars" aria-label="You earned two stars">
                    <span>★</span><span>★</span>
                  </div>
                  <p>Rose is doing a happy dance for your masterpiece.</p>
                  <div className="completion-actions">
                    <button type="button" className="celebration-primary" onClick={() => void runCompletionReplay()}>
                      Watch again
                    </button>
                    <button type="button" className="celebration-secondary" onClick={handleStartOver}>
                      Color again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="palette-bar" aria-label="Choose a color">
            <div className="palette-label">
              <span>Choose a color</span>
              <strong>{stats.total - stats.filled} squares left</strong>
            </div>
            <div className="swatch-list">
              {artwork.palette.map((color) => {
                const complete = completedColors.has(color.id)
                const selected = selectedColor === color.id
                return (
                  <button
                    key={color.id}
                    type="button"
                    className={`color-swatch ${selected ? 'is-selected' : ''} ${complete ? 'is-complete' : ''}`}
                    style={{ '--swatch-color': color.color } as CSSProperties}
                    aria-label={`${color.name}, color ${color.id}${complete ? ', complete' : ''}`}
                    aria-pressed={selected}
                    disabled={phase !== 'playing'}
                    onClick={() => setSelectedColor(color.id)}
                  >
                    <span className="swatch-circle">{complete ? '✓' : color.id}</span>
                    <span className="swatch-name">{color.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </section>

      <div className="portrait-notice">
        <RoseMascot />
        <h2>Turn the iPad sideways</h2>
        <p>Arya Color is happiest in landscape.</p>
      </div>
    </main>
  )
}

export default App
