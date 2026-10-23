# Spec: Motor isométrico v2 (Plantin)

> Documento autocontenido para ejecutar por fases con un agente de código (Gemini u otro).
> Cada fase es un PR/commit independiente, con criterios de aceptación verificables.
> Idioma: comentarios y UI en español (como el resto del repo); identificadores en inglés.

## 0. Contexto

La vista isométrica vive en `src/features/locations/isometric/`:

| Archivo | Líneas | Rol |
|---|---|---|
| `IsometricRoomInterior.tsx` | ~1860 | Sala: paredes, piso, celdas, plantas, arcos de pedigrí, HUD, zoom, lentes, drag & drop |
| `IsometricPlantSprite.tsx` | ~950 | Planta procedural SVG: contenedor + morfología por arquetipo × BBCH |
| `IsometricCampusMap.tsx` | ~960 | Mapa del campus con tarjetas de instalaciones (Motion) |
| `botanicalArchetypes.ts` | ~380 | `resolveBotanicalArchetype(taxon)` → paleta/arquetipo; `evaluateMicroclimateComfort` |

Proyección 2:1: `TILE_W=104`, `TILE_H=52`, `X=(c-r)*halfW`, `Y=(c+r+1)*halfH`. Orden de pintado fijo en JSX (fondo → paredes → piso → celdas r,c → arcos).

Stack: React 19, Vite 8, Tailwind 4, `motion` 14, Zustand, Vitest + jsdom + Testing Library. Bundle actual: un solo chunk `index-*.js` de ~938 KB (~260 KB gz).

### Problemas detectados

1. **Dibujo a ciegas**: las formas son coordenadas escritas a mano; no hay forma de ver el resultado fuera de la app.
2. **Explosión combinatoria**: 9 arquetipos × 5 fases BBCH, cada combinación con paths fijos.
3. **Colores sueltos**: cientos de hex literales; no hay modelo de luz único.
4. **Rendimiento**: cada `IsometricPlantSprite` crea 3 gradientes con `useId` (sala 16×16 ⇒ 768 `<linearGradient>/<radialGradient>`); `setHoveredSlot` en el padre re-renderiza toda la sala y todos los sprites al mover el mouse; ningún componente usa `React.memo`.
5. **Monolito**: `IsometricRoomInterior.tsx` mezcla geometría, escenografía, interacción y HUD.
6. **Sin code-splitting**: toda la app en un chunk.

### Hallazgos visuales (capturas de la app real: parcela "Patio de adelante", invernadero "Invernadero pequeño", sala "Patio de atrás")

Lo que ya funciona y **no hay que perder**: estilo limpio tipo diorama, paredes en corte, vidrio del invernadero, cerco de la parcela, siluetas reconocibles (girasol, maíz, lechuga, frutilla, remolacha, tomate).

Problemas, por impacto:

- **V1. Etiquetas tapadas y cortadas** (el más grave). En salas con plantas las etiquetas de nombre se leen como "cosa #01", "roit #01", "illa #01", "moja #0", "orca #0": cada etiqueta se dibuja dentro de su celda y la tapa la planta de la fila siguiente (algoritmo del pintor). En la parcela, el badge "-001 #03" queda montado sobre la maceta y la celda vecina.
- **V2. Oclusión por plantas altas.** Tomate y girasol tapan celdas, etiquetas y equipamiento de atrás (el tanque H2O queda detrás del tomate). No hay forma de ver/seleccionar lo que queda detrás.
- **V3. Ruido visual en celdas vacías.** Un botón "+" blanco sobre *cada* maceta vacía compite con las plantas; con 20–25 celdas vacías domina la escena.
- **V4. Escala inconsistente.** En la parcela la planta es chica respecto de la baldosa (104 px) y el alcorque; en la sala el tomate mide ~3× la lechuga y desborda por encima de la pared. Los badges ★ flotan sin relación clara con la planta.
- **V5. Líneas punteadas azules en la parcela** (arcos de pedigrí u otra guía) cruzan toda la grilla en diagonal y se confunden con surcos; necesitan más jerarquía o mostrarse solo con la lente Genética / al seleccionar.
- **V6. Cartel "INVERNADERO PEQUEO"**: falta la Ñ. Revisar si el texto se trunca, si `toUpperCase()`/la fuente monospace pierde el glifo, o si el nombre viene así de los datos. Mismo chequeo en `IsometricCampusMap`.
- **V7. Convivencia de dos sistemas de coordenadas visibles**: la etiqueta de celda (`D-01`) y el nombre de la planta ocupan el mismo lugar; en celdas ocupadas se pierde la coordenada.
- **V8. Pared/escenografía tapada por el follaje** sin ninguna atenuación: en salas cerradas, el equipamiento de fondo pierde sentido.

## 1. Objetivos y no-objetivos

**Objetivos**
- Mejor aspecto (luz coherente, variación natural, crecimiento continuo) y animaciones sutiles.
- **Cero dependencias de runtime nuevas** en fases 1–5. Bundle principal no debe crecer > 5 KB gz.
- Arquitectura que permita, más adelante, renderizar un cultivo con otra técnica (imagen raster, 3D) sin tocar la sala.
- Ciclo de feedback visual (hoja de contactos PNG) para iterar dibujos.

**No-objetivos**
- No migrar a Three.js / R3F / PixiJS en este plan (ver §8).
- No cambiar el comportamiento funcional: clicks, selección, drag & drop, lentes, filtros, zoom, accesibilidad (`role="button"`, `aria-label`, teclado) deben quedar idénticos.
- No crear páginas, rutas o componentes demo/prueba en la app.

## 2. Reglas para el agente ejecutor

- **No levantar servidor de desarrollo.** El dueño ya tiene uno corriendo en `http://localhost:5173`. Para verificar UI usar esa app real.
- No crear rutas/páginas demo. Las herramientas de verificación van en `scripts/` (Node), nunca en `src/` como página.
- Después de cada fase: `npm run lint`, `npm test`, `npm run build` deben pasar. Los tests existentes (`src/features/locations/__tests__/LocationsPage.test.tsx` y demás) no se modifican salvo que se justifique en el PR.
- Mantener los `data-*` existentes (`data-archetype`, `data-container`, `data-botanical-feature`, `data-scenery`, `data-room-type`, `data-lens-mode`, `data-empty-container`): los tests dependen de ellos.
- Commits con convención existente: `feat(isometric): ...`, `perf(isometric): ...`, `refactor(isometric): ...`.
- Al terminar cada fase, reportar: qué cambió, cómo se verificó, qué quedó pendiente.

## 3. Arquitectura objetivo

