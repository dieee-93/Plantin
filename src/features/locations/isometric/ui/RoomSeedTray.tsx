import React from 'react'
import type { Accession } from '@/domain/accession'
import type { SeedLot } from '@/domain/seedLot'
import type { Taxon } from '@/domain/taxon'
import { resolveBotanicalArchetype } from '../botanicalArchetypes'
import { Sprout, Package } from 'lucide-react'

export interface RoomSeedTrayProps {
  accessions: Accession[]
  seedLots: SeedLot[]
  accessionToTaxon: Map<string, Taxon>
}

export const RoomSeedTray: React.FC<RoomSeedTrayProps> = React.memo(({
  accessions,
  seedLots,
  accessionToTaxon,
}) => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
        pointerEvents: 'auto',
        maxWidth: 880,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 10.5,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
          }}
        >
          Semillas disponibles (Arrastra hacia una celda para sembrar):
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {accessions.length} accesiones registradas
        </span>
      </div>

      {accessions.length === 0 ? (
        <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: '4px 0' }}>
          No hay accesiones registradas en el catálogo. Registra una accesión para sembrar con genética trazable.
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
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
                  padding: '6px 11px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${profile.badgeColor}`,
                  cursor: 'grab',
                  flexShrink: 0,
                  userSelect: 'none',
                }}
              >
                <Sprout size={13} color={profile.badgeColor} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {acc.accessionNumber}
                    {acc.cultivarName ? ` · ${acc.cultivarName}` : taxon?.commonName ? ` · ${taxon.commonName}` : ''}
                  </p>
                  {primaryLot ? (
                    <p style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: '#5b21b6', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Package size={10} />
                      {primaryLot.lotCode}
                      {primaryLot.currentCount !== undefined ? ` (${primaryLot.currentCount} sem.)` : ''}
                    </p>
                  ) : (
                    <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>Siembra libre</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
RoomSeedTray.displayName = 'RoomSeedTray'
