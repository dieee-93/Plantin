import type { FloorMaterialType, WallMaterialType } from '@/domain/spaceGeometry';

export type StructuralMaterialType = 'wood_carpentry' | 'metal_frame';

export interface SpaceMaterialConfig {
  id: string;
  label: string;
  fallbackColor: string;
  roughness: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  metersPerTileX: number;
  metersPerTileY: number;
  textureUrl?: string;
  normalMapUrl?: string;
  armMapUrl?: string; // R = Ambient Occlusion, G = Roughness, B = Metalness
  normalScale?: number;
  aoMapIntensity?: number;
  antiTile?: boolean;
  tintColor?: string;
}

export const FLOOR_MATERIAL_CONFIGS: Record<FloorMaterialType, SpaceMaterialConfig> = {
  soil: {
    id: 'soil',
    label: 'Tierra de cultivo',
    fallbackColor: '#7c5338',
    roughness: 0.95,
    metalness: 0.0,
    metersPerTileX: 2.5,
    metersPerTileY: 2.5,
    textureUrl: '/textures/floors/soil/albedo.webp',
    normalMapUrl: '/textures/floors/soil/normal.webp',
    armMapUrl: '/textures/floors/soil/arm.webp',
    normalScale: 0.65,
    aoMapIntensity: 0.7,
    antiTile: true,
  },
  grass: {
    id: 'grass',
    label: 'Césped',
    fallbackColor: '#5b8c2a',
    roughness: 0.92,
    metalness: 0.0,
    metersPerTileX: 2.2,
    metersPerTileY: 2.2,
    textureUrl: '/textures/floors/grass/albedo.webp',
    normalMapUrl: '/textures/floors/grass/normal.webp',
    armMapUrl: '/textures/floors/grass/arm.webp',
    normalScale: 0.6,
    aoMapIntensity: 0.65,
    antiTile: true,
  },
  concrete: {
    id: 'concrete',
    label: 'Hormigón / Cemento',
    fallbackColor: '#b8b2a6',
    roughness: 0.9,
    metalness: 0.0,
    metersPerTileX: 2.0,
    metersPerTileY: 2.0,
    textureUrl: '/textures/floors/concrete/albedo.webp',
    normalMapUrl: '/textures/floors/concrete/normal.webp',
    armMapUrl: '/textures/floors/concrete/arm.webp',
    normalScale: 0.6,
    aoMapIntensity: 0.55,
    antiTile: true,
  },
  gravel: {
    id: 'gravel',
    label: 'Grava / Canto rodado',
    fallbackColor: '#9c9284',
    roughness: 0.95,
    metalness: 0.0,
    metersPerTileX: 1.8,
    metersPerTileY: 1.8,
    textureUrl: '/textures/floors/gravel/albedo.webp',
    normalMapUrl: '/textures/floors/gravel/normal.webp',
    armMapUrl: '/textures/floors/gravel/arm.webp',
    normalScale: 0.75,
    aoMapIntensity: 0.75,
    antiTile: true,
  },
  tile: {
    id: 'tile',
    label: 'Baldosas / Cerámica',
    fallbackColor: '#b87352',
    roughness: 0.88,
    metalness: 0.0,
    metersPerTileX: 1.6,
    metersPerTileY: 1.6,
    textureUrl: '/textures/floors/tile/albedo.webp',
    normalMapUrl: '/textures/floors/tile/normal.webp',
    armMapUrl: '/textures/floors/tile/arm.webp',
    normalScale: 0.55,
    aoMapIntensity: 0.5,
    antiTile: false,
  },
  wood: {
    id: 'wood',
    label: 'Deck de madera',
    fallbackColor: '#a46334',
    roughness: 0.88,
    metalness: 0.0,
    metersPerTileX: 1.8,
    metersPerTileY: 1.8,
    textureUrl: '/textures/floors/wood/albedo.webp',
    normalMapUrl: '/textures/floors/wood/normal.webp',
    armMapUrl: '/textures/floors/wood/arm.webp',
    normalScale: 0.55,
    aoMapIntensity: 0.6,
    antiTile: false,
  },
  mulch: {
    id: 'mulch',
    label: 'Mulch / Cobertura orgánica',
    fallbackColor: '#7c4722',
    roughness: 0.96,
    metalness: 0.0,
    metersPerTileX: 2.0,
    metersPerTileY: 2.0,
    textureUrl: '/textures/floors/mulch/albedo.webp',
    normalMapUrl: '/textures/floors/mulch/normal.webp',
    armMapUrl: '/textures/floors/mulch/arm.webp',
    normalScale: 0.75,
    aoMapIntensity: 0.75,
    antiTile: true,
  },
};

