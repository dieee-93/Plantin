import type { PlacedObject } from '@/domain/roomLayout'

export type EditorMode = 'plants' | 'space'
export type EditorViewMode = 'iso' | 'plan'
export type EditorTool = 'select' | 'place' | 'furrow' | 'bed' | 'furrows'

export interface GhostObject {
  typeId: string
  x: number
  y: number
  z: number
  rotation: 0 | 90 | 180 | 270
  isValid: boolean
  reason?: string
}

export interface SpaceEditorState {
  mode: EditorMode
  viewMode: EditorViewMode
  tool: EditorTool
  selectedObjectId: string | null
  activeCatalogTypeId: string | null
  ghost: GhostObject | null
  isDragging: boolean
  dragOffset: { x: number; y: number }
  dragDrawStart: { x: number; y: number } | null
  dragDrawCurrent: { x: number; y: number } | null
  snapCm: number
  history: PlacedObject[][]
  historyIndex: number
}

export type EditorAction =
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'SET_VIEW_MODE'; viewMode: EditorViewMode }
  | { type: 'SET_TOOL'; tool: EditorTool; catalogTypeId?: string }
  | { type: 'SELECT_OBJECT'; id: string | null }
  | { type: 'START_DRAGGING'; objectId: string; pointerWorldX: number; pointerWorldY: number; objX: number; objY: number }
  | { type: 'STOP_DRAGGING' }
  | { type: 'START_DRAW'; point: { x: number; y: number } }
  | { type: 'UPDATE_DRAW'; point: { x: number; y: number } }
  | { type: 'CANCEL_DRAW' }
  | { type: 'FINISH_DRAW' }
  | { type: 'UPDATE_GHOST'; ghost: GhostObject | null }
  | { type: 'SET_SNAP'; snapCm: number }
  | { type: 'PUSH_HISTORY'; objects: PlacedObject[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
