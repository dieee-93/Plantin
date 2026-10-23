import React from 'react'
import type { PlantPaletteData } from './paletteKey'

export interface SharedDefsProps {
  palettes?: PlantPaletteData[]
}

/**
 * Emite gradientes SVG compartidos para todas las plantas de la escena,
 * evitando la creación de gradientes individuales en cada sprite (<linearGradient>/<radialGradient>).
 */
export const SharedDefs: React.FC<SharedDefsProps> = ({ palettes = [] }) => {
  return (
    <defs>
      {/* Tutor de bambú compartido único */}
      <linearGradient id="tutor-bamboo" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="40%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>

      {/* Sombra de contacto radial compartida para todas las plantas */}
      <radialGradient id="plant-contact-shadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      {/* Gradientes deduplicados por paletteKey */}
      {palettes.map(p => (
        <React.Fragment key={p.key}>
          <radialGradient id={`plant-fruit-${p.key}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="25%" stopColor={p.fruitBaseColor} />
            <stop offset="100%" stopColor={p.fruitShadowColor} />
          </radialGradient>
          <linearGradient id={`plant-stem-${p.key}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={p.leafLight} />
            <stop offset="50%" stopColor={p.stemColor} />
            <stop offset="100%" stopColor={p.leafDark} />
          </linearGradient>
        </React.Fragment>
      ))}
    </defs>
  )
}
