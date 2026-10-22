import React from 'react'
import type { IndividualStatus } from '@/domain/individual'
import type { Taxon } from '@/domain/taxon'
import type { LocationType } from '@/domain/location'
import {
  resolveBotanicalArchetype,
  type IsometricLensMode,
} from './botanicalArchetypes'

export interface IsometricPlantSpriteProps {
  bbch?: number
  status: IndividualStatus
  label: string
  isSelected?: boolean
  taxon?: Taxon
  locationType?: LocationType
  generation?: string
  lensMode?: IsometricLensMode
  dimmed?: boolean
}

/**
 * Renderiza un contenedor contextual y una planta procedural 2.5D en SVG
 * con ilustraciones botánicas vectoriales ricas (gradientes, sombreado,
 * nervaduras, flores con cáliz y frutos volumétricos de alta definición).
 */
export const IsometricPlantSprite: React.FC<IsometricPlantSpriteProps> = ({
  bbch,
  status,
  label,
  isSelected = false,
  taxon,
  locationType = 'greenhouse',
  generation,
  lensMode = 'species',
  dimmed = false,
}) => {
  const uid = React.useId().replace(/:/g, '')
  const stage = bbch ?? 14
  const isDead = status === 'dead' || status === 'discarded'
  const isHarvested = status === 'harvested'
  const profile = resolveBotanicalArchetype(taxon)

  // Paleta dinámica según estado vital y perfil botánico
  const stemColor = isDead
    ? '#8d6e63'
    : isHarvested
      ? '#b45309'
      : profile.stemColor

  const leafDark = isDead
    ? '#a1887f'
    : isHarvested
      ? '#d97706'
      : profile.leafDark

  const leafMid = isDead
    ? '#bcaaa4'
    : isHarvested
      ? '#f59e0b'
      : profile.leafMid

  const leafLight = isDead
    ? '#d7ccc8'
    : isHarvested
      ? '#fbbf24'
      : profile.leafLight

  const isRipe = stage >= 80
  const fruitBaseColor = isRipe ? profile.ripeFruitColor : profile.unripeFruitColor
  const fruitShadowColor = isRipe ? profile.ripeFruitStroke : '#365314'

  return (
    <g
      data-archetype={profile.archetype}
      data-container={locationType}
      style={{
        opacity: dimmed ? 0.25 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <defs>
        <radialGradient id={`fruit-grad-${uid}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="25%" stopColor={fruitBaseColor} />
          <stop offset="100%" stopColor={fruitShadowColor} />
        </radialGradient>
        <linearGradient id={`stem-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={leafLight} />
          <stop offset="50%" stopColor={stemColor} />
          <stop offset="100%" stopColor={leafDark} />
        </linearGradient>
        <linearGradient id={`tutor-bamboo-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="40%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>

      {/* Halo de selección en la base isométrica */}
      {isSelected && (
        <polygon
          points="0,-20 38,0 0,20 -38,0"
          fill="rgba(45, 106, 79, 0.22)"
          stroke="#2d6a4f"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
      )}

      {/* Sombra proyectada en la base */}
      <ellipse cx="0" cy="4" rx="20" ry="10" fill="rgba(15, 23, 42, 0.18)" />

      {/* ── CONTENEDOR SEGÚN TIPO DE SALA (LocationType) ── */}
      {locationType === 'field' ? (
        /* Campo Abierto: Alcorque de tierra labrada (sin maceta) */
        <g>
          <ellipse cx="0" cy="-2" rx="19" ry="9.5" fill="#451a03" />
          <ellipse cx="0" cy="-4" rx="15" ry="7.5" fill="#78350f" stroke={isSelected ? '#4ade80' : '#92400e'} strokeWidth={isSelected ? '1.5' : '0.8'} />
          <ellipse cx="0" cy="-5.5" rx="10" ry="4.5" fill="#290f02" />
        </g>
      ) : locationType === 'growth_chamber' ? (
        /* Cámara de Crecimiento: Contenedor técnico cuadrado negro */
        <g>
          <polygon points="-16,-8 0,0 0,12 -14,4" fill={isSelected ? '#1b4332' : '#1e293b'} />
          <polygon points="16,-8 0,0 0,12 14,4" fill={isSelected ? '#2d6a4f' : '#0f172a'} />
          <polygon
            points="0,-16 18,-7 0,2 -18,-7"
            fill={isSelected ? '#40916c' : '#334155'}
            stroke={isSelected ? '#4ade80' : '#c084fc'}
            strokeWidth="1"
          />
          <polygon points="0,-14 14,-7 0,0 -14,-7" fill="#475569" />
        </g>
      ) : locationType === 'lab' ? (
        /* Laboratorio: Frasco in-vitro traslúcido */
        <g>
          <polygon points="-15,-8 0,0 0,11 -13,3" fill="rgba(186, 230, 253, 0.75)" stroke="#0284c7" strokeWidth="0.7" />
          <polygon points="15,-8 0,0 0,11 13,3" fill="rgba(125, 211, 252, 0.85)" stroke="#0284c7" strokeWidth="0.7" />
          <polygon points="0,-15 16,-7 0,1 -16,-7" fill="rgba(224, 242, 254, 0.9)" stroke={isSelected ? '#15803d' : '#0369a1'} strokeWidth="1" />
          <polygon points="0,-13 12,-7 0,-1 -12,-7" fill="#67e8f9" />
        </g>
      ) : (
        /* Invernadero / Sala / Bancada: Maceta Terracota 3D */
        <g>
          <polygon points="-16,-8 0,0 0,12 -13,4" fill={isSelected ? '#1b4332' : '#c2410c'} />
          <polygon points="16,-8 0,0 0,12 13,4" fill={isSelected ? '#2d6a4f' : '#9a3412'} />
          <polygon
            points="0,-16 18,-7 0,2 -18,-7"
            fill={isSelected ? '#40916c' : '#ea580c'}
            stroke={isSelected ? '#1b4332' : '#7c2d12'}
            strokeWidth="0.8"
          />
          <polygon points="0,-14 14,-7 0,0 -14,-7" fill="#3e2723" />
        </g>
      )}

      {/* ── MORFOLOGÍA BOTÁNICA PROCEDURAL (BBCH × ARQUETIPO) ── */}

      {/* ETAPA 1 · BBCH 0–9: Germinación y Emergencia */}
      {stage < 10 && (
        <g>
          {profile.archetype === 'cereal_grass' ? (
            <path d="M 0,-7 Q -2,-16 3,-23 Q 1,-14 0,-7" fill={leafLight} stroke={leafMid} strokeWidth="0.8" />
          ) : (
            <>
              <path d="M 0,-7 Q 0,-15 0,-18" stroke={leafLight} strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <ellipse cx="-4" cy="-18" rx="4.5" ry="2.2" transform="rotate(-25 -4 -18)" fill={leafLight} />
              <ellipse cx="4" cy="-18" rx="4.5" ry="2.2" transform="rotate(25 4 -18)" fill={leafMid} />
            </>
          )}
        </g>
      )}

      {/* ETAPA 2 · BBCH 10–29: Desarrollo Foliar Temprano */}
      {stage >= 10 && stage < 30 && (
        <g>
          {profile.archetype === 'rosette_leafy' ? (
            <g>
              <ellipse cx="-9" cy="-11" rx="8" ry="4.5" transform="rotate(-18 -9 -11)" fill={leafDark} />
              <ellipse cx="9" cy="-11" rx="8" ry="4.5" transform="rotate(18 9 -11)" fill={leafMid} />
              <ellipse cx="-5" cy="-15" rx="7" ry="4" transform="rotate(-10 -5 -15)" fill={leafMid} />
              <ellipse cx="5" cy="-15" rx="7" ry="4" transform="rotate(10 5 -15)" fill={leafLight} />
              <circle cx="0" cy="-14" r="4.5" fill={leafLight} />
            </g>
          ) : profile.archetype === 'cereal_grass' ? (
            <g>
              <path d="M 0,-7 L 0,-28" stroke={stemColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 0,-14 Q -14,-24 -18,-18 Q -10,-16 0,-12" fill={leafMid} />
              <path d="M 0,-16 Q 14,-26 18,-20 Q 10,-18 0,-14" fill={leafDark} />
              <path d="M 0,-22 Q -10,-34 -13,-30 Q -6,-26 0,-20" fill={leafLight} />
              <path d="M 0,-24 Q 10,-36 13,-32 Q 6,-28 0,-22" fill={leafMid} />
            </g>
          ) : (
            <g>
              <path d="M 0,-7 C -1,-16 1,-24 0,-30" stroke={stemColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 0,-15 Q -12,-22 -14,-16 Q -8,-11 0,-15" fill={leafMid} />
              <path d="M 0,-15 Q 12,-22 14,-16 Q 8,-11 0,-15" fill={leafDark} />
              <path d="M 0,-25 Q -10,-34 -12,-27 Q -6,-21 0,-25" fill={leafLight} />
              <path d="M 0,-25 Q 10,-34 12,-27 Q 6,-21 0,-25" fill={leafMid} />
              <circle cx="0" cy="-31" r="3" fill={leafLight} />
            </g>
          )}
        </g>
      )}

      {/* ETAPAS 3, 4 y 5 · BBCH 30–99: Estructura Adulta Diferenciada */}
      {stage >= 30 && (
        <g>
          {/* ── ARQUETIPO 1: SOLANÁCEAS DE FRUTO (Tomate, Pimiento, Berenjena) ── */}
          {(profile.archetype === 'solanaceae_tall' || profile.archetype === 'generic_herb') && (
            <g>
              {/* Tutor de bambú / guía espiralada técnica con abrazaderas verdes */}
              <g data-botanical-feature="plant-stake">
                <rect x="5" y="-56" width="3.5" height="52" rx="1.5" fill={`url(#tutor-bamboo-${uid})`} stroke="#78350f" strokeWidth="0.6" />
                {/* Nudos de bambú */}
                <line x1="4.5" y1="-44" x2="9" y2="-44" stroke="#78350f" strokeWidth="0.8" />
                <line x1="4.5" y1="-30" x2="9" y2="-30" stroke="#78350f" strokeWidth="0.8" />
                <line x1="4.5" y1="-16" x2="9" y2="-16" stroke="#78350f" strokeWidth="0.8" />
                {/* Abrazadera / clip hortícola */}
                <ellipse cx="4" cy="-28" rx="4" ry="1.8" fill="#15803d" stroke="#166534" strokeWidth="0.8" />
                <ellipse cx="4" cy="-44" rx="4" ry="1.8" fill="#15803d" stroke="#166534" strokeWidth="0.8" />
              </g>

              {/* Tallo principal cilíndrico */}
              <path
                d="M 0,-7 C -2,-22 2,-36 0,-50"
                stroke={`url(#stem-grad-${uid})`}
                strokeWidth="3.6"
                strokeLinecap="round"
                fill="none"
              />

              {/* Hojas compuestas imparipinnadas con folíolos y nervaduras */}
              {/* Nivel inferior */}
              <g transform="translate(-1, -18)">
                <path d="M 0,0 Q -14,-7 -20,-1 Q -11,5 0,0" fill={leafDark} />
                <line x1="0" y1="0" x2="-18" y2="-1" stroke={leafLight} strokeWidth="0.8" />
                <ellipse cx="-12" cy="-4" rx="3.5" ry="1.8" transform="rotate(-15 -12 -4)" fill={leafMid} />
                <ellipse cx="-12" cy="2" rx="3.5" ry="1.8" transform="rotate(15 -12 2)" fill={leafDark} />
              </g>
              <g transform="translate(1, -19)">
                <path d="M 0,0 Q 14,-7 20,-1 Q 11,5 0,0" fill={leafMid} />
                <line x1="0" y1="0" x2="18" y2="-1" stroke={leafLight} strokeWidth="0.8" />
                <ellipse cx="12" cy="-4" rx="3.5" ry="1.8" transform="rotate(15 12 -4)" fill={leafLight} />
                <ellipse cx="12" cy="2" rx="3.5" ry="1.8" transform="rotate(-15 12 2)" fill={leafMid} />
              </g>

              {/* Nivel medio */}
              <g transform="translate(-1, -32)">
                <path d="M 0,0 Q -15,-9 -22,-3 Q -12,5 0,0" fill={leafMid} />
                <line x1="0" y1="0" x2="-20" y2="-3" stroke={leafLight} strokeWidth="0.8" />
                <ellipse cx="-13" cy="-5" rx="4" ry="2" transform="rotate(-15 -13 -5)" fill={leafLight} />
                <ellipse cx="-13" cy="2" rx="4" ry="2" transform="rotate(15 -13 2)" fill={leafMid} />
              </g>
              <g transform="translate(1, -33)">
                <path d="M 0,0 Q 15,-9 22,-3 Q 12,5 0,0" fill={leafDark} />
                <line x1="0" y1="0" x2="20" y2="-3" stroke={leafLight} strokeWidth="0.8" />
                <ellipse cx="13" cy="-5" rx="4" ry="2" transform="rotate(15 13 -5)" fill={leafMid} />
                <ellipse cx="13" cy="2" rx="4" ry="2" transform="rotate(-15 13 2)" fill={leafDark} />
              </g>

              {/* Ápice foliáceo */}
              <path d="M 0,-44 Q -12,-55 -14,-46 Q -6,-39 0,-44" fill={leafLight} />
              <path d="M 0,-44 Q 12,-55 14,-46 Q 6,-39 0,-44" fill={leafMid} />
              <ellipse cx="0" cy="-52" rx="5" ry="3.2" fill={leafLight} />

              {/* ── INFLORESCENCIA: FLORES ESTRELLADAS CON CONO ANTERAL (BBCH 50–69) ── */}
              {stage >= 50 && stage < 70 && (
                <g data-botanical-feature="star-flower">
                  {/* Flor izquierda */}
                  <g transform="translate(-10, -36)">
                    {/* Cáliz verde posterior */}
                    <line x1="0" y1="0" x2="-3" y2="-3" stroke="#166534" strokeWidth="1" />
                    {/* 5 pétalos estrellados */}
                    <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5" fill={profile.flowerPetalColor} stroke="#ca8a04" strokeWidth="0.6" />
                    {/* Cono central de estambres */}
                    <circle cx="0" cy="0" r="1.6" fill={profile.flowerCenterColor} />
                  </g>
                  {/* Flor derecha */}
                  <g transform="translate(11, -39)">
                    <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5" fill={profile.flowerPetalColor} stroke="#ca8a04" strokeWidth="0.6" />
                    <circle cx="0" cy="0" r="1.6" fill={profile.flowerCenterColor} />
                  </g>
                  {/* Flor superior apical */}
                  <g transform="translate(-2, -49)">
                    <polygon points="0,-5.5 1.6,-1.6 5.5,0 1.6,1.6 0,5.5 -1.6,1.6 -5.5,0 -1.6,-1.6" fill={profile.flowerPetalColor} stroke="#ca8a04" strokeWidth="0.6" />
                    <circle cx="0" cy="0" r="1.8" fill={profile.flowerCenterColor} />
                  </g>
                </g>
              )}

              {/* ── FRUCTIFICACIÓN: FRUTOS CON CÁLIZ Y BRILLO ESPECULAR (BBCH 70+) ── */}
              {stage >= 70 && (
                <g data-botanical-feature="calyx-fruit">
                  {profile.fruitShape === 'elongated_pod' ? (
                    /* Pimientos / Berenjenas con cáliz coronario */
                    <>
                      {/* Fruto izquierdo */}
                      <g transform="translate(-10, -24) rotate(14)">
                        {/* Cáliz verde de 5 sépalos */}
                        <polygon points="0,-8 -3.5,-5 0,-6 3.5,-5" fill="#15803d" stroke="#166534" strokeWidth="0.8" />
                        <ellipse cx="0" cy="0" rx="4.2" ry="7.5" fill={`url(#fruit-grad-${uid})`} stroke={fruitShadowColor} strokeWidth="0.9" />
                        <ellipse cx="-1.5" cy="-2" rx="1.2" ry="3.5" fill="rgba(255,255,255,0.65)" />
                      </g>
                      {/* Fruto derecho */}
                      <g transform="translate(10, -27) rotate(-14)">
                        <polygon points="0,-8 -3.5,-5 0,-6 3.5,-5" fill="#15803d" stroke="#166534" strokeWidth="0.8" />
                        <ellipse cx="0" cy="0" rx="4.2" ry="7.5" fill={`url(#fruit-grad-${uid})`} stroke={fruitShadowColor} strokeWidth="0.9" />
                        <ellipse cx="-1.5" cy="-2" rx="1.2" ry="3.5" fill="rgba(255,255,255,0.65)" />
                      </g>
                    </>
                  ) : (
                    /* Tomates esféricos con cáliz estrellado y brillo especular */
                    <>
                      {/* Tomate izquierdo */}
                      <g transform="translate(-10, -24)">
                        <circle cx="0" cy="0" r="5.6" fill={`url(#fruit-grad-${uid})`} stroke={fruitShadowColor} strokeWidth="0.9" />
                        {/* Brillo especular blanco */}
                        <circle cx="-1.8" cy="-1.8" r="1.5" fill="#ffffff" opacity="0.8" />
                        {/* Cáliz estrellado de 5 sépalos curvados hacia atrás */}
                        <g transform="translate(0, -5.2)">
                          <path d="M 0,0 L -3,-2 M 0,0 L 3,-2 M 0,0 L -4,0.5 M 0,0 L 4,0.5 M 0,0 L 0,-3" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                          <circle cx="0" cy="0" r="1.1" fill="#166534" />
                        </g>
                      </g>

                      {/* Tomate derecho */}
                      <g transform="translate(10, -27)">
                        <circle cx="0" cy="0" r="5.8" fill={`url(#fruit-grad-${uid})`} stroke={fruitShadowColor} strokeWidth="0.9" />
                        <circle cx="-1.8" cy="-1.8" r="1.5" fill="#ffffff" opacity="0.8" />
                        <g transform="translate(0, -5.4)">
                          <path d="M 0,0 L -3,-2 M 0,0 L 3,-2 M 0,0 L -4,0.5 M 0,0 L 4,0.5 M 0,0 L 0,-3" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                          <circle cx="0" cy="0" r="1.1" fill="#166534" />
                        </g>
                      </g>

                      {/* Tomate central apical */}
                      <g transform="translate(0, -38)">
                        <circle cx="0" cy="0" r="4.8" fill={`url(#fruit-grad-${uid})`} stroke={fruitShadowColor} strokeWidth="0.9" />
                        <circle cx="-1.5" cy="-1.5" r="1.3" fill="#ffffff" opacity="0.8" />
                        <g transform="translate(0, -4.5)">
                          <path d="M 0,0 L -2.5,-2 M 0,0 L 2.5,-2 M 0,0 L -3,0 M 0,0 L 3,0" stroke="#15803d" strokeWidth="1.1" strokeLinecap="round" />
                          <circle cx="0" cy="0" r="0.9" fill="#166534" />
                        </g>
                      </g>
                    </>
                  )}
                </g>
              )}
            </g>
          )}

          {/* ── ARQUETIPO 2: CEREAL / GRAMÍNEA (Maíz, Trigo) ── */}
          {profile.archetype === 'cereal_grass' && (
            <g>
              {/* Caña / Culmo segmentado con nudos y hojas acintadas */}
              <g data-botanical-feature="cereal-culm">
                {/* Caña principal cilíndrica */}
                <line x1="0" y1="-7" x2="0" y2="-56" stroke={`url(#stem-grad-${uid})`} strokeWidth="4.2" strokeLinecap="round" />
                {/* Nudos y vainas foliares */}
                <line x1="-3.5" y1="-22" x2="3.5" y2="-22" stroke="#365314" strokeWidth="1.6" />
                <line x1="-3.5" y1="-36" x2="3.5" y2="-36" stroke="#365314" strokeWidth="1.6" />
                <line x1="-3" y1="-48" x2="3" y2="-48" stroke="#365314" strokeWidth="1.4" />

                {/* Hojas inferiores arqueadas con nervadura central (midrib) */}
                <g transform="translate(0, -18)">
                  <path d="M 0,0 Q -18,-14 -25,-6 Q -14,-2 0,0" fill={leafDark} />
                  <line x1="0" y1="0" x2="-23" y2="-6" stroke="#bef264" strokeWidth="1" />
                </g>
                <g transform="translate(0, -20)">
                  <path d="M 0,0 Q 18,-15 25,-7 Q 14,-3 0,0" fill={leafMid} />
                  <line x1="0" y1="0" x2="23" y2="-7" stroke="#d9f99d" strokeWidth="1" />
                </g>

                {/* Hojas medias amplias y colgantes */}
                <g transform="translate(0, -32)">
                  <path d="M 0,0 Q -22,-18 -28,-8 Q -16,-4 0,0" fill={leafMid} />
                  <line x1="0" y1="0" x2="-26" y2="-8" stroke="#d9f99d" strokeWidth="1.1" />
                </g>
                <g transform="translate(0, -34)">
                  <path d="M 0,0 Q 22,-19 28,-9 Q 16,-5 0,0" fill={leafDark} />
                  <line x1="0" y1="0" x2="26" y2="-9" stroke="#bef264" strokeWidth="1.1" />
                </g>

                {/* Hojas superiores / de la bandera */}
                <g transform="translate(0, -44)">
                  <path d="M 0,0 Q -15,-16 -18,-10 Q -10,-6 0,0" fill={leafLight} />
                  <line x1="0" y1="0" x2="-16" y2="-10" stroke="#f7fee7" strokeWidth="0.9" />
                </g>
                <g transform="translate(0, -46)">
                  <path d="M 0,0 Q 15,-17 18,-11 Q 10,-7 0,0" fill={leafMid} />
                  <line x1="0" y1="0" x2="16" y2="-11" stroke="#ecfccb" strokeWidth="0.9" />
                </g>
              </g>

              {/* ── FLORACIÓN: PANOJA APICAL CON ESPIGUILLAS DORADAS (BBCH 50–69) ── */}
              {stage >= 50 && (
                <g data-botanical-feature="cereal-tassel" transform="translate(0, -56)">
                  {/* Eje central de la panoja */}
                  <line x1="0" y1="2" x2="0" y2="-14" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                  {/* Ramas laterales de espiguillas */}
                  <path d="M 0,-4 Q -7,-9 -9,-14" stroke="#ca8a04" strokeWidth="1.4" fill="none" />
                  <path d="M 0,-4 Q 7,-9 9,-14" stroke="#ca8a04" strokeWidth="1.4" fill="none" />
                  <path d="M 0,-8 Q -5,-14 -6,-18" stroke="#eab308" strokeWidth="1.3" fill="none" />
                  <path d="M 0,-8 Q 5,-14 6,-18" stroke="#eab308" strokeWidth="1.3" fill="none" />
                  {/* Espiguillas de polen doradas */}
                  <circle cx="0" cy="-14" r="1.6" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
                  <circle cx="-9" cy="-14" r="1.4" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
                  <circle cx="9" cy="-14" r="1.4" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
                </g>
              )}

              {/* ── FRUCTIFICACIÓN: MAZORCAS CON CHALAS Y SEDAS (BBCH 70+) ── */}
              {stage >= 70 && (
                <g data-botanical-feature="maize-cob">
                  {/* Mazorca principal izquierda */}
                  <g transform="translate(-5, -28) rotate(-22)">
                    {/* Cuerpo de la mazorca con granos dorados */}
                    <ellipse cx="0" cy="0" rx="4.5" ry="9" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
                    {/* Hileras de granos */}
                    <line x1="-1.5" y1="-6" x2="-1.5" y2="6" stroke="#ca8a04" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
                    <line x1="1.5" y1="-6" x2="1.5" y2="6" stroke="#ca8a04" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
                    {/* Chalas envolventes verdes */}
                    <path d="M -4.2,6 Q -6,0 -4.5,-7" stroke="#4d7c0f" strokeWidth="1.8" fill="none" />
                    <path d="M 4.2,6 Q 6,0 4.5,-7" stroke="#65a30d" strokeWidth="1.8" fill="none" />
                    {/* Sedas / Barbas de choclo sobresaliendo del ápice */}
                    <path d="M 0,-8 Q -3,-14 -1,-17" stroke="#b45309" strokeWidth="1" fill="none" />
                    <path d="M 1,-8 Q 3,-14 2,-16" stroke="#d97706" strokeWidth="0.9" fill="none" />
                  </g>

                  {/* Mazorca secundaria derecha */}
                  <g transform="translate(6, -34) rotate(22)">
                    <ellipse cx="0" cy="0" rx="4.2" ry="8.5" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
                    <line x1="-1.2" y1="-5.5" x2="-1.2" y2="5.5" stroke="#ca8a04" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
                    <line x1="1.2" y1="-5.5" x2="1.2" y2="5.5" stroke="#ca8a04" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
                    <path d="M -3.8,5.5 Q -5.5,0 -4,-6" stroke="#4d7c0f" strokeWidth="1.8" fill="none" />
                    <path d="M 3.8,5.5 Q 5.5,0 4,-6" stroke="#65a30d" strokeWidth="1.8" fill="none" />
                    <path d="M 0,-7 Q -2,-13 -1,-16" stroke="#b45309" strokeWidth="0.9" fill="none" />
                    <path d="M 1,-7 Q 3,-13 2,-15" stroke="#d97706" strokeWidth="0.8" fill="none" />
                  </g>
                </g>
              )}
            </g>
          )}

          {/* ── ARQUETIPO 3: GIRASOL / CAPÍTULO SOLAR (Helianthus) ── */}
          {profile.archetype === 'heliotropo_tall' && (
            <g>
              {/* Tallo robusto y hojas cordadas (data-botanical-feature="sunflower-stem") */}
              <g data-botanical-feature="sunflower-stem">
                {/* Tallo principal grueso y cilíndrico */}
                {stage >= 70 ? (
                  /* En fructificación el tallo superior se encorva por el peso del capítulo */
                  <path
                    d="M 0,-7 L 0,-38 Q 0,-48 -8,-52"
                    stroke={`url(#stem-grad-${uid})`}
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : (
                  <line
                    x1="0"
                    y1="-7"
                    x2="0"
                    y2="-52"
                    stroke={`url(#stem-grad-${uid})`}
                    strokeWidth="4.8"
                    strokeLinecap="round"
                  />
                )}

                {/* Hojas basales e intermedias: amplias, acorazonadas (cordadas) con pecíolo y nervaduras */}
                {/* Nivel inferior */}
                <g transform="translate(0, -16)">
                  {/* Hoja izquierda */}
                  <path
                    d="M 0,0 C -6,-8 -22,-14 -25,-4 C -26,6 -10,7 0,0"
                    fill={leafDark}
                    stroke="#1b4332"
                    strokeWidth="0.6"
                  />
                  <line x1="0" y1="0" x2="-23" y2="-3" stroke={leafLight} strokeWidth="1" />
                  <path d="M -10,-2 Q -16,-6 -18,-9" stroke={leafLight} strokeWidth="0.7" fill="none" />
                  <path d="M -12,0 Q -17,4 -19,5" stroke={leafLight} strokeWidth="0.7" fill="none" />

                  {/* Hoja derecha */}
                  <path
                    d="M 0,0 C 6,-8 22,-14 25,-4 C 26,6 10,7 0,0"
                    fill={leafMid}
                    stroke="#166534"
                    strokeWidth="0.6"
                  />
                  <line x1="0" y1="0" x2="23" y2="-3" stroke={leafLight} strokeWidth="1" />
                  <path d="M 10,-2 Q 16,-6 18,-9" stroke={leafLight} strokeWidth="0.7" fill="none" />
                  <path d="M 12,0 Q 17,4 19,5" stroke={leafLight} strokeWidth="0.7" fill="none" />
                </g>

                {/* Nivel medio */}
                <g transform="translate(0, -30)">
                  {/* Hoja media izquierda */}
                  <path
                    d="M 0,0 C -5,-7 -20,-11 -22,-2 C -23,6 -8,5 0,0"
                    fill={leafMid}
                    stroke="#166534"
                    strokeWidth="0.6"
                  />
                  <line x1="0" y1="0" x2="-20" y2="-2" stroke={leafLight} strokeWidth="0.9" />

                  {/* Hoja media derecha */}
                  <path
                    d="M 0,0 C 5,-7 20,-11 22,-2 C 23,6 8,5 0,0"
                    fill={leafLight}
                    stroke="#2d6a4f"
                    strokeWidth="0.6"
                  />
                  <line x1="0" y1="0" x2="20" y2="-2" stroke="#ecfccb" strokeWidth="0.9" />
                </g>

                {/* Hojas superiores subapicales */}
                <g transform="translate(0, -42)">
                  <path
                    d="M 0,0 Q -12,-8 -15,-2 Q -8,3 0,0"
                    fill={leafLight}
                  />
                  <path
                    d="M 0,0 Q 12,-8 15,-2 Q 8,3 0,0"
                    fill={leafMid}
                  />
                </g>
              </g>

              {/* ── FLORACIÓN: CAPÍTULO SOLAR RADIANTE (BBCH 50–69) ── */}
              {stage >= 50 && stage < 70 && (
                <g data-botanical-feature="sunflower-head" transform="translate(0, -54)">
                  {/* Brácteas involucrales verdes posteriores */}
                  <g fill="#3f6212" stroke="#1a2e05" strokeWidth="0.5">
                    <polygon points="0,-15 -3,-11 3,-11" />
                    <polygon points="-11,-10 -9,-6 -6,-9" />
                    <polygon points="11,-10 9,-6 6,-9" />
                    <polygon points="-15,0 -11,-3 -11,3" />
                    <polygon points="15,0 11,-3 11,3" />
                    <polygon points="-11,10 -9,6 -6,9" />
                    <polygon points="11,10 9,6 6,9" />
                    <polygon points="0,15 -3,11 3,11" />
                  </g>

                  {/* Anillo exterior de lígulas doradas (pétalos radiantes) */}
                  <g fill="#facc15" stroke="#ca8a04" strokeWidth="0.6">
                    {/* 12 pétalos exteriores */}
                    <ellipse cx="0" cy="-14" rx="2.5" ry="5.5" />
                    <ellipse cx="7" cy="-12" rx="2.5" ry="5.5" transform="rotate(30 7 -12)" />
                    <ellipse cx="12" cy="-7" rx="2.5" ry="5.5" transform="rotate(60 12 -7)" />
                    <ellipse cx="14" cy="0" rx="2.5" ry="5.5" transform="rotate(90 14 0)" />
                    <ellipse cx="12" cy="7" rx="2.5" ry="5.5" transform="rotate(120 12 7)" />
                    <ellipse cx="7" cy="12" rx="2.5" ry="5.5" transform="rotate(150 7 12)" />
                    <ellipse cx="0" cy="14" rx="2.5" ry="5.5" transform="rotate(180 0 14)" />
                    <ellipse cx="-7" cy="12" rx="2.5" ry="5.5" transform="rotate(210 -7 12)" />
                    <ellipse cx="-12" cy="7" rx="2.5" ry="5.5" transform="rotate(240 -12 7)" />
                    <ellipse cx="-14" cy="0" rx="2.5" ry="5.5" transform="rotate(270 -14 0)" />
                    <ellipse cx="-12" cy="-7" rx="2.5" ry="5.5" transform="rotate(300 -12 -7)" />
                    <ellipse cx="-7" cy="-12" rx="2.5" ry="5.5" transform="rotate(330 -7 -12)" />
                  </g>

                  {/* Anillo interior de lígulas doradas brillantes (intercaladas) */}
                  <g fill="#fef08a" stroke="#eab308" strokeWidth="0.5">
                    <ellipse cx="4" cy="-10" rx="2" ry="4.5" transform="rotate(15 4 -10)" />
                    <ellipse cx="10" cy="-4" rx="2" ry="4.5" transform="rotate(45 10 -4)" />
                    <ellipse cx="11" cy="4" rx="2" ry="4.5" transform="rotate(75 11 4)" />
                    <ellipse cx="4" cy="10" rx="2" ry="4.5" transform="rotate(105 4 10)" />
                    <ellipse cx="-4" cy="10" rx="2" ry="4.5" transform="rotate(135 -4 10)" />
                    <ellipse cx="-10" cy="4" rx="2" ry="4.5" transform="rotate(165 -10 4)" />
                    <ellipse cx="-11" cy="-4" rx="2" ry="4.5" transform="rotate(195 -11 -4)" />
                    <ellipse cx="-4" cy="-10" rx="2" ry="4.5" transform="rotate(225 -4 -10)" />
                  </g>

                  {/* Disco central de flores tubulares (capítulo) */}
                  <circle cx="0" cy="0" r="8" fill="#713f12" stroke="#ca8a04" strokeWidth="1.2" />
                  <circle cx="0" cy="0" r="5" fill="#451a03" stroke="#92400e" strokeWidth="0.8" />
                  <circle cx="0" cy="0" r="2.2" fill="#1c0a00" />
                  {/* Estrellitas de polen en la corona del disco */}
                  <circle cx="-3" cy="-3" r="0.8" fill="#fef08a" />
                  <circle cx="3" cy="-3" r="0.8" fill="#fef08a" />
                  <circle cx="-3" cy="3" r="0.8" fill="#fef08a" />
                  <circle cx="3" cy="3" r="0.8" fill="#fef08a" />
                </g>
              )}

              {/* ── FRUCTIFICACIÓN: CABEZA PÉNDULA DE AQUENIOS MADUROS (BBCH 70+) ── */}
              {stage >= 70 && (
                <g data-botanical-feature="sunflower-seed-head" transform="translate(-10, -52) rotate(16)">
                  {/* Involucro posterior inclinado (cáliz/brácteas secas doradas-verdosas) */}
                  <ellipse cx="0" cy="-2" rx="13" ry="10" fill="#4d7c0f" stroke="#365314" strokeWidth="0.9" />

                  {/* Disco masivo de semillas (aquenios) */}
                  <ellipse cx="0" cy="2" rx="12" ry="9" fill="#1c1917" stroke="#ca8a04" strokeWidth="1.2" />

                  {/* Patrón reticulado radial de aquenios estriados en espiral */}
                  <g stroke="#78716c" strokeWidth="0.9" strokeDasharray="1.5 1.2" fill="none">
                    <ellipse cx="0" cy="2" rx="9" ry="6.5" />
                    <ellipse cx="0" cy="2" rx="6" ry="4.5" />
                    <ellipse cx="0" cy="2" rx="3" ry="2" />
                  </g>
                  <g stroke="#a8a29e" strokeWidth="0.7">
                    <line x1="-8" y1="2" x2="8" y2="2" strokeDasharray="1 1.5" />
                    <line x1="0" y1="-5" x2="0" y2="8" strokeDasharray="1 1.5" />
                    <line x1="-6" y1="-3" x2="6" y2="6" strokeDasharray="1 1.5" />
                    <line x1="6" y1="-3" x2="-6" y2="6" strokeDasharray="1 1.5" />
                  </g>

                  {/* Lígulas marchitas y secas que cuelgan del borde del capítulo */}
                  <g fill="#ca8a04" opacity="0.85">
                    <path d="M -11,4 Q -14,10 -11,13 Q -10,9 -9,5 Z" />
                    <path d="M -6,8 Q -7,14 -4,15 Q -4,11 -3,9 Z" />
                    <path d="M 0,9 Q 0,16 2,16 Q 2,12 3,9 Z" />
                    <path d="M 6,8 Q 8,14 10,13 Q 8,10 7,8 Z" />
                    <path d="M 10,5 Q 14,9 13,12 Q 11,8 9,5 Z" />
                  </g>
                </g>
              )}
            </g>
          )}

          {/* ── ARQUETIPO 4: HORTECILLAS DE HOJA Y ROSETAS (Lechuga, Espinaca, Brássica, Frutilla) ── */}
          {profile.archetype === 'rosette_leafy' && (
            <g>
              {profile.fruitShape === 'berry_cluster' ? (
                /* ── SUB-VARIANTE FRUTILLA (Fragaria) ── */
                <g>
                  {/* Follaje trifoliado con folíolos aserrados */}
                  {/* Peciolo y trifolio izquierdo */}
                  <g transform="translate(0, -6)">
                    <line x1="0" y1="0" x2="-14" y2="-12" stroke={leafLight} strokeWidth="1.2" strokeLinecap="round" />
                    {/* Folíolo central */}
                    <ellipse cx="-16" cy="-15" rx="5" ry="3.5" transform="rotate(-35 -16 -15)" fill={leafDark} stroke="#14532d" strokeWidth="0.6" />
                    <line x1="-13" y1="-12" x2="-18" y2="-17" stroke={leafLight} strokeWidth="0.8" />
                    {/* Folíolo lateral superior */}
                    <ellipse cx="-13" cy="-18" rx="4.2" ry="3" transform="rotate(-15 -13 -18)" fill={leafMid} stroke="#166534" strokeWidth="0.6" />
                    {/* Folíolo lateral inferior */}
                    <ellipse cx="-18" cy="-11" rx="4.2" ry="3" transform="rotate(-55 -18 -11)" fill={leafDark} stroke="#14532d" strokeWidth="0.6" />
                  </g>

                  {/* Peciolo y trifolio derecho */}
                  <g transform="translate(0, -6)">
                    <line x1="0" y1="0" x2="14" y2="-12" stroke={leafLight} strokeWidth="1.2" strokeLinecap="round" />
                    <ellipse cx="16" cy="-15" rx="5" ry="3.5" transform="rotate(35 16 -15)" fill={leafMid} stroke="#166534" strokeWidth="0.6" />
                    <line x1="13" y1="-12" x2="18" y2="-17" stroke={leafLight} strokeWidth="0.8" />
                    <ellipse cx="13" cy="-18" rx="4.2" ry="3" transform="rotate(15 13 -18)" fill={leafLight} stroke="#15803d" strokeWidth="0.6" />
                    <ellipse cx="18" cy="-11" rx="4.2" ry="3" transform="rotate(55 18 -11)" fill={leafMid} stroke="#166534" strokeWidth="0.6" />
                  </g>

                  {/* Trifolio central erecto */}
                  <g transform="translate(0, -6)">
                    <line x1="0" y1="0" x2="0" y2="-16" stroke={leafLight} strokeWidth="1.2" strokeLinecap="round" />
                    <ellipse cx="0" cy="-20" rx="5.5" ry="3.8" fill={leafLight} stroke="#15803d" strokeWidth="0.6" />
                    <line x1="0" y1="-16" x2="0" y2="-23" stroke="#f0fdf4" strokeWidth="0.8" />
                    <ellipse cx="-5" cy="-18" rx="4.5" ry="3" transform="rotate(-25 -5 -18)" fill={leafMid} stroke="#166534" strokeWidth="0.6" />
                    <ellipse cx="5" cy="-18" rx="4.5" ry="3" transform="rotate(25 5 -18)" fill={leafLight} stroke="#15803d" strokeWidth="0.6" />
                  </g>

                  {/* Flores blancas de 5 pétalos con centro dorado (BBCH 50+) */}
                  {stage >= 50 && (
                    <g data-botanical-feature="strawberry-flower">
                      {/* Flor superior izquierda */}
                      <g transform="translate(-7, -24)">
                        {/* 5 pétalos blancos redondeados */}
                        <circle cx="0" cy="-3.2" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="3" cy="-1" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="2" cy="2.5" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="-2" cy="2.5" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="-3" cy="-1" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        {/* Centro estaminífero amarillo dorado */}
                        <circle cx="0" cy="0" r="1.8" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" />
                      </g>

                      {/* Flor apical derecha */}
                      <g transform="translate(8, -25)">
                        <circle cx="0" cy="-3.2" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="3" cy="-1" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="2" cy="2.5" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="-2" cy="2.5" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="-3" cy="-1" r="2.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                        <circle cx="0" cy="0" r="1.8" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" />
                      </g>
                    </g>
                  )}

                  {/* Frutillas colgantes cónicas con aquenios y cáliz estrellado (BBCH 70+) */}
                  {stage >= 70 && (
                    <g data-botanical-feature="strawberry-berry">
                      {/* Frutilla principal izquierda que desborda el borde */}
                      <g transform="translate(-11, -10) rotate(-12)">
                        {/* Cáliz verde reflexo */}
                        <path d="M 0,-5 L -3,-7 M 0,-5 L 3,-7 M 0,-5 L -4,-3 M 0,-5 L 4,-3" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                        {/* Baya cónica roja carnosa */}
                        <path d="M -5,-4 C -5,2 -1,8 0,9 C 1,8 5,2 5,-4 C 3,-5 -3,-5 -5,-4 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
                        {/* Brillo especular superior */}
                        <ellipse cx="-1.8" cy="-1.5" rx="1.4" ry="2.2" fill="#fca5a5" opacity="0.75" />
                        {/* Semillas / aquenios dorados superficiales */}
                        <circle cx="-2" cy="-1" r="0.6" fill="#fef08a" />
                        <circle cx="2" cy="-1" r="0.6" fill="#fef08a" />
                        <circle cx="-1" cy="2" r="0.6" fill="#fef08a" />
                        <circle cx="2" cy="3" r="0.6" fill="#fef08a" />
                        <circle cx="0" cy="6" r="0.5" fill="#fef08a" />
                      </g>

                      {/* Frutilla secundaria derecha */}
                      <g transform="translate(12, -9) rotate(16)">
                        <path d="M 0,-4 L -2.5,-6 M 0,-4 L 2.5,-6 M 0,-4 L -3,-2 M 0,-4 L 3,-2" stroke="#15803d" strokeWidth="1.1" strokeLinecap="round" />
                        <path d="M -4.2,-3 C -4.2,2 -0.8,7 0,8 C 0.8,7 4.2,2 4.2,-3 C 2.5,-4 -2.5,-4 -4.2,-3 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
                        <ellipse cx="-1.4" cy="-1" rx="1.1" ry="1.8" fill="#fca5a5" opacity="0.7" />
                        <circle cx="-1.5" cy="-0.5" r="0.5" fill="#fef08a" />
                        <circle cx="1.5" cy="-0.5" r="0.5" fill="#fef08a" />
                        <circle cx="0" cy="2.5" r="0.5" fill="#fef08a" />
                        <circle cx="0" cy="5.2" r="0.4" fill="#fef08a" />
                      </g>
                    </g>
                  )}
                </g>
              ) : (
                /* ── SUB-VARIANTE HORTALIZAS DE HOJA / LECHUGA / REPOLLO (Lactuca, Brassica) ── */
                <g data-botanical-feature="leafy-rosette">
                  {/* Capa basal exterior: hojas envolventes onduladas y crespas */}
                  <g fill={leafDark} stroke="#14532d" strokeWidth="0.8">
                    {/* Hoja inferior izquierda */}
                    <path d="M 0,-6 C -12,-3 -22,-8 -24,-14 C -20,-18 -12,-14 0,-8 Z" />
                    {/* Hoja inferior derecha */}
                    <path d="M 0,-6 C 12,-3 22,-8 24,-14 C 20,-18 12,-14 0,-8 Z" />
                    {/* Hoja anterior delantera */}
                    <path d="M -11,-4 C -8,2 8,2 11,-4 C 7,-8 -7,-8 -11,-4 Z" />
                    {/* Hoja posterior dorsal */}
                    <path d="M -14,-10 C -12,-22 12,-22 14,-10 C 6,-14 -6,-14 -14,-10 Z" />
                  </g>

                  {/* Nervaduras basales principales */}
                  <line x1="0" y1="-7" x2="-18" y2="-13" stroke={leafLight} strokeWidth="1" strokeLinecap="round" />
                  <line x1="0" y1="-7" x2="18" y2="-13" stroke={leafLight} strokeWidth="1" strokeLinecap="round" />
                  <line x1="0" y1="-7" x2="0" y2="-16" stroke={leafLight} strokeWidth="1.2" strokeLinecap="round" />

                  {/* Capa intermedia: hojas abullonadas y turgentes */}
                  <g fill={leafMid} stroke="#166534" strokeWidth="0.7">
                    <path d="M 0,-7 C -8,-10 -16,-16 -16,-22 C -10,-24 -4,-18 0,-11 Z" />
                    <path d="M 0,-7 C 8,-10 16,-16 16,-22 C 10,-24 4,-18 0,-11 Z" />
                    <path d="M -8,-8 C -8,-16 8,-16 8,-8 C 4,-12 -4,-12 -8,-8 Z" />
                  </g>

                  {/* Nervaduras secundarias */}
                  <line x1="0" y1="-9" x2="-12" y2="-18" stroke="#dcfce7" strokeWidth="0.9" />
                  <line x1="0" y1="-9" x2="12" y2="-18" stroke="#dcfce7" strokeWidth="0.9" />

                  {/* Corazón / Cogollo central: hojas tiernas compactas y rizadas */}
                  <g fill={leafLight} stroke="#15803d" strokeWidth="0.7">
                    <ellipse cx="0" cy="-18" rx="8" ry="6" />
                    <path d="M -5,-18 Q 0,-24 5,-18 Q 0,-14 -5,-18 Z" fill="#bbf7d0" />
                    <ellipse cx="0" cy="-19" rx="3.5" ry="2.8" fill="#dcfce7" />
                  </g>
                </g>
              )}
            </g>
          )}

          {/* ── ARQUETIPO 5: RAÍCES, TUBÉRCULOS Y BULBOS (Zanahoria, Remolacha, Rábano, Allium) ── */}
          {profile.archetype === 'root_tuber' && (
            <g>
              {/* 1. Hombro carnoso de la raíz emergente del suelo/sustrato */}
              <g data-botanical-feature="root-shoulder">
                {profile.cropCode === 'CARROT' ? (
                  /* Hombro de zanahoria naranja cónico con estrías horizontales */
                  <g>
                    <path
                      d="M -7,-5 C -8,-1 -2,2 0,2 C 2,2 8,-1 7,-5 C 5,-11 2,-13 0,-13 C -2,-13 -5,-11 -7,-5 Z"
                      fill="#ea580c"
                      stroke="#9a3412"
                      strokeWidth="0.9"
                    />
                    {/* Estrías de crecimiento / lenticelas anulares */}
                    <line x1="-5" y1="-8" x2="5" y2="-8" stroke="#c2410c" strokeWidth="0.8" />
                    <line x1="-4" y1="-5" x2="4" y2="-5" stroke="#c2410c" strokeWidth="0.8" />
                    <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#9a3412" strokeWidth="0.8" />
                    {/* Brillo especular sutil en el hombro */}
                    <ellipse cx="-2.5" cy="-8" rx="1.2" ry="2.5" fill="#fdba74" opacity="0.6" />
                  </g>
                ) : profile.cropCode === 'BEETROOT' || profile.cropCode === 'RADISH' ? (
                  /* Corona globular de remolacha / rábano púrpura/magenta */
                  <g>
                    <ellipse cx="0" cy="-6" rx={stage >= 70 ? 9.5 : 7} ry={stage >= 70 ? 6.5 : 4.8} fill="#881337" stroke="#4c0519" strokeWidth="1" />
                    <ellipse cx="-2" cy="-7.5" rx="2.5" ry="1.5" fill="#f43f5e" opacity="0.5" />
                    <path d="M -5,-5 Q 0,-3 5,-5" stroke="#4c0519" strokeWidth="0.8" fill="none" />
                  </g>
                ) : (
                  /* Bulbo / tubérculo general */
                  <g>
                    <ellipse cx="0" cy="-6" rx={stage >= 70 ? 9 : 6.5} ry={stage >= 70 ? 5.5 : 4} fill={fruitBaseColor} stroke={fruitShadowColor} strokeWidth="1" />
                  </g>
                )}
              </g>

              {/* 2. Follaje específico según especie */}
              {profile.cropCode === 'CARROT' ? (
                /* Follaje plumoso / bipinnatisecto de la zanahoria (plumose-foliage) */
                <g data-botanical-feature="plumose-foliage">
                  {/* Rama central alta plumosa */}
                  <g transform="translate(0, -11)">
                    <path d="M 0,0 L 0,-32" stroke="#15803d" strokeWidth="1.3" strokeLinecap="round" />
                    {/* Plúmulas / folíolos finos en peine */}
                    <path d="M 0,-10 L -6,-14 M 0,-10 L 6,-14" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                    <path d="M 0,-16 L -8,-21 M 0,-16 L 8,-21" stroke="#4ade80" strokeWidth="1" strokeLinecap="round" />
                    <path d="M 0,-22 L -9,-28 M 0,-22 L 9,-28" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                    <path d="M 0,-27 L -7,-33 M 0,-27 L 7,-33" stroke="#86efac" strokeWidth="0.9" strokeLinecap="round" />
                    <path d="M 0,-32 L -4,-37 M 0,-32 L 4,-37" stroke="#bbf7d0" strokeWidth="0.8" strokeLinecap="round" />
                  </g>

                  {/* Rama lateral izquierda arqueada */}
                  <g transform="translate(-1, -10)">
                    <path d="M 0,0 Q -10,-12 -16,-26" stroke="#166534" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M -5,-8 L -11,-10 M -5,-8 L -3,-13" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                    <path d="M -9,-15 L -16,-17 M -9,-15 L -8,-20" stroke="#4ade80" strokeWidth="1" strokeLinecap="round" />
                    <path d="M -13,-21 L -19,-23 M -13,-21 L -12,-26" stroke="#86efac" strokeWidth="0.9" strokeLinecap="round" />
                  </g>

                  {/* Rama lateral derecha arqueada */}
                  <g transform="translate(1, -10)">
                    <path d="M 0,0 Q 10,-12 16,-26" stroke="#166534" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M 5,-8 L 11,-10 M 5,-8 L 3,-13" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                    <path d="M 9,-15 L 16,-17 M 9,-15 L 8,-20" stroke="#4ade80" strokeWidth="1" strokeLinecap="round" />
                    <path d="M 13,-21 L 19,-23 M 13,-21 L 12,-26" stroke="#86efac" strokeWidth="0.9" strokeLinecap="round" />
                  </g>
                </g>
              ) : profile.cropCode === 'BEETROOT' || profile.cropCode === 'RADISH' ? (
                /* Hojas de remolacha con pecíolos y nervaduras magenta / púrpura (beet-foliage) */
                <g data-botanical-feature="beet-foliage">
                  {/* Hoja izquierda */}
                  <g transform="translate(0, -9)">
                    {/* Pecíolo magenta */}
                    <path d="M 0,0 Q -8,-10 -15,-16" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    {/* Limbo foliar verde oscuro acorazonado/ondulado */}
                    <ellipse cx="-16" cy="-21" rx="7" ry="5" transform="rotate(-30 -16 -21)" fill="#14532d" stroke="#052e16" strokeWidth="0.7" />
                    {/* Nervadura central magenta */}
                    <path d="M -13,-17 L -19,-25" stroke="#fb7185" strokeWidth="1.1" strokeLinecap="round" />
                  </g>

                  {/* Hoja derecha */}
                  <g transform="translate(0, -9)">
                    <path d="M 0,0 Q 8,-10 15,-16" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <ellipse cx="16" cy="-21" rx="7" ry="5" transform="rotate(30 16 -21)" fill="#166534" stroke="#052e16" strokeWidth="0.7" />
                    <path d="M 13,-17 L 19,-25" stroke="#fb7185" strokeWidth="1.1" strokeLinecap="round" />
                  </g>

                  {/* Hoja central erecta */}
                  <g transform="translate(0, -9)">
                    <line x1="0" y1="0" x2="0" y2="-22" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
                    <ellipse cx="0" cy="-26" rx="6.5" ry="7.5" fill="#15803d" stroke="#052e16" strokeWidth="0.7" />
                    <line x1="0" y1="-20" x2="0" y2="-32" stroke="#fda4af" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                </g>
              ) : (
                /* Follaje tubular / erecto para cebollas, ajos y otros tubérculos */
                <g>
                  <path d="M 0,-7 Q -10,-24 -14,-36" stroke={leafDark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <path d="M 0,-7 Q 10,-24 14,-36" stroke={leafMid} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <path d="M 0,-8 L 0,-42" stroke={leafLight} strokeWidth="2.5" strokeLinecap="round" />
                </g>
              )}
            </g>
          )}

          {profile.archetype === 'palmate_cane' && (
            <g>
              <line x1="0" y1="-7" x2="0" y2="-49" stroke={stemColor} strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 0,-17 L -16,-24 M 0,-17 L -18,-18 M 0,-17 L -12,-12" stroke={leafDark} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M 0,-17 L 16,-24 M 0,-17 L 18,-18 M 0,-17 L 12,-12" stroke={leafMid} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M 0,-29 L -18,-37 M 0,-29 L 18,-37" stroke={leafLight} strokeWidth="2.5" strokeLinecap="round" />
              {stage >= 50 && (
                <ellipse cx="0" cy="-48" rx={stage >= 70 ? 6 : 4.5} ry={stage >= 70 ? 11 : 8} fill={fruitBaseColor} stroke={stage >= 70 ? '#d97706' : '#a7f3d0'} strokeWidth="1" />
              )}
            </g>
          )}

          {profile.archetype === 'vine_climber' && (
            <g>
              <line x1="3" y1="-6" x2="3" y2="-48" stroke="#a16207" strokeWidth="2.2" />
              <path d="M -2,-7 C -8,-18 8,-28 -3,-39 C 4,-45 2,-49 0,-51" stroke={stemColor} strokeWidth="2.8" fill="none" />
              <path d="M -2,-18 Q -18,-25 -19,-17 Q -10,-11 -2,-18" fill={leafDark} />
              <path d="M 2,-25 Q 18,-32 19,-24 Q 10,-18 2,-25" fill={leafMid} />
              {stage >= 70 && (
                <ellipse cx="-9" cy="-24" rx="2.6" ry="8" transform="rotate(12 -9 -24)" fill={fruitBaseColor} stroke={fruitShadowColor} strokeWidth="0.9" />
              )}
            </g>
          )}

          {profile.archetype === 'woody_perennial' && (
            <g>
              <path d="M 0,-7 L 0,-30 M 0,-22 L -10,-32 M 0,-24 L 10,-33" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              <circle cx="-11" cy="-34" r="11" fill={leafDark} />
              <circle cx="11" cy="-34" r="11" fill={leafMid} />
              <circle cx="0" cy="-42" r="13" fill={leafMid} />
              {stage >= 70 && (
                <>
                  <circle cx="-10" cy="-32" r="4.5" fill={fruitBaseColor} stroke={fruitShadowColor} strokeWidth="0.9" />
                  <circle cx="10" cy="-33" r="4.5" fill={fruitBaseColor} stroke={fruitShadowColor} strokeWidth="0.9" />
                </>
              )}
            </g>
          )}
        </g>
      )}

      {/* ── Insignia Superior Contextual (Madurez BBCH >= 80 o Generación en Lente Genético) ── */}
      {lensMode === 'genetics' && generation ? (
        <g transform="translate(0, -64)">
          <rect x="-16" y="-8" width="32" height="13" rx="6" fill="#6d28d9" stroke="#ffffff" strokeWidth="1" />
          <text x="0" y="1.5" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#ffffff">
            {generation.slice(0, 5)}
          </text>
        </g>
      ) : stage >= 80 && status === 'active' ? (
        <g transform="translate(18, -48)">
          <circle cx="0" cy="0" r="7" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
          <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="800" fill="#854d0e">
            ★
          </text>
        </g>
      ) : null}

      {/* ── Etiqueta Compacta en la Base con Indicador de Color por Especie ── */}
      <g transform="translate(0, 20)">
        <rect
          x="-30"
          y="-8"
          width="60"
          height="15"
          rx="4"
          fill={isSelected ? '#1b4332' : 'rgba(255, 255, 255, 0.94)'}
          stroke={isSelected ? '#2d6a4f' : '#cbd5e1'}
          strokeWidth="1"
        />
        <circle cx="-23" cy="-0.5" r="3" fill={profile.badgeColor} />
        <text
          x="3"
          y="2.5"
          textAnchor="middle"
          fontSize="8.2"
          fontWeight="700"
          fontFamily="monospace"
          fill={isSelected ? '#ffffff' : '#1e293b'}
        >
          {label.length > 9 ? label.slice(-8) : label}
        </text>
      </g>
    </g>
  )
}
