import React from 'react'
import { useInRouterContext, useNavigate, useLocation } from 'react-router-dom'
import { Sprout, Package, Leaf } from 'lucide-react'
import { useAccessionStore } from '@/store/accessionStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useTaxonStore } from '@/store/taxonStore'

export type SeedBankSection = 'accessions' | 'seedlots' | 'taxons'

export function SeedBankTabs({ active }: { active: SeedBankSection }) {
  const inRouter = useInRouterContext()
  if (!inRouter) return null
  return <SeedBankTabsInner active={active} />
}

function SeedBankTabsInner({ active }: { active: SeedBankSection }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessions } = useAccessionStore()
  const { seedLots } = useSeedLotStore()
  const { taxons } = useTaxonStore()

  const activeLotsCount = seedLots.filter(l => l.status === 'active').length

  const tabs: {
    id: SeedBankSection
    label: string
    sub: string
    to: string
    icon: React.ElementType
    count: number
  }[] = [
    {
      id: 'accessions',
      label: 'Variedades (Accesiones)',
      sub: 'Pasaporte genético y stock',
      to: '/accessions',
      icon: Sprout,
      count: accessions.length,
    },
    {
      id: 'seedlots',
      label: 'Sobres / Lotes de Semillas',
      sub: 'Almacenamiento y germinación',
      to: '/seedlots',
      icon: Package,
      count: activeLotsCount,
    },
    {
      id: 'taxons',
      label: 'Catálogo Botánico (Especies)',
      sub: 'Biología, clima y descriptores',
      to: '/taxons',
      icon: Leaf,
      count: taxons.length,
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        background: 'var(--surface-elevated)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id || location.pathname.startsWith(tab.to)
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.to)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: isActive ? '1px solid #b7e4c7' : '1px solid transparent',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 99,
                  background: isActive ? 'white' : 'var(--surface-subtle)',
                  color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                }}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      <span
        style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Paso 2 del Ciclo · Banco de Semillas y Germoplasma
      </span>
    </div>
  )
}
