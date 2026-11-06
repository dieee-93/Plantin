import simreadyRawCatalog from './simreadyCatalog.json';

export type FunctionalAssetRole =
  | 'cultivation_vessel' // Macetas, cajones de cultivo, camas, mesas de cultivo, racks de propagación
  | 'climate_control' // Ventiladores, extractores, filtros de aire, humidificadores, calefactores, HVAC
  | 'irrigation_fertigation' // Tanques IBC, reservorios, bombas de agua/drenaje, mangueras, cañerías
  | 'bioprocessing'; // Tambores de compost/200L, tolvas orgánicas

export interface TechnicalSpecLevel1 {
  role: FunctionalAssetRole;
  iotBindable: boolean;
  // Métricas opcionales según el rol:
  waterCapacityLiters?: number;
  flowRateLpm?: number;
  airflowM3h?: number;
  thermalDeltaC?: number;
  humidityControl?: 'humidify' | 'dehumidify' | 'stabilize';
  vesselType?: 'pot_container' | 'propagation_bench' | 'vertical_rack';
  substrateVolumeLiters?: number;
  compostCapacityLiters?: number;
}

export type AssetPlacementMode = 'build_props' | 'planting_utility';

export interface FacilityCatalogItem {
  assetId: string;
  label: string;
  originalLabel?: string;
  variantCode?: string;
  category: string;
  subcategory: string;
  description?: string;
  triangles?: number;
  drawCalls?: number;
  sizeMb?: number;
  glbUrl: string;
  thumbnailUrl: string;
  badge?: string;
  dimensionsBadge?: string;
  defaultElevationM?: number;
  placementMode: AssetPlacementMode;
  technicalSpec?: TechnicalSpecLevel1;
}

export const OBJECT_ELEVATION_PRESETS = {
  floor: 0,
  pallet: 0.21,
  rack: 0.5,
  table: 0.93,
} as const;

export interface CatalogCategoryDef {
  id: string;
  label: string;
  emoji: string;
}

export const CATALOG_CATEGORIES: readonly CatalogCategoryDef[] = [
  { id: 'all', label: 'Todos (999)', emoji: '✨' },
  { id: 'botanical', label: 'Plantas 3D', emoji: '🌿' },
  { id: 'logistics', label: 'Logística', emoji: '📦' },
  { id: 'mep_climate', label: 'Clima / MEP', emoji: '⚡' },
  { id: 'workbench_furniture', label: 'Mobiliario', emoji: '🪑' },
  { id: 'harvest_produce', label: 'Cosechas', emoji: '🍎' },
  { id: 'hand_tools', label: 'Herramientas', emoji: '🔧' },
  { id: 'safety', label: 'Seguridad', emoji: '🦺' },
] as const;

export type CatalogCategoryId = (typeof CATALOG_CATEGORIES)[number]['id'];

export interface CatalogSubcategoryDef {
  id: string;
  label: string;
  emoji?: string;
}

