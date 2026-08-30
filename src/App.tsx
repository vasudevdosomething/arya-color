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
import { ArtworkPreview } from './components/ArtworkPreview'
import { artworks, getArtwork, totalColorableCells, type Artwork } from './game/artwork'
import { isArtworkUnlocked, nextUnlockAt, totalEarnedStars } from './game/progression'
import {
  loadAllProgress,
  requestPersistentStorage,
  saveArtworkProgress,
  type ArtworkProgressSnapshot,
  type SavedArtworkProgress,
} from './storage/progress'

type GamePhase = 'playing' | 'replaying' | 'celebrating'

const emptyProgress: ArtworkProgressSnapshot = { filled: [], fillOrder: [] }
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

function SoundButton({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`sound-button ${enabled ? 'is-on' : ''}`}
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <span aria-hidden="true">{enabled ? '♪' : '×'}</span>
      Sound
    </button>
  )
}

function progressPercent(artwork: Artwork, progress?: SavedArtworkProgress): number {
  if (!progress) return 0
  return Math.round((progress.filled.length / Math.max(1, totalColorableCells(artwork))) * 100)
}

interface GalleryProps {
  progressById: Record<string, SavedArtworkProgress>
  soundEnabled: boolean
  onSoundToggle: () => void
  onOpenArtwork: (artwork: Artwork) => void
}

