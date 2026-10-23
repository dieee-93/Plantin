import { describe, it, expect } from 'vitest'
import { isBehind, topologicalSortFootprints, type Footprint } from '../geometry/depth'

describe('topologicalSortFootprints and isBehind', () => {
  it('determines A is behind B when A has smaller X and non-overlapping footprint', () => {
    const a: Footprint = { x: 0, y: 0, w: 50, d: 50, z: 0, h: 50 }
    const b: Footprint = { x: 60, y: 0, w: 50, d: 50, z: 0, h: 50 }

    expect(isBehind(a, b)).toBe(true)
    expect(isBehind(b, a)).toBe(false)
  })

  it('determines A is behind B when A has smaller Y and non-overlapping footprint', () => {
    const a: Footprint = { x: 0, y: 0, w: 50, d: 50, z: 0, h: 50 }
    const b: Footprint = { x: 0, y: 60, w: 50, d: 50, z: 0, h: 50 }

    expect(isBehind(a, b)).toBe(true)
    expect(isBehind(b, a)).toBe(false)
  })

  it('orders supporting surface (bench) before object on top (pot at z=80)', () => {
    const bench: Footprint = { x: 50, y: 50, w: 120, d: 60, z: 0, h: 80 }
    const potOnBench: Footprint = { x: 60, y: 60, w: 30, d: 30, z: 80, h: 30 }

    expect(isBehind(bench, potOnBench)).toBe(true)
    expect(isBehind(potOnBench, bench)).toBe(false)

    const sorted = topologicalSortFootprints([
      { key: 'pot', footprint: potOnBench },
      { key: 'bench', footprint: bench },
    ])

    expect(sorted.map(s => s.key)).toEqual(['bench', 'pot'])
  })

  it('orders multi-tier shelf levels strictly from bottom to top', () => {
    const tierBottom: Footprint = { x: 10, y: 10, w: 40, d: 40, z: 0, h: 50 }
    const tierMiddle: Footprint = { x: 10, y: 10, w: 40, d: 40, z: 60, h: 50 }
    const tierTop: Footprint = { x: 10, y: 10, w: 40, d: 40, z: 120, h: 50 }

    const input = [
      { key: 'top', footprint: tierTop },
      { key: 'bottom', footprint: tierBottom },
      { key: 'middle', footprint: tierMiddle },
    ]

    const sorted = topologicalSortFootprints(input)
    expect(sorted.map(s => s.key)).toEqual(['bottom', 'middle', 'top'])
  })

  it('sorts a complex layout containing tank, bench, pots and foreground furrows', () => {
    const backgroundTank = { key: 'tank', footprint: { x: 0, y: 0, w: 80, d: 80, z: 0, h: 160 } }
    const midBench = { key: 'bench', footprint: { x: 100, y: 50, w: 120, d: 60, z: 0, h: 80 } }
    const potOnBench = { key: 'pot_on_bench', footprint: { x: 120, y: 60, w: 30, d: 30, z: 80, h: 30 } }
    const foregroundPot = { key: 'foreground_pot', footprint: { x: 150, y: 200, w: 35, d: 35, z: 0, h: 30 } }

    const sorted = topologicalSortFootprints([
      foregroundPot,
      potOnBench,
      backgroundTank,
      midBench,
    ])

    const keys = sorted.map(s => s.key)
    expect(keys.indexOf('tank')).toBeLessThan(keys.indexOf('foreground_pot'))
    expect(keys.indexOf('bench')).toBeLessThan(keys.indexOf('pot_on_bench'))
    expect(keys.indexOf('bench')).toBeLessThan(keys.indexOf('foreground_pot'))
  })

  it('handles empty and single-element inputs without error', () => {
    expect(topologicalSortFootprints([])).toEqual([])
    const single = [{ key: 'one', footprint: { x: 10, y: 10, w: 10, d: 10 } }]
    expect(topologicalSortFootprints(single)).toEqual(single)
  })
})
