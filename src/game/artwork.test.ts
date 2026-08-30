import { describe, expect, it } from 'vitest'
import { artworks, totalColorableCells } from './artwork'

describe('artwork catalog', () => {
  it('has 15 unique pictures with exactly three starter unlocks', () => {
    expect(artworks).toHaveLength(15)
    expect(new Set(artworks.map(({ id }) => id)).size).toBe(15)
    expect(artworks.filter(({ unlockAt }) => unlockAt === 0)).toHaveLength(3)
  })

  it('keeps food pictures medium sized', () => {
    expect(artworks.filter(({ category }) => category === 'Food').every(({ difficulty }) => difficulty === 'medium')).toBe(true)
  })

  it('uses only declared colors and gives every color something to fill', () => {
    artworks.forEach((artwork) => {
      const paletteIds = new Set(artwork.palette.map(({ id }) => id))
      expect(totalColorableCells(artwork)).toBeGreaterThan(0)
      artwork.cells.forEach((colorId) => expect(colorId === 0 || paletteIds.has(colorId)).toBe(true))
      artwork.palette.forEach(({ id }) => expect(artwork.cells, `${artwork.title} color ${id}`).toContain(id))
    })
  })
})
