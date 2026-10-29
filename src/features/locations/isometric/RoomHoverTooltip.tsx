import React, { useSyncExternalStore } from 'react'
import type { FacilityLocation } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { Taxon } from '@/domain/taxon'
import {
  resolveBotanicalArchetype,
  evaluateMicroclimateComfort,
} from './botanicalArchetypes'
import { getHoveredSlot, subscribeHover } from './hoverStore'

export interface RoomHoverTooltipProps {
  slotToPlant: Map<string, Individual>
  accessions: Accession[]
  accessionToTaxon: Map<string, Taxon>
  locationType: FacilityLocation['type']
  ambientTempC?: number
}

export const RoomHoverTooltip: React.FC<RoomHoverTooltipProps> = React.memo(({
  slotToPlant,
  accessions,
  accessionToTaxon,
  locationType,
  ambientTempC,
}) => {
  const hoveredSlot = useSyncExternalStore(subscribeHover, getHoveredSlot)
  if (!hoveredSlot) return null
  const plant = slotToPlant.get(hoveredSlot)
  if (!plant) return null
  const acc = accessions.find(a => a.id === plant.accessionId)
  const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
  const profile = resolveBotanicalArchetype(taxon)
  const comfort = evaluateMicroclimateComfort(taxon, locationType, ambientTempC)
  const displayName = getIndividualDisplayName(plant, acc?.accessionNumber)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 62,
        right: 18,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.96)',
        border: `1.5px solid ${profile.badgeColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        boxShadow: 'var(--shadow-md)',
        maxWidth: 230,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: 4,
            background: profile.badgeColor,
            color: '#ffffff',
          }}
        >
          {hoveredSlot} · {profile.cropCode}
        </span>
        {plant.generation && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 4,
              background: '#ede9fe',
              color: '#5b21b6',
            }}
          >
            Gen {plant.generation}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
        {displayName}
      </p>
      {taxon && (
        <p style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>
          {taxon.genus} {taxon.species}
          {taxon.commonName ? ` (${taxon.commonName})` : ''}
        </p>
      )}
      <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
        {profile.archetypeLabel}
      </p>
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px dashed #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          color: '#1e293b',
        }}
      >
        <span>BBCH: <strong>{plant.currentBBCH ?? 0}</strong></span>
        <span style={{ color: comfort.badgeBg, fontWeight: 600 }}>
          {comfort.label}
        </span>
      </div>
    </div>
  )
})
RoomHoverTooltip.displayName = 'RoomHoverTooltip'