```
src/features/locations/isometric/
├── geometry/
│   ├── iso.ts                 # proyección, polígonos de baldosa, viewBox, esquinas
│   └── depth.ts               # clave de profundidad y orden de dibujables
├── visual/
│   ├── palette.ts             # tokens base + shade() en OKLCH
│   ├── seed.ts                # PRNG determinístico desde id (mulberry32 + hash)
│   ├── plantSpec.ts           # buildPlantVisualSpec(): dominio → PlantVisualSpec (puro)
│   └── SharedDefs.tsx         # <defs> compartidos (gradientes por paleta, sombras)
├── renderers/
│   ├── types.ts               # PlantRenderer interface
│   ├── registry.ts            # arquetipo → renderer (procedural por defecto)
│   ├── procedural/            # un archivo por arquetipo (solanaceae.tsx, cereal.tsx, ...)
│   │   └── containers.tsx     # macetas/alcorques/frascos por LocationType
│   └── raster/RasterPlant.tsx # (fase 6) <image> desde sprite WebP
├── layers/
│   ├── SceneryLayer.tsx       # paredes, equipamiento, cercos
│   ├── FloorLayer.tsx         # losa
│   ├── CellsLayer.tsx         # baldosas + interacción
│   ├── PlantsLayer.tsx        # plantas ordenadas por profundidad
│   ├── OverlayLayer.tsx       # arcos de pedigrí, halos, hover
│   └── AmbientLayer.tsx       # tinte de luz diurna (fase 5)
├── IsometricRoomInterior.tsx  # orquestación + HUD (objetivo < 600 líneas)
├── IsometricPlantSprite.tsx   # wrapper fino: spec → renderer (API pública igual)
├── IsometricCampusMap.tsx
└── botanicalArchetypes.ts
scripts/
└── render-sprite-sheet.tsx    # hoja de contactos PNG (fase 1)
```

### 3.1 Contratos clave

```ts
// visual/plantSpec.ts
export type BbchPhase = 'germination' | 'leaf' | 'structure' | 'flowering' | 'fruiting'

export interface PlantVisualSpec {
  archetype: BotanicalArchetypeId
  cropCode: string
  fruitShape: FruitShape
  bbch: number                 // 0–99 crudo
  phase: BbchPhase
  phaseProgress: number        // 0–1 dentro de la fase (crecimiento continuo)
  vitality: 'alive' | 'harvested' | 'dead'
  palette: PlantPalette        // ya resuelta con shade(), incluye estado vital
  paletteKey: string           // clave estable para SharedDefs (ej. "solanaceae_tall:alive:ripe")
  seed: number                 // derivado del id del individuo
  variation: {
    heightScale: number        // 0.9–1.1
    leanDeg: number            // -4..4
    leafJitterDeg: number      // -8..8
    mirror: boolean            // espejo horizontal
  }
  container: LocationType
}

export function buildPlantVisualSpec(input: {
  individualId: string
  taxon?: Taxon
  bbch?: number
  status: IndividualStatus
  locationType: LocationType
}): PlantVisualSpec
```

```ts
// renderers/types.ts
export interface PlantRendererProps {
  spec: PlantVisualSpec
  isSelected: boolean
}
export type PlantRenderer = React.ComponentType<PlantRendererProps>
```

```ts
// visual/palette.ts
export type Face = 'top' | 'left' | 'right' | 'highlight' | 'shadow'
/** Luz fija desde arriba-izquierda (cuadrante noroeste). top = +L, left = base, right = -L, shadow = -L fuerte. */
export function shade(baseHex: string, face: Face): string
```

Reglas de `shade` (OKLCH, sin dependencias; implementar conversión sRGB↔OKLCH a mano, ~60 líneas):
- `top`: L +0.08, C ×0.95
- `left`: base
- `right`: L −0.10, C ×1.05
- `highlight`: L +0.18, C ×0.7
- `shadow`: L −0.20, C ×0.9, hue desplazado −10° (sombras levemente más frías)
- Clamp L∈[0,1], C≥0; salida hex `#rrggbb`.

```ts
// geometry/depth.ts
export interface Drawable { key: string; row: number; col: number; layer: number; subOrder?: number; node: React.ReactNode }
// orden: (row + col) asc, luego layer asc, luego subOrder asc
export function sortDrawables(list: Drawable[]): Drawable[]
```

## 4. Fases

### Fase 1 — Hoja de contactos + rendimiento base

**1a. Script `scripts/render-sprite-sheet.tsx`**
- Dev deps nuevas permitidas: `@resvg/resvg-js`, `tsx` (si no hay forma de correr TSX desde Node con lo existente).
- Script npm: `"sprites:sheet": "tsx scripts/render-sprite-sheet.tsx"`.
- Usa `react-dom/server` `renderToStaticMarkup` para renderizar `IsometricPlantSprite` envuelto en un `<svg>` por celda.
- Grilla: filas = arquetipos × variante (incluye tomate, pimiento, berenjena, maíz, trigo, girasol, lechuga, frutilla, zanahoria, remolacha, cebolla, cáñamo, poroto, zapallo, vid, cítrico, genérico); columnas = BBCH `[5, 15, 25, 35, 55, 75, 85]` + `harvested` + `dead`.
- Taxones de ejemplo como fixtures dentro del script (genus/species/family/cropCode mínimos).
- Etiquetas de texto por fila y columna. Fondo claro `#f8fafc`. Celda 140×160, escala 2×.
- Salida: `scripts/out/sprite-sheet.png` (+ `sprite-sheet.svg`). Agregar `scripts/out/` a `.gitignore`.
- Flag opcional `--container=greenhouse|field|growth_chamber|lab` para ver contenedores.
- Si el alias `@/` no resuelve en `tsx`, usar `tsconfig-paths` o resolver con `--tsconfig`.

**1b. Rendimiento**
- `IsometricPlantSprite` envuelto en `React.memo` (comparación shallow por defecto basta si las props son primitivas/estables).
- Eliminar gradientes por instancia: crear `visual/SharedDefs.tsx` que recibe el conjunto de `paletteKey` presentes en la sala y emite un juego de gradientes por clave (`id="plant-fruit-${paletteKey}"`, `plant-stem-…`, `tutor-bamboo` único). Sanitizar la clave para ids válidos. El sprite referencia `url(#…)` por clave.
  - En el script de la hoja de contactos, incluir `SharedDefs` en cada SVG.
- Hover: dejar de re-renderizar toda la sala.
  - El resaltado visual de baldosa vacía pasa a CSS: clase `.iso-cell:hover .iso-tile { fill: …; stroke: … }` en `src/index.css` (o CSS module local).
  - `hoveredSlot` se mantiene solo para la tarjeta flotante de inspección; extraer la tarjeta a un componente que lea el hover de un store mínimo (Zustand local o `useSyncExternalStore`) para que el cambio de hover no re-renderice `PlantsLayer`.
  - Alternativa aceptable: `React.memo` en la celda con props estables (`useCallback` para handlers con `posLabel` vía `data-pos` + un handler delegado en el `<g>` contenedor).
- Code-splitting: en `src/router.tsx`, `LocationsPage` (y otras páginas pesadas si es trivial) con `React.lazy` + `<Suspense>` con un fallback simple existente o un spinner mínimo.

**Aceptación fase 1**
- `npm run sprites:sheet` genera el PNG con todas las combinaciones sin errores.
- En una sala 16×16 llena, el DOM tiene ≤ 20 elementos `<linearGradient>/<radialGradient>` dentro de la sala (verificable con un test: renderizar `IsometricRoomInterior` con 256 individuos y contar).
- Test: mover hover entre dos celdas no re-renderiza los sprites (usar un spy de render o `React.Profiler` en test).
- `npm run build` muestra un chunk separado para la vista de ubicaciones; el chunk principal baja.
- Comportamiento idéntico; tests existentes verdes.

