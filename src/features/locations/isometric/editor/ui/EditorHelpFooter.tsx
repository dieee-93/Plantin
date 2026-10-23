import React from 'react'
import type { EditorTool } from '../editorTypes'

export interface EditorHelpFooterProps {
  tool: EditorTool
  hasSelection: boolean
}

export const EditorHelpFooter: React.FC<EditorHelpFooterProps> = React.memo(({
  tool,
  hasSelection,
}) => {
  let helpText = 'Clic en un objeto para seleccionarlo · Elegí un elemento del catálogo abajo'
  if (tool === 'place') {
    helpText = 'Clic en el piso para colocar · R rota · Esc cancela'
  } else if (tool === 'furrow') {
    helpText = 'Arrastrá sobre el piso para trazar el surco · Puestos calculados en vivo · Esc cancela'
  } else if (tool === 'bed') {
    helpText = 'Arrastrá para definir ancho y profundidad del cantero · Esc cancela'
  } else if (tool === 'furrows') {
    helpText = 'Arrastrá un área para trazar surcos paralelos · Esc cancela'
  } else if (hasSelection) {
    helpText = 'Arrastrá para mover · R rota · Ctrl+D duplica · Supr borra · Shift encastre libre'
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 4,
        right: 12,
        fontSize: 11,
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '2px 8px',
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      {helpText}
    </div>
  )
})
EditorHelpFooter.displayName = 'EditorHelpFooter'
