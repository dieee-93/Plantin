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
  { key: 'container', label: 'Contenedores', icon: <Box size={13} /> },
  { key: 'furniture', label: 'Mobiliario', icon: <Layers size={13} /> },
  { key: 'equipment', label: 'Equipamiento', icon: <Zap size={13} /> },
  { key: 'structure', label: 'Estructuras', icon: <DoorOpen size={13} /> },
  { key: 'decor', label: 'Señalética', icon: <Tag size={13} /> },
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
        bottom: 66,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: 680,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderRadius: 14,
        boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        zIndex: 34,
        overflow: 'hidden',
        pointerEvents: 'auto',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Cabecera del Cajón con pestañas de categorías y botón colapsar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 10px',
          background: 'var(--surface-subtle)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
                gap: 4,
                padding: '3px 8px',
                borderRadius: 99,
                border: activeTab === cat.key ? '1px solid var(--accent)' : '1px solid transparent',
                background: activeTab === cat.key ? 'var(--accent-light)' : 'transparent',
                color: activeTab === cat.key ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(prev => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 11,
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 6,
          }}
          title={isCollapsed ? 'Expandir catálogo' : 'Minimizar catálogo'}
        >
          {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span>{isCollapsed ? 'Abrir' : 'Ocultar'}</span>
        </button>
      </div>

      {/* Lista de objetos colocables en la categoría activa (Mini-cards horizontales) */}
      {!isCollapsed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            overflowX: 'auto',
          }}
        >
          {activeTab === 'container' && onSelectTool && (
            <>
              <button
                type="button"
                onClick={() => onSelectTool('furrow')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: activeTool === 'furrow' ? '1.5px solid var(--accent)' : '1px dashed var(--accent)',
                  background: activeTool === 'furrow' ? 'var(--accent-light)' : '#f0fdf4',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 13 }}>✏️</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}>
                  Trazar Surco
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTool('bed')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: activeTool === 'bed' ? '1.5px solid var(--accent)' : '1px dashed var(--accent)',
                  background: activeTool === 'bed' ? 'var(--accent-light)' : '#f0fdf4',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 13 }}>📐</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}>
                  Trazar Cantero
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--accent-light)' : 'var(--surface-elevated)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {fp.w}×{fp.d}
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