### Fase 2 — Geometría y capas (refactor sin cambio visual)

- Extraer a `geometry/iso.ts`: `TILE_W`, `TILE_H`, `halfW`, `halfH`, `projectCell(r, c)`, `tilePolygon(inset)`, `roomCorners(rows, cols)`, `roomViewBox(rows, cols)`, `wallHeight`.
- **Preparación para el editor (§8)**: `iso.ts` debe exponer además `projectWorld({x, y, z})` en **centímetros** (x = eje columnas, y = eje filas, z = altura) y su inversa `screenToWorld(px, py, z = 0)`. `projectCell` se implementa encima de `projectWorld` con una constante `CELL_CM` (por defecto 50 cm = 1 baldosa). Todo lo nuevo se posiciona en cm; las celdas pasan a ser solo una forma de *etiquetar* posiciones.
- `sortDrawables` debe aceptar objetos con **huella** (`footprint: {x, y, w, d}` en cm) además de celdas, para que muebles de varias celdas ordenen bien (§8.4).
- Partir `IsometricRoomInterior.tsx` en las capas de §3. Props explícitas, sin contexto global salvo un `IsoRoomContext` de solo lectura con `rows`, `cols`, `locationType`, `lensMode` si reduce prop drilling.
- `PlantsLayer` y `OverlayLayer` usan `sortDrawables` (§3.1). Las baldosas quedan en `CellsLayer` (debajo); plantas en su propia capa por encima, ordenadas por profundidad. **Importante**: los handlers de interacción siguen en la celda; la capa de plantas usa `pointer-events: none` salvo que se necesite click directo en la planta (hoy el click va por la celda).
- Tests unitarios para `iso.ts` (proyección de esquinas conocidas, viewBox para 1×1 y 16×16) y `depth.ts`.

**Legibilidad (resuelve V1, V2, V3, V5, V6, V7, V8)** — único cambio visual permitido en esta fase:
- **Etiquetas en capa propia** (`LabelsLayer`, por encima de `PlantsLayer`): las etiquetas de planta y de coordenada salen de la celda y se dibujan al final, ancladas al pie de cada celda (`projectCell(r,c)` + offset fijo `y = halfH - 6`). Nunca las tapa una planta.
  - Por defecto se muestra solo la coordenada (chica, baja opacidad). El nombre de la planta aparece en hover, selección o con un toggle "Mostrar nombres" en el HUD.
  - Con nombres activos: truncar a 12 caracteres con "…", fondo tipo píldora con `paint-order: stroke` o rect semitransparente, y evitar solapes simples: si dos etiquetas de la misma diagonal (r+c) se superponen en X, alternar offset vertical ±10 px.
  - El badge del individuo (`-001 #03`) pasa a la misma capa y solo en selección.
- **Transparencia por oclusión ("rayos X")**: cuando hay celda en hover/seleccionada o drag activo, las plantas que están **delante** (mayor `r+c`) y cuya caja se superpone en pantalla con esa celda bajan a opacidad 0.35 (`transition: opacity 0.15s`). Implementar con la caja aproximada del sprite (ancho ±30 px, alto según `heightScale` y fase) en `geometry/depth.ts` (`occludes(front, back): boolean`, con test).
- **Celdas vacías silenciosas**: el "+" se muestra solo en hover/foco de teclado, durante drag & drop y en la celda seleccionada. En reposo, la maceta vacía se dibuja con menor contraste (opacidad 0.7). Mantener `aria-label` "Celda vacía X" (accesibilidad igual).
- **Arcos de pedigrí con jerarquía**: visibles solo con lente `genetics` o cuando la planta seleccionada es parte del arco; trazo 1.5 px, opacidad 0.6, y por encima de etiquetas. Verificar qué son las líneas punteadas azules de la parcela; si son arcos, aplicar esta regla; si son otra guía, documentarla y bajarle la opacidad a 0.25.
- **Ñ y acentos**: reproducir V6 con un test que renderice un cartel con "Invernadero pequeño" y verifique el texto "INVERNADERO PEQUEÑO"; usar `toLocaleUpperCase('es')` y una fuente con el glifo (o `font-family` con fallback que lo tenga).
- **Escenografía legible**: el equipamiento de fondo (tanque, displays, ventanas) se dibuja en `SceneryLayer` y nunca debe quedar a la altura de las plantas de la primera fila del fondo: correr tanques/carteles a las paredes (lado alto del muro) en vez del piso cercano a la celda A-01.

**Aceptación fase 2**
- La geometría, escenografía y plantas se ven igual que antes (hoja de contactos + captura de cada tipo de sala, antes/después, adjuntas al PR); los únicos cambios visuales son los de "Legibilidad".
- En la sala "Patio de atrás" (o equivalente con ≥ 10 plantas mezcladas) ninguna etiqueta visible queda tapada ni cortada.
- Al pasar el mouse sobre una celda detrás de un tomate o girasol, la planta de adelante se vuelve translúcida y la celda se puede clickear.
- En reposo no se ven botones "+" en celdas vacías.
- `IsometricRoomInterior.tsx` < 600 líneas.
- Tests verdes.

### Fase 3 — Spec visual, luz y variación

- Implementar `visual/palette.ts` (`shade`) con tests: valores de ejemplo, clamps, que `right` sea más oscuro que `left` y `top` más claro (comparar L).
- Implementar `visual/seed.ts`: `hashString(id) → uint32` (FNV-1a) y `mulberry32(seed)`. Test de determinismo.
- Implementar `buildPlantVisualSpec` (puro, con tests):
  - `phase` y `phaseProgress` desde BBCH: germination [0,10), leaf [10,30), structure [30,50), flowering [50,70), fruiting [70,100].
  - `vitality` desde status (`dead`/`discarded` → dead; `harvested` → harvested).
  - Paleta: tomar colores base de `resolveBotanicalArchetype` y derivar caras con `shade`. Estados dead/harvested: desaturar (C ×0.35) y virar hue hacia 60–70° en vez de hex fijos.
  - `variation` desde el seed con los rangos de §3.1.
- Migrar `IsometricPlantSprite` a: `spec = buildPlantVisualSpec(...)` → `registry[spec.archetype]` → renderer procedural. API pública del componente igual **más** una prop nueva opcional `individualId` (la sala ya la tiene: `plant.id`).
- Mover cada arquetipo a `renderers/procedural/<arquetipo>.tsx`, reemplazando hex literales por `spec.palette.*`. Prohibido hex literal en renderers salvo blanco/negro puros para brillos (agregar un test o regla simple: grep en CI opcional).
- Aplicar variación: el grupo de follaje recibe `transform="scale(1, heightScale) rotate(leanDeg)"` con origen en la base (0, -7); `mirror` aplica `scale(-1,1)`; jitter de hojas por índice.
- Crecimiento continuo: dentro de cada fase, escala del follaje `0.85 + 0.15 * phaseProgress`.
- Sombra de contacto: reemplazar elipse plana por `radialGradient` compartido (`plant-contact-shadow`) negro con opacidad 0.28 → 0.

