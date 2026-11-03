import simreadyRawCatalog from '../../../../public/models/simready/catalog.json';

export interface FacilityCatalogItem {
  assetId: string;
  label: string;
  category: string;
  description?: string;
  triangles?: number;
  drawCalls?: number;
  sizeMb?: number;
  glbUrl: string;
  thumbnailUrl: string;
  badge?: string;
  defaultElevationM?: number;
}

export const CATALOG_CATEGORIES = [
  { id: 'all', label: 'Todos (999)', emoji: '✨' },
  { id: 'logistics', label: 'Logística', emoji: '📦' },
  { id: 'mep_climate', label: 'Clima / MEP', emoji: '⚡' },
  { id: 'workbench_furniture', label: 'Mobiliario', emoji: '🪑' },
  { id: 'harvest_produce', label: 'Cosechas', emoji: '🍎' },
  { id: 'hand_tools', label: 'Herramientas', emoji: '🔧' },
  { id: 'safety', label: 'Seguridad', emoji: '🦺' },
] as const;

export type CatalogCategoryId = (typeof CATALOG_CATEGORIES)[number]['id'];

const HF_CDN_GLB_BASE = 'https://huggingface.co/datasets/codepawl/simready-glb/resolve/main/glb';

export function resolvePublicAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export const SIMREADY_CATALOG: FacilityCatalogItem[] = (
  simreadyRawCatalog as Array<{
    assetId: string;
    label: string;
    category: string;
    triangles: number;
    drawCalls: number;
    sizeMb: number;
    glbUrl: string;
    thumbnailUrl: string;
  }>
).map((item) => {
  // En producción (o en GitHub Pages sin bundle masivo), transmitimos desde el CDN global de Hugging Face
  const isProd =
    import.meta.env.PROD ||
    (typeof globalThis !== 'undefined' &&
      (globalThis as unknown as { process?: { env?: { GITHUB_PAGES?: string } } }).process?.env
        ?.GITHUB_PAGES === 'true') ||
    import.meta.env.BASE_URL !== '/';
  const glbUrl = isProd
    ? `${HF_CDN_GLB_BASE}/${item.assetId}.glb`
    : resolvePublicAssetUrl(item.glbUrl);

  return {
    ...item,
    glbUrl,
    thumbnailUrl: resolvePublicAssetUrl(item.thumbnailUrl),
    badge: item.triangles ? `${Math.round(item.triangles / 1000)}k tris` : undefined,
    defaultElevationM: 0,
  };
});

// Quick featured subset for immediate access
export const FEATURED_OBJECTS_CATALOG: FacilityCatalogItem[] = [
  {
    assetId: 'pallet_standard_wood_a01',
    label: 'Palet Europeo',
    category: 'logistics',
    description: 'Palet estándar de madera de 120 × 80 cm para carga y apilado',
    glbUrl: '/models/pallet_standard_wood_a01.glb',
    thumbnailUrl: '/models/thumbs/pallet_standard_wood_a01.webp',
    badge: '120×80 cm',
    defaultElevationM: 0,
  },
  {
    assetId: 'crate_harvest_plastic_green_a01',
    label: 'Caja de Cosecha',
    category: 'logistics',
    description: 'Cajón agrícola plástico apilable de 60 × 40 × 25 cm',
    glbUrl: '/models/crate_harvest_plastic_green_a01.glb',
    thumbnailUrl: '/models/thumbs/crate_harvest_plastic_green_a01.webp',
    badge: '60×40 cm',
    defaultElevationM: 0,
  },
  {
    assetId: 'workbench_modular_table_b01',
    label: 'Mesa de Trabajo',
    category: 'workbench_furniture',
    description: 'Mesa modular de cultivo y trasplante con estante inferior',
    glbUrl: '/models/workbench_modular_table_b01.glb',
    thumbnailUrl: '/models/thumbs/workbench_modular_table_b01.webp',
    badge: 'Mesa 2m',
    defaultElevationM: 0,
  },
  {
    assetId: 'rack_heavyduty_metal_f01',
    label: 'Estantería Reforzada',
    category: 'logistics',
    description: 'Rack metálico industrial de 1.3 m para bandejas y herramientas',
    glbUrl: '/models/rack_heavyduty_metal_f01.glb',
    thumbnailUrl: '/models/thumbs/rack_heavyduty_metal_f01.webp',
    badge: 'Rack 1.3m',
    defaultElevationM: 0,
  },
  {
    assetId: 'rack_industrial_empty_a01',
    label: 'Rack Industrial 4m',
    category: 'logistics',
    description: 'Gran estantería para palets pesados de 4 m de ancho',
    glbUrl: '/models/rack_industrial_empty_a01.glb',
    thumbnailUrl: '/models/thumbs/rack_industrial_empty_a01.webp',
    badge: 'Rack 4m',
    defaultElevationM: 0,
  },
  {
    assetId: 'fan_axial_floor_a01',
    label: 'Ventilador Axial',
    category: 'mep_climate',
    description: 'Circulador de aire de suelo para control microclimático',
    glbUrl: '/models/fan_axial_floor_a01.glb',
    thumbnailUrl: '/models/thumbs/fan_axial_floor_a01.webp',
    badge: 'MEP / Clima',
    defaultElevationM: 0,
  },
  {
    assetId: 'produce_bocchoy_leafy_a03',
    label: 'Boc Choy (Hoja)',
    category: 'harvest_produce',
    description: 'Planta de hojas verdes en roseta para ambientación',
    glbUrl: '/models/produce_bocchoy_leafy_a03.glb',
    thumbnailUrl: '/models/thumbs/produce_bocchoy_leafy_a03.webp',
    badge: 'Botánico',
    defaultElevationM: 0,
  },
  {
    assetId: 'produce_tomato_fruit_a01',
    label: 'Tomate Fruto',
    category: 'harvest_produce',
    description: 'Fruto de tomate maduro para llenar cajas de cosecha',
    glbUrl: '/models/produce_tomato_fruit_a01.glb',
    thumbnailUrl: '/models/thumbs/produce_tomato_fruit_a01.webp',
    badge: 'Cosecha',
    defaultElevationM: 0,
  },
];

