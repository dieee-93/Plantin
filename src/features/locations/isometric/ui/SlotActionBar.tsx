import React from 'react'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { Taxon } from '@/domain/taxon'
import { getVegetativeCloneCapability } from '@/domain/propagationForm'
import {
  X,
  Search,
  ArrowRightLeft,
  TrendingUp,
  Trash2,
  Scissors,
  Sprout,
  Sparkles,
  MapPin,
  Zap,
} from 'lucide-react'

export interface SlotActionBarProps {
  selectedSlot: string
  plant?: Individual
  accessions: Accession[]
  accessionToTaxon: Map<string, Taxon>
  unplacedRoomIndividuals: Individual[]
  movingPlantId: string | null
  setMovingPlantId: (plantId: string | null) => void
  onMovePlantToSlot: (individualId: string, slot: string) => void
  onSelectPlant: (individualId: string) => void
  onInspectPlant?: (individualId: string) => void
  onOpenSowDrawerWithSlot?: (slot: string, subTab: 'inventory' | 'new-material') => void
  onAdvancePlantBbch?: (individualId: string, nextBbch: number) => void
  onQuickClonePlant?: (motherId: string) => void
  onRemovePlantFromSlot?: (individualId: string) => void
  onClose?: () => void
  anchorPercent?: { leftPct: number; topPct: number; placeBelow?: boolean }
}

const BBCH_MILESTONES = [0, 10, 14, 35, 55, 65, 75, 89] as const

function getNextBbch(currentBbch: number = 0): number {
  const next = BBCH_MILESTONES.find(m => m > currentBbch)
  return next ?? 89
}

export function getHumanStageLabel(bbch: number = 0): { icon: string; name: string; full: string } {
  if (bbch < 10) return { icon: '🌰', name: 'Germinación', full: '🌰 Germinación' }
  if (bbch < 20) return { icon: '🌱', name: 'Plántula', full: '🌱 Plántula' }
  if (bbch < 50) return { icon: '🌿', name: 'Vegetativo', full: '🌿 Vegetativo' }
  if (bbch < 60) return { icon: '🌼', name: 'Botón floral', full: '🌼 Botón floral' }
  if (bbch < 70) return { icon: '🌸', name: 'Floración', full: '🌸 Floración' }
  if (bbch < 80) return { icon: '🍅', name: 'Fruto', full: '🍅 Fruto' }
  return { icon: '🌾', name: 'Maduración', full: '🌾 Maduración' }
}

