export type Difficulty = 'small' | 'medium' | 'large'
export type ArtworkCategory = 'Food' | 'Sweet shapes' | 'Tropical' | 'Holiday' | 'Landscapes'

export interface PaletteColor {
  id: number
  name: string
  color: string
  softColor: string
}

export interface Artwork {
  id: string
  version: number
  title: string
  category: ArtworkCategory
  difficulty: Difficulty
  stars: 1 | 2 | 3
  unlockAt: number
  width: number
  height: number
  cells: number[]
  palette: PaletteColor[]
}

interface ArtworkDetails extends Omit<Artwork, 'version' | 'cells'> {
  draw: (grid: PixelGrid) => void
}

class PixelGrid {
  readonly cells: number[]

  constructor(readonly width: number, readonly height: number) {
    this.cells = new Array<number>(width * height).fill(0)
  }

  set(x: number, y: number, color: number) {
    const col = Math.round(x)
    const row = Math.round(y)
    if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
      this.cells[row * this.width + col] = color
    }
  }

  rect(left: number, top: number, right: number, bottom: number, color: number) {
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) this.set(x, y, color)
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: number) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x - cx) / rx
        const dy = (y - cy) / ry
        if (dx * dx + dy * dy <= 1) this.set(x, y, color)
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, color: number, thickness = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let step = 0; step <= steps; step += 1) {
      const x = Math.round(x0 + ((x1 - x0) * step) / steps)
      const y = Math.round(y0 + ((y1 - y0) * step) / steps)
      for (let oy = -Math.floor(thickness / 2); oy <= Math.floor(thickness / 2); oy += 1) {
        for (let ox = -Math.floor(thickness / 2); ox <= Math.floor(thickness / 2); ox += 1) {
          this.set(x + ox, y + oy, color)
        }
      }
    }
  }
}

function makeArtwork(details: ArtworkDetails): Artwork {
  const grid = new PixelGrid(details.width, details.height)
  details.draw(grid)
  const { draw: _draw, ...artwork } = details
  return { ...artwork, version: 1, cells: grid.cells }
}

const heart = makeArtwork({
  id: 'happy-heart', title: 'Happy Heart', category: 'Sweet shapes', difficulty: 'small',
  stars: 1, unlockAt: 0, width: 16, height: 16,
  palette: [
    { id: 1, name: 'Rose', color: '#f04479', softColor: '#ffe0ea' },
    { id: 2, name: 'Pink', color: '#ff83a7', softColor: '#ffe6ee' },
    { id: 3, name: 'Shine', color: '#ffd1dd', softColor: '#fff0f4' },
    { id: 4, name: 'Smile', color: '#713d5b', softColor: '#eadce5' },
  ],
  draw: (g) => {
    for (let y = 2; y <= 13; y += 1) {
      for (let x = 1; x <= 14; x += 1) {
        const top = (x - 4.5) ** 2 + (y - 4.5) ** 2 <= 13 || (x - 10.5) ** 2 + (y - 4.5) ** 2 <= 13
        const bottom = y >= 4 && Math.abs(x - 7.5) <= 8 - (y - 4) * 0.82
        if (top || bottom) g.set(x, y, y > 10 || x < 3 || x > 12 ? 1 : 2)
      }
    }
    g.rect(4, 4, 5, 5, 3)
    g.set(5, 8, 4); g.set(10, 8, 4); g.line(6, 10, 9, 10, 4)
  },
})

