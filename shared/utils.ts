/**
 * 随机打乱数组并返回指定长度的子数组
 *
 * @template T - 数组元素类型
 * @param array - 要打乱的源数组
 * @param length - 返回的子数组长度，默认返回全部
 * @returns 打乱后的新数组
 */
export function arrayShuffle<T>(array: T[], length?: number) {
  const sourceLength = array.length
  const targetLength = length
    ? Math.max(0, Math.min(length, sourceLength))
    : sourceLength

  if (targetLength === 0) return []

  if (targetLength === 1) {
    const randomIndex = Math.floor(Math.random() * sourceLength)
    return [array[randomIndex]]
  }

  for (let i = 0; i < targetLength; i++) {
    const j = i + Math.floor(Math.random() * (sourceLength - i))
    ;[array[i], array[j]] = [array[j], array[i]]
  }

  return array.slice(0, targetLength)
}

/**
 * 生成指定范围内的随机整数
 *
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @returns 返回 min 到 max 之间的随机整数
 *
 * @throws {RangeError} 当 min > max 时抛出
 */
export function getRandomInt(min: number, max: number) {
  if (min > max) {
    throw new RangeError('min must be less than or equal to max')
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomWeighted<T>(
  items: ReadonlyArray<{ value: T; weight: number }>,
) {
  if (items.length === 0) {
    throw new Error('Items array cannot be empty')
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0')
  }

  let random = Math.random() * totalWeight
  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item.value
    }
  }

  return items[items.length - 1].value
}