export const WALL_MATERIAL_CONFIGS: Record<WallMaterialType, SpaceMaterialConfig> = {
  brick: {
    id: 'brick',
    label: 'Ladrillo visto',
    fallbackColor: '#b45309',
    roughness: 0.9,
    metalness: 0.0,
    metersPerTileX: 1.6,
    metersPerTileY: 1.6,
    textureUrl: '/textures/walls/brick/albedo.webp',
    normalMapUrl: '/textures/walls/brick/normal.webp',
    armMapUrl: '/textures/walls/brick/arm.webp',
    normalScale: 0.7,
    aoMapIntensity: 0.7,
    antiTile: false,
  },
  concrete: {
    id: 'concrete',
    label: 'Hormigón',
    fallbackColor: '#9ca3af',
    roughness: 0.88,
    metalness: 0.0,
    metersPerTileX: 1.8,
    metersPerTileY: 1.8,
    textureUrl: '/textures/walls/concrete/albedo.webp',
    normalMapUrl: '/textures/walls/concrete/normal.webp',
    armMapUrl: '/textures/walls/concrete/arm.webp',
    normalScale: 0.55,
    aoMapIntensity: 0.55,
    antiTile: true,
  },
  glass_greenhouse: {
    id: 'glass_greenhouse',
    label: 'Vidrio de invernadero',
    fallbackColor: '#bae6fd',
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
    metersPerTileX: 1.0,
    metersPerTileY: 1.0,
  },
  polycarbonate: {
    id: 'polycarbonate',
    label: 'Policarbonato alveolar',
    fallbackColor: '#e0f2fe',
    roughness: 0.35,
    metalness: 0.05,
    transparent: true,
    opacity: 0.55,
    metersPerTileX: 1.0,
    metersPerTileY: 1.0,
  },
  wood_fence: {
    id: 'wood_fence',
    label: 'Cerco de madera',
    fallbackColor: '#92400e',
    roughness: 0.88,
    metalness: 0.0,
    metersPerTileX: 1.8,
    metersPerTileY: 1.8,
    textureUrl: '/textures/walls/wood_fence/albedo.webp',
    normalMapUrl: '/textures/walls/wood_fence/normal.webp',
    armMapUrl: '/textures/walls/wood_fence/arm.webp',
    normalScale: 0.6,
    aoMapIntensity: 0.65,
    antiTile: false,
  },
  wire_fence: {
    id: 'wire_fence',
    label: 'Tejido de alambre',
    fallbackColor: '#94a3b8',
    roughness: 0.55,
    metalness: 0.5,
    transparent: true,
    opacity: 0.55,
    metersPerTileX: 0.5,
    metersPerTileY: 0.5,
  },
  drywall: {
    id: 'drywall',
    label: 'Yeso / Durlock',
    fallbackColor: '#e5e7eb',
    roughness: 0.9,
    metalness: 0.0,
    metersPerTileX: 2.0,
    metersPerTileY: 2.0,
    textureUrl: '/textures/walls/drywall/albedo.webp',
    normalMapUrl: '/textures/walls/drywall/normal.webp',
    armMapUrl: '/textures/walls/drywall/arm.webp',
    normalScale: 0.3,
    aoMapIntensity: 0.4,
    antiTile: true,
  },
};

export const STRUCTURAL_MATERIAL_CONFIGS: Record<StructuralMaterialType, SpaceMaterialConfig> = {
  wood_carpentry: {
    id: 'wood_carpentry',
    label: 'Carpintería de madera',
    fallbackColor: '#78350f',
    tintColor: '#b45309',
    roughness: 0.6,
    metalness: 0.0,
    metersPerTileX: 1.0,
    metersPerTileY: 1.0,
    textureUrl: '/textures/floors/wood/albedo.webp',
    normalMapUrl: '/textures/floors/wood/normal.webp',
    armMapUrl: '/textures/floors/wood/arm.webp',
    normalScale: 0.5,
    aoMapIntensity: 0.5,
  },
  metal_frame: {
    id: 'metal_frame',
    label: 'Marco metálico arquitectónico',
    fallbackColor: '#334155',
    roughness: 0.35,
    metalness: 0.75,
    metersPerTileX: 1.0,
    metersPerTileY: 1.0,
  },
};

export function getFloorMaterialConfig(
  type: FloorMaterialType,
  tintColor?: string,
): SpaceMaterialConfig {
  const base = FLOOR_MATERIAL_CONFIGS[type] ?? FLOOR_MATERIAL_CONFIGS.soil;
  if (!tintColor) return base;
  return { ...base, tintColor, fallbackColor: tintColor };
}

export function getWallMaterialConfig(
  type: WallMaterialType,
  tintColor?: string,
): SpaceMaterialConfig {
  const base = WALL_MATERIAL_CONFIGS[type] ?? WALL_MATERIAL_CONFIGS.brick;
  if (!tintColor) return base;
  return { ...base, tintColor, fallbackColor: tintColor };
}

export function getStructuralMaterialConfig(
  type: StructuralMaterialType,
  tintColor?: string,
): SpaceMaterialConfig {
  const base = STRUCTURAL_MATERIAL_CONFIGS[type] ?? STRUCTURAL_MATERIAL_CONFIGS.metal_frame;
  if (!tintColor) return base;
  return { ...base, tintColor, fallbackColor: tintColor };
}

