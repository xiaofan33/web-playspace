import { arrayShuffle, type Position } from '~/shared'

export type AroundMineCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type BoardStage = 'ready' | 'playing' | 'lost' | 'won'
export type CellAction = 'open' | 'flag' | 'open-around'

export interface CellState {
  readonly index: number
  open?: boolean
  mine?: boolean
  flag?: boolean
  boom?: boolean
  aroundMineCount?: AroundMineCount
}

export interface ModelConfig {
  w: number /** board width */
  h: number /** board height */
  m: number /** mines count */
}

export interface ModelProps extends ModelConfig {
  cellBits?: Array<[number /** index */, number /* bit */]>
  duration?: number
}

const enum CellBitFlag {
  Open = 0x1,
  Mine = 0x2,
  Flag = 0x4,
}

// prettier-ignore
const NEIGHBOR_DIRECTIONS: readonly [number, number][] = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
] as const

class MinesweeperModel {
  timer: { duration: number; startAt?: number } = { duration: 0 }
  props: ModelProps = { w: 0, h: 0, m: 0 }
  stage: BoardStage = 'ready'
  cells: CellState[] = []
  mineIndexArr: number[] = []
  flagIndexSet: Set<number> = new Set()

  private unopenedCellCount = 0
  private minesPlaced = false
  private aroundCellCache: WeakMap<CellState, CellState[]> = new WeakMap()

  init(props: ModelProps) {
    const { w, h, m, cellBits, duration = 0 } = props

    if (w !== this.props.w || h !== this.props.h) {
      this.cells = Array.from({ length: w * h }, (_, index) => ({ index }))
      this.aroundCellCache = new WeakMap()
    } else {
      this.cells.forEach(c => {
        c.open = false
        c.mine = false
        c.flag = false
        c.boom = false
        c.aroundMineCount = undefined
      })
    }

    this.props = { w, h, m }
    this.unopenedCellCount = this.cells.length - m
    this.mineIndexArr.length = 0
    this.flagIndexSet.clear()
    this.timer = { duration }
    this.stage = 'ready'
    this.minesPlaced = false

    if (cellBits?.length) {
      this.restoreFromCellBits(cellBits)
    }
  }

  restart() {
    if (this.stage === 'ready') {
      return
    }

    this.cells.forEach(c => {
      c.open = false
      c.flag = false
      c.boom = false
    })

    this.flagIndexSet.clear()
    this.unopenedCellCount = this.cells.length - this.props.m
    this.timer = { duration: 0, startAt: Date.now() }
    this.stage = 'playing'
  }

  dump() {
    const cellBits = this.cells.flatMap(c => {
      const bit =
        (c.open ? CellBitFlag.Open : 0) |
        (c.mine ? CellBitFlag.Mine : 0) |
        (c.flag ? CellBitFlag.Flag : 0)
      return bit > 0 ? [[c.index, bit] as [number, number]] : []
    })
    const duration = this.timer.startAt
      ? Date.now() - this.timer.startAt + this.timer.duration
      : this.timer.duration

    return { ...this.props, cellBits, duration }
  }

  indexToPos(index: number) {
    return {
      x: index % this.props.w,
      y: Math.floor(index / this.props.w),
    }
  }

  posToIndex(pos: Position) {
    return pos.x + pos.y * this.props.w
  }

  getAroundCells(cell: CellState) {
    const cache = this.aroundCellCache.get(cell)
    if (cache) return cache

    const { w, h } = this.props
    const { x, y } = this.indexToPos(cell.index)
    const aroundCells = NEIGHBOR_DIRECTIONS.flatMap(([dx, dy]) => {
      const pos = { x: x + dx, y: y + dy }
      return pos.x >= 0 && pos.x < w && pos.y >= 0 && pos.y < h
        ? [this.cells[this.posToIndex(pos)]]
        : []
    })

    this.aroundCellCache.set(cell, aroundCells)
    return aroundCells
  }

  getAroundMineCount(cell: CellState) {
    if (cell.aroundMineCount === undefined) {
      const { length } = this.getAroundCells(cell).filter(c => c.mine)
      cell.aroundMineCount = length as AroundMineCount
    }

    return cell.aroundMineCount
  }