export const CATALOG_SUBCATEGORIES: Record<string, CatalogSubcategoryDef[]> = {
  all: [{ id: 'all', label: 'Todos', emoji: '✨' }],
  botanical: [
    { id: 'all', label: 'Todos', emoji: '🌿' },
    { id: 'fruiting_crops', label: 'Hortalizas y Frutos', emoji: '🍅' },
  ],
  logistics: [
    { id: 'all', label: 'Todos', emoji: '📦' },
    { id: 'pallets', label: 'Palets y Zorras', emoji: '🪵' },
    { id: 'boxes_crates', label: 'Cajas y Cajones', emoji: '📦' },
    { id: 'racks_shelves', label: 'Racks y Estanterías', emoji: '🗄️' },
    { id: 'transport_carts', label: 'Carros y Transporte', emoji: '🛒' },
    { id: 'waste_drums', label: 'Tambores y Residuos', emoji: '🛢️' },
    { id: 'access_safety', label: 'Escaleras y Acceso', emoji: '🪜' },
  ],
  mep_climate: [
    { id: 'all', label: 'Todos', emoji: '⚡' },
    { id: 'ventilation_fans', label: 'Ventilación y Extractores', emoji: '💨' },
    { id: 'hvac_cooling', label: 'HVAC y Clima', emoji: '❄️' },
    { id: 'tanks_drainage', label: 'Tanques y Cañerías', emoji: '🚰' },
    { id: 'equipment_misc', label: 'Equipos y Suministros', emoji: '🔌' },
  ],
  workbench_furniture: [
    { id: 'all', label: 'Todos', emoji: '🪑' },
    { id: 'workbenches', label: 'Mesas de Trabajo', emoji: '🪵' },
    { id: 'seating', label: 'Sillas y Asientos', emoji: '🪑' },
    { id: 'cabinets_storage', label: 'Armarios y Gabinetes', emoji: '🗄️' },
  ],
  harvest_produce: [
    { id: 'all', label: 'Todos', emoji: '🍎' },
    { id: 'fruits', label: 'Frutas', emoji: '🍎' },
    { id: 'vegetables', label: 'Hortalizas y Frutos', emoji: '🍅' },
    { id: 'leafy_greens', label: 'Hojas y Coles', emoji: '🥬' },
    { id: 'roots_tubers', label: 'Raíces y Tubérculos', emoji: '🥕' },
    { id: 'grains_fungi', label: 'Granos y Hongos', emoji: '🌽' },
  ],
  hand_tools: [
    { id: 'all', label: 'Todos', emoji: '🔧' },
    { id: 'hand_tools', label: 'Manuales y Llaves', emoji: '🔧' },
    { id: 'power_tools', label: 'Eléctricas y Neumáticas', emoji: '⚙️' },
    { id: 'workshop_equipment', label: 'Morsas y Bancos', emoji: '🗜️' },
    { id: 'storage_support', label: 'Soportes y Guardado', emoji: '🧰' },
  ],
  safety: [
    { id: 'all', label: 'Todos', emoji: '🦺' },
    { id: 'fire_protection', label: 'Incendio y Extintores', emoji: '🧯' },
    { id: 'barriers_rails', label: 'Vallas y Barandas', emoji: '🚧' },
    { id: 'signage_ppe', label: 'Señalética y EPP', emoji: '🦺' },
    { id: 'cabinets_safety', label: 'Gabinetes de Seguridad', emoji: '🔒' },
  ],
};

