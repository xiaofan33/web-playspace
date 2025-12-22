import { arrayShuffle, type Position } from '~/shared';

export type AroundMineCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type BoardStage = 'ready' | 'playing' | 'lost' | 'won';
export type CellAction = 'open' | 'flag' | 'open-around';

export interface CellState {
  readonly index: number;
  open?: boolean;
  mine?: boolean;
  flag?: boolean;
  boom?: boolean;
  aroundMineCount?: AroundMineCount;
}

export interface ModelProps {
  w: number; /**board width */
  h: number; /**board height */
  m: number; /**mines count */
  cellBits?: Array<[number /**index */, number /*bit*/]>;
  duration?: number;
}

class MinesweeperModel {
  props: ModelProps = { w: 0, h: 0, m: 0 };
  timer: { duration: number; startAt?: number } = { duration: 0 };
  stage: BoardStage = 'ready';
  cells: CellState[] = [];
  mineIndexArr: Array<number> = [];
  flagIndexSet: Set<number> = new Set();

  private unopenedCellCount = 0;
  private aroundCellCache: WeakMap<CellState, CellState[]> = new WeakMap();
  // prettier-ignore
  private static aroundPosVec = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
  ] as const
  private static bitFlags = {
    open: 0x1,
    mine: 0x2,
    flag: 0x4,
  } as const;

  init(props: ModelProps) {
    const { w, h, m, cellBits, duration = 0 } = props;
    if (w !== this.props.w || h !== this.props.h) {
      this.cells = Array.from({ length: w * h }, (_, index) => ({ index }));
      this.aroundCellCache = new WeakMap();
    } else {
      this.cells.forEach(c => {
        if (c.open) c.open = false;
        if (c.mine) c.mine = false;
        if (c.flag) c.flag = false;
        if (c.boom) c.boom = false;
        c.aroundMineCount = undefined;
      });
    }
    this.props = { w, h, m };
    this.unopenedCellCount = this.cells.length - m;
    this.mineIndexArr.length = 0;
    this.flagIndexSet.clear();
    this.timer = { duration };
    this.stage = 'ready';

    if (cellBits?.length) {
      const openedCells: CellState[] = [];
      cellBits.forEach(([index, bit]) => {
        const cell = this.cells[index];
        if (bit & MinesweeperModel.bitFlags.open) {
          cell.open = true;
          openedCells.push(cell);
        }
        if (bit & MinesweeperModel.bitFlags.mine) {
          cell.mine = true;
          this.mineIndexArr.push(index);
        }
        if (bit & MinesweeperModel.bitFlags.flag) {
          cell.flag = true;
          this.flagIndexSet.add(index);
        }
      });
      // ensure all opened cells calculated around mine count
      openedCells.forEach(c => this.getAroundMineCount(c));
      this.unopenedCellCount -= openedCells.length;
      this.timer.startAt = Date.now();
      this.stage = 'playing';
    }

    return this;
  }

  restart() {
    if (this.stage === 'ready') return;

    this.cells.forEach(c => {
      if (c.open) c.open = false;
      if (c.flag) c.flag = false;
      if (c.boom) c.boom = false;
    });
    this.flagIndexSet.clear();
    this.unopenedCellCount = this.cells.length - this.props.m;
    this.timer = { duration: 0, startAt: Date.now() };
    this.stage = 'playing';
  }

  dump(): ModelProps {
    const cellBits = this.cells.flatMap(c => {
      const bit =
        (c.open ? MinesweeperModel.bitFlags.open : 0) |
        (c.mine ? MinesweeperModel.bitFlags.mine : 0) |
        (c.flag ? MinesweeperModel.bitFlags.flag : 0);
      return bit > 0 ? [[c.index, bit] as [number, number]] : [];
    });
    const duration = this.timer.startAt
      ? Date.now() - this.timer.startAt + this.timer.duration
      : this.timer.duration;
    return { ...this.props, cellBits, duration };
  }

  posToIndex({ x, y }: Position) {
    return x + y * this.props.w;
  }

  indexToPos(index: number) {
    return {
      x: index % this.props.w,
      y: Math.floor(index / this.props.w),
    };
  }

  getAroundCells(cell: CellState) {
    const cache = this.aroundCellCache.get(cell);
    if (cache) return cache;

    const { w, h } = this.props;
    const { x, y } = this.indexToPos(cell.index);
    const aroundCells = MinesweeperModel.aroundPosVec.flatMap(([dx, dy]) => {
      const pos = { x: x + dx, y: y + dy };
      return pos.x >= 0 && pos.x < w && pos.y >= 0 && pos.y < h
        ? [this.cells[this.posToIndex(pos)]]
        : [];
    });
    this.aroundCellCache.set(cell, aroundCells);
    return aroundCells;
  }

  getAroundMineCount(cell: CellState) {
    if (cell.aroundMineCount === undefined) {
      const { length } = this.getAroundCells(cell).filter(c => c.mine);
      cell.aroundMineCount = length as AroundMineCount;
    }
    return cell.aroundMineCount;
  }

  getCellGrid() {
    return Array.from({ length: this.props.h }, (_, y) =>
      Array.from(
        { length: this.props.w },
        (_, x) => this.cells[this.posToIndex({ x, y })],
      ),
    );
  }

  operate(cell: CellState, action: CellAction, allowOpenAround = false) {
    if (this.stage === 'won' || this.stage === 'lost') return;

    if (this.stage === 'ready') {
      this.placeMines(cell);
      this.timer.startAt = Date.now();
      this.stage = 'playing';
    }

    if (action === 'open-around') {
      this.doOpenAround(cell);
      return;
    }

    const success = action === 'open' ? this.doOpen(cell) : this.doFlag(cell);
    if (!success && allowOpenAround) {
      this.doOpenAround(cell);
    }
  }

  private placeMines(cell: CellState) {
    const excluded = [cell, ...this.getAroundCells(cell)];
    const candidates = this.cells.flatMap(c =>
      excluded.includes(c) ? [] : [c],
    );
    arrayShuffle(candidates, this.props.m).forEach(c => {
      c.mine = true;
      this.mineIndexArr.push(c.index);
    });
  }

  private doOpen(cell: CellState) {
    if (cell.open || cell.flag) return;

    cell.open = true;
    if (cell.mine) {
      cell.boom = true;
      this.doGameEnd(false);
      return;
    }

    if (--this.unopenedCellCount === 0) {
      this.doGameEnd(true);
      return;
    }

    if (this.getAroundMineCount(cell) === 0) {
      this.getAroundCells(cell).forEach(c => this.doOpen(c));
    }
    return true;
  }

  private doFlag(cell: CellState) {
    if (cell.open) return;

    if (cell.flag) {
      cell.flag = false;
      this.flagIndexSet.delete(cell.index);
    } else {
      cell.flag = true;
      this.flagIndexSet.add(cell.index);
    }
    return true;
  }

  private doOpenAround(cell: CellState) {
    if (!cell.open) return;

    const around = this.getAroundCells(cell);
    const flagCount = around.filter(c => c.flag).length;
    if (flagCount === 0 || flagCount !== this.getAroundMineCount(cell)) return;

    around.forEach(c => this.doOpen(c));
    return true;
  }

  private doGameEnd(isWin: boolean) {
    if (isWin) {
      this.stage = 'won';
      this.flagIndexSet.clear();
      this.cells.forEach(c => {
        if (c.mine) {
          c.flag = true;
          this.flagIndexSet.add(c.index);
        } else {
          c.open = true;
          this.getAroundMineCount(c);
        }
      });
    } else {
      this.stage = 'lost';
      this.mineIndexArr.forEach(index => (this.cells[index].open = true));
      this.flagIndexSet.forEach(index => (this.cells[index].open = true));
    }
  }
}

export function createModel(props: ModelProps = { w: 9, h: 9, m: 10 }) {
  return new MinesweeperModel().init(props);
}
