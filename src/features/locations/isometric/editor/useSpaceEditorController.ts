import { useReducer, useCallback, useMemo } from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { useRoomLayoutStore } from '@/store/roomLayoutStore'
import { editorReducer, initialEditorState } from './editorReducer'
import { snapToGrid, validatePlacement } from './collision'
import { screenToWorld } from '../geometry/iso'

export interface UseSpaceEditorControllerOptions {
  locationId: string
  rows: number
  cols: number
  camera: { x: number; y: number; zoom: number }
  viewBox: { minX: number; minY: number; width: number; height: number }
  handlePointerMoveCamera: (e: React.PointerEvent<SVGSVGElement>) => void
}

export function useSpaceEditorController({
  locationId,
  rows,
  cols,
  camera,
  viewBox,
  handlePointerMoveCamera,
}: UseSpaceEditorControllerOptions) {
  const roomLayout = useRoomLayoutStore(state => state.getLayout(locationId))
  const placedObjects = useMemo(() => roomLayout?.objects ?? [], [roomLayout?.objects])

  const [editorState, dispatchEditor] = useReducer(
    editorReducer,
    placedObjects,
    initialEditorState
  )

  const roomWidthCm = cols * 50
  const roomDepthCm = rows * 50

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      handlePointerMoveCamera(e)
      if (editorState.mode !== 'space') return

      const rect = e.currentTarget.getBoundingClientRect()
      const clientX = e.clientX - rect.left
      const clientY = e.clientY - rect.top
      const svgX = viewBox.minX + (clientX / rect.width) * viewBox.width - camera.x
      const svgY = viewBox.minY + (clientY / rect.height) * viewBox.height - camera.y

      const world = screenToWorld(svgX, svgY)
      const snappedX = snapToGrid(world.x, e.shiftKey ? 1 : editorState.snapCm)
      const snappedY = snapToGrid(world.y, e.shiftKey ? 1 : editorState.snapCm)

      if (editorState.dragDrawStart) {
        dispatchEditor({ type: 'UPDATE_DRAW', point: { x: snappedX, y: snappedY } })
        return
      }

      if (editorState.tool === 'place' && editorState.activeCatalogTypeId) {
        const candidate: PlacedObject = {
          id: 'ghost',
          typeId: editorState.activeCatalogTypeId,
          x: snappedX,
          y: snappedY,
          z: 0,
          rotation: editorState.ghost?.rotation ?? 0,
        }

        const val = validatePlacement(candidate, placedObjects, roomWidthCm, roomDepthCm)
        dispatchEditor({
          type: 'UPDATE_GHOST',
          ghost: {
            typeId: editorState.activeCatalogTypeId,
            x: snappedX,
            y: snappedY,
            z: 0,
            rotation: candidate.rotation,
            isValid: val.isValid,
            reason: val.reason,
          },
        })
      }
    },
    [
      handlePointerMoveCamera,
      editorState.mode,
      editorState.tool,
      editorState.activeCatalogTypeId,
      editorState.ghost?.rotation,
      editorState.dragDrawStart,
      editorState.snapCm,
      viewBox.minX,
      viewBox.minY,
      viewBox.width,
      viewBox.height,
      camera.x,
      camera.y,
      placedObjects,
      roomWidthCm,
      roomDepthCm,
    ]
  )

  const handleClick = useCallback(() => {
    if (editorState.mode !== 'space') return

    if (editorState.tool === 'place' && editorState.ghost?.isValid) {
      const newId = `obj-${Date.now()}`
      const newObj: PlacedObject = {
        id: newId,
        typeId: editorState.ghost.typeId,
        x: editorState.ghost.x,
        y: editorState.ghost.y,
        z: editorState.ghost.z,
        rotation: editorState.ghost.rotation,
      }
      useRoomLayoutStore.getState().addObject(locationId, newObj)
      const updated = useRoomLayoutStore.getState().getLayout(locationId)?.objects ?? []
      dispatchEditor({ type: 'PUSH_HISTORY', objects: updated })
      dispatchEditor({ type: 'SELECT_OBJECT', id: newId })
      return
    }

    if (editorState.tool === 'furrow' || editorState.tool === 'bed' || editorState.tool === 'furrows') {
      if (!editorState.dragDrawStart) {
        if (editorState.ghost) {
          dispatchEditor({ type: 'START_DRAW', point: { x: editorState.ghost.x, y: editorState.ghost.y } })
        }
      } else if (editorState.dragDrawCurrent) {
        const start = editorState.dragDrawStart
        const curr = editorState.dragDrawCurrent
        const minX = Math.min(start.x, curr.x)
        const minY = Math.min(start.y, curr.y)
        const w = Math.max(50, Math.abs(curr.x - start.x))
        const d = Math.max(40, Math.abs(curr.y - start.y))

        if (editorState.tool === 'furrow') {
          const newId = `furrow-${Date.now()}`
          const newObj: PlacedObject = {
            id: newId,
            typeId: 'furrow',
            x: minX,
            y: start.y,
            z: 0,
            rotation: 0,
            params: { lengthCm: w, plantSpacingCm: 40 },
          }
          useRoomLayoutStore.getState().addObject(locationId, newObj)
        } else if (editorState.tool === 'bed') {
          const newId = `bed-${Date.now()}`
          const newObj: PlacedObject = {
            id: newId,
            typeId: 'raised_bed',
            x: minX,
            y: minY,
            z: 0,
            rotation: 0,
            params: { widthCm: w, depthCm: d, plantSpacingCm: 40, rowSpacingCm: 40 },
          }
          useRoomLayoutStore.getState().addObject(locationId, newObj)
        } else if (editorState.tool === 'furrows') {
          const numFurrows = Math.max(1, Math.floor(d / 70))
          for (let f = 0; f < numFurrows; f++) {
            const newObj: PlacedObject = {
              id: `furrow-${Date.now()}-${f}`,
              typeId: 'furrow',
              x: minX,
              y: minY + f * 70,
              z: 0,
              rotation: 0,
              params: { lengthCm: w, plantSpacingCm: 40 },
            }
            useRoomLayoutStore.getState().addObject(locationId, newObj)
          }
        }
        dispatchEditor({ type: 'FINISH_DRAW' })
        const updated = useRoomLayoutStore.getState().getLayout(locationId)?.objects ?? []
        dispatchEditor({ type: 'PUSH_HISTORY', objects: updated })
        dispatchEditor({ type: 'SET_TOOL', tool: 'select' })
      }
    }
  }, [
    editorState.mode,
    editorState.tool,
    editorState.ghost,
    editorState.dragDrawStart,
    editorState.dragDrawCurrent,
    locationId,
  ])

  const handleUndo = useCallback(() => {
    if (editorState.historyIndex > 0) {
      const prev = editorState.history[editorState.historyIndex - 1]
      if (prev && roomLayout) {
        useRoomLayoutStore.getState().setLayout(locationId, { ...roomLayout, objects: prev })
      }
      dispatchEditor({ type: 'UNDO' })
    }
  }, [editorState.historyIndex, editorState.history, roomLayout, locationId])

  const handleRedo = useCallback(() => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const next = editorState.history[editorState.historyIndex + 1]
      if (next && roomLayout) {
        useRoomLayoutStore.getState().setLayout(locationId, { ...roomLayout, objects: next })
      }
      dispatchEditor({ type: 'REDO' })
    }
  }, [editorState.historyIndex, editorState.history, roomLayout, locationId])

  return {
    editorState,
    dispatchEditor,
    placedObjects,
    roomWidthCm,
    roomDepthCm,
    handlePointerMove,
    handleClick,
    handleUndo,
    handleRedo,
  }
}