export function inferAssetPlacementAndSpec(
  assetId: string,
  category: string,
  subcategory?: string,
): {
  placementMode: AssetPlacementMode;
  technicalSpec?: TechnicalSpecLevel1;
} {
  const idLower = assetId.toLowerCase();
  const subcat = subcategory ?? inferSubcategory(assetId, category);

  // Todo harvest_produce, botanical, hand_tools y safety pasan a build_props
  if (
    category === 'botanical' ||
    category === 'harvest_produce' ||
    category === 'hand_tools' ||
    category === 'safety'
  ) {
    return { placementMode: 'build_props' };
  }

  // Calefactores y Humidificadores específicos
  if (idLower.includes('heater') && !idLower.includes('handtool')) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'climate_control',
        iotBindable: true,
        thermalDeltaC: 5,
        airflowM3h: 400,
      },
    };
  }
  if (idLower.includes('humidifier')) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'climate_control',
        iotBindable: true,
        humidityControl: 'humidify',
        airflowM3h: 250,
      },
    };
  }

  // 2. Riego y Fertigación (role: 'irrigation_fertigation', iotBindable: true)
  const isIbcTank = idLower.includes('ibctank') || idLower.includes('tank_ibc');
  if (isIbcTank) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'irrigation_fertigation',
        iotBindable: true,
        waterCapacityLiters: 1000,
      },
    };
  }

  const isReservoir =
    idLower.includes('reservoir_tank') ||
    idLower.includes('water_tank') ||
    (category === 'mep_climate' && (idLower.includes('tank') || idLower.includes('reservoir')));
  if (isReservoir) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'irrigation_fertigation',
        iotBindable: true,
        waterCapacityLiters: 250,
      },
    };
  }

  const isPumpingOrHose =
    idLower.includes('drainage_pumpsystem') ||
    idLower.includes('fluid_pump') ||
    idLower.includes('pump') ||
    idLower.includes('hosereel') ||
    idLower.includes('hose') ||
    idLower.includes('pipe_plastic') ||
    idLower.includes('pipe');
  if (isPumpingOrHose && (category === 'mep_climate' || category === '')) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'irrigation_fertigation',
        iotBindable: true,
        flowRateLpm: 45,
      },
    };
  }

  // 1b. Clima, Ventilación y Filtrado restantes (role: 'climate_control', iotBindable: true)
  const isClimateSubcat =
    subcat === 'ventilation_fans' || subcat === 'hvac_cooling';
  const hasClimateKeyword =
    idLower.includes('fan') ||
    idLower.includes('extractor') ||
    idLower.includes('ventilation') ||
    idLower.includes('airsystem') ||
    idLower.includes('air_filter') ||
    idLower.includes('airfilter') ||
    idLower.includes('climate') ||
    idLower.includes('cooling') ||
    idLower.includes('hvac');

  if (category === 'mep_climate' || isClimateSubcat || (category === '' && hasClimateKeyword)) {
    if (hasClimateKeyword || isClimateSubcat) {
      return {
        placementMode: 'planting_utility',
        technicalSpec: {
          role: 'climate_control',
          iotBindable: true,
          thermalDeltaC: -2,
          airflowM3h: 800,
          humidityControl: 'stabilize',
        },
      };
    }
  }

  // 3. Bioprocesamiento y Compostaje (role: 'bioprocessing', iotBindable: false)
  const isBioprocessing =
    idLower.includes('drum_plastic') ||
    idLower.includes('drum_fiber') ||
    idLower.includes('warehouse_barrel_plastic') ||
    idLower.includes('hopper_dumpling');
  if (isBioprocessing) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'bioprocessing',
        iotBindable: false,
        compostCapacityLiters: 200,
      },
    };
  }

  // 4. Contenedores, Mesas de Cultivo y Racks de Propagación (role: 'cultivation_vessel', iotBindable: false)
  const isCratePot =
    idLower.includes('crate_harvest_plastic') ||
    idLower.includes('crate_plastic') ||
    idLower.includes('pail_plastic') ||
    idLower.includes('bucket_utility') ||
    idLower.includes('bin_plastic');
  if (isCratePot) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'cultivation_vessel',
        iotBindable: false,
        vesselType: 'pot_container',
        substrateVolumeLiters: 40,
      },
    };
  }

  const isTableBench =
    idLower.includes('table_metal_stainless') ||
    idLower.includes('workbench_modular_table') ||
    idLower.includes('table_deluxe_packing');
  if (isTableBench) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'cultivation_vessel',
        iotBindable: false,
        vesselType: 'propagation_bench',
        substrateVolumeLiters: 120,
      },
    };
  }

  const isVerticalRack =
    idLower.includes('rack_heavyduty_metal') ||
    idLower.includes('rack_industrial_empty');
  if (isVerticalRack) {
    return {
      placementMode: 'planting_utility',
      technicalSpec: {
        role: 'cultivation_vessel',
        iotBindable: false,
        vesselType: 'vertical_rack',
        substrateVolumeLiters: 300,
      },
    };
  }

  // 5. Todo el resto clasifica a build_props
  return { placementMode: 'build_props' };
}

