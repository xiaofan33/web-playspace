import { describe, expect, it } from 'vitest'
import { allSolutions } from './solutions'

function isValidSolution(solution: number[]) {
  const seen = new Set()
  for (let row = 0; row < solution.length; row++) {
    const col = solution[row]
    if (
      !seen.add(`c${col}`) ||
      !seen.add(`d1${row - col}`) ||
      !seen.add(`d2${row + col}`)
    ) {
      return false
    }
  }
  return true
}

describe('测试可行解的数量', () => {
  const testCases = [
    { n: 3, expected: 0 },
    { n: 4, expected: 2 },
    { n: 8, expected: 92 },
    { n: 9, expected: 352 },
  ]

  testCases.forEach(({ n, expected }) => {
    it(`${n} 皇后应该返回 ${expected} 个解`, () => {
      allSolutions.forEach((solution, index) => {
        expect(solution(n).length, `nQueens$${index + 1}`).toBe(expected)
      })
    })
  })
})

describe('测试可行解的正确性', () => {
  const testCases = [8, 9]

  testCases.forEach(n => {
    it(`${n} 皇后返回的所有解应该都是有效的`, () => {
      allSolutions.forEach((solution, index) => {
        solution(n).forEach(s => {
          expect(isValidSolution(s), `nQueens$${index + 1}`).toBe(true)
        })
      })
    })
  })

  testCases.forEach(n => {
    it(`${n} 皇后返回的所有解应该都是唯一的`, () => {
      allSolutions.forEach((solution, index) => {
        const res = solution(n)
        const s = new Set()
        res.forEach(r => s.add(JSON.stringify(r)))
        expect(res.length, `nQueens$${index + 1}`).toBe(s.size)
      })
    })
  })
})

describe('打印 N-Queens 的求解时间', () => {
  const n = 13
  const times: number[] = []
  allSolutions.forEach((solution, index) => {
    const start = performance.now()
    solution(n)
    const end = performance.now()
    times.push(Math.round(end - start))
    it(`当 n = ${n}时, nQueens$${index + 1} 的求解耗时: ${times[index]}ms`)
  })
})
