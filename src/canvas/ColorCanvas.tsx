import {
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Artwork } from '../game/artwork'
import { canFillCell, getColorProgress } from '../game/rules'
import {
  cellsOnLine,
  clamp,
  screenToCell,
  screenToWorld,
  type CellPoint,
  type Point,
  type ViewTransform,
} from './geometry'

export interface CanvasStats {
  filled: number
  total: number
  completedColors: number[]
}

interface ColorCanvasProps {
  artwork: Artwork
  selectedColor: number
  resetViewNonce: number
  resetProgressNonce: number
  onStatsChange: (stats: CanvasStats) => void
}

interface ActivePointer extends Point {
  id: number
  type: string
}

interface TransformGesture {
  startDistance: number
  startScale: number
  anchorWorld: Point
}

type GestureMode = 'idle' | 'pending-touch' | 'painting' | 'transforming' | 'blocked'

const TOUCH_DECISION_DELAY_MS = 80

function pointerDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function pointerCenter(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function ColorCanvas({
  artwork,
  selectedColor,
  resetViewNonce,
  resetProgressNonce,
  onStatsChange,
}: ColorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const filledRef = useRef<Set<number>>(new Set())
  const selectedColorRef = useRef(selectedColor)
  const onStatsChangeRef = useRef(onStatsChange)
  const viewRef = useRef<ViewTransform>({ scale: 20, offsetX: 0, offsetY: 0 })
  const fitScaleRef = useRef(20)
  const canvasSizeRef = useRef({ width: 0, height: 0 })
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map())
  const ignoredPointersRef = useRef<Set<number>>(new Set())
  const modeRef = useRef<GestureMode>('idle')
  const paintPointerRef = useRef<number | null>(null)
  const lastPaintCellRef = useRef<CellPoint | null>(null)
  const pendingTimerRef = useRef<number | null>(null)
  const transformRef = useRef<TransformGesture | null>(null)
  const strokeAddedRef = useRef<number[]>([])
  const loupePointRef = useRef<Point | null>(null)
  const drawRef = useRef<() => void>(() => undefined)
  const frameRef = useRef<number | null>(null)

  selectedColorRef.current = selectedColor
  onStatsChangeRef.current = onStatsChange

  const invalidate = () => {
    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      drawRef.current()
    })
  }

  const reportStats = () => {
    const progress = getColorProgress(artwork, filledRef.current)
    onStatsChangeRef.current({
      filled: filledRef.current.size,
      total: artwork.cells.filter((color) => color !== 0).length,
      completedColors: progress.filter((color) => color.complete).map((color) => color.colorId),
    })
  }

  const fitBoard = () => {
    const { width, height } = canvasSizeRef.current
    if (width === 0 || height === 0) return
    const availableWidth = Math.max(120, width - 88)
    const availableHeight = Math.max(120, height - 72)
    const scale = Math.min(34, availableWidth / artwork.width, availableHeight / artwork.height)
    fitScaleRef.current = scale
    viewRef.current = {
      scale,
      offsetX: (width - artwork.width * scale) / 2,
      offsetY: (height - artwork.height * scale) / 2,
    }
    invalidate()
  }

  const constrainView = (candidate: ViewTransform): ViewTransform => {
    const { width, height } = canvasSizeRef.current
    const visibleMargin = 72
    const boardWidth = artwork.width * candidate.scale
    const boardHeight = artwork.height * candidate.scale
    return {
      scale: candidate.scale,
      offsetX: clamp(candidate.offsetX, visibleMargin - boardWidth, width - visibleMargin),
      offsetY: clamp(candidate.offsetY, visibleMargin - boardHeight, height - visibleMargin),
    }
  }

  const drawCells = (
    context: CanvasRenderingContext2D,
    view: ViewTransform,
    emphasizeSelection: boolean,
  ) => {
    const palette = new Map(artwork.palette.map((color) => [color.id, color]))
    const numberSize = clamp(view.scale * 0.38, 9, 19)
    const showNumbers = view.scale >= 13

    artwork.cells.forEach((requiredColor, index) => {
      if (requiredColor === 0) return
      const row = Math.floor(index / artwork.width)
      const col = index % artwork.width
      const x = view.offsetX + col * view.scale
      const y = view.offsetY + row * view.scale
      const color = palette.get(requiredColor)
      if (!color) return
      const filled = filledRef.current.has(index)

      context.fillStyle = filled
        ? color.color
        : emphasizeSelection && requiredColor === selectedColorRef.current
          ? color.softColor
          : '#fffdfd'
      context.fillRect(x, y, view.scale, view.scale)
      context.strokeStyle = filled ? 'rgba(78, 57, 79, 0.16)' : 'rgba(112, 89, 112, 0.24)'
      context.lineWidth = clamp(view.scale * 0.035, 0.7, 1.25)
      context.strokeRect(x, y, view.scale, view.scale)

      if (!filled && showNumbers) {
        context.fillStyle = requiredColor === selectedColorRef.current ? '#513d52' : '#8c7a8d'
        context.font = `700 ${numberSize}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(String(requiredColor), x + view.scale / 2, y + view.scale / 2 + 0.5)
      }
    })
  }

  drawRef.current = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const { width, height } = canvasSizeRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)

    const view = viewRef.current
    const boardX = view.offsetX - 12
    const boardY = view.offsetY - 12
    const boardWidth = artwork.width * view.scale + 24
    const boardHeight = artwork.height * view.scale + 24
    context.save()
    context.shadowColor = 'rgba(74, 51, 77, 0.12)'
    context.shadowBlur = 24
    context.shadowOffsetY = 10
    context.fillStyle = '#ffffff'
    context.fillRect(boardX, boardY, boardWidth, boardHeight)
    context.restore()
    drawCells(context, view, true)

    const contact = loupePointRef.current
    if (!contact) return
    const radius = 58
    const loupeX = clamp(contact.x, radius + 12, width - radius - 12)
    const preferredY = contact.y - 98
    const loupeY = preferredY - radius < 8 ? contact.y + 98 : preferredY
    const world = screenToWorld(contact, view)
    const loupeScale = clamp(Math.max(34, view.scale * 1.65), 34, 58)
    const loupeView: ViewTransform = {
      scale: loupeScale,
      offsetX: loupeX - world.x * loupeScale,
      offsetY: loupeY - world.y * loupeScale,
    }

    context.save()
    context.shadowColor = 'rgba(65, 42, 68, 0.24)'
    context.shadowBlur = 18
    context.shadowOffsetY = 6
    context.beginPath()
    context.arc(loupeX, loupeY, radius + 3, 0, Math.PI * 2)
    context.fillStyle = '#ffffff'
    context.fill()
    context.restore()

    context.save()
    context.beginPath()
    context.arc(loupeX, loupeY, radius, 0, Math.PI * 2)
    context.clip()
    context.fillStyle = '#fff9fb'
    context.fillRect(loupeX - radius, loupeY - radius, radius * 2, radius * 2)
    drawCells(context, loupeView, true)
    context.restore()

    context.beginPath()
    context.arc(loupeX, loupeY, radius + 1, 0, Math.PI * 2)
    context.strokeStyle = '#ff7f9f'
    context.lineWidth = 4
    context.stroke()
    context.beginPath()
    context.arc(loupeX, loupeY, 4, 0, Math.PI * 2)
    context.fillStyle = '#ff7f9f'
    context.fill()
  }

  const clearPendingTimer = () => {
    if (pendingTimerRef.current === null) return
    window.clearTimeout(pendingTimerRef.current)
    pendingTimerRef.current = null
  }

  const pointForEvent = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }

  const fillAtPoint = (point: Point) => {
    const cell = screenToCell(point, viewRef.current, artwork.width, artwork.height)
    loupePointRef.current = point
    if (!cell) {
      lastPaintCellRef.current = null
      invalidate()
      return
    }

    const path = lastPaintCellRef.current ? cellsOnLine(lastPaintCellRef.current, cell) : [cell]
    let changed = false
    path.forEach(({ col, row }) => {
      const index = row * artwork.width + col
      if (!canFillCell(artwork, index, selectedColorRef.current, filledRef.current)) return
      filledRef.current.add(index)
      strokeAddedRef.current.push(index)
      changed = true
    })
    lastPaintCellRef.current = cell
    if (changed) reportStats()
    invalidate()
  }

  const beginPainting = (pointerId: number) => {
    const pointer = activePointersRef.current.get(pointerId)
    if (!pointer) return
    clearPendingTimer()
    modeRef.current = 'painting'
    paintPointerRef.current = pointerId
    lastPaintCellRef.current = null
    strokeAddedRef.current = []
    fillAtPoint(pointer)
  }

  const rollbackActiveStroke = () => {
    if (strokeAddedRef.current.length === 0) return
    strokeAddedRef.current.forEach((index) => filledRef.current.delete(index))
    strokeAddedRef.current = []
    reportStats()
  }

  const touchPointers = (): ActivePointer[] =>
    [...activePointersRef.current.values()].filter((pointer) => pointer.type === 'touch')

  const startTransform = () => {
    const touches = touchPointers()
    if (touches.length < 2) return
    clearPendingTimer()
    if (modeRef.current === 'painting') rollbackActiveStroke()
    loupePointRef.current = null
    lastPaintCellRef.current = null
    paintPointerRef.current = null
    const center = pointerCenter(touches[0], touches[1])
    transformRef.current = {
      startDistance: Math.max(1, pointerDistance(touches[0], touches[1])),
      startScale: viewRef.current.scale,
      anchorWorld: screenToWorld(center, viewRef.current),
    }
    modeRef.current = 'transforming'
    invalidate()
  }

  const updateTransform = () => {
    const touches = touchPointers()
    const transform = transformRef.current
    if (touches.length < 2 || !transform) return
    const center = pointerCenter(touches[0], touches[1])
    const distance = Math.max(1, pointerDistance(touches[0], touches[1]))
    const scale = clamp(
      transform.startScale * (distance / transform.startDistance),
      fitScaleRef.current * 0.9,
      fitScaleRef.current * 5.5,
    )
    viewRef.current = constrainView({
      scale,
      offsetX: center.x - transform.anchorWorld.x * scale,
      offsetY: center.y - transform.anchorWorld.y * scale,
    })
    invalidate()
  }

  const finishPointer = (event: ReactPointerEvent<HTMLCanvasElement>, cancelled: boolean) => {
    event.preventDefault()
    if (ignoredPointersRef.current.delete(event.pointerId)) return
    const point = pointForEvent(event)
    const pointer = activePointersRef.current.get(event.pointerId)
    if (pointer) {
      pointer.x = point.x
      pointer.y = point.y
    }

    if (!cancelled && modeRef.current === 'pending-touch' && paintPointerRef.current === event.pointerId) {
      beginPainting(event.pointerId)
    }
    if (!cancelled && modeRef.current === 'painting' && paintPointerRef.current === event.pointerId) {
      fillAtPoint(point)
    }

    activePointersRef.current.delete(event.pointerId)
    clearPendingTimer()
    loupePointRef.current = null
    lastPaintCellRef.current = null
    strokeAddedRef.current = []

    if (modeRef.current === 'transforming' && touchPointers().length > 0) {
      modeRef.current = 'blocked'
    } else if (touchPointers().length === 0) {
      modeRef.current = 'idle'
    }
    if (paintPointerRef.current === event.pointerId) paintPointerRef.current = null
    transformRef.current = null
    invalidate()
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = pointForEvent(event)

    const penIsActive = [...activePointersRef.current.values()].some(
      (pointer) => pointer.type === 'pen',
    )
    if (event.pointerType === 'touch' && penIsActive) {
      ignoredPointersRef.current.add(event.pointerId)
      return
    }

    activePointersRef.current.set(event.pointerId, {
      id: event.pointerId,
      type: event.pointerType || 'mouse',
      ...point,
    })

    if (event.pointerType === 'touch') {
      if (touchPointers().length >= 2) {
        startTransform()
        return
      }
      modeRef.current = 'pending-touch'
      paintPointerRef.current = event.pointerId
      pendingTimerRef.current = window.setTimeout(
        () => beginPainting(event.pointerId),
        TOUCH_DECISION_DELAY_MS,
      )
      return
    }

    beginPainting(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (ignoredPointersRef.current.has(event.pointerId)) return
    const pointer = activePointersRef.current.get(event.pointerId)
    if (!pointer) return
    const point = pointForEvent(event)
    pointer.x = point.x
    pointer.y = point.y

    if (modeRef.current === 'transforming') {
      updateTransform()
    } else if (modeRef.current === 'painting' && paintPointerRef.current === event.pointerId) {
      fillAtPoint(point)
    }
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      canvasSizeRef.current = { width: bounds.width, height: bounds.height }
      canvas.width = Math.max(1, Math.round(bounds.width * dpr))
      canvas.height = Math.max(1, Math.round(bounds.height * dpr))
      fitBoard()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    return () => observer.disconnect()
  }, [artwork])

  useEffect(() => {
    fitBoard()
  }, [resetViewNonce])

  useEffect(() => {
    filledRef.current.clear()
    strokeAddedRef.current = []
    reportStats()
    invalidate()
  }, [resetProgressNonce, artwork])

  useEffect(() => {
    invalidate()
  }, [selectedColor])

  useEffect(
    () => () => {
      clearPendingTimer()
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    },
    [],
  )

  return (
    <canvas
      ref={canvasRef}
      className="color-canvas"
      aria-label={`Color the ${artwork.title} picture. One finger or Pencil paints; two fingers move and zoom.`}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishPointer(event, false)}
      onPointerCancel={(event) => finishPointer(event, true)}
    />
  )
}