// Fallback compatibility alias
export const FACILITY_OBJECTS_CATALOG = SIMREADY_CATALOG;

export interface ObjectDimensionsCm {
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

export const KNOWN_OBJECT_DIMENSIONS: Record<string, ObjectDimensionsCm> = {
  pallet_standard_wood_a01: { widthCm: 120, depthCm: 80, heightCm: 21 },
  crate_harvest_plastic_green_a01: { widthCm: 60, depthCm: 40, heightCm: 25 },
  workbench_modular_table_b01: { widthCm: 62, depthCm: 92, heightCm: 202 },
  fan_axial_floor_a01: { widthCm: 60, depthCm: 60, heightCm: 120 },
  rack_heavyduty_metal_f01: { widthCm: 130, depthCm: 50, heightCm: 180 },
  rack_industrial_empty_a01: { widthCm: 400, depthCm: 110, heightCm: 400 },
  produce_bocchoy_leafy_a03: { widthCm: 30, depthCm: 30, heightCm: 25 },
  produce_tomato_fruit_a01: { widthCm: 10, depthCm: 10, heightCm: 10 },
};

export function getObjectDimensionsCm(assetId: string, category?: string): ObjectDimensionsCm {
  if (KNOWN_OBJECT_DIMENSIONS[assetId]) {
    return KNOWN_OBJECT_DIMENSIONS[assetId];
  }
  const idLower = assetId.toLowerCase();
  if (idLower.includes('pallet')) return { widthCm: 120, depthCm: 80, heightCm: 20 };
  if (idLower.includes('crate') || idLower.includes('box')) return { widthCm: 60, depthCm: 40, heightCm: 30 };
  if (idLower.includes('table') || idLower.includes('desk') || idLower.includes('bench')) return { widthCm: 150, depthCm: 80, heightCm: 90 };
  if (idLower.includes('rack') || idLower.includes('shelf')) return { widthCm: 120, depthCm: 50, heightCm: 200 };
  if (idLower.includes('fan') || idLower.includes('compressor')) return { widthCm: 60, depthCm: 60, heightCm: 100 };
  if (idLower.includes('trash') || idLower.includes('bin') || idLower.includes('barrel')) return { widthCm: 50, depthCm: 50, heightCm: 80 };
  if (category === 'harvest_produce') return { widthCm: 30, depthCm: 30, heightCm: 20 };
  if (category === 'hand_tools') return { widthCm: 40, depthCm: 20, heightCm: 15 };
  if (category === 'safety') return { widthCm: 40, depthCm: 40, heightCm: 60 };
  return { widthCm: 60, depthCm: 60, heightCm: 60 };
}
