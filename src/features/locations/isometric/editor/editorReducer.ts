import type { PlacedObject } from '@/domain/roomLayout'
import type { SpaceEditorState, EditorAction } from './editorTypes'

export function initialEditorState(initialObjects: PlacedObject[] = []): SpaceEditorState {
  return {
    mode: 'plants',
    viewMode: 'iso',
    tool: 'select',
    selectedObjectId: null,
    activeCatalogTypeId: null,
    ghost: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    dragDrawStart: null,
    dragDrawCurrent: null,
    snapCm: 10,
    history: [initialObjects],
    historyIndex: 0,
  }
}

export function editorReducer(state: SpaceEditorState, action: EditorAction): SpaceEditorState {
  switch (action.type) {
    case 'START_DRAW': {
      return {
        ...state,
        dragDrawStart: action.point,
        dragDrawCurrent: action.point,
      }
    }

    case 'UPDATE_DRAW': {
      return {
        ...state,
        dragDrawCurrent: action.point,
      }
    }

    case 'CANCEL_DRAW':
    case 'FINISH_DRAW': {
      return {
        ...state,
        dragDrawStart: null,
        dragDrawCurrent: null,
      }
    }

    case 'SET_MODE': {
      if (action.mode === state.mode) return state
      return {
        ...state,
        mode: action.mode,
        selectedObjectId: null,
        activeCatalogTypeId: null,
        ghost: null,
        isDragging: false,
        dragDrawStart: null,
        dragDrawCurrent: null,
        tool: 'select',
      }
    }

    case 'SET_VIEW_MODE': {
      return {
        ...state,
        viewMode: action.viewMode,
      }
    }

    case 'SET_TOOL': {
      return {
        ...state,
        tool: action.tool,
        activeCatalogTypeId: action.catalogTypeId ?? null,
        selectedObjectId: action.tool === 'place' ? null : state.selectedObjectId,
        ghost: null,
      }
    }

    case 'SELECT_OBJECT': {
      return {
        ...state,
        selectedObjectId: action.id,
        tool: 'select',
        activeCatalogTypeId: null,
        ghost: null,
      }
    }

    case 'START_DRAGGING': {
      return {
        ...state,
        selectedObjectId: action.objectId,
        isDragging: true,
        dragOffset: {
          x: action.pointerWorldX - action.objX,
          y: action.pointerWorldY - action.objY,
        },
      }
    }

    case 'STOP_DRAGGING': {
      return {
        ...state,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
      }
    }

    case 'UPDATE_GHOST': {
      return {
        ...state,
        ghost: action.ghost,
      }
    }

    case 'SET_SNAP': {
      return {
        ...state,
        snapCm: action.snapCm,
      }
    }

    case 'PUSH_HISTORY': {
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(action.objects)
      // Mantener máx 30 estados en historial
      if (newHistory.length > 30) {
        newHistory.shift()
      }
      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      return {
        ...state,
        historyIndex: state.historyIndex - 1,
        selectedObjectId: null,
        ghost: null,
      }
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      return {
        ...state,
        historyIndex: state.historyIndex + 1,
        selectedObjectId: null,
        ghost: null,
      }
    }

    default:
      return state
  }
}