export function inferSubcategory(assetId: string, category: string): string {
  const id = assetId.toLowerCase();
  if (category === 'logistics') {
    if (id.includes('pallet')) return 'pallets';
    if (
      id.includes('box') ||
      id.includes('crate') ||
      id.includes('bin') ||
      id.includes('container') ||
      id.includes('pail') ||
      id.includes('bucket')
    )
      return 'boxes_crates';
    if (
      id.includes('rack') ||
      id.includes('shelve') ||
      id.includes('storagesystem') ||
      id.includes('storage')
    )
      return 'racks_shelves';
    if (
      id.includes('cart') ||
      id.includes('trolley') ||
      id.includes('handtruck') ||
      id.includes('tilttruck') ||
      id.includes('conveyor') ||
      id.includes('vehicle')
    )
      return 'transport_carts';
    if (
      id.includes('drum') ||
      id.includes('trash') ||
      id.includes('waste') ||
      id.includes('hopper')
    )
      return 'waste_drums';
    return 'access_safety';
  }
  if (category === 'mep_climate') {
    if (
      id.includes('fan') ||
      id.includes('ventilation') ||
      id.includes('extractor') ||
      id.includes('airsystem')
    )
      return 'ventilation_fans';
    if (
      id.includes('climate') ||
      id.includes('cooling') ||
      id.includes('humidifier') ||
      id.includes('hvac')
    )
      return 'hvac_cooling';
    if (
      id.includes('tank') ||
      id.includes('pipe') ||
      id.includes('drainage') ||
      id.includes('water')
    )
      return 'tanks_drainage';
    return 'equipment_misc';
  }
  if (category === 'workbench_furniture') {
    if (
      id.includes('table') ||
      id.includes('workbench') ||
      id.includes('workstation') ||
      id.includes('workshop')
    )
      return 'workbenches';
    if (id.includes('chair') || id.includes('stool')) return 'seating';
    return 'cabinets_storage';
  }
  if (category === 'harvest_produce') {
    if (
      /apple|banana|grape|kiwi|lemon|lime|mango|orange|peach|pear|strawberry|tangerine|avocado/.test(
        id,
      )
    )
      return 'fruits';
    if (
      /tomato|bellpepper|eggplant|cucumber|bittermelon|squash|zucchini/.test(id)
    )
      return 'vegetables';
    if (/bocchoy|broccoli/.test(id)) return 'leafy_greens';
    if (/carrot|garlic|onion|potato|sweetpotato/.test(id)) return 'roots_tubers';
    return 'grains_fungi';
  }
  if (category === 'hand_tools') {
    if (id.includes('power') || id.includes('air') || id.includes('ratchet'))
      return 'power_tools';
    if (id.includes('vise') || id.includes('equipment') || id.includes('bench'))
      return 'workshop_equipment';
    if (id.includes('storage') || id.includes('support')) return 'storage_support';
    return 'hand_tools';
  }
  if (category === 'safety') {
    if (
      id.includes('fire') ||
      id.includes('extinguisher') ||
      id.includes('detector')
    )
      return 'fire_protection';
    if (
      id.includes('barrier') ||
      id.includes('rail') ||
      id.includes('fence') ||
      id.includes('guard')
    )
      return 'barriers_rails';
    if (
      id.includes('sign') ||
      id.includes('ppe') ||
      id.includes('board') ||
      id.includes('tape')
    )
      return 'signage_ppe';
    return 'cabinets_safety';
  }
  return 'all';
}

export function inferDimensionBadge(assetId: string, category: string): string {
  const idLower = assetId.toLowerCase();
  if (
    idLower.includes('pallet_standard_wood') ||
    idLower.includes('pallet_standard') ||
    idLower.includes('pallet_euro')
  )
    return '120×80 cm';
  if (idLower.includes('pallet')) return '120×80 cm';
  if (
    idLower.includes('crate_harvest_plastic_green') ||
    idLower.includes('crate') ||
    idLower.includes('harvest_plastic')
  )
    return '60×40 cm';
  if (
    idLower.includes('rack_industrial') ||
    idLower.includes('rack_4m') ||
    idLower.includes('industrial_empty')
  )
    return '4m';
  if (
    idLower.includes('rack_heavyduty') ||
    idLower.includes('rack_1.3m') ||
    idLower.includes('rack_f01')
  )
    return '1.3m';
  if (idLower.includes('rack') || idLower.includes('shelve')) return '1.3m';
  if (
    idLower.includes('workbench_modular_table') ||
    idLower.includes('table_deluxe_packing') ||
    idLower.includes('workbench') ||
    idLower.includes('workstation')
  )
    return 'Mesa 2m';
  if (idLower.includes('table')) return '150×80 cm';
  if (idLower.includes('fan_axial') || idLower.includes('fan')) return 'Ø 60 cm';
  if (idLower.includes('tank_ibc') || idLower.includes('ibctank')) return '1000 L';
  if (idLower.includes('drum')) return '200 L';
  if (idLower.includes('trashcan') || idLower.includes('waste')) return '120 L';
  if (idLower.includes('ladder')) return '2.5m';
  if (idLower.includes('box_corrugated') || idLower.includes('box'))
    return '40×30 cm';
  if (idLower.includes('fireextinguisher')) return '6 kg';
  if (idLower.includes('palletjack')) return '115×55 cm';
  if (category === 'harvest_produce') return 'Cosecha';
  if (category === 'hand_tools') return 'Herramienta';
  if (category === 'safety') return 'Seguridad';
  return '60×60 cm';
}