**Aceptación fase 3**
- Hoja de contactos regenerada: colores coherentes (misma dirección de luz en macetas, tallos y frutos), sin hex sueltos.
- Agregar al script una fila "variación": el mismo taxón y BBCH con 6 ids distintos — deben verse distintos pero reconocibles.
- Tests de `palette`, `seed`, `plantSpec` verdes; tests existentes verdes (los `data-*` se mantienen).

### Fase 4 — Mejora de dibujos (iterativa, guiada por la hoja de contactos)

Para cada arquetipo, en este orden de prioridad: solanaceae, cereal, rosette, root_tuber, heliotropo, vine_climber, woody_perennial, palmate_cane, generic_herb.

Guía de estilo (aplicar en todos):
- **Luz**: desde arriba-izquierda. Hojas/frutos: cara iluminada `top/highlight` a la izquierda-arriba, `right/shadow` abajo-derecha.
- **Contornos**: un solo grosor de contorno por escala (`0.8` en sprites de celda), color = `shade(base,'shadow')`, nunca negro puro.
- **Escala relativa** (altura del follaje en px de sprite, BBCH adulto): roseta 18–24, raíz/bulbo 22–30, herbácea/solanácea 45–55, cereal 55–65, girasol 60–70, leñosa 55–65 (puede desbordar la celda hacia arriba, nunca a los costados más de ±30 px). Hoy el tomate adulto supera claramente este rango (V4): ajustarlo primero.
- **Ocupación de la baldosa**: el sprite completo (contenedor + follaje) debe ocupar 55–75% del ancho de la baldosa (~57–78 px de 104). En `field` hoy la planta queda chica (V4): escalar contenedor y follaje juntos según `locationType` con un factor en el spec (`containerScale`), no redibujando.
- **Badges** (★ generación, estado): anclados a una posición fija relativa al contenedor (borde superior derecho de la maceta), tamaño 12 px, nunca flotando sobre el follaje.
- **Silueta primero**: cada arquetipo debe ser reconocible en silueta negra a 50% de tamaño (agregar opción `--silhouette` al script para chequearlo).
- **Profundidad dentro de la planta**: hojas traseras más oscuras y dibujadas antes; delanteras más claras y después.
- **Máximo ~60 elementos SVG por sprite** en la fase más compleja (medir en test por arquetipo).
- Arquetipos sin dibujo propio hoy (`vine_climber`, `woody_perennial`, `palmate_cane` si caen a genérico): crear renderer propio.

Proceso por arquetipo: modificar → `npm run sprites:sheet` → revisar PNG → ajustar → commit con el PNG antes/después adjunto al PR (no commitear `scripts/out/`).

**Aceptación fase 4**: por arquetipo, PNG antes/después en el PR; conteo de elementos dentro del límite; tests verdes.

### Fase 5 — Animaciones sutiles

Todas con CSS o `motion` (ya instalado). Todas desactivadas con `@media (prefers-reduced-motion: reduce)`.

1. **Balanceo ambiental**: clase `.iso-sway` en el grupo de follaje:
   ```css
   .iso-sway { transform-box: fill-box; transform-origin: 50% 100%; animation: iso-sway 5s ease-in-out infinite alternate; }
   @keyframes iso-sway { from { transform: rotate(-1.2deg); } to { transform: rotate(1.2deg); } }
   ```
   `animation-delay` negativo derivado del seed (`-(seed % 5000)ms`) y duración 4–6 s por seed. No aplicar a `dead`. En `field` amplitud ×1.5; en `growth_chamber`/`lab` amplitud ×0.5 (via CSS variable `--sway-amp`).
   - Pausar cuando la vista no está visible: `IntersectionObserver` en el contenedor que alterna una clase `.iso-paused { animation-play-state: paused }`.
2. **Crecimiento al cambiar BBCH**: si `phase` cambia entre renders del mismo individuo, el follaje hace `scale 0.85 → 1` con `motion.g` (spring, ~400 ms) desde la base. Detectar con `useRef` de la fase anterior. No animar en el primer montaje.
3. **Siembra (drop)**: al aparecer un individuo nuevo en una celda (tras `onDropSeedInSlot`), animación de entrada `y: -12 → 0`, `opacity 0 → 1`, + 3 partículas de tierra (círculos `r=1.5`) que salen y se desvanecen en 350 ms. Solo para ids que no estaban en el render anterior y no en el montaje inicial.
4. **Luz diurna (`AmbientLayer`)**: rectángulo/poligono sobre toda la sala con `mix-blend-mode: multiply` y color según hora local y fotoperíodo de la ubicación (usar datos de clima existentes si están disponibles en `agroClimateStore`/servicios de clima; si no, solo hora local):
   - día: sin tinte; amanecer/atardecer: `#fde68a` opacidad 0.12; noche: `#1e3a8a` opacidad 0.18.
   - `growth_chamber` y `lab`: sin tinte (luz artificial). `pointer-events: none`.
   - Toggle en el HUD (ícono sol/luna de `lucide-react`) para desactivarlo; preferencia en `localStorage` con try/catch.
5. **Selección**: el halo punteado de selección anima `stroke-dashoffset` (marcha de hormigas) en CSS, 1.2 s lineal.

**Aceptación fase 5**
- Con `prefers-reduced-motion` no hay animaciones (test con `matchMedia` mockeado o verificación de clase).
- En sala 16×16 llena el scroll y hover siguen fluidos (verificar en la app real con DevTools Performance; sin long tasks > 50 ms al mover el mouse).
- Sin dependencias nuevas.

### Fase 6 — Piloto de sprite raster (un cultivo)

Objetivo: validar el camino "cultivo con dibujo de mayor calidad" sin cambiar el motor.

- `renderers/raster/RasterPlant.tsx`: dibuja el contenedor procedural + `<image href={url} x y width height preserveAspectRatio="xMidYMax meet" />` alineado a la base (0, -7). Aplica `variation` (mirror, heightScale) y la clase `.iso-sway`.
- Manifest `src/features/locations/isometric/renderers/raster/manifest.ts`:
  ```ts
  export const RASTER_SPRITES: Partial<Record<string /* cropCode */, Partial<Record<BbchPhase | 'dead' | 'harvested', string>>>> = {
    TOM: { leaf: new URL('./assets/tom-leaf.webp', import.meta.url).href, ... },
  }
  ```
- `registry.ts`: si existe sprite raster para `cropCode` + fase, usar `RasterPlant`; si no, renderer procedural (fallback siempre disponible).
- Assets: `renderers/raster/assets/*.webp`, 2× (≈ 160×200 px), ≤ 20 KB cada uno, fondo transparente, luz arriba-izquierda, vista 2:1.
- Fuentes posibles de arte (decisión del dueño):
  - Recraft V4 Styles (vector/SVG) con style ID fijo para consistencia → exportar a WebP.
  - Modelo 3D low-poly (Meshy / Tripo / Hunyuan3D, GLB) renderizado en Blender: cámara ortográfica, rotación X=60°, Y=0, Z=45° (dimétrica 2:1), luz sol arriba-izquierda, fondo transparente.
  - Ilustración manual.