  getCellGrid() {
    return Array.from({ length: this.props.h }, (_, y) =>
      Array.from(
        { length: this.props.w },
        (_, x) => this.cells[this.posToIndex({ x, y })],
      ),
    )
  }

  operate(cell: CellState, action: CellAction, allowOpenAround = false) {
    if (this.stage === 'won' || this.stage === 'lost') {
      return
    }

    if (!this.minesPlaced) {
      this.placeMines(cell)
      this.timer.startAt = Date.now()
      this.stage = 'playing'
      this.minesPlaced = true
    }

    if (action === 'open-around') {
      this.doOpenAround(cell)
      return
    }

    const success = action === 'open' ? this.doOpen(cell) : this.doFlag(cell)
    if (!success && allowOpenAround) {
      this.doOpenAround(cell)
    }
  }

  private placeMines(firstClickCell: CellState) {
    const excluded = [firstClickCell, ...this.getAroundCells(firstClickCell)]
    const candidates = this.cells.flatMap(c =>
      excluded.includes(c) ? [] : [c],
    )
    arrayShuffle(candidates, this.props.m).forEach(c => {
      c.mine = true
      this.mineIndexArr.push(c.index)
    })
  }

  private doOpen(cell: CellState): boolean {
    if (cell.open || cell.flag) {
      return false
    }

    cell.open = true

    if (cell.mine) {
      cell.boom = true
      this.doGameEnd(false)
      return true
    }

    if (--this.unopenedCellCount === 0) {
      this.doGameEnd(true)
      return true
    }

    if (this.getAroundMineCount(cell) === 0) {
      this.getAroundCells(cell).forEach(c => this.doOpen(c))
    }

    return true
  }

  private doFlag(cell: CellState): boolean {
    if (cell.open) {
      return false
    }

    if (cell.flag) {
      cell.flag = false
      this.flagIndexSet.delete(cell.index)
    } else {
      cell.flag = true
      this.flagIndexSet.add(cell.index)
    }

    return true
  }

  private doOpenAround(cell: CellState): boolean {
    if (!cell.open) {
      return false
    }

    const aroundCells = this.getAroundCells(cell)
    const flagCount = aroundCells.filter(c => c.flag).length
    const mineCount = this.getAroundMineCount(cell)

    if (flagCount === 0 || flagCount !== mineCount) {
      return false
    }

    let openedAny = false
    for (const c of aroundCells) {
      if (this.doOpen(c)) {
        openedAny = true
      }
    }

    return openedAny
  }

  private doGameEnd(won: boolean) {
    if (won) {
      this.stage = 'won'
      this.flagIndexSet.clear()
      this.cells.forEach(c => {
        if (c.mine) {
          c.flag = true
          this.flagIndexSet.add(c.index)
        } else {
          c.open = true
          this.getAroundMineCount(c)
        }
      })
    } else {
      this.stage = 'lost'
      this.mineIndexArr.forEach(index => (this.cells[index].open = true))
      this.flagIndexSet.forEach(index => (this.cells[index].open = true))
    }
  }

  private restoreFromCellBits(cellBits: [number, number][]) {
    const openedCells: CellState[] = []
    for (const [index, bit] of cellBits) {
      const cell = this.cells[index]

      if (bit & CellBitFlag.Open) {
        cell.open = true
        openedCells.push(cell)
      }
      if (bit & CellBitFlag.Mine) {
        cell.mine = true
        this.mineIndexArr.push(index)
      }
      if (bit & CellBitFlag.Flag) {
        cell.flag = true
        this.flagIndexSet.add(index)
      }
    }

    for (const cell of openedCells) {
      this.getAroundMineCount(cell)
    }
    this.unopenedCellCount -= openedCells.length
    this.timer.startAt = Date.now()
    this.stage = 'playing'
    this.minesPlaced = true
  }
}

export function createModel(props: ModelProps = { w: 9, h: 9, m: 10 }) {
  const m = new MinesweeperModel()
  m.init(props)
  return m
}
