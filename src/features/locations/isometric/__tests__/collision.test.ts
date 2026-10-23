import { describe, it, expect } from 'vitest'
import {
  snapToGrid,
  checkAABBOverlap,
  isWithinRoom,
  validatePlacement,
  getObjectBox,
} from '../editor/collision'
import type { PlacedObject } from '@/domain/roomLayout'

describe('editor collision and snapping', () => {
  it('snaps values to nearest 10 cm by default', () => {
    expect(snapToGrid(14)).toBe(10)
    expect(snapToGrid(16)).toBe(20)
    expect(snapToGrid(50)).toBe(50)
    expect(snapToGrid(123, 10)).toBe(120)
  })

  it('snaps values to custom snap interval (e.g. 50 cm or 1 cm for free shift)', () => {
    expect(snapToGrid(48, 50)).toBe(50)
    expect(snapToGrid(14.7, 1)).toBe(15)
  })

  it('correctly calculates rotated object box dimensions', () => {
    const unrotated: PlacedObject = {
      id: '1',
      typeId: 'bench',
      x: 10,
      y: 20,
      z: 0,
      rotation: 0, // bench is 120w x 60d x 80h
    }
    const box0 = getObjectBox(unrotated)
    expect(box0.w).toBe(120)
    expect(box0.d).toBe(60)

    const rotated90: PlacedObject = {
      ...unrotated,
      rotation: 90,
    }
    const box90 = getObjectBox(rotated90)
    expect(box90.w).toBe(60)
    expect(box90.d).toBe(120)
  })

  it('detects 2D AABB overlaps', () => {
    const a = { x: 0, y: 0, w: 100, d: 100 }
    const b = { x: 50, y: 50, w: 100, d: 100 }
    const c = { x: 120, y: 0, w: 50, d: 50 }

    expect(checkAABBOverlap(a, b)).toBe(true)
    expect(checkAABBOverlap(a, c)).toBe(false)
  })

  it('checks if an object is within room boundaries', () => {
    const roomW = 400
    const roomD = 300

    expect(isWithinRoom({ x: 0, y: 0, w: 100, d: 100 }, roomW, roomD)).toBe(true)
    expect(isWithinRoom({ x: 350, y: 0, w: 100, d: 100 }, roomW, roomD)).toBe(false) // overflows X
    expect(isWithinRoom({ x: -10, y: 0, w: 50, d: 50 }, roomW, roomD)).toBe(false) // negative X
    expect(isWithinRoom({ x: 0, y: 250, w: 50, d: 100 }, roomW, roomD)).toBe(false) // overflows Y
  })

  it('validates placement: detects collisions at same Z level', () => {
    const roomW = 500
    const roomD = 500

    const existingBench: PlacedObject = {
      id: 'bench-1',
      typeId: 'bench',
      label: 'Mesada 1',
      x: 100,
      y: 100,
      z: 0,
      rotation: 0,
    }

    const collidingPot: PlacedObject = {
      id: 'pot-1',
      typeId: 'pot_20l',
      label: 'Maceta A',
      x: 120,
      y: 120,
      z: 0,
      rotation: 0,
    }

    const result = validatePlacement(collidingPot, [existingBench], roomW, roomD)
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('Choca con Mesada 1')
  })

  it('validates placement: allows stacking on different Z levels (pot at z=80 on top of bench)', () => {
    const roomW = 500
    const roomD = 500

    const existingBench: PlacedObject = {
      id: 'bench-1',
      typeId: 'bench',
      label: 'Mesada 1',
      x: 100,
      y: 100,
      z: 0,
      rotation: 0,
    }

    // Pot is on the surface of the bench (z = 80 cm)
    const potOnBench: PlacedObject = {
      id: 'pot-on-bench',
      typeId: 'pot_20l',
      label: 'Maceta en mesada',
      x: 120,
      y: 120,
      z: 80,
      rotation: 0,
    }

    const result = validatePlacement(potOnBench, [existingBench], roomW, roomD)
    expect(result.isValid).toBe(true)
  })
})
