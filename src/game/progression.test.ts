import { describe, expect, it } from 'vitest'
import type { Artwork } from './artwork'
import { isArtworkUnlocked, nextUnlockAt, totalEarnedStars } from './progression'

const artwork = (id: string, stars: 1 | 2 | 3, unlockAt: number) => ({
  id, stars, unlockAt,
} as Artwork)

const catalog = [artwork('heart', 1, 0), artwork('cake', 2, 0), artwork('moon', 1, 2)]

describe('progression', () => {
  it('awards a picture only once', () => {
    expect(totalEarnedStars(catalog, [
      { artworkId: 'cake', completedAt: 10 },
      { artworkId: 'cake', completedAt: 20 },
    ])).toBe(2)
  })

  it('uses permanent milestone thresholds', () => {
    expect(isArtworkUnlocked(catalog[2], 1)).toBe(false)
    expect(isArtworkUnlocked(catalog[2], 2)).toBe(true)
    expect(nextUnlockAt(catalog, 0)).toBe(2)
    expect(nextUnlockAt(catalog, 2)).toBeNull()
  })
})