- Agregar al script de hoja de contactos una columna "raster" para comparar.
- Test: con el manifest vacío, todo cae al procedural.

**Aceptación fase 6**: tomate en 5 fases con raster; peso total de assets del piloto ≤ 100 KB; cargan solo al abrir una sala (no en el chunk principal); fallback funcionando.

### Fase 7 (opcional) — Documentación de convenciones

`docs/isometric-art-guide.md` breve: contratos (`PlantVisualSpec`, `PlantRenderer`), `shade()` y caras, escala relativa, límites de elementos, cómo correr la hoja de contactos y cómo agregar un arquetipo o un sprite raster. Esto reemplaza la idea de "skill de dirección de arte": las reglas viven en el código y esta guía solo las documenta.

## 5. Orden y dependencias

```
F1 (sheet + perf) → F2 (capas) → F3 (spec/luz/seed) → F4 (dibujos, iterativa)
                                              └──→ F5 (animaciones)
                                              └──→ F6 (raster piloto)
F7 al final
```
F4, F5 y F6 pueden hacerse en paralelo una vez cerrada F3 (tocan archivos distintos: renderers/procedural, CSS+layers, renderers/raster).

## 6. Presupuestos

| Métrica | Límite |
|---|---|
| Deps de runtime nuevas (F1–F5) | 0 |
| Crecimiento chunk principal | ≤ 5 KB gz (debería bajar por code-splitting) |
| Gradientes en sala 16×16 | ≤ 20 |
| Elementos SVG por sprite procedural | ≤ 60 |
| Asset raster | ≤ 20 KB c/u |
| Long tasks al hacer hover | ninguna > 50 ms |

## 7. Riesgos

- **Ids de gradientes compartidos** chocan si hay dos salas montadas a la vez (campus + sala): prefijar con un id de instancia de sala.
- **`transform-box: fill-box`** en SVG tiene soporte bueno en navegadores modernos; verificar Safari en la app real.
- **jsdom** no calcula layout ni animaciones CSS: testear presencia de clases/atributos, no el movimiento.
- **Refactor de F2** puede romper el orden de pintado: comparar capturas antes/después de cada tipo de sala (greenhouse, field, growth_chamber, lab, room, bench).
- **`resvg-js`** no soporta `mix-blend-mode` ni animaciones CSS; la hoja de contactos es estática y no incluye `AmbientLayer`.

## 8. Editor de espacios (fases E1–E5)

Objetivo: que el usuario construya y edite sus salas como en un juego de construcción (tamaño, forma, muebles, canteros, distancia entre plantas, objetos), con la seriedad de una herramienta técnica: **unidades reales, medidas visibles, nada decorativo que mienta sobre el espacio**. El motor debe soportarlo de base aunque la UI del editor llegue después.

Requisito previo: fases 1–3 terminadas (capas, `projectWorld` en cm, spec visual).

### 8.1 Principio central: el mundo se mide en centímetros, no en celdas

Hoy una sala es `rows × cols` y cada planta tiene `position = "B-03"` (`src/domain/location.ts`, `src/domain/individual.ts`). Eso no permite distancias reales, muebles ni canteros. Nuevo modelo:

- La sala tiene un **contorno en cm** y una **grilla de encastre** (snap) fina, p. ej. 10 cm, independiente del tamaño de las plantas.
- Los objetos (muebles, contenedores, equipos) tienen **posición, huella y altura en cm**.
- Las plantas viven en **puestos** (*slots*) que generan los contenedores (una maceta = 1 puesto; una bandeja de 72 alvéolos = 72; un cantero de 3 m con 40 cm entre plantas = 7 por surco).
- `Individual.position` (formato BrAPI `observationUnitPosition`) se **sigue llenando** con una etiqueta derivada legible (`"Cantero 1 · S2-P05"` o `"B-03"` en salas migradas), para no romper exportaciones ni otras pantallas.

### 8.2 Modelo de datos (dominio, puro y testeado)

```ts
// src/domain/roomLayout.ts
export interface RoomLayout {
  schemaVersion: 1
  locationId: string
  shape: { kind: 'rect'; widthCm: number; depthCm: number }    // E1
       | { kind: 'cells'; cellCm: number; mask: boolean[][] }  // E4: formas en L, U, etc.
  snapCm: number                    // 10 por defecto
  wallHeightCm: number              // 0 = sin paredes (campo abierto)
  floor: FloorMaterial              // 'tile' | 'concrete' | 'soil' | 'grass' | 'gravel' | 'mesh'
  objects: PlacedObject[]
}

export interface PlacedObject {
  id: string                        // uuidv7, como el resto del dominio
  typeId: string                    // clave en el catálogo (8.3)
  x: number; y: number; z: number   // cm; z > 0 = apoyado sobre otro objeto (estante, mesada)
  rotation: 0 | 90 | 180 | 270
  parentId?: string                 // objeto sobre el que está apoyado
  label?: string                    // "Mesada 1", "Cantero norte"
  params?: Record<string, number | string | boolean> // p. ej. { rowSpacingCm: 70, plantSpacingCm: 40 }
}

export interface PlantSlot {
  id: string                        // estable: `${objectId}:${index}`
  objectId: string
  x: number; y: number; z: number   // cm, en coordenadas de sala
  label: string                     // etiqueta derivada para Individual.position
}
```

- `deriveSlots(layout, catalog): PlantSlot[]` — función pura que genera todos los puestos desde los objetos y sus parámetros.
- Los individuos guardan `slotId` (campo nuevo y opcional en `Individual`) además de `position`. Si un objeto se borra o se achica y quedan plantas sin puesto, **no se borran**: pasan a una bandeja "Sin ubicar" de la sala y se avisa al usuario.
- **Migración**: los datos actuales son **de prueba y viven en localStorage**, así que no hace falta migración compleja. Alcanza con subir la versión del store persistido y reiniciar los datos (o regenerar los datos semilla de `src/data/` con el nuevo modelo). Opcional y barato: `gridToLayout(rows, cols)` como generador de la plantilla "Grilla de macetas", útil para los datos semilla.

### 8.3 Catálogo de objetos (lo que hace que "agregar cosas" sea barato)

Cada tipo de objeto es **datos + un renderer**, registrado en un catálogo. Agregar un objeto nuevo = agregar una entrada, sin tocar el motor.

```ts
// src/features/locations/isometric/catalog/types.ts
export interface ObjectType {
  id: string                          // 'pot_20l', 'tray_72', 'raised_bed', 'bench', 'shelf_3', 'water_tank', 'led_panel', 'door', 'window'
  label: string
  category: 'container' | 'furniture' | 'equipment' | 'structure' | 'decor'
  footprint: { w: number; d: number; h: number }  // cm, rotación 0
  resizable?: { w?: [min: number, max: number]; d?: [number, number] }
  mount: 'floor' | 'surface' | 'wall'             // wall = puertas, ventanas, carteles
  allowedIn?: LocationType[]
  stackableSurfaceZ?: number[]        // alturas donde se pueden apoyar otros objetos (estante de 3 niveles: [0, 60, 120])
  params?: ParamDef[]                 // definición de parámetros editables (con unidades y límites)
  slots?: (obj: PlacedObject) => Omit<PlantSlot, 'id' | 'objectId'>[]
  Renderer: React.ComponentType<{ obj: PlacedObject; view: 'a' | 'b' }>
  /** Vista en planta (cenital, 8.5 regla 6). Si falta, se dibuja la huella como rectángulo con el ícono de la categoría y la etiqueta. */
  PlanRenderer?: React.ComponentType<{ obj: PlacedObject }>
}
```

