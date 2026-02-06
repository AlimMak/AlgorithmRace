const stringHash = (input: string): number => {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const normalizeSeed = (input?: string | number | null): number => {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input >>> 0
  }

  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) {
      return randomSeed()
    }

    const asNumber = Number.parseInt(trimmed, 10)
    if (Number.isFinite(asNumber)) {
      return asNumber >>> 0
    }

    return stringHash(trimmed)
  }

  return randomSeed()
}

export const createSeededRng = (seed: number): (() => number) => {
  let value = seed >>> 0

  return () => {
    value += 0x6d2b79f5
    let result = Math.imul(value ^ (value >>> 15), value | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export const randomSeed = (): number => {
  const randomPart = Math.floor(Math.random() * 0xffffffff)
  return (Date.now() ^ randomPart) >>> 0
}
