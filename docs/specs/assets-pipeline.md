# Spec: Pipeline de assets ilustrados (Nano Banana → WebP)

> Reemplaza la versión anterior de este spec (Blender + Quaternius). Documento autocontenido para ejecutar por fases con un agente de código (Gemini u otro).
> Complementa `docs/specs/isometric-engine-v2.md` y `docs/isometric-art-guide.md`.
> Idioma: docs, comentarios y reportes en español; identificadores en inglés.

## 0. Contexto y decisión

- El pipeline 3D (Blender) dio resultados pobres a tamaño real: los modelos se ven chicos y poco legibles. Se reemplaza por **imágenes generadas con Nano Banana** (modelo de imagen de Gemini) en estilo **3D estilizado** (volumen 3D con proporciones de cartoon, no hiperrealista), recortadas y normalizadas por scripts. Se generan como imagen, no se modela en 3D.
- El motor ya dibuja plantas como imagen raster dentro del SVG (`renderers/raster/RasterPlant.tsx`, `<image>`), con manifiesto por `cropCode` × fase (`manifest.ts` + `manifest.generated.ts`) y fallback procedural. **No hace falta vectorizar.**
- Alcance: **plantas** (todas las fases) y **objetos del catálogo** de tamaño fijo (macetas, bandejas, estanterías, mesadas, tanque, equipos, decoración). Los objetos que se estiran (surco, línea de goteo, camino, cantero redimensionable) siguen procedurales en este spec (ver §7.4).
- **Generación manual por el dueño**: el modelo de imágenes no tiene cuota gratuita por API, así que el dueño genera en la app de Gemini / AI Studio con los prompts y guías que prepara el agente. El agente **no genera imágenes**: prepara prompts, guías y referencias, y procesa los resultados.
- Los WebP actuales renderizados desde Blender (tomate, zapallo, maíz, cáñamo, etc.) **se mantienen** hasta que su reemplazo ilustrado esté aprobado. Las fuentes `.blend` en `assets-src/crops/` quedan como archivo histórico (no se borran sin aprobación).

## 1. Objetivos y no-objetivos

**Objetivos**
- Estilo único y coherente para todas las plantas y objetos (guía de arte ejecutable + referencias aprobadas).
- Assets listos para el motor: perspectiva compatible con la proyección 2:1, anclaje exacto en maceta/piso, tamaño y peso controlados.
- Las 5 fases de un cultivo se reconocen como la misma planta.
- Flujo repetible: prompt → generación → bandeja de entrada → `npm run assets` → app.
- Registro de procedencia de cada asset.

**No-objetivos**
- No usar servicios pagos ni API con facturación.
- No vectorizar imágenes.
- No cambiar el editor ni la lógica del catálogo, salvo agregar el renderer por imagen (§7).
- No incluir texto dentro de ninguna imagen (los carteles y etiquetas los dibuja el motor).

## 2. Reglas para el agente ejecutor

- **No levantar servidor de desarrollo** (corre en `http://localhost:5173`). Verificar UI en la app real.
- **No crear páginas, rutas ni componentes demo.** Herramientas en `scripts/`.
- **Una fase por vez**; reportar (qué cambió, cómo se verificó, pendientes, capturas) y esperar aprobación.
- **No generar imágenes ni llamar APIs de generación.** Preparar prompts y guías; el dueño genera.
- Dependencias permitidas: `sharp` (dev). Opcional: `rembg` (Python, MIT, local) solo si el dueño lo instala; el pipeline debe funcionar sin él (§6.2).
- `npm run lint`, `npm test`, `npm run build` en verde al cerrar cada fase.
- Si el código contradice el spec, gana el código existente; anotar la diferencia.
- No commit ni push sin pedido del dueño.
- Higiene de repo: agregar `*.blend1` a `.gitignore` y sacarlos del índice (hoy hay `.blend1` en staging).

## 3. Estructura

