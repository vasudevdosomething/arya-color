import { describe, expect, it } from 'vitest'
import { cellsOnLine, screenToCell } from './geometry'

describe('canvas geometry', () => {
  it('maps screen points through the current view transform', () => {
    expect(
      screenToCell(
        { x: 125, y: 85 },
        { scale: 20, offsetX: 25, offsetY: 5 },
        24,
        24,
      ),
    ).toEqual({ col: 5, row: 4 })
  })

  it('interpolates every cell along a fast stroke', () => {
    expect(cellsOnLine({ col: 2, row: 2 }, { col: 7, row: 2 })).toEqual([
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
      { col: 5, row: 2 },
      { col: 6, row: 2 },
      { col: 7, row: 2 },
    ])
  })
})