const PRODUCE_TRANSLATIONS: Record<string, string> = {
  apple: 'Manzana (Apple)',
  banana: 'Banana',
  tomato: 'Tomate (Tomato)',
  lemon: 'Limón (Lemon)',
  orange: 'Naranja (Orange)',
  pear: 'Pera (Pear)',
  potato: 'Papa (Potato)',
  carrot: 'Zanahoria (Carrot)',
  bocchoy: 'Boc Choy',
  broccoli: 'Brócoli',
  garlic: 'Ajo (Garlic)',
  onion: 'Cebolla (Onion)',
  peach: 'Durazno (Peach)',
  strawberry: 'Frutilla (Strawberry)',
  avocado: 'Palta (Avocado)',
  grape: 'Uva (Grape)',
  cucumber: 'Pepino (Cucumber)',
  eggplant: 'Berenjena (Eggplant)',
  bellpepper: 'Morrón (Bell Pepper)',
  corn: 'Maíz (Corn)',
  mushroom: 'Hongo (Mushroom)',
  dragonfruit: 'Pitahaya (Dragon Fruit)',
  bittermelon: 'Melón Amargo',
  tangerine: 'Mandarina',
  squash: 'Calabaza',
  sweetpotato: 'Batata',
  zucchini: 'Zucchini',
  freshcarrot: 'Zanahoria Fresca',
  corncob: 'Choclo / Mazorca',
  lime: 'Lima',
  kiwi: 'Kiwi',
  mango: 'Mango',
};

export function cleanFormatAssetLabel(
  assetId: string,
  rawLabel: string,
  category: string,
): { label: string; variantCode?: string; dimensionsBadge: string } {
  const dimensionsBadge = inferDimensionBadge(assetId, category);

  // 1. Extract factory/variant code: e.g. (A01), (B01), (C02)
  let variantCode: string | undefined = undefined;
  const parenMatch = rawLabel.match(/\(([A-Za-z0-9_-]+)\)/);
  if (parenMatch) {
    variantCode = parenMatch[1];
  } else {
    const idVariantMatch = assetId.match(/_([a-z]\d{2})$/i);
    if (idVariantMatch) {
      variantCode = idVariantMatch[1].toUpperCase();
    }
  }

  // Strip factory code from rawLabel
  let cleaned = rawLabel.replace(/\s*\([A-Za-z0-9_-]+\)\s*$/, '').trim();
  const idLower = assetId.toLowerCase();

  // Featured explicit labels
  if (assetId === 'pallet_standard_wood_a01') {
    return { label: 'Palet Europeo de Madera', variantCode, dimensionsBadge };
  }
  if (assetId === 'crate_harvest_plastic_green_a01') {
    return { label: 'Cajón de Cosecha Plástico', variantCode, dimensionsBadge };
  }
  if (assetId === 'workbench_modular_table_b01') {
    return { label: 'Mesa de Trabajo Modular', variantCode, dimensionsBadge };
  }
  if (assetId === 'rack_heavyduty_metal_f01') {
    return { label: 'Estantería Metálica Reforzada', variantCode, dimensionsBadge };
  }
  if (assetId === 'rack_industrial_empty_a01') {
    return { label: 'Rack Industrial 4m', variantCode, dimensionsBadge };
  }
  if (assetId === 'fan_axial_floor_a01') {
    return { label: 'Ventilador Axial de Suelo', variantCode, dimensionsBadge };
  }
  if (assetId === 'produce_bocchoy_leafy_a03') {
    return { label: 'Cosecha Boc Choy (Hoja)', variantCode, dimensionsBadge };
  }
  if (assetId === 'produce_tomato_fruit_a01') {
    return { label: 'Cosecha Tomate Fruto', variantCode, dimensionsBadge };
  }

  // Produce translations
  if (category === 'harvest_produce') {
    for (const [key, trans] of Object.entries(PRODUCE_TRANSLATIONS)) {
      if (idLower.includes(key)) {
        return { label: `Cosecha ${trans}`, variantCode, dimensionsBadge };
      }
    }
    return { label: `Cosecha ${cleaned || 'Fruto'}`, variantCode, dimensionsBadge };
  }

  // Prefix mapping
  let prefix = '';
  if (idLower.startsWith('handtool_') || idLower.startsWith('tool_')) prefix = 'Herramienta';
  else if (idLower.startsWith('palletjack_')) prefix = 'Zorra Transpaleta';
  else if (idLower.startsWith('pallet_')) prefix = 'Palet';
  else if (idLower.startsWith('crate_')) prefix = 'Cajón';
  else if (idLower.startsWith('rack_') || idLower.startsWith('shelve_')) prefix = 'Rack';
  else if (
    idLower.startsWith('table_') ||
    idLower.startsWith('workbench_') ||
    idLower.startsWith('workstation_')
  )
    prefix = 'Mesa de Trabajo';
  else if (idLower.startsWith('fan_')) prefix = 'Ventilador';
  else if (
    idLower.startsWith('tank_') ||
    idLower.startsWith('ibctank_') ||
    idLower.includes('ibc')
  )
    prefix = 'Tanque IBC';
  else if (
    idLower.startsWith('cart_') ||
    idLower.startsWith('trolley_') ||
    idLower.startsWith('truck_') ||
    idLower.startsWith('tilttruck_') ||
    idLower.startsWith('handtruck_')
  )
    prefix = 'Carro';
  else if (idLower.startsWith('barrier_') || idLower.startsWith('fence_'))
    prefix = 'Barrera';
  else if (idLower.startsWith('cabinet_') || idLower.startsWith('chest_'))
    prefix = 'Armario';
  else if (idLower.startsWith('fireextinguisher_')) prefix = 'Extintor';
  else if (idLower.startsWith('ladder_')) prefix = 'Escalera';
  else if (idLower.startsWith('drum_')) prefix = 'Tambor';
  else if (idLower.startsWith('box_')) prefix = 'Caja';
  else if (idLower.startsWith('bin_') || idLower.startsWith('container_'))
    prefix = 'Contenedor';
  else if (idLower.startsWith('chair_') || idLower.startsWith('stool_'))
    prefix = 'Silla';
  else if (idLower.startsWith('equipment_')) prefix = 'Equipo';

  // If cleaned is empty, or equals raw factory code, reconstruct from assetId
  if (!cleaned || cleaned.toLowerCase() === prefix.toLowerCase()) {
    const parts = assetId.split('_').slice(1, -1);
    cleaned = parts.length > 0 ? parts.join(' ') : 'Estándar';
  }

  // Format label: avoid duplicating prefix if cleaned already starts with it
  let finalLabel = cleaned;
  if (prefix && !cleaned.toLowerCase().includes(prefix.toLowerCase())) {
    finalLabel = `${prefix} ${cleaned}`.trim();
  }

  return { label: finalLabel, variantCode, dimensionsBadge };
}

