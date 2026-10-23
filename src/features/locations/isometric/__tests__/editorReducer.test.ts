import { describe, it, expect } from 'vitest'
import { editorReducer, initialEditorState } from '../editor/editorReducer'
import type { PlacedObject } from '@/domain/roomLayout'

describe('editorReducer state machine', () => {
  const sampleObj: PlacedObject = {
    id: 'obj-1',
    typeId: 'bench',
    x: 50,
    y: 50,
    z: 0,
    rotation: 0,
  }

  it('initializes with default values', () => {
    const state = initialEditorState([sampleObj])
    expect(state.mode).toBe('plants')
    expect(state.viewMode).toBe('iso')
    expect(state.tool).toBe('select')
    expect(state.selectedObjectId).toBeNull()
    expect(state.history).toHaveLength(1)
    expect(state.historyIndex).toBe(0)
  })

  it('switches between plants and space mode cleanly', () => {
    let state = initialEditorState([sampleObj])
    state = editorReducer(state, { type: 'SET_MODE', mode: 'space' })
    expect(state.mode).toBe('space')

    // Selecting an object
    state = editorReducer(state, { type: 'SELECT_OBJECT', id: 'obj-1' })
    expect(state.selectedObjectId).toBe('obj-1')

    // Leaving space mode clears selection
    state = editorReducer(state, { type: 'SET_MODE', mode: 'plants' })
    expect(state.mode).toBe('plants')
    expect(state.selectedObjectId).toBeNull()
  })

  it('switches view mode between isometric and plan view', () => {
    let state = initialEditorState()
    expect(state.viewMode).toBe('iso')
    state = editorReducer(state, { type: 'SET_VIEW_MODE', viewMode: 'plan' })
    expect(state.viewMode).toBe('plan')
  })

  it('handles undo and redo history progression', () => {
    let state = initialEditorState([sampleObj])

    const modified1: PlacedObject[] = [
      { ...sampleObj, x: 100 },
    ]
    state = editorReducer(state, { type: 'PUSH_HISTORY', objects: modified1 })
    expect(state.history).toHaveLength(2)
    expect(state.historyIndex).toBe(1)

    const modified2: PlacedObject[] = [
      { ...sampleObj, x: 200 },
    ]
    state = editorReducer(state, { type: 'PUSH_HISTORY', objects: modified2 })
    expect(state.history).toHaveLength(3)
    expect(state.historyIndex).toBe(2)

    // Undo
    state = editorReducer(state, { type: 'UNDO' })
    expect(state.historyIndex).toBe(1)
    expect(state.history[state.historyIndex][0].x).toBe(100)

    // Undo again to initial
    state = editorReducer(state, { type: 'UNDO' })
    expect(state.historyIndex).toBe(0)
    expect(state.history[state.historyIndex][0].x).toBe(50)

    // Undo at index 0 does nothing
    state = editorReducer(state, { type: 'UNDO' })
    expect(state.historyIndex).toBe(0)

    // Redo
    state = editorReducer(state, { type: 'REDO' })
    expect(state.historyIndex).toBe(1)
    expect(state.history[state.historyIndex][0].x).toBe(100)
  })

  it('switches to place tool and updates ghost preview', () => {
    let state = initialEditorState()
    state = editorReducer(state, { type: 'SET_TOOL', tool: 'place', catalogTypeId: 'water_tank' })
    expect(state.tool).toBe('place')
    expect(state.activeCatalogTypeId).toBe('water_tank')

    state = editorReducer(state, {
      type: 'UPDATE_GHOST',
      ghost: {
        typeId: 'water_tank',
        x: 100,
        y: 100,
        z: 0,
        rotation: 0,
        isValid: true,
      },
    })
    expect(state.ghost).not.toBeNull()
    expect(state.ghost?.isValid).toBe(true)
  })

  it('prevents history flooding during continuous drag-draw (multiple UPDATE_DRAW events do not inflate history)', () => {
    let state = initialEditorState([sampleObj])
    expect(state.history).toHaveLength(1)

    // Iniciar trazado
    state = editorReducer(state, { type: 'START_DRAW', point: { x: 50, y: 50 } })
    expect(state.dragDrawStart).toEqual({ x: 50, y: 50 })
    expect(state.dragDrawCurrent).toEqual({ x: 50, y: 50 })
    expect(state.history).toHaveLength(1) // No agrega historial

    // Simular 50 eventos pointermove rápidos
    for (let i = 1; i <= 50; i++) {
      state = editorReducer(state, { type: 'UPDATE_DRAW', point: { x: 50 + i * 2, y: 50 } })
    }
    expect(state.dragDrawCurrent).toEqual({ x: 150, y: 50 })
    // El historial permanece exactamente en 1, evitando saturación
    expect(state.history).toHaveLength(1)
    expect(state.historyIndex).toBe(0)

    // Al finalizar el trazado, se limpia el borrador temporal
    state = editorReducer(state, { type: 'FINISH_DRAW' })
    expect(state.dragDrawStart).toBeNull()
    expect(state.dragDrawCurrent).toBeNull()

    // Solo se emite un único PUSH_HISTORY al confirmar
    const newObjects = [...state.history[0], { ...sampleObj, id: 'furrow-1', x: 50 }]
    state = editorReducer(state, { type: 'PUSH_HISTORY', objects: newObjects })
    expect(state.history).toHaveLength(2)
    expect(state.historyIndex).toBe(1)
  })

  it('resets tool, ghost preview, and drag coordinates cleanly when switching from space to plants mode', () => {
    let state = initialEditorState([sampleObj])
    state = editorReducer(state, { type: 'SET_MODE', mode: 'space' })
    state = editorReducer(state, { type: 'SET_TOOL', tool: 'place', catalogTypeId: 'pot_20l' })
    state = editorReducer(state, {
      type: 'UPDATE_GHOST',
      ghost: { typeId: 'pot_20l', x: 10, y: 10, z: 0, rotation: 0, isValid: true },
    })
    state = editorReducer(state, { type: 'SELECT_OBJECT', id: 'obj-1' })

    // Salir al modo Cultivo
    state = editorReducer(state, { type: 'SET_MODE', mode: 'plants' })
    expect(state.mode).toBe('plants')
    expect(state.tool).toBe('select')
    expect(state.activeCatalogTypeId).toBeNull()
    expect(state.ghost).toBeNull()
    expect(state.selectedObjectId).toBeNull()
    expect(state.dragDrawStart).toBeNull()
    expect(state.dragDrawCurrent).toBeNull()
  })

  it('caps history size to a maximum of 30 states to prevent memory leaks', () => {
    let state = initialEditorState([sampleObj])

    // Agregar 40 estados al historial
    for (let i = 1; i <= 40; i++) {
      state = editorReducer(state, {
        type: 'PUSH_HISTORY',
        objects: [{ ...sampleObj, x: i * 10 }],
      })
    }

    expect(state.history.length).toBe(30)
    expect(state.historyIndex).toBe(29)
  })
})