Catálogo inicial sugerido: maceta (tamaños), bandeja de alvéolos, cantero elevado, surco/camellón (campo), mesada, estantería de cultivo multinivel, panel LED, tanque de agua, puerta, ventana, cartel. Lo que hoy está dibujado fijo en `IsometricRoomInterior` (tanque H2O, displays, luminarias, estanterías, ventanas, cerco) se convierte en entradas del catálogo.

**Distancia entre plantas** (lo que lo diferencia de un juego): canteros y surcos tienen `rowSpacingCm` y `plantSpacingCm`; `slots()` los recalcula al instante. El editor muestra un aviso no bloqueante cuando la distancia está por debajo de lo recomendado.

**Fuente del espaciado recomendado**: hoy **no existe** en el proyecto (ni en Ecocrop ni en el taxón; verificado). Crear `src/data/plantSpacing.ts`: tabla curada por `cropCode` con `{ plantCm, rowCm, source }` para los ~30 cultivos que ya tienen arquetipo (tomate, pimiento, maíz, trigo, girasol, lechuga, frutilla, zanahoria, etc.), con la fuente citada en cada entrada (INTA, FAO o manual de cultivo). Resolver con `getEffectiveCropCode(taxon)`; si no hay dato, no mostrar "Recomendado" y usar el último valor usado (o 40 cm / 70 cm).

### 8.4 Motor: lo que tiene que tolerar

- **Proyección con altura**: `projectWorld({x, y, z})` para todo. Un objeto apoyado en una mesada a 80 cm se dibuja más arriba y ordena por su base.
- **Orden de profundidad con huellas**: para objetos de varias celdas no alcanza `r + c`. Usar la comparación clásica de cajas isométricas: A va detrás de B si `A.x + A.w <= B.x` o `A.y + A.d <= B.y` (o, a igual huella, si `A.z + A.h <= B.z`); construir el grafo de "detrás de" y ordenar topológicamente. Con < 1.000 objetos es O(n²) y alcanza; cachear y recalcular solo al cambiar el layout, no en hover. Tests con casos conocidos (mesada larga y maceta delante, estante con plantas en niveles).
- **Rotación**: en isométrica 2:1 alcanza con **dos vistas** por objeto (`view: 'a' | 'b'`): 0°/180° usan `a`, 90°/270° usan `b`, y el espejo horizontal resuelve el resto. La huella intercambia `w`↔`d` a 90°/270°.
- **Colisiones**: matriz de ocupación a la resolución de `snapCm` (o comparación AABB de huellas si hay < 300 objetos). Objetos `surface` solo se pueden soltar sobre un objeto con `stackableSurfaceZ`. Objetos `wall` solo sobre el borde de una pared.
- **Paredes dinámicas**: las paredes se generan del contorno. Para no tapar el interior, solo se dibujan las dos paredes del fondo (como hoy) y las delanteras como zócalo bajo; con formas en L (E4) se dibujan los tramos cuyo lado interior mira a la cámara.
- **Cámara**: paneo (arrastrar el fondo o mantener espacio), zoom con rueda centrado en el puntero, botón "encuadrar". Aplicado como `transform` en un `<g>` raíz (no cambiando `maxWidth` como hoy). Rotar la vista 90° queda para el futuro: ya está soportado por la regla de dos vistas.
- **Rendimiento con salas grandes**: descartar lo que queda fuera de la vista (culling por caja en pantalla). Escape hatch si algún día hace falta: rasterizar las capas estáticas (piso, paredes) a una `<image>` cacheada y dejar en SVG solo lo interactivo. PixiJS sigue sin justificarse salvo > 5.000 elementos visibles.

### 8.5 Experiencia de usuario del editor (prioridad sobre el motor)

Referencias de interacción estudiadas: modo Construcción/Compra de *The Sims*, *Two Point Hospital*, *Stardew Valley* (arado y siembra), *RollerCoaster Tycoon* / *Factorio* (construir arrastrando), *Animal Crossing* (editor de habitación), *Planner 5D* / planificadores de cocina (medidas y vista en planta), Figma (selección, manijas, barra contextual). No conviene copiar código de esos juegos (motores distintos); lo que se reutiliza son **patrones de interacción probados**.

Principio: **manipulación directa sobre el espacio, con los números como respuesta visual, no como formulario.** El usuario dibuja y estira; la app calcula cuántas plantas entran y lo muestra en vivo. Los valores se pueden ajustar tocando la etiqueta en el mismo lugar del dibujo, nunca en un formulario aparte como paso obligatorio.

Patrones concretos (todos sobre el lienzo, en vivo):
- **Trazar = definir largo.** Arrastrar con la herramienta Surco dibuja la fila; mientras se arrastra, aparecen las plantas fantasma una a una y una etiqueta "2,80 m · 8 plantas".
- **Espaciado con manija, estilo Figma.** Al seleccionar una fila, entre dos puestos aparece una manija de separación; arrastrarla abre o cierra el espaciado de **toda** la fila y las plantas se acomodan en vivo ("40 cm"). Mismo gesto para la distancia entre surcos.
- **Etiquetas editables en el lugar.** Las cotas que se ven ("40 cm", "8 plantas", "2,80 m") son clickeables: al tocar una se vuelve un campo chico ahí mismo, se escribe y Enter. Sirve para quien quiere precisión sin obligar a nadie a usarlo.
- **Valores rápidos como chips.** Junto a la herramienta activa, 3–4 chips: "30 · 40 · 50 cm · Recomendado (tomate)". Un toque cambia el espaciado de lo que se está trazando o de la selección.
- **Valor por defecto inteligente.** Si hay un cultivo activo (el que se va a sembrar o el filtro de especie), el espaciado inicial es el recomendado para ese taxón; si no, el último usado. La mayoría de las veces el usuario no toca ningún número.
- **El panel de propiedades es secundario**: existe para revisar o hacer ajustes finos, pero ningún flujo principal depende de él.

Siete reglas:

