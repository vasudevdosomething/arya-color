export type Difficulty = 'small' | 'medium' | 'large'

export interface PaletteColor {
  id: number
  name: string
  color: string
  softColor: string
}

export interface Artwork {
  id: string
  title: string
  difficulty: Difficulty
  width: number
  height: number
  cells: number[]
  palette: PaletteColor[]
}

const width = 24
const height = 24

function createCupcakeCells(): number[] {
  const cells = new Array<number>(width * height).fill(0)
  const set = (x: number, y: number, color: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      cells[y * width + x] = color
    }
  }

  // Cherry and stem.
  set(13, 0, 6)
  set(12, 1, 6)
  for (let y = 2; y <= 5; y += 1) {
    for (let x = 9; x <= 14; x += 1) {
      const dx = (x - 11.5) / 3
      const dy = (y - 3.5) / 2.2
      if (dx * dx + dy * dy <= 1) set(x, y, 1)
    }
  }

  // Soft, rounded frosting.
  const frostingWidths = [3, 5, 7, 8, 9, 9, 8, 8]
  for (let row = 0; row < frostingWidths.length; row += 1) {
    const y = 5 + row
    const half = frostingWidths[row]
    for (let x = 12 - half; x <= 11 + half; x += 1) set(x, y, 2)
  }

  // Frosting highlights and sprinkles.
  ;[
    [8, 7], [9, 7], [7, 8], [8, 8], [9, 8], [15, 9], [16, 9], [14, 10], [15, 10],
  ].forEach(([x, y]) => set(x, y, 3))
  ;[
    [11, 6], [14, 7], [6, 9], [11, 9], [18, 10], [9, 11], [13, 11], [16, 12],
  ].forEach(([x, y]) => set(x, y, 4))

  // Teal cupcake wrapper, slightly tapered toward the bottom.
  for (let y = 13; y <= 21; y += 1) {
    const inset = Math.floor((y - 13) / 3)
    for (let x = 4 + inset; x <= 19 - inset; x += 1) {
      const stripe = (x + y) % 5 === 0 || (x - y + 30) % 6 === 0
      set(x, y, stripe ? 6 : 5)
    }
  }
  for (let x = 7; x <= 16; x += 1) set(x, 22, 6)

  return cells
}

export const cupcakeArtwork: Artwork = {
  id: 'sprinkle-cupcake-prototype',
  title: 'Sprinkle Cupcake',
  difficulty: 'medium',
  width,
  height,
  cells: createCupcakeCells(),
  palette: [
    { id: 1, name: 'Cherry', color: '#ef476f', softColor: '#ffe1e9' },
    { id: 2, name: 'Frosting', color: '#ff8fb1', softColor: '#ffe4ee' },
    { id: 3, name: 'Highlight', color: '#ffd2df', softColor: '#fff0f5' },
    { id: 4, name: 'Sprinkle', color: '#ffd166', softColor: '#fff2c9' },
    { id: 5, name: 'Wrapper', color: '#41c7b5', softColor: '#d9f7f2' },
    { id: 6, name: 'Shadow', color: '#287f86', softColor: '#d7eff1' },
  ],
}

export function totalColorableCells(artwork: Artwork): number {
  return artwork.cells.reduce((total, color) => total + (color === 0 ? 0 : 1), 0)
}

