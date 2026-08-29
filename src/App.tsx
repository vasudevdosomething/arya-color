import { useMemo, useState } from 'react'
import { ColorCanvas, type CanvasStats } from './canvas/ColorCanvas'
import { cupcakeArtwork, totalColorableCells } from './game/artwork'

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

function App() {
  const artwork = cupcakeArtwork
  const total = totalColorableCells(artwork)
  const [selectedColor, setSelectedColor] = useState(2)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [resetViewNonce, setResetViewNonce] = useState(0)
  const [resetProgressNonce, setResetProgressNonce] = useState(0)
  const [stats, setStats] = useState<CanvasStats>({ filled: 0, total, completedColors: [] })

  const percent = Math.round((stats.filled / Math.max(1, stats.total)) * 100)
  const completedColors = useMemo(() => new Set(stats.completedColors), [stats.completedColors])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <RoseMascot />
          <div>
            <p className="brand-name">Arya Color</p>
            <p className="brand-subtitle">Pencil &amp; touch prototype</p>
          </div>
        </div>

        <div className="picture-heading">
          <span className="difficulty-pill">Medium</span>
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
            onClick={() => setSoundEnabled((enabled) => !enabled)}
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
            Interaction test
          </div>
          <div className="guide-copy">
            <p className="eyebrow">Try it on the iPad</p>
            <h2>Color, move, zoom.</h2>
            <p>Use the selected number and test each kind of gesture.</p>
          </div>

          <div className="gesture-list">
            <div className="gesture-card">
              <span className="gesture-icon pencil-icon">✎</span>
              <div><strong>Pencil or one finger</strong><span>Tap or drag to color</span></div>
            </div>
            <div className="gesture-card">
              <span className="gesture-icon fingers-icon">••</span>
              <div><strong>Two fingers</strong><span>Move and pinch-zoom</span></div>
            </div>
            <div className="gesture-card">
              <span className="gesture-icon loupe-icon">⌕</span>
              <div><strong>Hold and color</strong><span>See the magnifying bubble</span></div>
            </div>
          </div>

          <div className="guide-actions">
            <button type="button" className="secondary-button" onClick={() => setResetViewNonce((n) => n + 1)}>
              Center picture
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setResetProgressNonce((n) => n + 1)}
            >
              Clear test colors
            </button>
          </div>
        </aside>

        <section className="play-area" aria-label="Coloring area">
          <div className="canvas-card">
            <ColorCanvas
              artwork={artwork}
              selectedColor={selectedColor}
              resetViewNonce={resetViewNonce}
              resetProgressNonce={resetProgressNonce}
              onStatsChange={setStats}
            />
            <div className="canvas-tip" aria-hidden="true">
              Wrong numbers stay blank
            </div>
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
                    style={{ '--swatch-color': color.color } as React.CSSProperties}
                    aria-label={`${color.name}, color ${color.id}${complete ? ', complete' : ''}`}
                    aria-pressed={selected}
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

