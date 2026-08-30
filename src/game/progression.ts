import type { Artwork } from './artwork'

export interface CompletionLike {
  artworkId: string
  completedAt?: number
}

export function completedArtworkIds(progress: Iterable<CompletionLike>): Set<string> {
  return new Set([...progress].filter((item) => item.completedAt).map((item) => item.artworkId))
}

export function totalEarnedStars(artworks: Artwork[], progress: Iterable<CompletionLike>): number {
  const completed = completedArtworkIds(progress)
  return artworks.reduce((total, artwork) => total + (completed.has(artwork.id) ? artwork.stars : 0), 0)
}

export function isArtworkUnlocked(artwork: Artwork, stars: number): boolean {
  return stars >= artwork.unlockAt
}

export function nextUnlockAt(artworks: Artwork[], stars: number): number | null {
  const next = artworks
    .map(({ unlockAt }) => unlockAt)
    .filter((unlockAt) => unlockAt > stars)
    .sort((a, b) => a - b)[0]
  return next ?? null
}