1. **Nunca empezar de cero: plantillas.** Al crear una sala se elige una plantilla según `LocationType` (p. ej. "Invernadero 6×20 m con 3 mesadas", "Cámara con 2 racks de 3 niveles", "Parcela con surcos a 70 cm", "Mesada de laboratorio con 4 bandejas", "Vacía"). Ancho/profundidad se ajustan en el mismo paso con dos campos en metros y vista previa en vivo. La mayoría de los usuarios solo retoca la plantilla.
2. **Construir arrastrando, como en los juegos de construcción.** Cada herramienta tiene un gesto natural:
   | Quiero… | Gesto | Resultado |
   |---|---|---|
   | Agregar una maceta | Elegirla en el catálogo y hacer clic en el piso | Una maceta en el punto encastrado |
   | Agregar varias macetas | Elegirla y **arrastrar** una línea o un rectángulo | Se llena con macetas al espaciado elegido; antes de soltar se ve "12 macetas · 40 cm" |
   | Agregar un surco/fila | Herramienta *Surco*: arrastrar de un punto a otro | Surco con puestos cada `plantSpacingCm` (por defecto, el recomendado del taxón activo o 40 cm) |
   | Agregar varios surcos | Arrastrar con la herramienta *Surcos* un rectángulo | Surcos paralelos a `rowSpacingCm`, contador en vivo "4 surcos × 9 plantas" |
   | Agregar un cantero/mesada | Arrastrar un rectángulo | Objeto del tamaño dibujado, con cotas en vivo |
   | Alargar o acortar una fila | Arrastrar la manija del extremo | Se agregan/quitan puestos; si alguno tiene planta, aviso antes de soltar |
   | Cambiar la distancia | Arrastrar la manija de separación entre dos puestos, tocar un chip, o tocar la cota "40 cm" y escribir | Puestos recalculados en vivo |
3. **Seleccionar y mover como en Figma/The Sims.** Clic selecciona; arrastrar mueve (con plantas incluidas); rectángulo de selección sobre el fondo para varios; Shift suma a la selección. Al seleccionar aparece una **barra contextual flotante** junto al objeto: Rotar · Duplicar · Propiedades · Borrar. Teclado: R rotar, Ctrl+D duplicar (repite el último desplazamiento, para hacer series), Supr borrar, flechas mover 10 cm.
4. **Feedback antes de soltar, siempre.** Vista fantasma verde (válido) / roja (choca o queda fuera) con el motivo en texto ("Choca con Mesada 2"), guías de alineación con vecinos, cotas en vivo y contador de puestos. El usuario nunca descubre el error después.
5. **Sin miedo: deshacer visible y guardado automático.** Botones Deshacer/Rehacer siempre visibles en modo edición (además de Ctrl+Z), sin botón "Guardar". Borrar algo con plantas muestra un toast "3 plantas pasaron a Sin ubicar · Deshacer".
6. **Dos vistas del mismo espacio: isométrica y en planta.** Un conmutador "Iso / Planta" (vista cenital 2D, mismo modelo en cm, solo cambia `projectWorld`). La isométrica es la mejor para *ver* y para el atractivo; la planta es mejor para *medir y ubicar con precisión*, no tiene oclusión y funciona mejor en pantallas chicas. Las herramientas funcionan igual en ambas. Esto lo usan Planner 5D y planificadores profesionales, y es lo que más reduce la frustración.
7. **Separar "armar el espacio" de "sembrar".** Modo *Espacio* (estructura: objetos, surcos, canteros) y modo *Plantas* (lo de hoy). En modo Plantas se puede **sembrar en lote**: arrastrar sobre varios puestos vacíos los selecciona y un único diálogo asigna accesión/lote de semillas a todos (como el arado/siembra de Stardew). El DnD actual de semillas desde el panel sigue funcionando sobre un puesto o sobre una selección.

Otros detalles:
- **Catálogo** como cajón inferior (estilo The Sims) con categorías por tipo de sala, búsqueda y "usados recientemente". Solo muestra objetos válidos para el `LocationType`.
- **Ayuda contextual**: una línea de texto fija abajo que describe la herramienta activa ("Arrastrá para trazar un surco · Alt cambia la distancia · Esc cancela"). Hoja de atajos con `?`.
- **Estado vacío**: si la sala no tiene objetos, mostrar las plantillas y la herramienta más útil, no un piso vacío.
- **Táctil**: tocar selecciona, mantener presionado y arrastrar mueve, pellizcar hace zoom, dos dedos panean. La vista en planta es la recomendada en móvil.
- **Prueba de usabilidad (criterio de cierre de E3/E4)**: alguien que no conoce la app debe poder, sin ayuda y en menos de 2 minutos: crear un invernadero desde plantilla, agregar 2 surcos de 8 plantas a 40 cm, mover una mesada, deshacer el cambio y sembrar en lote un surco. Registrar dónde dudó.

### 8.5.1 Editor (detalle de implementación)

- **Dos modos**: *Ver* (lo de hoy: inspeccionar, sembrar, mover plantas) y *Editar espacio* (botón en el HUD). En modo editar las plantas se atenúan y no se seleccionan.
- **Herramientas**: seleccionar, mover, rotar (R), duplicar (Ctrl+D), borrar (Supr), redimensionar (manijas en los bordes de la huella si `resizable`), cambiar el tamaño de la sala arrastrando los bordes del piso, material del piso.
- **Catálogo** en un panel lateral por categorías; arrastrar del panel a la sala con vista previa "fantasma" verde (válido) o roja (choca o queda fuera).
- **Encastre**: a `snapCm`; Shift desactiva el encastre; se muestran guías de alineación con objetos vecinos.
- **Medidas siempre visibles al editar**: cota de ancho y profundidad del objeto seleccionado, distancia al objeto o pared más cercano, reglas en los bordes del piso cada 50 cm. Es lo que le da la "seriedad".
- **Inspector** del objeto seleccionado: etiqueta, parámetros con unidades (espaciado, niveles, tamaño), cantidad de puestos resultantes y plantas afectadas.
- **Deshacer/rehacer**: `zundo` (middleware de Zustand, < 1 KB gz) sobre el store del layout; Ctrl+Z / Ctrl+Shift+Z. El historial se limpia al salir del modo editar.
- **Cambios con plantas involucradas**: mover un contenedor mueve sus plantas (los `slotId` no cambian). Achicar un cantero o borrar un objeto con plantas pide confirmación y lista qué individuos pasan a "Sin ubicar".
- **Entrada**: dentro de la sala usar Pointer Events (`pointerdown/move/up` + `setPointerCapture`) con `screenToWorld`, no el drag & drop HTML5. El DnD HTML5 actual (semillas desde el panel lateral) se mantiene.
- **Accesibilidad**: los objetos seleccionables son `role="button"` con `aria-label`; con el objeto seleccionado, las flechas lo mueven `snapCm` (Shift = 1 cm) y R lo rota.
- **Herramientas como máquina de estados** (obligatorio, para que la interacción no termine en un nudo de `useState`): `editorStore` con `tool: 'select' | 'place' | 'row' | 'rows' | 'bed' | 'resizeRoom'` y `phase: 'idle' | 'hover' | 'pressing' | 'dragging' | 'invalid'`, transiciones en un reducer puro (`editorReducer(state, event)`) con eventos `pointerDown/Move/Up`, `keyDown`, `cancel`. El SVG solo traduce eventos del DOM a eventos del reducer y dibuja el estado (fantasma, cotas, guías). Esc siempre vuelve a `idle` de la herramienta actual; segundo Esc vuelve a `select`.
- **Testabilidad**: jsdom no implementa `getScreenCTM` ni layout. Por eso: `screenToWorld` recibe la matriz como parámetro (test puro); el reducer del editor y las funciones de snap, colisión, generación de puestos y orden se testean sin DOM; los tests de componentes solo verifican que un evento sintético llegue al reducer y que el estado se dibuje (clases/atributos). La verificación de la sensación se hace en la app real.
- **Persistencia**: el layout se guarda en un store Zustand persistido (`roomLayoutStore`), como los demás stores del proyecto, con `schemaVersion` para migraciones futuras.

