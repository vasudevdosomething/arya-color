import type { Artwork } from './artwork'

export function canFillCell(
  artwork: Artwork,
  cellIndex: number,
  selectedColor: number,
  filled: ReadonlySet<number>,
): boolean {
  return (
    cellIndex >= 0 &&
    cellIndex < artwork.cells.length &&
    artwork.cells[cellIndex] === selectedColor &&
    !filled.has(cellIndex)
  )
}

export function findHintCell(
  artwork: Artwork,
  selectedColor: number,
  filled: ReadonlySet<number>,
): number | null {
  const index = artwork.cells.findIndex(
    (requiredColor, cellIndex) => requiredColor === selectedColor && !filled.has(cellIndex),
  )
  return index === -1 ? null : index
}

export interface ColorProgress {
  colorId: number
  filled: number
  total: number
  complete: boolean
}

export function getColorProgress(artwork: Artwork, filled: ReadonlySet<number>): ColorProgress[] {
  return artwork.palette.map(({ id }) => {
    let total = 0
    let completed = 0
    artwork.cells.forEach((color, index) => {
      if (color !== id) return
      total += 1
      if (filled.has(index)) completed += 1
    })
    return { colorId: id, filled: completed, total, complete: total > 0 && completed === total }
  })
}
