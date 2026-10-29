// Archivo generado por scripts/assets/build-manifest.ts — no editar a mano

export interface RasterObjectMeta {
  href: string
  width: number
  height: number
  anchorX: number
  anchorY: number
  mirrorForViewB: boolean
  soilY?: number | null
}

export const RASTER_OBJECTS: Partial<Record<string, RasterObjectMeta>> = {
  pot_5l: {
    href: new URL('./assets/pot_5l.webp', import.meta.url).href,
    width: 52,
    height: 52,
    anchorX: -26,
    anchorY: -26,
    mirrorForViewB: true,
    soilY: -9,
  },
}