const HF_CDN_GLB_BASE =
  'https://huggingface.co/datasets/codepawl/simready-glb/resolve/main/glb';

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
  const isProd =
    import.meta.env.PROD ||
    (typeof globalThis !== 'undefined' &&
      (globalThis as unknown as { process?: { env?: { GITHUB_PAGES?: string } } })
        .process?.env?.GITHUB_PAGES === 'true') ||
    import.meta.env.BASE_URL !== '/';
  const glbUrl = isProd
    ? `${HF_CDN_GLB_BASE}/${item.assetId}.glb`
    : resolvePublicAssetUrl(item.glbUrl);

  const { label, variantCode, dimensionsBadge } = cleanFormatAssetLabel(
    item.assetId,
    item.label,
    item.category,
  );
  const subcategory = inferSubcategory(item.assetId, item.category);
  const { placementMode, technicalSpec } = inferAssetPlacementAndSpec(
    item.assetId,
    item.category,
    subcategory,
  );

  return {
    ...item,
    originalLabel: item.label,
    label,
    variantCode,
    subcategory,
    dimensionsBadge,
    glbUrl,
    thumbnailUrl: resolvePublicAssetUrl(item.thumbnailUrl),
    badge:
      dimensionsBadge ||
      (item.triangles ? `${Math.round(item.triangles / 1000)}k tris` : undefined),
    defaultElevationM: 0,
    placementMode,
    technicalSpec,
  };
});

export const BOTANICAL_CATALOG_ITEMS: FacilityCatalogItem[] = [
  {
    assetId: 'plant_tomato_clay_a01',
    label: 'Tomatera en Producción (3D Clay)',
    originalLabel: 'Tomate 3D Clay Estilizado',
    variantCode: 'A01',
    category: 'botanical',
    subcategory: 'fruiting_crops',
    triangles: 30000,
    drawCalls: 1,
    sizeMb: 7.8,
    glbUrl: '/models/plants/plant_tomato_clay_a01.glb',
    thumbnailUrl: '/models/plants/plant_tomato_clay_a01.webp',
    badge: '72 × 98 × 79 cm',
    dimensionsBadge: '72 × 98 cm',
    defaultElevationM: 0,
    placementMode: 'build_props',
  },
];

