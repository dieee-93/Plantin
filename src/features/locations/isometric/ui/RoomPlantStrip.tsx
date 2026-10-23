import React from 'react'
import type { FacilityLocation } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { Taxon } from '@/domain/taxon'
import { resolveBotanicalArchetype } from '../botanicalArchetypes'

export interface RoomPlantStripProps {
  locationType: FacilityLocation['type']
  roomIndividuals: Individual[]
  accessions: Accession[]
  accessionToTaxon: Map<string, Taxon>
  selectedIndividualId: string | null
  onSelectPlant: (individualId: string) => void
}

export const RoomPlantStrip: React.FC<RoomPlantStripProps> = React.memo(({
  locationType,
  roomIndividuals,
  accessions,
  accessionToTaxon,
  selectedIndividualId,
  onSelectPlant,
}) => {
  if (roomIndividuals.length === 0) return null

  return (
    <div
      style={{
        width: '100%',
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: locationType === 'growth_chamber' ? '#cbd5e1' : 'var(--text-tertiary)',
          textTransform: 'uppercase',
        }}
      >
        Plantas en sala (Arrastra hacia otra celda o sala para trasplantar):
      </span>
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
            onDragStart={e => {
              e.dataTransfer.setData('application/plantin-dnd', dragPayload)
              e.dataTransfer.setData('text/plain', dragPayload)
            }}
            onClick={() => onSelectPlant(ind.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 99,
              background: isSelected ? 'var(--accent)' : 'var(--surface-elevated)',
              color: isSelected ? 'white' : 'var(--text-primary)',
              border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isSelected ? '#ffffff' : profile.badgeColor,
                display: 'inline-block',
              }}
            />
            <span>{ind.position || 'S/P'}</span>
            <strong>{dispName}</strong>
          </div>
        )
      })}
    </div>
  )
})
RoomPlantStrip.displayName = 'RoomPlantStrip'
