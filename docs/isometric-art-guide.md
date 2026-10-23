# Guía de Arte y Arquitectura del Motor Isométrico 2.5D (Plantin)

Esta guía documenta los contratos, convenciones de diseño, escala y procedimientos para extender el motor isométrico visual y el editor de espacios de Plantin.

---

## 1. Proyección Geométrica y Sistema de Unidades

- **Proyección**: Isométrica / dimétrica 2:1 (`TILE_W = 104 px`, `TILE_H = 52 px`).
- **Unidad del Mundo**: Centímetros reales (`cm`), independiente de la resolución en pantalla.
  - Baldosa estándar de referencia: `CELL_CM = 50 cm`.
  - Encastre magnético configurable: `snapCm` (10 cm por defecto; `Shift` desactiva encastre).
- **Funciones clave (`geometry/iso.ts`)**:
  - `projectWorld({ x, y, z })`: Convierte coordenadas tridimensionales en cm a puntos de pantalla SVG `{ x: number, y: number }`.
  - `screenToWorld(svgX, svgY)`: Transforma coordenadas del puntero en pantalla al plano base $XY$ de la sala en cm.

---

## 2. Contratos Botánicos Visuales

### 2.1 `PlantVisualSpec` (`visual/plantSpec.ts`)

Función pura `buildPlantVisualSpec(individual, taxon, locationType)`: transforma el modelo de dominio en una especificación visual inmutable:

- **Arquetipo**: `BotanicalArchetypeId` ('solanaceae_tall', 'cereal_tall', 'sunflower_tall', 'rosette_leafy', 'root_bulb', 'herb_bushy', etc.).
- **Fase Fenológica (BBCH)**: `germination` (00–09), `leaf` (10–29), `structure` (30–59), `flowering` (60–69), `fruiting` (70–89).
- **Progreso Continuo**: `phaseProgress` ($0.0 \dots 1.0$), permite crecimiento continuo sutil dentro de cada etapa.
- **Variación Natural Determinística**: Semilla PRNG derivada del ID del individuo (`mulberry32`), garantizando variación orgánica en altura ($\pm 10\%$), inclinación ($\pm 4^\circ$) y espejo horizontal sin re-renders aleatorios.
- **Paleta y Estado Vital**: Paleta resuelta mediante `shade()` en espacio de color perceptual para estados `alive`, `harvested` y `dead`.

### 2.2 `PlantRenderer` (`renderers/types.ts`)

Interfaz de los componentes que dibujan plantas:
```tsx
export interface PlantRendererProps {
  spec: PlantVisualSpec
}
export type PlantRenderer = React.ComponentType<PlantRendererProps>
```
Cada arquetipo se declara en `renderers/procedural/` y se registra en `renderers/registry.ts`.

---

## 3. Presupuestos y Reglas de Rendimiento

| Métrica | Límite Estricto | Razón |
|---|---|---|
| Gradientes SVG en sala 16×16 | $\le 20$ | Compartidos globalmente en `<SharedDefs>`, evitando explosión en el DOM. |
| Elementos SVG por sprite | $\le 60$ | Rendimiento a 60 FPS con cientos de plantas en pantalla. |
| Nuevas dependencias runtime | $0$ | Cero impacto negativo en bundle size. |
| Líneas en `IsometricRoomInterior.tsx` | $< 600$ | Arquitectura desacoplada en capas (`layers/`) y controladores (`editor/`). |

---

## 4. Animaciones y Atmósfera

1. **Balanceo Ambiental (`.iso-sway`)**:
   - Respetuoso con `prefers-reduced-motion`.
   - Amplitud y frecuencia calibrada por tipo de instalación (campo abierto: más dinámico; cámara de cultivo: sutil y constante).
2. **Iluminación Diurna Dinámica (`AmbientLayer`)**:
   - Ajusta gradientes de luz solar cenital, atardecer o noche según la hora solar real y las condiciones climáticas en vivo provistas por OpenMeteo.
   - Conmutable mediante botón en el HUD.

---

## 5. Catálogo de Objetos y Editor de Espacios (Fases E1–E5)

### 5.1 Cómo agregar un objeto al catálogo

Para añadir un nuevo objeto (ej. nuevo contenedor, sensor o mobiliario):
1. Crear el renderer SVG en `catalog/renderers/MiObjetoRenderer.tsx` utilizando `getBoxCorners(w, d, h)` de `prismHelper.ts`.
2. Exportarlo en `catalog/renderers/index.ts`.
3. Registrar la definición en `OBJECT_CATALOG` (`catalog/index.ts`):
   - `id`: identificador único.
   - `label`: nombre visible.
   - `category`: `'container' | 'furniture' | 'equipment' | 'structure' | 'decor'`.
   - `footprint`: dimensiones `{ w, d, h }` en cm a rotación $0^\circ$.
   - `mount`: `'floor' | 'surface' | 'wall'`.
   - `slots`: (si es contenedor) generador de puestos de siembra con coordenadas $X, Y, Z$ globales.
4. **Regla de oro**: *Agregar un objeto nuevo jamás debe modificar los archivos del motor central (`geometry/`, `layers/`)*.

### 5.2 Orden de Profundidad Topológico

- El motor utiliza cajas 3D AABB y el algoritmo topológico de Kahn (`geometry/depth.ts`):
  - $A$ se dibuja detrás de $B$ si $A.x + A.w \le B.x$ o $A.y + A.d \le B.y$.
  - En apilamientos verticales ($Z$), el objeto inferior precede al superior.
  - Se ejecuta en $O(N^2)$ al cambiar el layout, manteniéndose completamente desacoplado del hover del mouse.

---

## 6. Herramientas de Verificación Visual

- **Hoja de contactos PNG**:
  ```bash
  npx tsx scripts/render-sprite-sheet.tsx
  ```
  Genera la matriz comparativa de arquetipos botánicos $\times$ fases fenológicas BBCH para auditoría visual sin necesidad de abrir el navegador.