export const FACILITY_OBJECTS_CATALOG: FacilityCatalogItem[] = [
  ...BOTANICAL_CATALOG_ITEMS,
  ...SIMREADY_CATALOG,
];

export function getCatalogItemsForMode(
  mode: AssetPlacementMode,
  catalog: FacilityCatalogItem[] = SIMREADY_CATALOG,
): FacilityCatalogItem[] {
  return catalog.filter((item) => item.placementMode === mode);
}

export interface RoomTechnicalSummary {
  totalWaterCapacityLiters: number;
  totalAirflowM3h: number;
  netThermalDeltaC: number;
  totalSubstrateVolumeLiters: number;
  totalCompostCapacityLiters: number;
  iotReadyDevicesCount: number;
  hasActiveIrrigation: boolean;
}

export function computeRoomTechnicalSummary(
  placedObjects: Array<{ assetId: string }>,
): RoomTechnicalSummary {
  let totalWaterCapacityLiters = 0;
  let totalAirflowM3h = 0;
  let rawThermalDeltaC = 0;
  let totalSubstrateVolumeLiters = 0;
  let totalCompostCapacityLiters = 0;
  let iotReadyDevicesCount = 0;
  let hasWaterSource = false;
  let hasActivePumping = false;

  const catalogMap = new Map<string, FacilityCatalogItem>();
  for (const item of SIMREADY_CATALOG) {
    catalogMap.set(item.assetId, item);
  }

  for (const obj of placedObjects) {
    const catalogItem = catalogMap.get(obj.assetId);
    const spec =
      catalogItem?.technicalSpec ??
      inferAssetPlacementAndSpec(obj.assetId, catalogItem?.category ?? '').technicalSpec;

    if (!spec) continue;

    if (spec.iotBindable) {
      iotReadyDevicesCount += 1;
    }

    if (spec.waterCapacityLiters && spec.waterCapacityLiters > 0) {
      totalWaterCapacityLiters += spec.waterCapacityLiters;
      hasWaterSource = true;
    }

    if (spec.flowRateLpm && spec.flowRateLpm > 0) {
      hasActivePumping = true;
    }

    if (spec.airflowM3h && spec.airflowM3h > 0) {
      totalAirflowM3h += spec.airflowM3h;
    }

    if (spec.thermalDeltaC !== undefined) {
      rawThermalDeltaC += spec.thermalDeltaC;
    }

    if (spec.substrateVolumeLiters && spec.substrateVolumeLiters > 0) {
      totalSubstrateVolumeLiters += spec.substrateVolumeLiters;
    }

    if (spec.compostCapacityLiters && spec.compostCapacityLiters > 0) {
      totalCompostCapacityLiters += spec.compostCapacityLiters;
    }
  }

  const netThermalDeltaC = Math.max(-8, Math.min(12, rawThermalDeltaC));
  const hasActiveIrrigation = hasWaterSource && hasActivePumping;

  return {
    totalWaterCapacityLiters,
    totalAirflowM3h,
    netThermalDeltaC,
    totalSubstrateVolumeLiters,
    totalCompostCapacityLiters,
    iotReadyDevicesCount,
    hasActiveIrrigation,
  };
}


export type StackingRole = 'support_base' | 'stackable_item' | 'top_only';

export interface ObjectDimensionsCm {
  widthCm: number;
  depthCm: number;
  heightCm: number;
  supportSurfaceHeightCm?: number;
  stackRole?: StackingRole;
  maxStackLevels?: number;
}

