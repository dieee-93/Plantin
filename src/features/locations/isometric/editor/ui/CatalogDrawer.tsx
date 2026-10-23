import React, { useState } from 'react'
import { OBJECT_CATALOG } from '../../catalog'
import type { ObjectType } from '../../catalog/types'
import { Box, Layers, Zap, DoorOpen, Tag, ChevronDown, ChevronUp } from 'lucide-react'

export interface CatalogDrawerProps {
  onSelectObjectToPlace: (typeId: string) => void
  activeCatalogTypeId: string | null
  onSelectTool?: (tool: 'furrow' | 'bed' | 'furrows') => void
  activeTool?: string
}

type CatalogCategory = 'container' | 'furniture' | 'equipment' | 'structure' | 'decor'

const CATEGORIES: { key: CatalogCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'container', label: 'Contenedores', icon: <Box size={14} /> },
  { key: 'furniture', label: 'Mobiliario', icon: <Layers size={14} /> },
  { key: 'equipment', label: 'Equipamiento', icon: <Zap size={14} /> },
  { key: 'structure', label: 'Estructuras', icon: <DoorOpen size={14} /> },
  { key: 'decor', label: 'Señalética', icon: <Tag size={14} /> },
]

export const CatalogDrawer: React.FC<CatalogDrawerProps> = React.memo(({
  onSelectObjectToPlace,
  activeCatalogTypeId,
  onSelectTool,
  activeTool,
}) => {
  const [activeTab, setActiveTab] = useState<CatalogCategory>('container')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const items = Object.values(OBJECT_CATALOG).filter(
    (item: ObjectType) => item.category === activeTab
  )

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: 720,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 30,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Cabecera del Cajón con pestañas de categorías y botón colapsar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'var(--surface-subtle)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setActiveTab(cat.key)
                if (isCollapsed) setIsCollapsed(false)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: activeTab === cat.key ? '1px solid var(--accent)' : '1px solid transparent',
                background: activeTab === cat.key ? 'var(--accent-light)' : 'transparent',
                color: activeTab === cat.key ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(prev => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 11,
            cursor: 'pointer',
            padding: '2px 6px',
          }}
          title={isCollapsed ? 'Expandir catálogo' : 'Minimizar catálogo'}
        >
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isCollapsed ? 'Abrir' : 'Ocultar'}
        </button>
      </div>

      {/* Lista de objetos colocables en la categoría activa */}
      {!isCollapsed && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 14px',
            overflowX: 'auto',
          }}
        >
          {activeTab === 'container' && onSelectTool && (
            <>
              <button
                type="button"
                onClick={() => onSelectTool('furrow')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 105,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: activeTool === 'furrow' ? '2px solid var(--accent)' : '1px dashed var(--accent)',
                  background: activeTool === 'furrow' ? 'var(--accent-light)' : '#f0fdf4',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                  ✏️ Trazar Surco
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  Arrastrar largo
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTool('bed')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 105,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: activeTool === 'bed' ? '2px solid var(--accent)' : '1px dashed var(--accent)',
                  background: activeTool === 'bed' ? 'var(--accent-light)' : '#f0fdf4',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                  📐 Trazar Cantero
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  Arrastrar área
                </span>
              </button>
            </>
          )}

          {items.map(item => {
            const isSelected = activeCatalogTypeId === item.id
            const fp = item.footprint
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectObjectToPlace(item.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 100,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--accent-light)' : 'var(--surface-elevated)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {fp.w}×{fp.d}×{fp.h} cm
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})
CatalogDrawer.displayName = 'CatalogDrawer'
