let currentHoveredSlot: string | null = null
const listeners = new Set<() => void>()

export function setHoveredSlot(slot: string | null): void {
  if (currentHoveredSlot === slot) return
  currentHoveredSlot = slot
  listeners.forEach(fn => fn())
}

export function getHoveredSlot(): string | null {
  return currentHoveredSlot
}

export function subscribeHover(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}
