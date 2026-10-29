import React, { useState } from 'react'
import type { LocationType } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { SeedLot } from '@/domain/seedLot'
import type { Taxon } from '@/domain/taxon'
import { resolveBotanicalArchetype } from '../botanicalArchetypes'
import { Sprout, X, GripHorizontal, Plus } from 'lucide-react'

export interface RoomBottomDockProps {
  locationType?: LocationType
  roomIndividuals: Individual[]
  accessions: Accession[]
  seedLots: SeedLot[]
  accessionToTaxon: Map<string, Taxon>
  selectedIndividualId: string | null
  onSelectPlant: (individualId: string) => void
  onOpenNewMaterial?: () => void
  isOpen?: boolean
  onClose?: () => void
}

export const RoomBottomDock: React.FC<RoomBottomDockProps> = React.memo(({
  locationType: _locationType,
  roomIndividuals,
  accessions,
  seedLots,
  accessionToTaxon,
  selectedIndividualId,
  onSelectPlant,
  onOpenNewMaterial,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'seeds' | 'plants'>('seeds')

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen
  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setInternalOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 74,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: 540,
        zIndex: 34,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderRadius: 20,
        padding: '12px 16px',
        boxShadow: '0 16px 38px -6px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'auto',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {/* Cabecera Flyout con Tabs Segmentados y Botón Cerrar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--surface-subtle)',
            borderRadius: 99,
            padding: 3,
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('seeds')}
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              border: 'none',
              background: activeTab === 'seeds' ? 'var(--surface-elevated)' : 'transparent',
              color: activeTab === 'seeds' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: activeTab === 'seeds' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🌾 Semillas</span>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'var(--font-mono)',
                padding: '1px 5px',
                borderRadius: 99,
                background: activeTab === 'seeds' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              }}
            >
              {accessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plants')}
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              border: 'none',
              background: activeTab === 'plants' ? 'var(--surface-elevated)' : 'transparent',
              color: activeTab === 'plants' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: activeTab === 'plants' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🌿 Plantas</span>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'var(--font-mono)',
                padding: '1px 5px',
                borderRadius: 99,
                background: activeTab === 'plants' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              }}
            >
              {roomIndividuals.length}
            </span>
          </button>
        </div>

        {/* Acciones y Botón Cerrar Minimizar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onOpenNewMaterial && (
            <button
              type="button"
              aria-label="Nuevo Cultivo o Material"
              onClick={onOpenNewMaterial}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 99,
                border: '1px solid var(--accent)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={12} strokeWidth={2.5} />
              <span>+ Nuevo Cultivo / Material</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar bandeja"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--surface-subtle)',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-elevated)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-subtle)'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Subtítulo Instructivo no invasivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
        <GripHorizontal size={13} />
        <span>
          {activeTab === 'seeds'
            ? 'Arrastra una semilla hacia cualquier maceta o cantero para sembrar'
            : 'Arrastra una planta hacia otra maceta o hacia otra sala para trasplantar'}
        </span>
      </div>

      {/* Contenido: Pestaña Semillas */}
      {activeTab === 'seeds' && (
        <div>
          {accessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, margin: '4px 0' }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                No hay accesiones registradas en el catálogo. Registra una variedad para sembrar.
              </p>
              {onOpenNewMaterial && (
                <button
                  type="button"
                  aria-label="+ Registrar primer Cultivo / Semilla"
                  onClick={onOpenNewMaterial}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--accent)',
                    background: 'var(--surface-elevated)',
                    color: 'var(--accent)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>+ Registrar primer Cultivo / Semilla</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {accessions.map(acc => {
                const taxon = accessionToTaxon.get(acc.id)
                const profile = resolveBotanicalArchetype(taxon)
                const activeLotsForAcc = seedLots.filter(
                  l => l.accessionId === acc.id && l.status === 'active' && (l.currentCount === undefined || l.currentCount > 0)
                )
                const primaryLot = activeLotsForAcc[0]
                const dragPayload = JSON.stringify({
                  kind: 'SEED',
                  accessionId: acc.id,
                  seedLotId: primaryLot?.id,
                })

                return (
                  <div
                    key={acc.id}
                    draggable
                    aria-label={`Semilla arrastrable ${acc.accessionNumber}`}
                    onDragStart={e => {
                      e.dataTransfer.setData('application/plantin-dnd', dragPayload)
                      e.dataTransfer.setData('text/plain', dragPayload)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      borderRadius: 10,
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderLeft: `3.5px solid ${profile.badgeColor}`,
                      cursor: 'grab',
                      flexShrink: 0,
                      userSelect: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Sprout size={14} color={profile.badgeColor} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {acc.cultivarName || taxon?.commonName || acc.accessionNumber}
                        </span>
                        {acc.cultivarName && (
                          <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                            {acc.accessionNumber}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                        <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 600 }}>
                          {primaryLot?.currentCount !== undefined ? `${primaryLot.currentCount} semillas` : 'Siembra libre'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenido: Pestaña Plantas */}
      {activeTab === 'plants' && (
        <div>
          {roomIndividuals.length === 0 ? (
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: '4px 0' }}>
              No hay plantas sembradas en esta sala actualmente.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {roomIndividuals.map(ind => {
                const acc = accessions.find(a => a.id === ind.accessionId)
                const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
                const profile = resolveBotanicalArchetype(taxon)
                const dispName = getIndividualDisplayName(ind, acc?.accessionNumber)
                const isSelected = selectedIndividualId === ind.id
                const dragPayload = JSON.stringify({
                  kind: 'PLANT',
                  individualId: ind.id,
                })

                return (
                  <div
                    key={ind.id}
                    draggable
                    aria-label={`Planta arrastrable ${dispName}`}
                    onClick={() => onSelectPlant(ind.id)}
                    onDragStart={e => {
                      e.dataTransfer.setData('application/plantin-dnd', dragPayload)
                      e.dataTransfer.setData('text/plain', dragPayload)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '6px 12px',
                      borderRadius: 10,
                      background: isSelected ? 'var(--accent-light)' : 'var(--surface-elevated)',
                      border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      borderLeft: `3.5px solid ${profile.badgeColor}`,
                      cursor: 'grab',
                      flexShrink: 0,
                      userSelect: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: profile.badgeColor,
                      }}
                    />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {dispName}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {ind.position || ind.location || 'A-01'}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                          · BBCH {ind.currentBBCH}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

RoomBottomDock.displayName = 'RoomBottomDock'