```
docs/art/
├── style-guide.md                 # guía de arte (la "skill"): §4 completo
├── prompts/
│   ├── _base.md                   # bloque de estilo común a todo prompt
│   ├── plant-adult.md             # plantilla planta adulta
│   ├── plant-stage-edit.md        # plantilla de edición a fases jóvenes
│   └── object.md                  # plantilla de objeto
└── references/                    # imágenes aprobadas que fijan el estilo (versionadas)
    ├── plant-style-01.webp
    └── object-style-01.webp
assets-src/
├── inbox/<assetId>/<variant>.png  # lo que el dueño descarga de Gemini (en .gitignore)
├── guides/<assetId>.png           # guías de perspectiva generadas (en .gitignore)
├── assets.json                    # catálogo de assets a producir y su estado (§5)
└── prompts/<assetId>.md           # prompt final usado por asset (versionado, trazabilidad)
scripts/assets/
├── make-guides.ts                 # genera guías de perspectiva por asset
├── make-prompts.ts                # arma el prompt de cada asset desde las plantillas
├── process.ts                     # inbox → recorte → normalización → WebP
└── build-manifest.ts              # (existente) adaptarlo: plantas + objetos + metadatos
src/features/locations/isometric/
├── renderers/raster/              # plantas (existente)
└── catalog/raster/                # objetos: assets/, manifest.generated.ts, ImageObjectRenderer.tsx
```

Scripts npm:
```json
"assets:guides": "tsx scripts/assets/make-guides.ts",
"assets:prompts": "tsx scripts/assets/make-prompts.ts",
"assets:process": "tsx scripts/assets/process.ts",
"assets:manifest": "tsx scripts/assets/build-manifest.ts",
"assets": "npm run assets:process && npm run assets:manifest"
```
Todos aceptan `--id=<assetId>` para un solo asset.

## 4. Guía de arte (`docs/art/style-guide.md`)

Es la fuente única de estilo. Cualquier agente (Gemini, Claude) o persona que genere assets la sigue. Puede referenciarse desde `GEMINI.md`/`AGENTS.md`. Contenido obligatorio:

### 4.1 Estilo
- **3D estilizado** (render tipo juego casual o íconos 3D tipo "clay"/vinilo): volumen real con proporciones de cartoon. Formas simples, redondeadas y un poco exageradas (hojas gruesas, frutos rechonchos), **pocas piezas grandes**, silueta muy reconocible. **No hiperrealista**.
- **Materiales mate o satinados**, de color liso: sin texturas fotográficas, sin poros, sin pelusa, sin suciedad, sin ruido. Brillo especular suave y puntual solo en frutos y superficies lisas (plástico, metal).
- **Sombreado suave** con degradado de volumen y **oclusión ambiental** sutil en los encuentros (base de hojas, unión fruto-tallo). Sin sombras duras ni contraluces dramáticos.
- **Contorno**: por defecto **sin línea de contorno**; la separación de la figura con el fondo la dan el contraste y un leve oscurecimiento en los bordes. Si en el piloto (B2) las plantas no se leen a tamaño real, probar un contorno fino del color del relleno oscurecido (decisión N3).
- **Sin profundidad de campo ni desenfoque**: todo el asset en foco.
- **Luz desde arriba a la izquierda**, la misma de `visual/palette.ts` (`shade()`): cara superior/izquierda clara, derecha/abajo oscura.
- **Paleta**: tomar los colores base de `visual/palette.ts` y `botanicalArchetypes.ts` (verdes de hoja por arquetipo, terracota, madera, metal). Documentar en la guía una tabla de colores hex por material y tipo de hoja.
- **Prohibido**: texto, letras, números, logos, marcos, escena de fondo, piso, tierra suelta, sombras proyectadas en el piso, viñetas, bordes cortados, personajes.

### 4.2 Perspectiva (lo que hace que encaje en el motor)
- **Vista 3/4 desde arriba, elevación ~30°**, la misma de la proyección dimétrica 2:1 del motor. Las caras superiores de los objetos se ven como rombos de proporción 2:1.
- **Plantas**: crecen hacia arriba desde **un único punto de base (cuello de raíz / corona radicular viva)**; el tallo debe converger verticalmente hacia abajo con terminación orgánica intacta (NUNCA cortada transversalmente al bies como pepino/tubo ni flotando). Sin maceta: la maceta la dibuja el motor.
- **Objetos**: orientados como el motor dibuja la vista `a` (frente hacia abajo-izquierda). La vista `b` se obtiene espejando en horizontal (§7.2); por eso los objetos deben ser **simétricos o funcionar espejados**.
- Siempre se adjunta la **guía de perspectiva** del asset (§6.1) como imagen de referencia en el prompt.

### 4.3 Legibilidad a tamaño real
- Tamaño final en pantalla de una planta: **~80×100 unidades SVG** (ajustable por asset, §5). Asset a **3×**: 240×300 px.
- Regla de aprobación: **si no se reconoce el cultivo achicado a 80×100 px, se rechaza**. `process.ts` genera esa miniatura para revisión.
- Detalles finos (zarcillos, nervaduras, pelos) solo si siguen visibles en la miniatura; si no, omitirlos.