const palm = makeArtwork({
  id: 'sunny-palm', title: 'Sunny Palm', category: 'Tropical', difficulty: 'medium',
  stars: 2, unlockAt: 0, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Sun', color: '#ffc94a', softColor: '#fff1c3' },
    { id: 2, name: 'Leaf', color: '#2eb67d', softColor: '#d8f4e8' },
    { id: 3, name: 'Leaf shade', color: '#18745c', softColor: '#d6ebe5' },
    { id: 4, name: 'Trunk', color: '#a8663f', softColor: '#eedfd6' },
    { id: 5, name: 'Sand', color: '#efb95c', softColor: '#faeccf' },
    { id: 6, name: 'Water', color: '#43b8cf', softColor: '#d9f1f6' },
  ],
  draw: (g) => {
    g.ellipse(4, 4, 3, 3, 1)
    g.rect(1, 19, 22, 21, 6); g.rect(4, 18, 19, 20, 5)
    g.line(12, 18, 14, 7, 4, 3)
    g.line(14, 7, 5, 5, 2, 2); g.line(14, 7, 8, 2, 3, 2)
    g.line(14, 7, 14, 1, 2, 2); g.line(14, 7, 20, 2, 3, 2); g.line(14, 7, 22, 7, 2, 2)
    g.line(14, 7, 19, 11, 3, 2); g.set(12, 7, 3); g.set(15, 7, 3)
  },
})

const cupcake = makeArtwork({
  id: 'sprinkle-cupcake', title: 'Sprinkle Cupcake', category: 'Food', difficulty: 'medium',
  stars: 2, unlockAt: 0, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Cherry', color: '#ef476f', softColor: '#ffe1e9' },
    { id: 2, name: 'Frosting', color: '#ff8fb1', softColor: '#ffe4ee' },
    { id: 3, name: 'Highlight', color: '#ffd2df', softColor: '#fff0f5' },
    { id: 4, name: 'Sprinkle', color: '#ffd166', softColor: '#fff2c9' },
    { id: 5, name: 'Wrapper', color: '#41c7b5', softColor: '#d9f7f2' },
    { id: 6, name: 'Shadow', color: '#287f86', softColor: '#d7eff1' },
  ],
  draw: (g) => {
    g.set(13, 0, 6); g.set(12, 1, 6); g.ellipse(11.5, 3.5, 3, 2.2, 1)
    const widths = [3, 5, 7, 8, 9, 9, 8, 8]
    widths.forEach((half, row) => g.rect(12 - half, 5 + row, 11 + half, 5 + row, 2))
    ;[[8, 7], [9, 7], [7, 8], [8, 8], [15, 9], [16, 9], [14, 10], [15, 10]].forEach(([x, y]) => g.set(x, y, 3))
    ;[[11, 6], [14, 7], [6, 9], [11, 9], [18, 10], [9, 11], [13, 11], [16, 12]].forEach(([x, y]) => g.set(x, y, 4))
    for (let y = 13; y <= 21; y += 1) {
      const inset = Math.floor((y - 13) / 3)
      for (let x = 4 + inset; x <= 19 - inset; x += 1) g.set(x, y, (x + y) % 5 === 0 ? 6 : 5)
    }
    g.rect(7, 22, 16, 22, 6)
  },
})

const moon = makeArtwork({
  id: 'moon-and-stars', title: 'Moon & Stars', category: 'Sweet shapes', difficulty: 'small',
  stars: 1, unlockAt: 2, width: 18, height: 18,
  palette: [
    { id: 1, name: 'Moon', color: '#ffd45e', softColor: '#fff2c8' },
    { id: 2, name: 'Moonlight', color: '#fff0a3', softColor: '#fff8dc' },
    { id: 3, name: 'Star', color: '#f6a83b', softColor: '#faecd4' },
    { id: 4, name: 'Night', color: '#7167b8', softColor: '#e4e1f5' },
  ],
  draw: (g) => {
    g.ellipse(8, 9, 6, 7, 1); g.ellipse(11, 7, 4.5, 5.5, 0)
    g.ellipse(5, 6, 1.5, 1.2, 2); g.ellipse(7, 12, 1.8, 1.3, 2)
    ;[[14, 2], [15, 10], [12, 15], [2, 3]].forEach(([x, y], index) => {
      g.set(x, y, index % 2 ? 3 : 4); g.set(x - 1, y, 3); g.set(x + 1, y, 3); g.set(x, y - 1, 3); g.set(x, y + 1, 3)
    })
  },
})

