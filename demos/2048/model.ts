import { arrayShuffle, randomWeighted, type Direction } from '~/shared'

type TilesInLine = Array<TileState | null>
type MoveOptions = {
  prop: 'x' | 'y'
  isReverse: boolean
  getTiles: (index: number) => TilesInLine
}

export interface TileState {
  id?: number
  value: number
  x: number
  y: number
}

export interface ModelState {
  score: number
  steps: number
  tiles: TileState[]
}

export interface ModelConfig {
  boardWidth: number
  popupStart: number
  popupMoved: number
  newValueWeights: ReadonlyArray<{ value: number; weight: number }>
}

export interface ModelProps extends ModelConfig {
  currentState?: Partial<ModelState>
}

const defaultModelConfig: ModelConfig = {
  boardWidth: 4,
  popupStart: 2,
  popupMoved: 1,
  newValueWeights: [
    { value: 2, weight: 90 },
    { value: 4, weight: 10 },
  ],
} as const

let idCounter = 0

class G2048Model {
  props: ModelProps = { ...defaultModelConfig }
  state: ModelState = { score: 0, steps: 0, tiles: [] }

  private _gameOver = false
  private _tileGrid: TilesInLine[] = []
  private _oldState: ModelState | null = null

  // prettier-ignore
  private readonly _moveOptionsMap: Record<Direction, MoveOptions> = {
    up   : { prop: "y", isReverse: true,  getTiles: (x: number) => this._tileGrid.map((row) => row[x]) },
    down : { prop: "y", isReverse: false, getTiles: (x: number) => this._tileGrid.map((row) => row[x]) },
    left : { prop: "x", isReverse: true,  getTiles: (y: number) => this._tileGrid[y] },
    right: { prop: "x", isReverse: false, getTiles: (y: number) => this._tileGrid[y] },
  }

  static isTilesPositionEqual(t1: TileState[], t2: TileState[]) {
    return (
      t1.length === t2.length &&
      t1.every((t, i) => t.x === t2[i].x && t.y === t2[i].y)
    )
  }

  init(props: ModelProps) {
    const { currentState, ...rest } = props
    this.props = rest
    this.state = { score: 0, steps: 0, tiles: [], ...currentState }
    this._gameOver = false
    this._oldState = null
    this._updateTileGrid(true)

    if (this.state.tiles.length === 0) {
      this._popupTile(this.props.popupStart)
    } else {
      this.state.tiles.forEach(t => (t.id = idCounter++))
    }
  }

  move(direction: Direction) {
    if (this._gameOver) return

    const { currentState } = this.dump()
    const moveOptions = this._moveOptionsMap[direction]
    this._doMoveTiles(moveOptions)

    if (G2048Model.isTilesPositionEqual(currentState.tiles, this.state.tiles)) {
      return
    }

    this._oldState = currentState
    this.state.steps++
    this._updateTileGrid()
    this._popupTile(this.props.popupMoved)
  }

  back() {
    if (this._oldState) {
      this.state = this._oldState
      this._oldState = null
      this._gameOver = false
      this._updateTileGrid()
    }
  }

  dump() {
    const currentState = {
      ...this.state,
      tiles: this.state.tiles.map(t => ({ ...t })),
    }
    return { ...this.props, currentState }
  }

  canBack() {
    return this._oldState !== null
  }

  canMove() {
    return !this._gameOver
  }

  canMerge() {
    const maxIndex = this.props.boardWidth - 1
    for (let i = 0; i <= maxIndex; i++) {
      for (let j = 0; j <= maxIndex; j++) {
        const val = this._tileGrid[i][j]?.value
        if (i < maxIndex && val === this._tileGrid[i + 1][j]?.value) return true
        if (j < maxIndex && val === this._tileGrid[i][j + 1]?.value) return true
      }
    }
    return false
  }

  private _popupTile(count: number) {
    if (count <= 0) return

    const emptyPos = this._tileGrid.flatMap((row, y) =>
      row.flatMap((item, x) => (item === null ? [{ x, y }] : [])),
    )
    if (emptyPos.length < count) {
      this._gameOver = true
      return
    }

    arrayShuffle(emptyPos, count).forEach(pos => {
      const value = randomWeighted(this.props.newValueWeights)
      const t = { id: idCounter++, value, ...pos }
      this.state.tiles.push(t)
      this._tileGrid[t.y][t.x] = t
    })

    if (emptyPos.length === count && !this.canMerge()) {
      this._gameOver = true
    }
  }

  private _updateTileGrid(isInit = false) {
    if (!isInit) {
      this._tileGrid.forEach(row => row.fill(null))
    } else {
      this._tileGrid = Array.from({ length: this.props.boardWidth }, () =>
        Array.from({ length: this.props.boardWidth }, () => null),
      )
    }

    this.state.tiles.forEach(t => (this._tileGrid[t.y][t.x] = t))
  }

  private _doMoveTiles({ prop, isReverse, getTiles }: MoveOptions) {
    const length = this.props.boardWidth
    for (let i = 0; i < length; i++) {
      let tiles = getTiles(i).filter((t): t is TileState => t !== null)
      if (tiles.length === 0) continue

      let offset = 0
      if (isReverse) {
        tiles = this._mergeTilesInLine(tiles.reverse()).reverse()
      } else {
        tiles = this._mergeTilesInLine(tiles)
        offset = length - tiles.length
      }

      tiles.forEach((t, index) => (t[prop] = index + offset))
    }

    this.state.tiles = this.state.tiles.filter(t => t.value > 0)
  }

  private _mergeTilesInLine(tiles: TileState[]) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const curr = tiles[i]
      const prev = tiles[i - 1]
      if (curr.value === prev.value) {
        prev.value *= 2
        curr.value = 0
        this.state.score += prev.value
        i--
      }
    }
    return tiles.filter(t => t.value > 0)
  }
}

export function createModel(props: ModelProps = { ...defaultModelConfig }) {
  const m = new G2048Model()
  m.init(props)
  return m
}

export function tilesToGrid(tiles: TileState[], size: number) {
  const length = size
  const grid = Array.from({ length }, () => Array.from({ length }, () => 0))
  tiles.forEach(t => (grid[t.y][t.x] = t.value))
  return grid
}

export function gridToTiles(grid: number[][]) {
  const tiles: TileState[] = []
  const size = grid.length
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = grid[y][x]
      if (value !== 0) {
        tiles.push({ x, y, value })
      }
    }
  }
  return tiles
}