### 4.4 Escala relativa
- Tabla de alturas por arquetipo en estado adulto (unidades SVG): roseta 18–24, raíz/bulbo 22–30, herbácea/solanácea 45–55, enredadera 40–55, cereal 55–65, girasol 60–70, leñosa 55–65. Fases jóvenes: proporcionales (germinación ~20 %, hoja ~40 %, estructura ~70 %, floración ~90 %, fructificación 100 %).
- Objetos: su tamaño sale de la huella en cm del catálogo (`catalog/index.ts`), no se elige a ojo.

### 4.5 Fondo para el recorte
- Fondo **sólido y plano**, sin degradado ni sombra:
  - por defecto **magenta `#FF00FF`**;
  - **cian `#00FFFF`** para assets con rosas/violetas/magentas (remolacha, berenjena, vid, flores rosas).
- El prompt lo pide explícitamente; `assets.json` indica la clave por asset.

### 4.6 Consistencia entre fases (plantas)
- Se genera **primero la planta adulta** (fructificación o la fase más completa).
- Las otras fases se generan **editando la adulta aprobada** con la plantilla `plant-stage-edit.md` ("la misma planta, en fase X: …, mismo estilo, mismo ángulo, mismo fondo"), en orden descendente: floración → estructura → hoja → germinación.
- Descripción botánica de cada fase en la plantilla (qué tiene y qué no: frutos, flores, cantidad de hojas, altura relativa).

### 4.7 Referencias de estilo
- Las imágenes aprobadas en el piloto (B2) se copian a `docs/art/references/` y se adjuntan en **todas** las generaciones siguientes (máximo 2–3 por prompt).
- La guía incluye ejemplos buenos y malos (capturas) con el motivo del rechazo.

## 5. `assets-src/assets.json`

```jsonc
{
  "plant.SQUASH": {
    "kind": "plant",
    "cropCode": "SQUASH",
    "label": "Zapallo",
    "archetype": "vine_climber",
    "targetHeightUnits": 50,          // alto final de la fase adulta en unidades SVG
    "displayWidthUnits": 80,          // ancho máximo del cuadro
    "keyColor": "#FF00FF",
    "structure": "tallo rastrero corto, 3–4 hojas lobuladas grandes, 1 flor amarilla, 1 zapallo apoyado en la base",
    "phases": ["fruiting", "flowering", "structure", "leaf", "germination"],
    "status": { "fruiting": "approved", "flowering": "pending" },   // pending | generated | approved | rejected
    "source": { "tool": "Gemini (Nano Banana)", "license": "Generado por el dueño; uso no comercial", "date": "2026-10-27" }
  },
  "object.pot_5l": {
    "kind": "object",
    "typeId": "pot_5l",               // clave del catálogo existente
    "label": "Maceta 5 L",
    "mirrorForViewB": true,
    "keyColor": "#FF00FF",
    "structure": "maceta troncocónica de plástico terracota, borde engrosado, sustrato oscuro visible arriba",
    "status": "pending",
    "anchor": { "soilY": null }      // lo calcula process.ts para contenedores (§6.3)
  }
}
```

- Validación con tipos TS + chequeo en los scripts; error claro si falta un campo.
- `make-prompts.ts` arma `assets-src/prompts/<assetId>.md` con: bloque `_base.md` + plantilla del tipo + `structure` + fase + tamaño + fondo + lista de imágenes a adjuntar (guía + referencias + adulta aprobada si es edición de fase).

## 6. Procesamiento

### 6.1 Guías de perspectiva (`make-guides.ts`)
Imágenes de referencia generadas **por código** con la misma proyección del motor (`geometry/iso.ts`, `catalog/renderers/prismHelper.ts`), renderizadas con `resvg` (ya usado en la hoja de contactos), sobre el color de fondo del asset:
- **Plantas**: el rombo del borde de la maceta de referencia, un punto marcando la base, y un rectángulo punteado con el alto y ancho objetivo de esa fase.
- **Objetos**: la caja de alambre de la huella `w × d × h` proyectada, con la cara superior marcada.
- Se adjunta al prompt con la instrucción "respetá el ángulo y las proporciones de la guía; no dibujes las líneas guía".

### 6.2 Recorte de fondo (`process.ts`)
1. Leer `assets-src/inbox/<assetId>/<variant>.png`.
2. Quitar fondo por **clave de color** (`keyColor` con tolerancia en espacio Lab), con **despill** (eliminar el tinte del color clave en los bordes) y suavizado de 1 px en el alfa.
3. Si `rembg` está disponible y se pasa `--rembg`, usarlo en lugar de la clave.
4. Advertir si quedan píxeles del color clave dentro del sujeto o si el sujeto toca el borde de la imagen (cortado).
5. **Marca de agua**: si la imagen trae marca de agua visible, no eliminarla: rechazar el asset en el reporte y regenerarlo desde AI Studio.