function Gallery({ progressById, soundEnabled, onSoundToggle, onOpenArtwork }: GalleryProps) {
  const progress = Object.values(progressById)
  const stars = totalEarnedStars(artworks, progress)
  const nextMilestone = nextUnlockAt(artworks, stars)
  const completedCount = progress.filter(({ completedAt }) => completedAt).length

  return (
    <main className="app-shell gallery-shell">
      <header className="topbar gallery-topbar">
        <div className="brand-lockup">
          <RoseMascot />
          <div>
            <p className="brand-name">Arya Color</p>
            <p className="brand-subtitle">Made for colorful moments</p>
          </div>
        </div>
        <div className="gallery-heading">
          <p>Rose’s picture library</p>
          <h1>Pick a picture</h1>
        </div>
        <div className="topbar-actions">
          <div className="star-wallet" aria-label={`${stars} stars earned`}>
            <span aria-hidden="true">★</span>
            <strong>{stars}</strong>
            <small>earned</small>
          </div>
          <SoundButton enabled={soundEnabled} onToggle={onSoundToggle} />
        </div>
      </header>

      <section className="gallery-content">
        <div className="gallery-summary">
          <div>
            <p className="eyebrow">15 original pictures</p>
            <h2>What should we color today?</h2>
            <p>All your coloring stays saved on this iPad.</p>
          </div>
          <div className="milestone-card">
            <span className="milestone-star">★</span>
            <div>
              <strong>{completedCount} finished</strong>
              <span>
                {nextMilestone === null
                  ? 'Every picture is unlocked!'
                  : `${nextMilestone - stars} more ${nextMilestone - stars === 1 ? 'star' : 'stars'} to the next unlock`}
              </span>
            </div>
          </div>
        </div>

        <div className="gallery-grid">
          {artworks.map((artwork, index) => {
            const saved = progressById[artwork.id]
            const percent = progressPercent(artwork, saved)
            const unlocked = isArtworkUnlocked(artwork, stars)
            const completed = Boolean(saved?.completedAt)
            const started = percent > 0 && percent < 100
            return (
              <button
                key={artwork.id}
                type="button"
                className={`artwork-card ${unlocked ? 'is-unlocked' : 'is-locked'} ${completed ? 'is-complete' : ''}`}
                disabled={!unlocked}
                onClick={() => onOpenArtwork(artwork)}
                aria-label={unlocked
                  ? `${artwork.title}, ${completed ? 'complete' : started ? `${percent}% complete` : 'not started'}`
                  : `${artwork.title}, locked until ${artwork.unlockAt} stars`}
              >
                <div className="artwork-card-preview">
                  <ArtworkPreview artwork={artwork} />
                  {index < 3 && <span className="starter-ribbon">Ready!</span>}
                  {!unlocked && (
                    <span className="lock-bubble">
                      <b aria-hidden="true">★</b>
                      {artwork.unlockAt}
                    </span>
                  )}
                  {completed && <span className="complete-check" aria-hidden="true">✓</span>}
                </div>
                <div className="artwork-card-copy">
                  <span className="artwork-category">{artwork.category}</span>
                  <strong>{artwork.title}</strong>
                  <div className="artwork-meta">
                    <span>{artwork.difficulty}</span>
                    <span className="card-stars">{'★'.repeat(artwork.stars)}</span>
                  </div>
                  {started && (
                    <span className="card-progress">
                      <i style={{ width: `${percent}%` }} />
                      <b>{percent}%</b>
                    </span>
                  )}
                  <span className="card-action">
                    {!unlocked ? `Unlocks at ${artwork.unlockAt} stars` : completed ? 'Color again' : started ? 'Keep coloring' : 'Start coloring'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <PortraitNotice />
    </main>
  )
}

function PortraitNotice() {
  return (
    <div className="portrait-notice">
      <RoseMascot />
      <h2>Turn the iPad sideways</h2>
      <p>Arya Color is happiest in landscape.</p>
    </div>
  )
}

function App() {
  const canvasRef = useRef<ColorCanvasHandle>(null)
  const soundEngineRef = useRef(new ColorSoundEngine())
  const phaseRef = useRef<GamePhase>('playing')
  const completionTimerRef = useRef<number | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const pendingSaveRef = useRef<SavedArtworkProgress | null>(null)
  const progressRef = useRef<Record<string, SavedArtworkProgress>>({})
  const activeArtworkRef = useRef<Artwork | null>(null)
  const earnedThisRunRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [progressById, setProgressById] = useState<Record<string, SavedArtworkProgress>>({})
  const [activeArtworkId, setActiveArtworkId] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(initialSoundSetting)
  const [resetViewNonce, setResetViewNonce] = useState(0)
  const [resetProgressNonce, setResetProgressNonce] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [stats, setStats] = useState<CanvasStats>({ filled: 0, total: 0, completedColors: [] })
  const soundEnabledRef = useRef(soundEnabled)
  const artwork = activeArtworkId ? getArtwork(activeArtworkId) : undefined

  soundEnabledRef.current = soundEnabled
  activeArtworkRef.current = artwork ?? null

  const savedProgress = artwork ? progressById[artwork.id] : undefined
  const initialProgress = useMemo<ArtworkProgressSnapshot>(() => savedProgress
    ? { filled: savedProgress.filled, fillOrder: savedProgress.fillOrder }
    : emptyProgress, [artwork?.id, savedProgress?.updatedAt])
  const percent = Math.round((stats.filled / Math.max(1, stats.total)) * 100)
  const completedColors = useMemo(() => new Set(stats.completedColors), [stats.completedColors])
  const selectedColorComplete = completedColors.has(selectedColor)

  const changePhase = (nextPhase: GamePhase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }

  const cancelCompletionTimer = () => {
    if (completionTimerRef.current === null) return
    window.clearTimeout(completionTimerRef.current)
    completionTimerRef.current = null
  }

  const persistPendingSave = () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const pending = pendingSaveRef.current
    pendingSaveRef.current = null
    if (pending) void saveArtworkProgress(pending).catch(() => undefined)
  }

  const recordForSnapshot = (currentArtwork: Artwork, snapshot: ArtworkProgressSnapshot) => {
    const previous = progressRef.current[currentArtwork.id]
    const complete = snapshot.filled.length === totalColorableCells(currentArtwork)
    return {
      artworkId: currentArtwork.id,
      artworkVersion: currentArtwork.version,
      filled: snapshot.filled,
      fillOrder: snapshot.fillOrder,
      updatedAt: Date.now(),
      completedAt: previous?.completedAt ?? (complete ? Date.now() : undefined),
    } satisfies SavedArtworkProgress
  }

  const queueProgressSave = (snapshot: ArtworkProgressSnapshot) => {
    const currentArtwork = activeArtworkRef.current
    if (!currentArtwork) return
    const previous = progressRef.current[currentArtwork.id]
    const record = recordForSnapshot(currentArtwork, snapshot)
    const firstCompletion = Boolean(record.completedAt && !previous?.completedAt)
    earnedThisRunRef.current ||= firstCompletion
    progressRef.current = { ...progressRef.current, [currentArtwork.id]: record }
    pendingSaveRef.current = record
    if (firstCompletion) setProgressById(progressRef.current)
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(persistPendingSave, 180)
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

  const openArtwork = (nextArtwork: Artwork) => {
    const stars = totalEarnedStars(artworks, Object.values(progressRef.current))
    if (!isArtworkUnlocked(nextArtwork, stars)) return
    earnedThisRunRef.current = false
    cancelCompletionTimer()
    setSelectedColor(nextArtwork.palette[0]?.id ?? 1)
    const saved = progressRef.current[nextArtwork.id]
    const savedIsComplete = saved?.filled.length === totalColorableCells(nextArtwork)
    changePhase(savedIsComplete ? 'celebrating' : 'playing')
    setStats({ filled: saved?.filled.length ?? 0, total: totalColorableCells(nextArtwork), completedColors: [] })
    setResetViewNonce((nonce) => nonce + 1)
    setResetProgressNonce((nonce) => nonce + 1)
    setActiveArtworkId(nextArtwork.id)
  }

  const returnToGallery = () => {
    cancelCompletionTimer()
    const currentArtwork = activeArtworkRef.current
    const snapshot = canvasRef.current?.getProgress()
    if (currentArtwork && snapshot) {
      const record = recordForSnapshot(currentArtwork, snapshot)
      progressRef.current = { ...progressRef.current, [currentArtwork.id]: record }
      pendingSaveRef.current = record
    }
    persistPendingSave()
    setProgressById(progressRef.current)
    setActiveArtworkId(null)
    changePhase('playing')
  }

  const handleStartOver = () => {
    const currentArtwork = activeArtworkRef.current
    if (!currentArtwork) return
    cancelCompletionTimer()
    const previous = progressRef.current[currentArtwork.id]
    const resetRecord: SavedArtworkProgress = {
      artworkId: currentArtwork.id,
      artworkVersion: currentArtwork.version,
      filled: [],
      fillOrder: [],
      updatedAt: Date.now(),
      completedAt: previous?.completedAt,
    }
    progressRef.current = { ...progressRef.current, [currentArtwork.id]: resetRecord }
    setProgressById(progressRef.current)
    pendingSaveRef.current = resetRecord
    persistPendingSave()
    earnedThisRunRef.current = false
    changePhase('playing')
    setSelectedColor(currentArtwork.palette[0]?.id ?? 1)
    setResetViewNonce((nonce) => nonce + 1)
    setResetProgressNonce((nonce) => nonce + 1)
  }

  useEffect(() => {
    let cancelled = false
    void loadAllProgress()
      .then((records) => {
        if (cancelled) return
        const valid: Record<string, SavedArtworkProgress> = {}
        records.forEach((record) => {
          const recordArtwork = getArtwork(record.artworkId)
          if (!recordArtwork || record.artworkVersion !== recordArtwork.version) return
          valid[record.artworkId] = record
        })
        progressRef.current = valid
        setProgressById(valid)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    void requestPersistentStorage().catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('arya-color:sound', soundEnabled ? 'on' : 'off')
    } catch {
      // The game still works if private browsing blocks preference storage.
    }
  }, [soundEnabled])

  useEffect(() => {
    const flush = () => persistPendingSave()
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      cancelCompletionTimer()
      persistPendingSave()
    }
  }, [])

  if (!ready) {
    return (
      <main className="app-shell loading-shell">
        <RoseMascot />
        <h1>Arya Color</h1>
        <p>Opening Rose’s picture library…</p>
      </main>
    )
  }

  if (!artwork) {
    return (
      <Gallery
        progressById={progressById}
        soundEnabled={soundEnabled}
        onSoundToggle={handleSoundToggle}
        onOpenArtwork={openArtwork}
      />
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar game-topbar">
        <div className="brand-lockup">
          <button type="button" className="back-button" onClick={returnToGallery} disabled={phase === 'replaying'} aria-label="Back to picture library">‹</button>
          <RoseMascot />
          <div>
            <p className="brand-name">Arya Color</p>
            <p className="brand-subtitle">Picture library</p>
          </div>
        </div>

        <div className="picture-heading">
          <span className="difficulty-pill">{artwork.difficulty} · {artwork.stars} {artwork.stars === 1 ? 'star' : 'stars'}</span>
          <h1>{artwork.title}</h1>
        </div>

        <div className="topbar-actions">
          <div className="progress-copy" aria-label={`${percent}% complete`}>
            <strong>{percent}%</strong>
            <span>{stats.filled} colored</span>
          </div>
          <SoundButton enabled={soundEnabled} onToggle={handleSoundToggle} />
        </div>
      </header>

      <section className="prototype-layout">
        <aside className="guide-panel">
          <div className="prototype-badge">
            <span className="pulse-dot" />
            {artwork.category}
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
              initialProgress={initialProgress}
              onStatsChange={handleStatsChange}
              onCellFilled={handleCellFilled}
              onProgressChange={queueProgressSave}
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
                  <p className="completion-kicker">{artwork.title} complete!</p>
                  <h2 id="completion-title">You colored it!</h2>
                  <div className="completion-stars" aria-label={`${artwork.stars} stars`}>
                    {'★'.repeat(artwork.stars)}
                  </div>
                  <p>{earnedThisRunRef.current ? `You earned ${artwork.stars} ${artwork.stars === 1 ? 'star' : 'stars'}!` : 'Rose saved your masterpiece.'}</p>
                  <div className="completion-actions">
                    <button type="button" className="celebration-primary" onClick={returnToGallery}>
                      Picture library
                    </button>
                    <button type="button" className="celebration-secondary" onClick={() => void runCompletionReplay()}>
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

      <PortraitNotice />
    </main>
  )
}

export default App
