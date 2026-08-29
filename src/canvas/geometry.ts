export interface Point {
  x: number
  y: number
}

export interface ViewTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface CellPoint {
  col: number
  row: number
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function screenToWorld(point: Point, view: ViewTransform): Point {
  return {
    x: (point.x - view.offsetX) / view.scale,
    y: (point.y - view.offsetY) / view.scale,
  }
}

export function screenToCell(
  point: Point,
  view: ViewTransform,
  width: number,
  height: number,
): CellPoint | null {
  const world = screenToWorld(point, view)
  const col = Math.floor(world.x)
  const row = Math.floor(world.y)
  if (col < 0 || row < 0 || col >= width || row >= height) return null
  return { col, row }
}

export function cellsOnLine(start: CellPoint, end: CellPoint): CellPoint[] {
  const cells: CellPoint[] = []
  let x = start.col
  let y = start.row
  const dx = Math.abs(end.col - start.col)
  const dy = Math.abs(end.row - start.row)
  const stepX = start.col < end.col ? 1 : -1
  const stepY = start.row < end.row ? 1 : -1
  let error = dx - dy

  while (true) {
    cells.push({ col: x, row: y })
    if (x === end.col && y === end.row) break
    const doubled = error * 2
    if (doubled > -dy) {
      error -= dy
      x += stepX
    }
    if (doubled < dx) {
      error += dx
      y += stepY
    }
  }

  return cells
}