### 6.3 Normalización
- Recortar al bounding box del alfa.
- **Plantas**: escalar para que el alto = `targetHeightUnits × fase × 3` px (≤ ancho `displayWidthUnits × 3`); pegar en lienzo transparente con la **base (fila más baja con alfa, punto medio de esa fila) en el centro inferior** del lienzo. Lienzo = `displayWidthUnits × 3` × alto máximo de la planta adulta × 3, igual para todas las fases del cultivo (así las fases no saltan).
- **Objetos**: escalar al ancho proyectado de la huella (calculado con `getBoxCorners` del catálogo) y anclar el vértice frontal inferior de la imagen al vértice frontal de la huella proyectada. Guardar en metadatos `anchor: {x, y}` en unidades SVG y `size: {w, h}`.
- **Contenedores** (macetas, bandejas): detectar o pedir al dueño el nivel del sustrato y guardarlo como `anchor.soilY` (la planta se apoya ahí).
- WebP con `sharp` (`quality` 85, `alphaQuality` 100, `effort` 6). Presupuesto: **≤ 30 KB** por asset a 3×; bajar calidad hasta 70 si excede; si sigue, fallar.
- Generar miniatura de control a 1× (`assets-src/out/<assetId>/<variant>.thumb.png`).
- Nombres: plantas `<cropcode>-<phase>.webp` (igual que hoy); objetos `<typeId>.webp`.

### 6.4 Manifiesto (`build-manifest.ts`, adaptar el existente)
- Plantas: mantener la forma actual de `RASTER_SPRITES` y la firma de `getRasterSprite`, agregando metadatos opcionales por entrada: `{ href, width, height, anchorX, anchorY }`. Si faltan, usar los valores actuales (80×100, base en y = −7).
- Objetos: `catalog/raster/manifest.generated.ts` con `RASTER_OBJECTS[typeId] = { href, width, height, anchorX, anchorY, mirrorForViewB, soilY? }`.
- `ATTRIBUTIONS.md` por manifiesto: herramienta, fecha, prompt usado (link a `assets-src/prompts/<id>.md`), estado.
- Solo entran al manifiesto los assets con `status: approved`.

## 7. Cambios en el motor (mínimos)

### 7.1 `RasterPlant`
- Usar `width/height/anchor` del manifiesto si existen. Si la planta está en un contenedor con `soilY` raster, apoyar la base en ese nivel; si no, en y = −7 como hoy.
- Mantener filtro CSS para `dead`/`harvested` salvo que haya sprite dedicado.

### 7.2 `ImageObjectRenderer` (nuevo, `catalog/raster/`)
- Props iguales a los renderers del catálogo (`{ obj, view }`).
- Dibuja `<image>` con el anclaje del manifiesto; en `view: 'b'` aplica `scale(-1, 1)` si `mirrorForViewB`.
- Mantener `data-object-id`, `data-object-type` y `className` que usan los renderers actuales (los tests y la interacción dependen de ellos).
- Registro: en `catalog/index.ts`, si existe `RASTER_OBJECTS[typeId]`, usar `ImageObjectRenderer`; si no, el renderer procedural actual (fallback).
- `PlanRenderer` (vista en planta) no cambia.

### 7.3 Macetas raster y plantas
- Si la maceta del catálogo es raster, la planta usa su `soilY`. Test: la base de la planta coincide con `soilY` (±1 unidad).

### 7.4 Objetos estirables (fuera de alcance, decisión futura)
Surco, línea de goteo, camino y canteros redimensionables siguen procedurales. Opción futura: piezas modulares raster (inicio / tramo repetible / fin) — no implementar ahora.

## 8. Fases

### B0 — Guía de arte, plantillas y herramientas de preparación
- Escribir `docs/art/style-guide.md` (§4 completo, con tabla de paleta extraída del código) y las plantillas de `docs/art/prompts/`.
- `assets.json` con todas las plantas que hoy tienen arquetipo y todos los objetos de tamaño fijo del catálogo (status `pending`). Mostrar la lista en el reporte para que el dueño elija prioridades.
- `make-guides.ts` y `make-prompts.ts`. Generar guías y prompts del piloto: `plant.SQUASH` (5 fases) y `object.pot_5l`.
- Higiene: `*.blend1` al `.gitignore` y fuera del índice.
- Si la hoja de contactos todavía tiene los problemas de la fase A0 anterior (columna raster vacía, fila de variación vacía, etiquetas cortadas), arreglarlos acá.

