import { getRadomInt, type Direction, type Position } from '~/shared';

export interface PieceState {
  readonly id: number;
  readonly target: Position;
  x: number;
  y: number;
  group?: number;
}

export interface ModelProps {
  w: number;
  h: number;
  steps?: number;
  idArr?: number[];
  blankId?: number;
}

// prettier-ignore
const vectorMap: Record<Direction, Position> = {
  up   : { x: 0,  y: -1 },
  down : { x: 0,  y: 1 },
  left : { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
} as const;
const directions = Object.values(vectorMap);

class SlidingPuzzleModel {
  props: ModelProps = { w: 0, h: 0 };
  pieces: PieceState[] = [];
  steps = 0;

  get isSolved() {
    return this.pieces.every(p => p.x === p.target.x && p.y === p.target.y);
  }

  get blankIndex() {
    return this.props.w * this.props.h - 1;
  }

  get blank() {
    return this.pieces[this.blankIndex];
  }

  init(props: ModelProps) {
    const { w, h, idArr, steps = 0, blankId = 0 } = props;
    this.steps = steps;

    if (this.props.w !== w || this.props.h !== h) {
      this.props = { w, h };
      this.pieces = Array.from({ length: w * h }, (_, index) => {
        const target = this.indexToPos(index);
        const id = index === this.blankIndex ? blankId : index + 1;
        return { id, target, ...target };
      });
    }

    if (idArr?.length) {
      idArr.forEach((id, index) => {
        const { x, y } = this.indexToPos(index);
        const p = this.pieces.find(p => p.id === id);
        if (p) {
          p.x = x;
          p.y = y;
        }
      });
    }
  }

  move(arg: number | Position | Direction) {
    if (typeof arg === 'string') {
      const { x, y } = vectorMap[arg];
      arg = { x: this.blank.x - x, y: this.blank.y - y };
    }

    const startPiece = this.getPiece(arg);
    const moveList = this.getMoves(startPiece);
    if (moveList?.length) {
      for (const p of moveList) {
        this.doSwap(p);
        this.steps++;
      }
    }
  }

  shuffle(count?: number) {
    count = count ?? this.pieces.length * 10;
    while (count > 0) {
      const randomPos = directions[getRadomInt(0, directions.length)];
      const p = this.getPiece(randomPos);
      if (p) {
        this.doSwap(p);
        count--;
      }
    }
  }

  indexToPos(index: number) {
    return {
      x: index % this.props.w,
      y: Math.floor(index / this.props.w),
    };
  }

  getPiece(arg: number | Position) {
    return typeof arg === 'number'
      ? this.pieces.find(p => p.id === arg)
      : this.pieces.find(p => p.x === arg.x && p.y === arg.y);
  }

  private getMoves(startPiece?: PieceState) {
    if (!startPiece) return;

    let { x: startX, y: startY } = startPiece;
    let { x: px, y: py } = this.blank;
    let offsetX = Math.abs(startX - px);
    let offsetY = Math.abs(startY - py);
    if (offsetX !== 0 && offsetY !== 0) return;

    const movePosList: Position[] = [];
    if (offsetX !== 0) {
      const dx = startX > px ? 1 : -1;
      while (offsetX > 0) {
        offsetX--;
        px += dx;
        movePosList.push({ x: px, y: startY });
      }
    } else {
      const dy = startY > py ? 1 : -1;
      while (offsetY > 0) {
        offsetY--;
        py += dy;
        movePosList.push({ x: startX, y: py });
      }
    }

    return movePosList
      .map(pos => this.getPiece(pos))
      .filter(Boolean) as PieceState[];
  }

  private doSwap(p: PieceState) {
    // swap piece with blank
    const { x, y } = this.blank;
    this.blank.x = p.x;
    this.blank.y = p.y;
    p.x = x;
    p.y = y;
  }
}

export function createModel(props: ModelProps = { w: 4, h: 4 }) {
  const model = new SlidingPuzzleModel();
  model.init(props);
  return model;
}