### 8.6 Fases del editor

| Fase | Contenido | Aceptación |
|---|---|---|
| **E1 — Modelo y plantillas** | `roomLayout.ts`, `deriveSlots`, `slotId` en `Individual`, `roomLayoutStore` (versión nueva, datos reiniciados), plantillas por `LocationType` y datos semilla regenerados. La plantilla "Grilla de macetas" se ve como la grilla actual. | Tests de dominio; crear sala desde plantilla funciona; `position` se llena con etiqueta legible. |
| **E2 — Motor con huellas** | Catálogo con maceta genérica + los equipos que hoy están fijos (tanque, LED, displays, ventanas, cerco) migrados a objetos; orden topológico; altura `z`; dos vistas por rotación; cámara con paneo/zoom. | Tests de orden de profundidad; equipamiento renderizado desde el catálogo; sin regresiones visuales. |
| **E3 — Editor básico** | Modos Espacio/Plantas, vista Iso/Planta, seleccionar/mover/rotar/borrar/duplicar, barra contextual, rectángulo de selección, encastre, colisiones, vista fantasma con motivo, cajón de catálogo, colocar arrastrando (línea/rectángulo de macetas), cotas, deshacer/rehacer visibles, redimensionar sala, ayuda contextual. | Flujo completo probado en la app real; tests de colisión y snap; Ctrl+Z restaura; prueba de usabilidad de 8.5 (parte de macetas y mover). |
| **E4 — Contenedores con espaciado** | Herramientas Surco/Surcos/Cantero arrastrando, manijas de extremo y de separación, cotas editables en el lugar, chips de espaciado, valor por defecto según taxón, estantería multinivel, avisos de marco de plantación, "Sin ubicar" con toast de deshacer, sembrar en lote, formas de sala por celdas (L/U). | Cambiar el espaciado recalcula puestos al instante; ninguna planta se pierde al achicar; tests de `slots()`; prueba de usabilidad de 8.5 completa en < 2 min. |
| **E5 — Más objetos** | Ampliar el catálogo (riego, sensores, carteles, caminos, decoración sobria). Cada objeto nuevo solo agrega una entrada + renderer. | Agregar un objeto no toca archivos del motor (`geometry/`, `layers/`). |

Orden respecto del plan visual: F1 → F2 → F3 → **E1 → E2** → (F4, F5, F6 y E3 en paralelo) → E4 → E5.

### 8.7 Riesgos específicos del editor

- **Usabilidad**: es el riesgo principal (el motor es la parte fácil). Hacer la prueba de 8.5 al cerrar E3 y E4 y ajustar antes de seguir con más objetos.
- **Datos**: hoy son de prueba en localStorage; al cambiar el modelo se reinician. Cuando haya datos reales o una base de datos, la migración pasa a ser obligatoria e idempotente.
- **Interferencia entre gestos**: paneo, mover objeto y DnD de semillas compiten por el puntero. Regla: arrastrar sobre un objeto lo mueve (solo en modo editar); sobre el fondo, panea; DnD HTML5 solo desde fuera de la sala.
- **Orden de profundidad con objetos que se cruzan** (sin solución con cajas): prohibirlo por colisión; si `z` permite superposición (estante), ordenar por niveles.
- **Ámbito**: la tentación de "juego" es grande. Cada objeto del catálogo debe corresponder a algo real de un establecimiento de cultivo; nada de decoración que el usuario no tenga.

## 9. Protocolo de ejecución y decisiones abiertas

### 9.1 Cómo ejecutar este spec

- **Una fase por vez.** Al terminar cada fase: detenerse, reportar (qué cambió, cómo se verificó, qué quedó pendiente, capturas antes/después si hubo cambios visuales) y **esperar aprobación del dueño** antes de empezar la siguiente.
- **Fase 0 obligatoria antes de F1 (solo lectura, sin cambios)**: leer los archivos de §0 y los stores `src/store/locationStore.ts`, `individualStore.ts`, `taxonStore.ts`, `src/domain/location.ts`, `src/domain/individual.ts`, `src/router.tsx`, y los tests de `src/features/locations/__tests__/`. Entregar un informe corto: qué partes del spec no coinciden con el código real y cómo se propone resolverlas. No asumir nombres de funciones o campos que no se hayan visto en el código.
- **Si el código contradice el spec**, gana el código existente salvo que el spec diga explícitamente que se cambia; anotar la diferencia en el reporte.
- **No inventar alcance**: nada que no esté en la fase activa (ni objetos de catálogo extra, ni animaciones extra, ni librerías nuevas fuera de las permitidas: `@resvg/resvg-js` y `tsx` en dev, `zundo` en runtime desde E3).
- **Corte mínimo viable** si hay que priorizar: F1 → F2 (incluida Legibilidad) → F3 → E1 → E2 → E3. Con eso la app ya se ve mejor, se lee bien y el usuario puede armar salas con macetas. F4–F6 y E4–E5 son mejoras incrementales.

### 9.2 Decisiones que debe tomar el dueño (completar antes de la fase indicada)

| # | Decisión | Antes de | Valor propuesto si no se decide |
|---|---|---|---|
| D1 | Qué son las líneas punteadas azules de la parcela (V5) | F2 | El agente lo averigua en Fase 0 y lo informa |
| D2 | Ajustes de `shade()` y escala de alturas por arquetipo | F3 / F4 | Los de §3.1 y F4; se ajustan mirando la hoja de contactos |
| D3 | Lista de plantillas por `LocationType` y sus medidas | E1 | Invernadero 6×20 m con 3 mesadas; Cámara 2,4×1,2 m con 2 racks de 3 niveles; Parcela 10×20 m con surcos a 70 cm; Laboratorio 3×4 m con mesada y 4 bandejas; Sala 4×5 m con grilla de macetas; Vacía |
| D4 | Tamaño de la baldosa de referencia `CELL_CM` | F2 | 50 cm |
| D5 | Catálogo inicial de E2/E3 (qué objetos, qué tamaños) | E2 | Maceta 1 L / 5 L / 20 L, bandeja 72 alvéolos, mesada 120×60, estantería 3 niveles, tanque, panel LED, puerta, ventana, cartel |
| D6 | Si la vista en planta es la predeterminada en móvil | E3 | Sí |

## 10. Fuera de alcance / futuro

- **Modo 3D** (React Three Fiber): solo si se necesita rotar cámara, luz dinámica o miles de objetos. Cargarlo con `React.lazy` únicamente en esa vista, reutilizando `PlantVisualSpec` y registrando un `PlantRenderer` 3D. Costo estimado +150–300 KB gz (medir).
- **PixiJS**: no recomendado; pierde eventos DOM, accesibilidad y tests jsdom sin un problema de rendimiento que lo justifique.
