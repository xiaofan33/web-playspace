import { getRandomInt, type Direction, type Position } from '~/shared'

export interface PieceState {
  readonly id: number
  readonly targetPos: Position
  x: number
  y: number
  group?: number
}

export interface ModelProps {
  w: number
  h: number
  steps?: number
  idArr?: number[]
  blankId?: number
}

// prettier-ignore
const VECTOR_MAP: Record<Direction, Position> = {
  up   : { x: 0,  y: -1 },
  down : { x: 0,  y: 1 },
  left : { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
} as const;
const DIRECTIONS = Object.values(VECTOR_MAP)

class SlidingPuzzleModel {
  props: ModelProps = { w: 0, h: 0 }
  steps: number = 0
  pieces: PieceState[] = []

  get isSolved() {
    return this.pieces.every(
      p => p.x === p.targetPos.x && p.y === p.targetPos.y,
    )
  }

  get blankIndex() {
    return this.props.w * this.props.h - 1
  }

  get blank() {
    return this.pieces[this.blankIndex]
  }

  init(props: ModelProps) {
    const { w, h, idArr, steps = 0, blankId = 0 } = props
    this.steps = steps

    if (this.props.w !== w || this.props.h !== h) {
      this.props = { w, h }
      this.pieces = Array.from({ length: w * h }, (_, index) => {
        const targetPos = this.indexToPos(index)
        const id = index === this.blankIndex ? blankId : index + 1
        return { id, targetPos, ...targetPos }
      })
    }

    if (idArr?.length) {
      idArr.forEach((id, index) => {
        const { x, y } = this.indexToPos(index)
        const p = this.pieces.find(p => p.id === id)
        if (p) {
          p.x = x
          p.y = y
        }
      })
    }
  }

  move(arg: number | Position | Direction) {
    if (this.isSolved) return

    if (typeof arg === 'string') {
      const { x, y } = VECTOR_MAP[arg]
      arg = { x: this.blank.x - x, y: this.blank.y - y }
    }

    const startPiece = this.getPiece(arg)
    const movePieceList = this.getMoves(startPiece)
    if (movePieceList?.length) {
      for (const p of movePieceList) {
        this.doSwap(p)
        this.steps++
      }
    }
  }

  shuffle(count?: number) {
    count = count ?? this.pieces.length * 10
    let prevDirIndex: number | undefined
    while (count > 0) {
      const dirIndex = getRandomInt(0, DIRECTIONS.length - 1)
      if (prevDirIndex === undefined || prevDirIndex === dirIndex) {
        continue
      }
      prevDirIndex = dirIndex
      const dir = DIRECTIONS[dirIndex]
      const pos = { x: this.blank.x + dir.x, y: this.blank.y + dir.y }
      if (
        pos.x < 0 ||
        pos.x >= this.props.w ||
        pos.y < 0 ||
        pos.y >= this.props.h
      ) {
        continue
      }
      this.move(pos)
      count--
    }
  }

  indexToPos(index: number) {
    const x = index % this.props.w
    const y = Math.floor(index / this.props.w)
    return { x, y }
  }

  getPiece(arg: number | Position) {
    return typeof arg === 'number'
      ? this.pieces.find(p => p.id === arg)
      : this.pieces.find(p => p.x === arg.x && p.y === arg.y)
  }

  private getMoves(startPiece?: PieceState) {
    if (!startPiece) return

    let { x: startX, y: startY } = startPiece
    let { x: px, y: py } = this.blank
    let offsetX = Math.abs(startX - px)
    let offsetY = Math.abs(startY - py)
    if (offsetX !== 0 && offsetY !== 0) return

    const movePosList: Position[] = []
    if (offsetX !== 0) {
      const dx = startX > px ? 1 : -1
      while (offsetX > 0) {
        offsetX--
        px += dx
        movePosList.push({ x: px, y: startY })
      }
    } else {
      const dy = startY > py ? 1 : -1
      while (offsetY > 0) {
        offsetY--
        py += dy
        movePosList.push({ x: startX, y: py })
      }
    }

    return movePosList
      .map(pos => this.getPiece(pos))
      .filter(Boolean) as PieceState[]
  }

  private doSwap(p: PieceState) {
    const { x, y } = this.blank
    this.blank.x = p.x
    this.blank.y = p.y
    p.x = x
    p.y = y
  }
}

export function createModel(props: ModelProps = { w: 4, h: 4 }) {
  const model = new SlidingPuzzleModel()
  model.init(props)
  return model
}