const watermelon = makeArtwork({
  id: 'juicy-watermelon', title: 'Juicy Watermelon', category: 'Food', difficulty: 'medium',
  stars: 2, unlockAt: 3, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Melon', color: '#f05270', softColor: '#fbdde3' },
    { id: 2, name: 'Rind', color: '#45b96d', softColor: '#d9f2e1' },
    { id: 3, name: 'Rind shade', color: '#19845b', softColor: '#d8ebe4' },
    { id: 4, name: 'Seed', color: '#5d3b4a', softColor: '#e3d9dd' },
    { id: 5, name: 'Juice', color: '#ff91a5', softColor: '#ffe5ea' },
  ],
  draw: (g) => {
    for (let y = 7; y <= 19; y += 1) {
      for (let x = 2; x <= 21; x += 1) {
        const dx = (x - 11.5) / 10
        const dy = (y - 7) / 13
        if (dx * dx + dy * dy <= 1) g.set(x, y, y >= 17 ? 3 : y >= 15 ? 2 : 1)
      }
    }
    g.rect(4, 7, 19, 8, 5)
    ;[[7, 11], [11, 10], [15, 12], [9, 14], [17, 9]].forEach(([x, y]) => g.set(x, y, 4))
  },
})

const iceCream = makeArtwork({
  id: 'triple-scoop', title: 'Triple Scoop', category: 'Food', difficulty: 'medium',
  stars: 2, unlockAt: 5, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Strawberry', color: '#ff7d9f', softColor: '#ffe3eb' },
    { id: 2, name: 'Vanilla', color: '#ffe7a3', softColor: '#fff5d8' },
    { id: 3, name: 'Mint', color: '#62cbb4', softColor: '#ddf5ef' },
    { id: 4, name: 'Cone', color: '#d9934d', softColor: '#f5e4d2' },
    { id: 5, name: 'Crunch', color: '#9c5b3f', softColor: '#eaded8' },
  ],
  draw: (g) => {
    g.ellipse(8, 7, 5, 5, 1); g.ellipse(15, 7, 5, 5, 3); g.ellipse(11.5, 4, 5, 4, 2)
    for (let y = 11; y <= 22; y += 1) {
      const half = Math.max(1, Math.round((22 - y) * 0.55))
      g.rect(12 - half, y, 11 + half, y, 4)
    }
    g.line(7, 12, 13, 21, 5); g.line(16, 12, 10, 21, 5)
  },
})

const hibiscus = makeArtwork({
  id: 'hibiscus-bloom', title: 'Hibiscus Bloom', category: 'Tropical', difficulty: 'medium',
  stars: 2, unlockAt: 7, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Petal', color: '#f35f91', softColor: '#fce0e9' },
    { id: 2, name: 'Petal light', color: '#ff9db4', softColor: '#ffe9ee' },
    { id: 3, name: 'Center', color: '#f7c548', softColor: '#fbf0cb' },
    { id: 4, name: 'Leaf', color: '#3eaa72', softColor: '#daeee3' },
    { id: 5, name: 'Leaf shade', color: '#236951', softColor: '#dbe7e2' },
  ],
  draw: (g) => {
    g.ellipse(12, 5, 4, 5, 2); g.ellipse(18, 10, 5, 4, 1); g.ellipse(16, 17, 4, 5, 2)
    g.ellipse(8, 17, 4, 5, 1); g.ellipse(5, 10, 5, 4, 2); g.ellipse(12, 11, 5, 5, 1)
    g.ellipse(12, 11, 2.5, 2.5, 3); g.line(12, 11, 21, 4, 3)
    g.ellipse(3, 19, 3, 2, 4); g.ellipse(21, 20, 3, 2, 5)
  },
})

