import { useEffect, useRef } from 'react'
import type { Artwork } from '../game/artwork'

interface ArtworkPreviewProps {
  artwork: Artwork
}

export function ArtworkPreview({ artwork }: ArtworkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pixelSize = 5
    canvas.width = artwork.width * pixelSize * dpr
    canvas.height = artwork.height * pixelSize * dpr
    context.scale(dpr, dpr)
    const palette = new Map(artwork.palette.map((color) => [color.id, color.color]))
    context.imageSmoothingEnabled = false
    artwork.cells.forEach((colorId, index) => {
      if (colorId === 0) return
      context.fillStyle = palette.get(colorId) ?? '#ffffff'
      context.fillRect(
        (index % artwork.width) * pixelSize,
        Math.floor(index / artwork.width) * pixelSize,
        pixelSize,
        pixelSize,
      )
    })
  }, [artwork])

  return <canvas ref={canvasRef} className="artwork-preview" aria-hidden="true" />
}
