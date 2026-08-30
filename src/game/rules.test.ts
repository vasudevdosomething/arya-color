import { describe, expect, it } from 'vitest'
import { cupcakeArtwork } from './artwork'
import { canFillCell, findHintCell, getColorProgress } from './rules'

describe('coloring rules', () => {
  it('accepts only the selected matching color', () => {
    const index = cupcakeArtwork.cells.findIndex((color) => color === 2)
    expect(canFillCell(cupcakeArtwork, index, 2, new Set())).toBe(true)
    expect(canFillCell(cupcakeArtwork, index, 1, new Set())).toBe(false)
  })

  it('does not refill an already completed cell', () => {
    const index = cupcakeArtwork.cells.findIndex((color) => color === 2)
    expect(canFillCell(cupcakeArtwork, index, 2, new Set([index]))).toBe(false)
  })

  it('marks a color complete when every matching cell is filled', () => {
    const cherryCells = cupcakeArtwork.cells
      .map((color, index) => (color === 1 ? index : -1))
      .filter((index) => index >= 0)
    const cherry = getColorProgress(cupcakeArtwork, new Set(cherryCells)).find(
      (progress) => progress.colorId === 1,
    )
    expect(cherry?.complete).toBe(true)
  })

  it('finds an unfinished matching square for an unlimited hint', () => {
    const firstFrosting = cupcakeArtwork.cells.findIndex((color) => color === 2)
    const nextFrosting = findHintCell(cupcakeArtwork, 2, new Set([firstFrosting]))
    expect(nextFrosting).not.toBeNull()
    expect(cupcakeArtwork.cells[nextFrosting!]).toBe(2)
  })

  it('returns no hint when the selected color is complete', () => {
    const allCherry = new Set(
      cupcakeArtwork.cells
        .map((color, index) => (color === 1 ? index : -1))
        .filter((index) => index >= 0),
    )
    expect(findHintCell(cupcakeArtwork, 1, allCherry)).toBeNull()
  })
})
