export type SetLike = { setNumber: number }

export const createSetId = (exerciseId: string): string => {
  const uuid = (typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto)
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${exerciseId}-${uuid}`
}

export const reindexSets = <T extends SetLike>(sets: T[]): T[] => (
  sets.map((set, index) => ({ ...set, setNumber: index + 1 }))
)
