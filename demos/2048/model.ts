import { arrayShuffle, type Direction } from '~/shared';

export interface TileState {
  id?: number;
  value: number;
  x: number;
  y: number;
}

export interface ModelState {
  score: number;
  steps: number;
  tiles: TileState[];
}

export interface ModelProps {
  boardWidth: number;
  popupStart: number;
  popupMoved: number;
  currentState?: Partial<ModelState>;
}

type TilesInLine = (TileState | null)[];
type MoveOptions = {
  prop: 'x' | 'y';
  isReverse: boolean;
  getTiles: (index: number) => TilesInLine;
};

let idCounter = 0;

class G2048Model {
  props: ModelProps = { boardWidth: 4, popupStart: 2, popupMoved: 1 };
  state: ModelState = { score: 0, steps: 0, tiles: [] };

  private gameOver = false;
  private tileGrid: TilesInLine[] = [];
  private oldState: ModelState | null = null;
  // prettier-ignore
  private moveOptionsMap: Record<Direction, MoveOptions> = {
    up   : { prop: "y", isReverse: true,  getTiles: (x: number) => this.tileGrid.map((row) => row[x])},
    down : { prop: "y", isReverse: false, getTiles: (x: number) => this.tileGrid.map((row) => row[x]) },
    left : { prop: "x", isReverse: true,  getTiles: (y: number) => this.tileGrid[y] },
    right: { prop: "x", isReverse: false, getTiles: (y: number) => this.tileGrid[y] },
  };

  static isTilesPositionEqual(t1: TileState[], t2: TileState[]) {
    return (
      t1.length === t2.length &&
      t1.every((t, i) => t.x === t2[i].x && t.y === t2[i].y)
    );
  }

  init(props: ModelProps) {
    const { currentState, ...rest } = props;
    this.props = rest;
    this.state = { score: 0, steps: 0, tiles: [], ...currentState };
    this.gameOver = false;
    this.oldState = null;
    this.updateTileGrid(true);

    if (this.state.tiles.length === 0) {
      this.popupTile(this.props.popupStart);
    } else {
      this.state.tiles.forEach(t => (t.id = idCounter++));
    }
  }

  move(direction: Direction) {
    if (this.gameOver) return;

    const { currentState } = this.dump();
    const moveOptions = this.moveOptionsMap[direction];
    this.doMoveTiles(moveOptions);

    if (G2048Model.isTilesPositionEqual(currentState.tiles, this.state.tiles))
      return;

    this.oldState = currentState;
    this.state.steps++;
    this.updateTileGrid();
    this.popupTile(this.props.popupMoved);
  }

  back() {
    if (this.oldState) {
      this.state = this.oldState;
      this.oldState = null;
      this.gameOver = false;
      this.updateTileGrid();
    }
  }

  dump() {
    const currentState = {
      ...this.state,
      tiles: this.state.tiles.map(t => ({ ...t })),
    };
    return { ...this.props, currentState };
  }

  canBack() {
    return !!this.oldState;
  }

  canMove() {
    return !this.gameOver;
  }

  canMerge() {
    const length = this.props.boardWidth;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length; j++) {
        const value = this.tileGrid[i][j]?.value;
        if (
          (i < length - 1 && value === this.tileGrid[i + 1][j]?.value) ||
          (j < length - 1 && value === this.tileGrid[i][j + 1]?.value)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private popupTile(count: number) {
    if (count === 0) return;

    const emptyPos = this.tileGrid.flatMap((row, y) => {
      return row.flatMap((item, x) => (item === null ? [{ x, y }] : []));
    });
    if (emptyPos.length < count) {
      this.gameOver = true;
      return;
    }

    arrayShuffle(emptyPos, count).forEach(pos => {
      const value = Math.random() < 0.9 ? 2 : 4;
      const t = { id: idCounter++, value, ...pos };
      this.state.tiles.push(t);
      this.tileGrid[t.y][t.x] = t;
    });
    if (emptyPos.length === count && !this.canMerge()) {
      this.gameOver = true;
    }
  }

  private updateTileGrid(shouldRecreate = false) {
    if (!shouldRecreate) {
      this.tileGrid.forEach(row => row.fill(null));
    } else {
      this.tileGrid = Array.from({ length: this.props.boardWidth }, () =>
        Array.from({ length: this.props.boardWidth }, () => null),
      );
    }
    this.state.tiles.forEach(t => (this.tileGrid[t.y][t.x] = t));
  }

  private doMoveTiles({ prop, isReverse, getTiles }: MoveOptions) {
    const length = this.props.boardWidth;
    for (let i = 0; i < length; i++) {
      let tiles = getTiles(i).filter(t => t !== null);
      if (tiles.length === 0) continue;

      let offset: number;
      if (isReverse) {
        tiles = this.mergeTilesInLine(tiles.reverse()).reverse();
        offset = 0;
      } else {
        tiles = this.mergeTilesInLine(tiles);
        offset = length - tiles.length;
      }
      tiles.forEach((t, index) => (t[prop] = index + offset));
    }

    this.state.tiles = this.state.tiles.filter(t => t.value > 0);
  }

  private mergeTilesInLine(tiles: TileState[]) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const to = tiles[i];
      const from = tiles[i - 1];
      if (to.value === from.value) {
        from.value += to.value;
        to.value = 0;
        this.state.score += from.value;
        i--;
      }
    }
    return tiles.filter(t => t.value > 0);
  }
}

export function createModel(
  props: ModelProps = { boardWidth: 4, popupStart: 2, popupMoved: 1 },
) {
  const m = new G2048Model();
  m.init(props);
  return m;
}

export function tilesToGrid(tiles: TileState[], size: number) {
  const length = size;
  const grid = Array.from({ length }, () => Array.from({ length }, () => 0));
  tiles.forEach(t => (grid[t.y][t.x] = t.value));
  return grid;
}

export function gridToTiles(grid: number[][]) {
  const tiles: TileState[] = [];
  const size = grid.length;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = grid[y][x];
      if (value !== 0) {
        tiles.push({ x, y, value });
      }
    }
  }
  return tiles;
}
