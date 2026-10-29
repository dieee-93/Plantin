import React, { useState } from 'react'
import type { FacilityLocation } from '@/domain/location'

export interface RoomOtherLocationsBarProps {
  otherLocations: FacilityLocation[]
  onSwitchRoom: (locationId: string) => void
  onMovePlantToRoom: (individualId: string, targetLocationId: string) => void
  setMovingPlantId: React.Dispatch<React.SetStateAction<string | null>>
}

export const RoomOtherLocationsBar: React.FC<RoomOtherLocationsBarProps> = React.memo(({
  otherLocations,
  onSwitchRoom,
  onMovePlantToRoom,
  setMovingPlantId,
}) => {
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null)

  if (otherLocations.length === 0) return null

  const handleRoomDrop = (e: React.DragEvent, targetLocationId: string) => {
    e.preventDefault()
    setDragOverRoomId(null)
    const raw = e.dataTransfer.getData('application/plantin-dnd') || e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const payload = JSON.parse(raw)
      if (payload.kind === 'PLANT' && payload.individualId) {
        onMovePlantToRoom(payload.individualId, targetLocationId)
        setMovingPlantId(null)
      }
    } catch {
      // ignore
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderRadius: 14,
        padding: '8px 10px',
        maxWidth: 280,
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Otras Salas (Navegar / Soltar):
        </span>
      </div>
      {otherLocations.map(otherLoc => {
        const isDropTarget = dragOverRoomId === otherLoc.id
        return (
          <button
            key={otherLoc.id}
            type="button"
            aria-label={`Sala destino ${otherLoc.name}`}
            onClick={() => onSwitchRoom(otherLoc.id)}
            onDragOver={e => {
              e.preventDefault()
              setDragOverRoomId(otherLoc.id)
            }}
            onDragLeave={() => setDragOverRoomId(null)}
            onDrop={e => handleRoomDrop(e, otherLoc.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 8px',
              borderRadius: 8,
              border: isDropTarget ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              background: isDropTarget ? 'var(--accent-light)' : 'var(--surface-subtle)',
              color: isDropTarget ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{otherLoc.name}</span>
            <span
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                padding: '1px 4px',
                borderRadius: 4,
                background: 'var(--surface-muted)',
                color: 'var(--text-tertiary)',
              }}
            >
              {otherLoc.type}
            </span>
          </button>
        )
      })}
    </div>
  )
})

RoomOtherLocationsBar.displayName = 'RoomOtherLocationsBar'
