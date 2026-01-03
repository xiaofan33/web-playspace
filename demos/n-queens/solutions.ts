export function nQueens$1(n = 8) {
  const solutions: number[][] = []
  const solution: number[] = Array(n)
  backtrack()
  return solutions

  function backtrack(
    y = 0,
    columns: boolean[] = Array(n),
    lt2rb: boolean[] = Array(n + n - 1),
    rt2lb: boolean[] = Array(n + n - 1),
  ) {
    if (y === n) {
      solutions.push([...solution])
      return
    }
    for (let x = 0; x < n; x++) {
      let d1: number, d2: number
      if (columns[x] || lt2rb[(d1 = y + x)] || rt2lb[(d2 = y - x + n)]) {
        continue
      }
      solution[y] = x
      columns[x] = lt2rb[d1] = rt2lb[d2] = true
      backtrack(y + 1, columns, lt2rb, rt2lb)
      columns[x] = lt2rb[d1] = rt2lb[d2] = false
    }
  }
}

export function nQueens$2(n = 8) {
  const solutions: number[][] = []
  const solution: number[] = Array(n)
  backtrack()
  return solutions

  function backtrack(y = 0, columns = 0, lt2rb = 0, rt2lb = 0) {
    if (y === n) {
      solutions.push([...solution])
      return
    }
    for (let x = 0; x < n; x++) {
      let d1: number, d2: number
      if (
        columns & (1 << x) ||
        lt2rb & (d1 = 1 << (y + x)) ||
        rt2lb & (d2 = 1 << (y - x + n))
      ) {
        continue
      }
      solution[y] = x
      backtrack(y + 1, columns | (1 << x), lt2rb | d1, rt2lb | d2)
    }
  }
}

export function nQueens$3(n = 8) {
  const solutions: number[][] = []
  const solution: number[] = Array(n)
  const bitmask = (1 << n) - 1
  backtrack()
  return solutions

  function backtrack(y = 0, columns = 0, lt2rb = 0, rt2lb = 0) {
    if (y === n) {
      solutions.push([...solution])
      return
    }
    let availablePos = bitmask & ~(columns | lt2rb | rt2lb)
    while (availablePos) {
      const pos = availablePos & -availablePos
      const x = 31 - Math.clz32(pos)
      solution[y] = x
      backtrack(y + 1, columns | pos, (lt2rb | pos) << 1, (rt2lb | pos) >> 1)
      availablePos ^= pos
    }
  }
}

export function nQueens$4(n = 8) {
  const solutions: number[][] = []
  const solution: number[] = Array(n)
  const bitmask = (1 << n) - 1
  const middle = (n + 1) >> 1
  backtrack()
  return [...solutions, ...getTheOtherHalf(n, solutions)]

  function backtrack(y = 0, columns = 0, lt2rb = 0, rt2lb = 0) {
    if (y === n) {
      solutions.push([...solution])
      return
    }
    let availablePos = bitmask & ~(columns | lt2rb | rt2lb)
    while (availablePos) {
      const pos = availablePos & -availablePos
      const x = 31 - Math.clz32(pos)
      if (y === 0 && x >= middle) {
        return
      }
      solution[y] = x
      backtrack(y + 1, columns | pos, (lt2rb | pos) << 1, (rt2lb | pos) >> 1)
      availablePos ^= pos
    }
  }

  function getTheOtherHalf(n: number, arr: number[][]) {
    const ret: number[][] = []
    const isEven = !(n & 1)
    if (isEven) {
      for (let i = arr.length - 1; i >= 0; i--) {
        ret.push(arr[i].map(x => n - 1 - x))
      }
    } else {
      const middle = n >> 1
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i][0] !== middle) {
          ret.push(arr[i].map(x => n - 1 - x))
        }
      }
    }
    return ret
  }
}

export const allSolutions = [nQueens$1, nQueens$2, nQueens$3, nQueens$4]