**Aceptación B0**: guía y plantillas revisadas por el dueño; guías PNG y prompts del piloto listos para usar.

### B1 — Procesamiento y motor
- `process.ts` (§6.2–6.3), adaptación de `build-manifest.ts` (§6.4), cambios de motor (§7).
- Tests: recorte por clave con una imagen sintética (círculo sobre magenta → alfa correcto, sin halo magenta), anclaje de plantas (base en el centro inferior), anclaje de objetos (vértice frontal), `ImageObjectRenderer` con y sin espejo, fallback procedural cuando no hay asset, manifiesto solo con `approved`.

**Aceptación B1**: con una imagen de prueba sintética en `inbox`, `npm run assets` produce WebP y manifiesto correctos; tests, lint y build verdes.

### B2 — Piloto (zapallo + maceta)
- El dueño genera con los prompts de B0 y deja los PNG en `assets-src/inbox/`.
- El agente procesa, regenera la hoja de contactos (columna "ilustrado" junto a Blender y procedural) y reporta miniaturas a 1×.
- Verificación en la app real: sala con zapallos en las 5 fases sobre macetas `pot_5l` raster, en invernadero y parcela; zoom mínimo y máximo.
- Iterar prompts hasta aprobar. Las imágenes aprobadas pasan a `docs/art/references/`. Ajustar la guía con lo aprendido (qué frases del prompt funcionaron y cuáles no).

**Aceptación B2**: el dueño aprueba el estilo; la planta apoya exacto en la maceta; las 5 fases se reconocen como la misma planta; cada WebP ≤ 30 KB.

### B3 — Resto de las plantas
- Por prioridad del dueño. Para cada cultivo: prompt adulta → aprobación → ediciones de fase → proceso → hoja de contactos.
- Verificar escala relativa en una sala mixta real (lechuga baja, tomate medio, maíz y girasol altos).

**Aceptación B3**: cada cultivo aprobado con 5 fases; sala mixta coherente; ningún asset rechazado en el manifiesto.

### B4 — Objetos del catálogo
- Macetas y bandejas primero (afectan el anclaje de plantas), luego mesadas, estanterías, tanque, panel LED, sensores, puerta, ventana, decoración.
- Verificar colisión visual: la imagen no debe sobresalir de la huella más de lo que sobresale el objeto real (p. ej. hojas sí, la mesada no).
- Objetos con texto (carteles): imagen sin texto + texto SVG del motor encima.

**Aceptación B4**: objetos raster en el editor, vistas `a` y `b` correctas, plantas bien apoyadas en estanterías y mesadas, vista en planta sin cambios.

## 9. Riesgos

- **Deriva de estilo** entre sesiones de generación: mitigada con referencias fijas, plantillas y la regla de editar desde la adulta. Si un asset nuevo no combina, se regenera; no se "arregla" con filtros.
- **Perspectiva inconsistente** del modelo de imagen: mitigada con las guías de §6.1 y la revisión en app real; rechazar antes que forzar.
- **Halos del recorte**: mitigados con fondo de clave, despill y tests.
- **3D estilizado vs objetos y escenografía SVG planos** conviviendo (paredes, piso, objetos estirables, procedurales sin reemplazo): es el riesgo de estilo más visible. Mitigación: misma dirección de luz y paleta; al final de B4 evaluar en la app real y, si desentona, sumar degradado de volumen suave a los procedurales (tarea acotada, no rediseño).
- **El 3D estilizado pierde detalle más rápido al achicarse** que el cartoon con contorno: aplicar estricto la regla de miniatura de §4.3.
- **Términos de uso de Gemini y marca de agua**: Plantin es no comercial; aun así registrar procedencia y no remover marcas de agua.

## 10. Decisiones del dueño

| # | Decisión | Antes de | Valor propuesto |
|---|---|---|---|
| N1 | Prioridad de cultivos y objetos | B3 / B4 | Los que más uses en tus salas |
| N2 | Tamaño final de las plantas en pantalla | B2 | 80×100 unidades; subir si en la app se ven chicas |
| N3 | Contorno sí/no y nivel de detalle del 3D estilizado | B2 | Sin contorno; agregar uno fino solo si no se lee a tamaño real |
| N4 | Reemplazar o conservar los sprites de Blender aprobados | B3 | Reemplazar cuando el ilustrado esté aprobado |
| N5 | Usar `rembg` | B1 | No; clave de color |