const pizza = makeArtwork({
  id: 'pizza-party', title: 'Pizza Party', category: 'Food', difficulty: 'medium',
  stars: 2, unlockAt: 9, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Cheese', color: '#ffd45a', softColor: '#fff3c7' },
    { id: 2, name: 'Sauce', color: '#e95a56', softColor: '#f9dfde' },
    { id: 3, name: 'Crust', color: '#d98c45', softColor: '#f3e2d1' },
    { id: 4, name: 'Pepperoni', color: '#be3f4b', softColor: '#eedadd' },
    { id: 5, name: 'Pepper', color: '#55a95b', softColor: '#dfeddf' },
  ],
  draw: (g) => {
    for (let y = 3; y <= 20; y += 1) {
      const half = Math.round((y - 2) * 0.55)
      g.rect(12 - half, y, 11 + half, y, y >= 18 ? 3 : y === 17 ? 2 : 1)
    }
    ;[[10, 8], [14, 12], [8, 15], [16, 17]].forEach(([x, y]) => g.ellipse(x, y, 1.5, 1.5, 4))
    g.line(13, 6, 17, 12, 5); g.line(7, 13, 11, 15, 5)
  },
})

const pumpkin = makeArtwork({
  id: 'happy-pumpkin', title: 'Happy Pumpkin', category: 'Holiday', difficulty: 'medium',
  stars: 2, unlockAt: 11, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Pumpkin', color: '#f58236', softColor: '#fbe5d7' },
    { id: 2, name: 'Pumpkin light', color: '#ffa64f', softColor: '#ffecd9' },
    { id: 3, name: 'Pumpkin shade', color: '#c95c2b', softColor: '#f1ded6' },
    { id: 4, name: 'Stem', color: '#47734a', softColor: '#dde8de' },
    { id: 5, name: 'Face', color: '#5b3a47', softColor: '#e2d8dc' },
  ],
  draw: (g) => {
    g.rect(11, 1, 13, 5, 4); g.ellipse(12, 13, 10, 8, 3); g.ellipse(8, 13, 6, 8, 1); g.ellipse(16, 13, 6, 8, 1); g.ellipse(12, 13, 5, 8, 2)
    g.line(3, 11, 3, 16, 3); g.line(21, 11, 21, 16, 3)
    g.ellipse(8, 11, 1.5, 1.5, 5); g.ellipse(16, 11, 1.5, 1.5, 5)
    g.line(8, 16, 16, 16, 5); g.set(10, 17, 5); g.set(14, 17, 5)
  },
})

const gift = makeArtwork({
  id: 'big-bow-gift', title: 'Big Bow Gift', category: 'Holiday', difficulty: 'small',
  stars: 1, unlockAt: 13, width: 18, height: 18,
  palette: [
    { id: 1, name: 'Paper', color: '#64b9d2', softColor: '#def1f6' },
    { id: 2, name: 'Paper shade', color: '#397f9f', softColor: '#dbe8ee' },
    { id: 3, name: 'Ribbon', color: '#f06287', softColor: '#fbe0e7' },
    { id: 4, name: 'Bow light', color: '#ff9cb2', softColor: '#ffe9ee' },
  ],
  draw: (g) => {
    g.rect(2, 7, 15, 16, 1); g.rect(2, 14, 15, 16, 2); g.rect(7, 7, 10, 16, 3); g.rect(1, 6, 16, 8, 2); g.rect(7, 6, 10, 8, 3)
    g.ellipse(5, 4, 4, 3, 4); g.ellipse(13, 4, 4, 3, 3); g.rect(8, 3, 10, 7, 4)
  },
})

