import React from 'react'
import { Tag, Sun, Moon, Eye, Building2 } from 'lucide-react'
import type { IsometricLensMode } from '../botanicalArchetypes'
import type { Taxon } from '@/domain/taxon'
import type { FacilityLocation } from '@/domain/location'
import { RoomLensBar } from './RoomLensBar'
import { RoomOtherLocationsBar } from './RoomOtherLocationsBar'

export interface RoomOverlayControlsProps {
  showPlantNames: boolean
  setShowPlantNames: React.Dispatch<React.SetStateAction<boolean>>
  ambientLightingEnabled: boolean
  onToggleAmbientLighting: () => void
  showLensBar: boolean
  onToggleLensBar: () => void
  lensMode: IsometricLensMode
  setLensMode: React.Dispatch<React.SetStateAction<IsometricLensMode>>
  speciesInRoom: { taxon: Taxon; count: number; badgeColor: string; archetypeLabel: string }[]
  speciesFilterId: string | null
  setSpeciesFilterId: React.Dispatch<React.SetStateAction<string | null>>
  otherLocations: FacilityLocation[]
  showOtherRooms: boolean
  onToggleOtherRooms: () => void
  onSwitchRoom: (locationId: string) => void
  onMovePlantToRoom: (individualId: string, targetLocationId: string) => void
  setMovingPlantId: React.Dispatch<React.SetStateAction<string | null>>
}

const LENS_SHORT_LABELS: Record<IsometricLensMode, string> = {
  species: 'Especies',
  bbch: 'BBCH',
  genetics: 'Genética',
  climate: 'Clima',
}

export const RoomOverlayControls: React.FC<RoomOverlayControlsProps> = React.memo(({
  showPlantNames,
  setShowPlantNames,
  ambientLightingEnabled,
  onToggleAmbientLighting,
  showLensBar,
  onToggleLensBar,
  lensMode,
  setLensMode,
  speciesInRoom,
  speciesFilterId,
  setSpeciesFilterId,
  otherLocations,
  showOtherRooms,
  onToggleOtherRooms,
  onSwitchRoom,
  onMovePlantToRoom,
  setMovingPlantId,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        pointerEvents: 'auto',
      }}
    >
      {/* Barra de Píldoras de Capas y Overlays */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 999,
          padding: '3px 6px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Toggle Nombres Botánicos */}
        <button
          type="button"
          aria-label="Alternar visualización de nombres de plantas"
          aria-pressed={showPlantNames}
          title={showPlantNames ? 'Ocultar nombres sobre plantas' : 'Mostrar nombres sobre plantas'}
          onClick={() => setShowPlantNames(prev => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 26,
            padding: '0 8px',
            borderRadius: 99,
            border: showPlantNames ? '1px solid var(--accent)' : '1px solid transparent',
            background: showPlantNames ? 'var(--accent-light)' : 'transparent',
            color: showPlantNames ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Tag size={11} />
          <span>Nombres</span>
        </button>

        {/* Toggle Iluminación Ambiental */}
        <button
          type="button"
          aria-label="Alternar ciclo circadiano e iluminación ambiental"
          title={ambientLightingEnabled ? 'Desactivar ciclo de luz circadiano' : 'Activar iluminación ambiental dinámica'}
          onClick={onToggleAmbientLighting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 26,
            padding: '0 8px',
            borderRadius: 99,
            border: ambientLightingEnabled ? '1px solid #f59e0b' : '1px solid transparent',
            background: ambientLightingEnabled ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
            color: ambientLightingEnabled ? '#b45309' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {ambientLightingEnabled ? <Sun size={11} /> : <Moon size={11} />}
          <span>Luz</span>
        </button>

        <div style={{ width: 1, height: 15, background: 'var(--border)' }} />

        {/* Toggle Lentes Botánicos */}
        <button
          type="button"
          aria-label="Alternar barra de lentes analíticos"
          aria-expanded={showLensBar}
          title="Capas y Lentes Analíticos (Fenología BBCH, Genética, Confort Climático)"
          onClick={onToggleLensBar}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 26,
            padding: '0 8px',
            borderRadius: 99,
            border: showLensBar ? '1px solid var(--accent)' : '1px solid transparent',
            background: showLensBar ? 'var(--accent-light)' : 'transparent',
            color: showLensBar ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Eye size={11} />
          <span>{LENS_SHORT_LABELS[lensMode] || 'Lentes'} ▾</span>
        </button>

        {/* Toggle Otras Salas */}
        {otherLocations.length > 0 && (
          <button
            type="button"
            aria-label="Alternar barra de otras salas"
            aria-expanded={showOtherRooms}
            title="Ver otras salas para navegar o transferir plantas"
            onClick={onToggleOtherRooms}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              height: 26,
              padding: '0 8px',
              borderRadius: 99,
              border: showOtherRooms ? '1px solid var(--accent)' : '1px solid transparent',
              background: showOtherRooms ? 'var(--accent-light)' : 'transparent',
              color: showOtherRooms ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={11} />
            <span>Salas ({otherLocations.length}) ▾</span>
          </button>
        )}
      </div>

      {/* Sub-dock flotante de Lentes Botánicos */}
      {showLensBar && (
        <div style={{ maxWidth: 310, width: '100%' }}>
          <RoomLensBar
            lensMode={lensMode}
            setLensMode={setLensMode}
            speciesInRoom={speciesInRoom}
            speciesFilterId={speciesFilterId}
            setSpeciesFilterId={setSpeciesFilterId}
          />
        </div>
      )}

      {/* Sub-dock flotante de Transferencia a Otras Salas */}
      {showOtherRooms && otherLocations.length > 0 && (
        <div style={{ maxWidth: 310, width: '100%' }}>
          <RoomOtherLocationsBar
            otherLocations={otherLocations}
            onSwitchRoom={onSwitchRoom}
            onMovePlantToRoom={onMovePlantToRoom}
            setMovingPlantId={setMovingPlantId}
          />
        </div>
      )}
    </div>
  )
})

RoomOverlayControls.displayName = 'RoomOverlayControls'