export const KNOWN_OBJECT_DIMENSIONS: Record<string, ObjectDimensionsCm> = {
  pallet_standard_wood_a01: {
    widthCm: 120,
    depthCm: 80,
    heightCm: 21,
    supportSurfaceHeightCm: 21,
    stackRole: 'support_base',
    maxStackLevels: 1,
  },
  crate_harvest_plastic_green_a01: {
    widthCm: 60,
    depthCm: 40,
    heightCm: 25,
    supportSurfaceHeightCm: 25,
    stackRole: 'stackable_item',
    maxStackLevels: 4,
  },
  workbench_modular_table_b01: {
    widthCm: 62,
    depthCm: 92,
    heightCm: 202,
    supportSurfaceHeightCm: 93,
    stackRole: 'support_base',
    maxStackLevels: 1,
  },
  fan_axial_floor_a01: {
    widthCm: 60,
    depthCm: 60,
    heightCm: 120,
    stackRole: 'top_only',
  },
  rack_heavyduty_metal_f01: {
    widthCm: 130,
    depthCm: 50,
    heightCm: 180,
    supportSurfaceHeightCm: 50,
    stackRole: 'support_base',
    maxStackLevels: 1,
  },
  rack_industrial_empty_a01: {
    widthCm: 400,
    depthCm: 110,
    heightCm: 400,
    supportSurfaceHeightCm: 150,
    stackRole: 'support_base',
    maxStackLevels: 1,
  },
  table_metal_stainless_a03: {
    widthCm: 180,
    depthCm: 70,
    heightCm: 85,
    supportSurfaceHeightCm: 85,
    stackRole: 'support_base',
    maxStackLevels: 1,
  },
  produce_bocchoy_leafy_a03: {
    widthCm: 30,
    depthCm: 30,
    heightCm: 25,
    stackRole: 'top_only',
  },
  produce_tomato_fruit_a01: {
    widthCm: 10,
    depthCm: 10,
    heightCm: 10,
    stackRole: 'top_only',
  },
};

export function canStackOnTop(
  itemRole: StackingRole,
  baseRole: StackingRole,
): boolean {
  if (baseRole === 'top_only') return false;
  if (itemRole === 'support_base') return false;
  if (baseRole === 'support_base') {
    return itemRole === 'stackable_item' || itemRole === 'top_only';
  }
  if (baseRole === 'stackable_item') {
    return itemRole === 'stackable_item' || itemRole === 'top_only';
  }
  return false;
}

export function getObjectDimensionsCm(
  assetId: string,
  category?: string,
): ObjectDimensionsCm {
  if (KNOWN_OBJECT_DIMENSIONS[assetId]) {
    return KNOWN_OBJECT_DIMENSIONS[assetId];
  }
  const idLower = assetId.toLowerCase();
  if (idLower.includes('pallet'))
    return {
      widthCm: 120,
      depthCm: 80,
      heightCm: 20,
      supportSurfaceHeightCm: 20,
      stackRole: 'support_base',
      maxStackLevels: 1,
    };
  if (idLower.includes('crate') || idLower.includes('box'))
    return {
      widthCm: 60,
      depthCm: 40,
      heightCm: 30,
      supportSurfaceHeightCm: 30,
      stackRole: 'stackable_item',
      maxStackLevels: 4,
    };
  if (
    idLower.includes('table') ||
    idLower.includes('desk') ||
    idLower.includes('bench')
  )
    return {
      widthCm: 150,
      depthCm: 80,
      heightCm: 90,
      supportSurfaceHeightCm: 90,
      stackRole: 'support_base',
      maxStackLevels: 1,
    };
  if (idLower.includes('rack') || idLower.includes('shelf'))
    return {
      widthCm: 120,
      depthCm: 50,
      heightCm: 200,
      supportSurfaceHeightCm: 100,
      stackRole: 'support_base',
      maxStackLevels: 1,
    };
  if (idLower.includes('fan') || idLower.includes('compressor'))
    return {
      widthCm: 60,
      depthCm: 60,
      heightCm: 100,
      stackRole: 'top_only',
    };
  if (
    idLower.includes('trash') ||
    idLower.includes('bin') ||
    idLower.includes('barrel')
  )
    return {
      widthCm: 50,
      depthCm: 50,
      heightCm: 80,
      stackRole: 'top_only',
    };
  if (assetId === 'plant_tomato_clay_a01' || idLower.includes('tomato_clay'))
    return {
      widthCm: 72,
      depthCm: 79,
      heightCm: 98,
      stackRole: 'top_only',
    };
  if (category === 'botanical')
    return {
      widthCm: 60,
      depthCm: 60,
      heightCm: 80,
      stackRole: 'top_only',
    };
  if (category === 'harvest_produce')
    return {
      widthCm: 30,
      depthCm: 30,
      heightCm: 20,
      stackRole: 'top_only',
    };
  if (category === 'hand_tools')
    return {
      widthCm: 40,
      depthCm: 20,
      heightCm: 15,
      stackRole: 'top_only',
    };
  if (category === 'safety')
    return {
      widthCm: 40,
      depthCm: 40,
      heightCm: 60,
      stackRole: 'top_only',
    };
  return {
    widthCm: 60,
    depthCm: 60,
    heightCm: 60,
    stackRole: 'top_only',
  };
}