const toucan = makeArtwork({
  id: 'tropical-toucan', title: 'Tropical Toucan', category: 'Tropical', difficulty: 'large',
  stars: 3, unlockAt: 14, width: 28, height: 26,
  palette: [
    { id: 1, name: 'Feather', color: '#28394f', softColor: '#d8dce1' },
    { id: 2, name: 'Chest', color: '#ffd45d', softColor: '#fff2c7' },
    { id: 3, name: 'Beak', color: '#ff8b49', softColor: '#ffe6d7' },
    { id: 4, name: 'Beak tip', color: '#ef4c65', softColor: '#fadde2' },
    { id: 5, name: 'Wing', color: '#38ad9b', softColor: '#daf0ed' },
    { id: 6, name: 'Branch', color: '#8a5c46', softColor: '#e9dfda' },
  ],
  draw: (g) => {
    g.line(2, 22, 25, 19, 6, 2); g.ellipse(14, 14, 7, 9, 1); g.ellipse(15, 15, 4, 6, 5); g.ellipse(12, 11, 3, 4, 2)
    g.ellipse(12, 6, 5, 5, 1); g.rect(14, 4, 24, 8, 3); g.rect(22, 5, 26, 8, 4)
    g.set(11, 5, 2); g.set(12, 5, 2); g.set(12, 6, 1); g.line(11, 21, 10, 24, 1, 2); g.line(16, 21, 18, 24, 1, 2)
  },
})

function xorshift(value: number) {
  let result = value + 17
  result ^= result << 13; result ^= result >> 7; result ^= result << 5
  return Math.abs(result)
}

const tree = makeArtwork({
  id: 'twinkle-tree', title: 'Twinkle Tree', category: 'Holiday', difficulty: 'medium',
  stars: 2, unlockAt: 17, width: 24, height: 24,
  palette: [
    { id: 1, name: 'Pine', color: '#319465', softColor: '#d9ece3' },
    { id: 2, name: 'Pine shade', color: '#176449', softColor: '#d7e5df' },
    { id: 3, name: 'Gold', color: '#ffd04f', softColor: '#fff1c4' },
    { id: 4, name: 'Berry', color: '#e85371', softColor: '#f9dfe5' },
    { id: 5, name: 'Trunk', color: '#8e5b43', softColor: '#eadfd9' },
    { id: 6, name: 'Snow', color: '#dfefff', softColor: '#f2f8fd' },
  ],
  draw: (g) => {
    g.rect(10, 19, 13, 23, 5)
    for (let y = 4; y <= 20; y += 1) {
      const half = Math.min(10, Math.floor((y - 2) * 0.62))
      g.rect(12 - half, y, 11 + half, y, xorshift(y) % 3 === 0 ? 2 : 1)
    }
    ;[[12, 1], [7, 10], [16, 8], [11, 14], [18, 16], [5, 17]].forEach(([x, y], index) => g.set(x, y, index === 0 ? 3 : index % 2 ? 4 : 3))
    g.line(3, 20, 20, 20, 6, 2)
  },
})

function fullLandscape(
  details: Omit<ArtworkDetails, 'width' | 'height' | 'draw'>,
  draw: (grid: PixelGrid) => void,
) {
  return makeArtwork({ ...details, width: 30, height: 22, draw })
}

const sunset = fullLandscape({
  id: 'sunset-hills', title: 'Sunset Hills', category: 'Landscapes', difficulty: 'large', stars: 3, unlockAt: 19,
  palette: [
    { id: 1, name: 'Sunset', color: '#f88b79', softColor: '#fce6e1' },
    { id: 2, name: 'Sun', color: '#ffd465', softColor: '#fff3ce' },
    { id: 3, name: 'Far hill', color: '#9b79b8', softColor: '#e9e2ef' },
    { id: 4, name: 'Near hill', color: '#5d668e', softColor: '#dfe0e8' },
    { id: 5, name: 'Grass', color: '#3e8068', softColor: '#dce8e4' },
  ],
}, (g) => {
  g.rect(0, 0, 29, 21, 1); g.ellipse(22, 6, 4, 4, 2)
  for (let x = 0; x < 30; x += 1) {
    const far = 12 + Math.round(Math.sin(x / 3) * 2); g.rect(x, far, x, 21, 3)
    const near = 16 + Math.round(Math.sin((x + 4) / 4) * 2); g.rect(x, near, x, 21, 4)
    const grass = 19 + Math.round(Math.sin(x / 2)); g.rect(x, grass, x, 21, 5)
  }
})

