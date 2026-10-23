import React, { useEffect, useCallback, useState } from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import type { SpaceEditorState, EditorAction } from './editorTypes'
import { useRoomLayoutStore } from '@/store/roomLayoutStore'
import { useIndividualStore } from '@/store/individualStore'
import { CatalogDrawer } from './ui/CatalogDrawer'
import { ObjectContextBar } from './ui/ObjectContextBar'
import { EditorHelpFooter } from './ui/EditorHelpFooter'

import type { LocationType } from '@/domain/location'
import { getTemplatesForLocationType } from '../templates'

export interface SpaceEditorOverlayProps {
  locationId: string
  locationType?: LocationType
  roomWidthCm: number
  roomDepthCm: number
  state: SpaceEditorState
  dispatch: React.Dispatch<EditorAction>
  activeCropCode?: string
}

export const SpaceEditorOverlay: React.FC<SpaceEditorOverlayProps> = ({
  locationId,
  locationType = 'greenhouse',
  roomWidthCm,
  roomDepthCm,
  state,
  dispatch,
  activeCropCode,
}) => {
  const layout = useRoomLayoutStore(s => s.getLayout(locationId))
  const objects = layout?.objects ?? []
  const templates = getTemplatesForLocationType(locationType)

  const selectedObject = objects.find(o => o.id === state.selectedObjectId)

  const [unplacedToast, setUnplacedToast] = useState<{
    count: number
    undoData: { indId: string; slotId?: string; position?: string }[]
    prevObjects: PlacedObject[]
  } | null>(null)

  // Acciones sobre el objeto seleccionado
  const handleRotate = useCallback(() => {
    if (selectedObject) {
      const nextRot = ((selectedObject.rotation + 90) % 360) as 0 | 90 | 180 | 270
      useRoomLayoutStore.getState().updateObject(locationId, selectedObject.id, { rotation: nextRot })
      const updated = (useRoomLayoutStore.getState().getLayout(locationId)?.objects ?? [])
      dispatch({ type: 'PUSH_HISTORY', objects: updated })
    } else if (state.ghost) {
      const nextRot = ((state.ghost.rotation + 90) % 360) as 0 | 90 | 180 | 270
      dispatch({ type: 'UPDATE_GHOST', ghost: { ...state.ghost, rotation: nextRot } })
    }
  }, [selectedObject, state.ghost, locationId, dispatch])

  const handleDuplicate = useCallback(() => {
    if (!selectedObject) return
    const newId = `obj-${Date.now()}`
    const duplicated: PlacedObject = {
      ...selectedObject,
      id: newId,
      x: Math.min(roomWidthCm - 50, selectedObject.x + 20),
      y: Math.min(roomDepthCm - 50, selectedObject.y + 20),
      label: selectedObject.label ? `${selectedObject.label} (Copia)` : undefined,
    }
    useRoomLayoutStore.getState().addObject(locationId, duplicated)
    const updated = (useRoomLayoutStore.getState().getLayout(locationId)?.objects ?? [])
    dispatch({ type: 'PUSH_HISTORY', objects: updated })
    dispatch({ type: 'SELECT_OBJECT', id: newId })
  }, [selectedObject, locationId, roomWidthCm, roomDepthCm, dispatch])

  const handleUpdateParams = useCallback((patch: Record<string, number | string | boolean>) => {
    if (!selectedObject) return
    useRoomLayoutStore.getState().updateObject(locationId, selectedObject.id, {
      params: { ...selectedObject.params, ...patch },
    })
    const updated = (useRoomLayoutStore.getState().getLayout(locationId)?.objects ?? [])
    dispatch({ type: 'PUSH_HISTORY', objects: updated })
  }, [selectedObject, locationId, dispatch])

  const handleDelete = useCallback(() => {
    if (!selectedObject) return
    const prevObjects = (useRoomLayoutStore.getState().getLayout(locationId)?.objects ?? [])

    // Proteger plantas: si tenían asignado este objeto, pasan a "Sin ubicar" con opción de deshacer
    const inds = useIndividualStore.getState().individuals.filter(i => i.locationId === locationId)
    const affected = inds.filter(
      i => (i.slotId && i.slotId.startsWith(selectedObject.id)) || i.position === selectedObject.label
    )

    if (affected.length > 0) {
      const undoData = affected.map(i => ({ indId: i.id, slotId: i.slotId, position: i.position }))
      affected.forEach(i => {
        useIndividualStore.getState().update(i.id, { slotId: undefined, position: 'Sin ubicar' })
      })
      setUnplacedToast({
        count: affected.length,
        undoData,
        prevObjects,
      })
    }

    useRoomLayoutStore.getState().removeObject(locationId, selectedObject.id)
    const updated = (useRoomLayoutStore.getState().getLayout(locationId)?.objects ?? [])
    dispatch({ type: 'PUSH_HISTORY', objects: updated })
    dispatch({ type: 'SELECT_OBJECT', id: null })
  }, [selectedObject, locationId, dispatch])

  const handleUndoToast = useCallback(() => {
    if (!unplacedToast) return
    if (layout) {
      useRoomLayoutStore.getState().setLayout(locationId, { ...layout, objects: unplacedToast.prevObjects })
      dispatch({ type: 'PUSH_HISTORY', objects: unplacedToast.prevObjects })
    }
    unplacedToast.undoData.forEach(item => {
      useIndividualStore.getState().update(item.indId, {
        slotId: item.slotId,
        position: item.position,
      })
    })
    setUnplacedToast(null)
  }, [unplacedToast, layout, locationId, dispatch])

  // Atajos de teclado en modo espacio
  useEffect(() => {
    if (state.mode !== 'space') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return

      // Rotar (R)
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleRotate()
      }

      // Duplicar (Ctrl+D o Cmd+D)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        handleDuplicate()
      }

      // Deshacer (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (state.historyIndex > 0) {
          const prevObjects = state.history[state.historyIndex - 1]
          if (prevObjects && layout) {
            useRoomLayoutStore.getState().setLayout(locationId, { ...layout, objects: prevObjects })
          }
          dispatch({ type: 'UNDO' })
        }
      }

      // Rehacer (Ctrl+Shift+Z o Ctrl+Y)
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault()
        if (state.historyIndex < state.history.length - 1) {
          const nextObjects = state.history[state.historyIndex + 1]
          if (nextObjects && layout) {
            useRoomLayoutStore.getState().setLayout(locationId, { ...layout, objects: nextObjects })
          }
          dispatch({ type: 'REDO' })
        }
      }

      // Borrar (Delete / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedObjectId) {
          e.preventDefault()
          handleDelete()
        }
      }

      // Escape: cancelar colocación o deseleccionar
      if (e.key === 'Escape') {
        e.preventDefault()
        if (state.tool === 'place') {
          dispatch({ type: 'SET_TOOL', tool: 'select' })
        } else if (state.selectedObjectId) {
          dispatch({ type: 'SELECT_OBJECT', id: null })
        } else {
          dispatch({ type: 'SET_MODE', mode: 'plants' })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, handleRotate, handleDuplicate, handleDelete, locationId, layout, dispatch])

  if (state.mode !== 'space') return null

  return (
    <>
      {/* Barra contextual si hay un objeto seleccionado */}
      {selectedObject && (
        <ObjectContextBar
          selectedObject={selectedObject}
          activeCropCode={activeCropCode}
          onRotate={handleRotate}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onDeselect={() => dispatch({ type: 'SELECT_OBJECT', id: null })}
          onUpdateParams={handleUpdateParams}
        />
      )}

      {/* Estado vacío: sugerir plantillas y herramientas */}
      {objects.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            color: '#f8fafc',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 35,
            maxWidth: 420,
            width: '90%',
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
            🌱 Espacio sin objetos
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
            Aplicá una plantilla recomendada o elegí un elemento del catálogo inferior:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {templates.slice(0, 3).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  const newLayout = useRoomLayoutStore.getState().createFromTemplate(locationId, tpl.id)
                  dispatch({ type: 'PUSH_HISTORY', objects: newLayout.objects })
                }}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
              >
                📐 {tpl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toast informativo de plantas pasadas a "Sin ubicar" con botón Deshacer */}
      {unplacedToast && (
        <div
          style={{
            position: 'absolute',
            bottom: 74,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(234, 88, 12, 0.95)',
            color: '#ffffff',
            padding: '6px 16px',
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 40,
            fontSize: 12,
            fontWeight: 500,
            backdropFilter: 'blur(6px)',
          }}
        >
          <span>{unplacedToast.count} planta(s) pasaron a "Sin ubicar"</span>
          <button
            type="button"
            onClick={handleUndoToast}
            style={{
              background: '#ffffff',
              color: '#c2410c',
              border: 'none',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Deshacer
          </button>
        </div>
      )}

      {/* Cajón de catálogo inferior */}
      <CatalogDrawer
        activeCatalogTypeId={state.activeCatalogTypeId}
        activeTool={state.tool}
        onSelectTool={(tool) => {
          dispatch({ type: 'SET_TOOL', tool })
        }}
        onSelectObjectToPlace={(typeId) => {
          dispatch({ type: 'SET_TOOL', tool: 'place', catalogTypeId: typeId })
        }}
      />

      {/* Pie de ayuda contextual */}
      <EditorHelpFooter
        tool={state.tool}
        hasSelection={Boolean(selectedObject)}
      />
    </>
  )
}
