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
})
