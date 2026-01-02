import { describe, expect, it } from 'vitest';
import {
  createModel,
  tilesToGrid,
  gridToTiles,
  type ModelProps,
} from './model';

function createTestModel(board: number[][], props?: Partial<ModelProps>) {
  return createModel({
    boardWidth: board.length,
    popupStart: 2,
    popupMoved: 0,
    currentState: {
      tiles: gridToTiles(board),
    },
    ...props,
  });
}

describe('G2048Model - Utility Functions', () => {
  it('should convert board to tiles correctly', () => {
    const board = [
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 16],
    ];

    const tiles = gridToTiles(board);
    expect(tiles).toHaveLength(4);
    expect(tiles).toContainEqual({ value: 2, x: 0, y: 0 });
    expect(tiles).toContainEqual({ value: 4, x: 1, y: 1 });
    expect(tiles).toContainEqual({ value: 8, x: 2, y: 2 });
    expect(tiles).toContainEqual({ value: 16, x: 3, y: 3 });
  });

  it('should convert tiles to board correctly', () => {
    const tiles = [
      { value: 2, x: 0, y: 0 },
      { value: 4, x: 1, y: 1 },
      { value: 8, x: 2, y: 2 },
      { value: 16, x: 3, y: 3 },
    ];

    const board = tilesToGrid(tiles, 4);
    expect(board).toEqual([
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 16],
    ]);
  });
});

describe('G2048Model - Movement', () => {
  const initialBoard = [
    [2, 0, 2, 0],
    [2, 2, 4, 4],
    [2, 2, 4, 8],
    [2, 2, 2, 0],
  ];

  const movementTests = [
    {
      direction: 'right' as const,
      expected: [
        [0, 0, 0, 4],
        [0, 0, 4, 8],
        [0, 4, 4, 8],
        [0, 0, 2, 4],
      ],
    },
    {
      direction: 'down' as const,
      expected: [
        [0, 0, 0, 0],
        [0, 0, 2, 0],
        [4, 2, 8, 4],
        [4, 4, 2, 8],
      ],
    },
    {
      direction: 'left' as const,
      expected: [
        [4, 0, 0, 0],
        [4, 8, 0, 0],
        [4, 4, 8, 0],
        [4, 2, 0, 0],
      ],
    },
    {
      direction: 'up' as const,
      expected: [
        [4, 4, 2, 4],
        [4, 2, 8, 8],
        [0, 0, 2, 0],
        [0, 0, 0, 0],
      ],
    },
  ];

  it.each(movementTests)(
    'should move tiles $direction correctly',
    ({ direction, expected }) => {
      const model = createTestModel(initialBoard);
      model.move(direction);
      expect(tilesToGrid(model.state.tiles, 4)).toEqual(expected);
    },
  );
});

describe('G2048Model - Scoring', () => {
  it('should calculate score correctly after merging tiles', () => {
    const board = [
      [2, 0, 2, 0],
      [2, 2, 4, 4],
      [2, 2, 4, 8],
      [2, 2, 2, 0],
    ];

    const model = createTestModel(board);
    const initialScore = model.state.score;
    model.move('right');

    // Expected merges: 2+2=4, 2+2=4, 4+4=8, 2+2=4, 2+2=4
    const expectedScoreIncrease = 4 + 4 + 8 + 4 + 4;
    expect(model.state.score).toBe(initialScore + expectedScoreIncrease);
  });

  it('should not increase score when no tiles merge', () => {
    const board = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const model = createTestModel(board);
    const initialScore = model.state.score;
    model.move('right');

    expect(model.state.score).toBe(initialScore);
  });
});

describe('G2048Model - Game Over State', () => {
  it('should detect game over state correctly', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];

    const model = createTestModel(board);
    // Game over is not set immediately on init
    expect(model.canMove()).toBe(true);
    expect(model.canMerge()).toBe(false);
  });

  it('should not set gameOver when moves are still possible', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 8],
      [4, 2, 4, 8],
    ];

    const model = createTestModel(board);
    model.move('right');
    expect(model.canMove()).toBe(true);
  });

  it('should set gameOver when no moves are possible', () => {
    const board = [
      [8, 16, 8, 16],
      [16, 8, 16, 8],
      [32, 16, 8, 32],
      [16, 32, 16, 32],
    ];

    const model = createTestModel(board, { popupMoved: 1 });
    model.move('up');
    expect(model.canMove()).toBe(false);
  });
});
