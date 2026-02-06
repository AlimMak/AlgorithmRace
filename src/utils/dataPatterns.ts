import { createSeededRng } from './rng'

export type DataPattern = 'random' | 'nearly-sorted' | 'reversed' | 'few-unique'

export const dataPatternOptions: Array<{ value: DataPattern; label: string }> = [
  { value: 'random', label: 'Random' },
  { value: 'nearly-sorted', label: 'Nearly sorted' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'few-unique', label: 'Few unique values' },
]

const randomInt = (rng: () => number, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min

const swap = (arr: number[], i: number, j: number): void => {
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

export const generateDataset = ({
  size,
  pattern,
  seed,
}: {
  size: number
  pattern: DataPattern
  seed: number
}): number[] => {
  const rng = createSeededRng(seed)
  const base = Array.from({ length: size }, () => randomInt(rng, 12, 1000))

  if (pattern === 'random') {
    return base
  }

  if (pattern === 'nearly-sorted') {
    const values = [...base].sort((a, b) => a - b)
    const perturbations = Math.max(1, Math.floor(size * 0.08))

    for (let i = 0; i < perturbations; i += 1) {
      const left = randomInt(rng, 0, size - 1)
      const right = randomInt(rng, 0, size - 1)
      swap(values, left, right)
    }

    return values
  }

  if (pattern === 'reversed') {
    return [...base].sort((a, b) => b - a)
  }

  const uniquePool = Array.from({ length: 5 }, () => randomInt(rng, 40, 960)).sort((a, b) => a - b)
  return Array.from({ length: size }, () => uniquePool[randomInt(rng, 0, uniquePool.length - 1)])
}