const cabin = fullLandscape({
  id: 'snowy-cabin', title: 'Snowy Cabin', category: 'Landscapes', difficulty: 'large', stars: 3, unlockAt: 22,
  palette: [
    { id: 1, name: 'Sky', color: '#879ed2', softColor: '#e4e8f3' },
    { id: 2, name: 'Snow', color: '#eef7ff', softColor: '#f7fbff' },
    { id: 3, name: 'Cabin', color: '#a9644c', softColor: '#eddeda' },
    { id: 4, name: 'Roof', color: '#584b67', softColor: '#dfdce3' },
    { id: 5, name: 'Window', color: '#ffd46b', softColor: '#fff3d0' },
    { id: 6, name: 'Pine', color: '#3e6f67', softColor: '#dce6e4' },
  ],
}, (g) => {
  g.rect(0, 0, 29, 21, 1); g.rect(0, 15, 29, 21, 2)
  g.rect(10, 10, 22, 18, 3); g.line(8, 11, 16, 5, 4, 2); g.line(16, 5, 24, 11, 4, 2); g.rect(13, 13, 16, 16, 5); g.rect(19, 12, 21, 18, 4)
  g.rect(26, 9, 27, 19, 6); for (let y = 3; y <= 14; y += 3) g.line(26, y, 21 + Math.floor(y / 4), y + 5, 6, 2)
  ;[[3, 3], [7, 8], [20, 2], [28, 5]].forEach(([x, y]) => g.set(x, y, 2))
})

const rainbow = fullLandscape({
  id: 'rainbow-meadow', title: 'Rainbow Meadow', category: 'Landscapes', difficulty: 'large', stars: 3, unlockAt: 25,
  palette: [
    { id: 1, name: 'Sky', color: '#79c8e8', softColor: '#e3f3f9' },
    { id: 2, name: 'Cloud', color: '#fff6ed', softColor: '#fffaf6' },
    { id: 3, name: 'Rainbow', color: '#ef6489', softColor: '#fbe2e8' },
    { id: 4, name: 'Sunbeam', color: '#ffc953', softColor: '#fff1c7' },
    { id: 5, name: 'Meadow', color: '#6cba70', softColor: '#e2f0e3' },
    { id: 6, name: 'Flowers', color: '#9a70c7', softColor: '#eae2f2' },
  ],
}, (g) => {
  g.rect(0, 0, 29, 21, 1); g.ellipse(25, 4, 3, 3, 4); g.ellipse(5, 5, 4, 2, 2); g.ellipse(9, 4, 4, 2, 2)
  for (let x = 5; x <= 24; x += 1) {
    const arch = 15 - Math.round(Math.sqrt(Math.max(0, 100 - (x - 15) ** 2)) * 0.65)
    g.set(x, arch, 3); g.set(x, arch + 1, 4)
  }
  g.rect(0, 15, 29, 21, 5)
  ;[[3, 18], [8, 16], [13, 20], [18, 17], [24, 19], [28, 16]].forEach(([x, y]) => {
    g.set(x, y, 6); g.set(x - 1, y, 4); g.set(x + 1, y, 4)
  })
})

export const artworks: Artwork[] = [
  heart, palm, cupcake, moon, watermelon, iceCream, hibiscus, pizza, pumpkin, gift,
  toucan, tree, sunset, cabin, rainbow,
]

export const cupcakeArtwork = cupcake

export function getArtwork(artworkId: string): Artwork | undefined {
  return artworks.find(({ id }) => id === artworkId)
}

export function totalColorableCells(artwork: Artwork): number {
  return artwork.cells.reduce((total, color) => total + (color === 0 ? 0 : 1), 0)
}