export const SlotActionBar: React.FC<SlotActionBarProps> = React.memo(({
  selectedSlot,
  plant,
  accessions,
  accessionToTaxon,
  unplacedRoomIndividuals,
  movingPlantId,
  setMovingPlantId,
  onMovePlantToSlot,
  onSelectPlant,
  onInspectPlant,
  onOpenSowDrawerWithSlot,
  onAdvancePlantBbch,
  onQuickClonePlant,
  onRemovePlantFromSlot,
  onClose,
  anchorPercent,
}) => {
  const isOccupied = Boolean(plant)

  // Datos para slot ocupado
  const acc = plant ? accessions.find(a => a.id === plant.accessionId) : undefined
  const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
  const plantDisplayName = plant ? getIndividualDisplayName(plant, acc?.accessionNumber) : ''
  const cloneCap = getVegetativeCloneCapability(taxon)

  const currentBbch = plant?.currentBBCH ?? 0
  const currentStage = getHumanStageLabel(currentBbch)
  const nextBbch = getNextBbch(currentBbch)
  const nextStage = getHumanStageLabel(nextBbch)

  const isMovingThisPlant = Boolean(plant && movingPlantId === plant.id)
  const isMovingAnyPlant = Boolean(movingPlantId)

  // Datos para slot vacío
  const firstUnplaced = unplacedRoomIndividuals.length > 0 ? unplacedRoomIndividuals[0] : null
  const firstUnplacedAcc = firstUnplaced
    ? accessions.find(a => a.id === firstUnplaced.accessionId)
    : undefined
  const firstUnplacedName = firstUnplaced
    ? getIndividualDisplayName(firstUnplaced, firstUnplacedAcc?.accessionNumber)
    : ''

  const buttonBaseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    height: 26,
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid var(--border)',
    background: 'var(--surface-elevated)',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  }

  const containerStyle: React.CSSProperties = anchorPercent
    ? {
        position: 'absolute',
        left: `${anchorPercent.leftPct}%`,
        top: `${anchorPercent.topPct}%`,
        transform: anchorPercent.placeBelow
          ? 'translate(-50%, 22px)'
          : 'translate(-50%, calc(-100% - 24px))',
        zIndex: 36,
        pointerEvents: 'auto',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 5,
        padding: '6px 8px',
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        boxShadow:
          '0 10px 28px -4px rgba(15, 23, 42, 0.16), 0 2px 6px -1px rgba(15, 23, 42, 0.06)',
        maxWidth: 320,
      }
    : {
        position: 'absolute',
        top: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 36,
        pointerEvents: 'auto',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 5,
        padding: '6px 8px',
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        boxShadow:
          '0 10px 28px -4px rgba(15, 23, 42, 0.16), 0 2px 6px -1px rgba(15, 23, 42, 0.06)',
        maxWidth: 320,
      }

  return (
    <div
      data-testid="slot-action-bar"
      role="toolbar"
      aria-label={selectedSlot ? `Acciones de slot ${selectedSlot}` : 'Acciones de slot'}
      style={containerStyle}
    >
      {/* ── Indicador triangular (flecha hacia la maceta) ── */}
      {anchorPercent && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            ...(anchorPercent.placeBelow
              ? {
                  top: -5,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  borderLeft: '1px solid rgba(226, 232, 240, 0.95)',
                  borderTop: '1px solid rgba(226, 232, 240, 0.95)',
                }
              : {
                  bottom: -5,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  borderRight: '1px solid rgba(226, 232, 240, 0.95)',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.95)',
                }),
            width: 10,
            height: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Fila 1: Cabecera mini + botón cerrar × ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          padding: '1px 4px',
        }}
      >
        {isOccupied && plant ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              Slot Ocupado · {selectedSlot}
            </span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span
              title={plantDisplayName}
              style={{
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {plantDisplayName}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 99,
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}
            >
              {currentStage.icon} BBCH {currentBbch}
            </span>
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              Slot Vacío · {selectedSlot}
            </span>
          </div>
        )}

        {onClose && (
          <button
            type="button"
            aria-label="Cerrar acciones de slot"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: 0,
              width: 20,
              height: 20,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Fila 2: Barra de botones compactos ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'nowrap',
        }}
      >
        {/* ── ESTADO A: Slot Vacío ── */}
        {!isOccupied && (
          <>
            {isMovingAnyPlant && movingPlantId && (
              <button
                type="button"
                aria-label={`Mover planta aquí (${selectedSlot})`}
                onClick={() => {
                  onMovePlantToSlot(movingPlantId, selectedSlot)
                  setMovingPlantId(null)
                }}
                style={{
                  ...buttonBaseStyle,
                  background: 'var(--accent)',
                  color: '#ffffff',
                  borderColor: 'var(--accent)',
                }}
              >
                <MapPin size={11} strokeWidth={2.5} />
                <span>Mover aquí</span>
              </button>
            )}

            {firstUnplaced && (
              <button
                type="button"
                aria-label="Colocar planta sin ubicar en slot"
                onClick={() => onMovePlantToSlot(firstUnplaced.id, selectedSlot)}
                style={{
                  ...buttonBaseStyle,
                  background: '#ecfdf5',
                  borderColor: '#a7f3d0',
                  color: '#065f46',
                }}
              >
                <Zap size={11} strokeWidth={2.5} color="#059669" />
                <span>Colocar {firstUnplacedName} aquí</span>
              </button>
            )}

            <button
              type="button"
              aria-label="Sembrar de Inventario en slot"
              onClick={() => onOpenSowDrawerWithSlot?.(selectedSlot, 'inventory')}
              style={buttonBaseStyle}
            >
              <Sprout size={11} color="var(--accent)" strokeWidth={2} />
              <span>Sembrar</span>
            </button>

            <button
              type="button"
              aria-label="Nuevo Cultivo en slot"
              onClick={() => onOpenSowDrawerWithSlot?.(selectedSlot, 'new-material')}
              style={buttonBaseStyle}
            >
              <Sparkles size={11} color="#f59e0b" strokeWidth={2} />
              <span>+ Nuevo</span>
            </button>
          </>
        )}

        {/* ── ESTADO B: Slot Ocupado ── */}
        {isOccupied && plant && (
          <>
            <button
              type="button"
              aria-label="Ver detalles de planta del slot"
              onClick={() => {
                if (onInspectPlant) {
                  onInspectPlant(plant.id)
                } else {
                  onSelectPlant(plant.id)
                }
              }}
              style={buttonBaseStyle}
            >
              <Search size={11} strokeWidth={2} />
              <span>Detalles</span>
            </button>

            <button
              type="button"
              aria-label="Avanzar etapa BBCH del slot"
              title={`Avanzar a ${nextStage.name} (BBCH ${nextBbch})`}
              onClick={() => {
                onAdvancePlantBbch?.(plant.id, nextBbch)
              }}
              style={buttonBaseStyle}
            >
              <TrendingUp size={11} color="#16a34a" strokeWidth={2} />
              <span>+Etapa</span>
            </button>

            {isMovingThisPlant ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }}
                >
                  Selecciona una celda vacía...
                </span>
                <button
                  type="button"
                  aria-label="Cancelar movimiento"
                  onClick={() => setMovingPlantId(null)}
                  style={{
                    ...buttonBaseStyle,
                    background: '#fef2f2',
                    borderColor: '#fecaca',
                    color: '#b91c1c',
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Mover planta de celda"
                onClick={() => setMovingPlantId(plant.id)}
                style={buttonBaseStyle}
              >
                <ArrowRightLeft size={11} strokeWidth={2} />
                <span>Mover</span>
              </button>
            )}

            {cloneCap.canClone && (
              <button
                type="button"
                aria-label="Clonar planta desde slot"
                onClick={() => onQuickClonePlant?.(plant.id)}
                style={{
                  ...buttonBaseStyle,
                  background: '#f5f3ff',
                  borderColor: '#ddd6fe',
                  color: '#6d28d9',
                }}
              >
                <Scissors size={11} strokeWidth={2} />
                <span aria-hidden="true">Esqueje</span>
                <span
                  className="sr-only"
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                  }}
                >
                  Sacar Esqueje / Gajo
                </span>
              </button>
            )}

            <button
              type="button"
              aria-label="Liberar slot ocupado"
              title="Quitar planta del slot"
              onClick={() => onRemovePlantFromSlot?.(plant.id)}
              style={{
                ...buttonBaseStyle,
                padding: '3px 6px',
                color: '#dc2626',
                borderColor: '#fecaca',
              }}
            >
              <Trash2 size={11} strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </div>
  )
})

SlotActionBar.displayName = 'SlotActionBar'
