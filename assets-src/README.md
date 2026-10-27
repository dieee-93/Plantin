# Guía de Edición y Creación de Sprites 3D en Blender

Esta guía explica paso a paso cómo personalizar los modelos 3D de las plantas o crear cultivos nuevos partiendo del pack de modelos, sin necesidad de conocimientos avanzados de Blender y sin tener que modificar el código del motor isométrico.

---

## 1. Estructura del Pipeline

```
assets-src/
├── README.md               # Esta guía
├── crops.json              # Configuración de cultivos, escalas, etapas y procedencia
├── vendor/                 # Modelos originales sin modificar (no versionado)
│   └── quaternius-crops/
├── crops/                  # Modelos .blend editados por ti (versionados)
│   └── TOM.blend
└── out/                    # Renders PNG intermedios de Blender (no versionado)
```

El pipeline garantiza que:
1. La cámara ortográfica (dimétrica 2:1 a 30° de elevación, rotación `X=60°, Y=0°, Z=45°`) coincide exactamente con la cuadrícula de Plantin.
2. La base de la planta queda anclada a ras del sustrato (`y = 197` en 160×200 px), apoyando con precisión matemática sobre cualquier contenedor (macetas, mesadas, bancales, surcos).
3. Cada etapa fenológica se comprime a WebP de alta densidad optimizado (≤ 20 KB por sprite).

---

## 2. Paso a Paso: Editar un Cultivo Existente (ej. Tomate)

### Paso 1: Extraer el modelo a la carpeta editable

Ejecuta el script extractor en tu terminal:

```bash
# En Windows (usando blender-launcher instalado desde Microsoft Store o en el PATH):
npm run assets:render -- --crop=TOM
```

O directamente mediante el extractor automatizado:

```bash
"%LOCALAPPDATA%\Microsoft\WindowsApps\blender-launcher.exe" -b -P scripts/blender/extract_crop.py -- --crop TOM
```

Esto creará automáticamente `assets-src/crops/TOM.blend` con 5 colecciones organizadas:
- `stage1`: Germinación
- `stage2`: Desarrollo foliar (hojas verdaderas)
- `stage3`: Formación de estructura / canopia
- `stage4`: Floración
- `stage5`: Fructificación / maduración

### Paso 2: Abrir y editar en Blender

Abre el archivo `assets-src/crops/TOM.blend` en Blender:

1. **Seleccionar la colección a editar**: En el panel *Outliner* (arriba a la derecha), puedes ocultar o mostrar las colecciones `stage1` a `stage5` para trabajar cómodamente en una sola etapa.
2. **Qué SÍ puedes modificar libremente**:
   - **Materiales y Colores**: Selecciona cualquier parte de la planta, ve a la pestaña *Material Properties* (ícono de esfera roja/tablero) y cambia el *Base Color* (por ejemplo, hacer los tomates más rojizos o cambiar el tono del verde).
   - **Escala de partes específicas**: En modo edición (`Tab`), puedes agrandar o achicar frutos, hojas o flores (`S` para escalar).
   - **Agregar o remover partes**: Puedes duplicar hojas (`Shift + D`) o borrar frutos no deseados (`X` -> Delete).
   - **Combinar piezas**: Puedes pegar hojas o frutos de otros modelos `.blend`.
3. **Qué NO debes tocar**:
   - **El origen en la base**: La raíz o tallo basal de la planta debe permanecer cerca de `Z = 0` y centrada en `X = 0, Y = 0`. El script centra automáticamente la base, pero mantener la orientación vertical evita rotaciones inesperadas.
   - **Los nombres de las colecciones**: Deben mantenerse como `stage1`, `stage2`, `stage3`, `stage4`, `stage5`.

Guarda el archivo en Blender (`Ctrl + S`).

### Paso 3: Activar el archivo editado en `crops.json`

Abre `assets-src/crops.json` y en la entrada de tu cultivo agrega `"editedFile"` y cambia `"modified": true`:

```json
  "TOM": {
    "label": "Tomate",
    "source": { ... },
    "editedFile": "crops/TOM.blend",
    "modified": true,
    "stages": { ... },
    "targetHeightPx": 100
  }
```

### Paso 4: Regenerar los sprites y verificar

Ejecuta el comando para regenerar ese cultivo:

```bash
npm run assets -- --crop=TOM
```

El pipeline detectará automáticamente `editedFile`, renderizará las 5 etapas, validará el anclaje subpixel, optimizará los WebP y actualizará el manifiesto.

Para ver el resultado visual comparado:
```bash
npm run sprites:sheet -- --crops=TOM
```
Abre la imagen resultante en `scripts/out/sprite-sheet.png` para inspeccionar el sprite renderizado junto al procedural.

---

## 3. Crear un Cultivo Nuevo Partiendo de Uno Existente

Si quieres agregar un cultivo nuevo (por ejemplo, Berenjena `EGGPLANT` partiendo del tomate):

1. **Extraer o duplicar la base**:
   ```bash
   "%LOCALAPPDATA%\Microsoft\WindowsApps\blender-launcher.exe" -b -P scripts/blender/extract_crop.py -- --crop TOM --out assets-src/crops
   ```
   Renombra `assets-src/crops/TOM.blend` a `assets-src/crops/EGGPLANT.blend`.
2. **Personalizar en Blender**:
   - Abre `EGGPLANT.blend`.
   - Modifica el material de los frutos para asignar el púrpura característico (#581c87).
   - Modifica las flores a tono lila/violeta.
   - Escala los frutos en el eje Z para darles la forma alargada u ovalada.
3. **Registrar en `assets-src/crops.json`**:
   Agrega la nueva entrada con su `cropCode`:
   ```json
   "EGGPLANT": {
     "label": "Berenjena",
     "source": {
       "pack": "Quaternius LowPoly Crops Pack (Modificado)",
       "url": "https://opengameart.org/content/lowpoly-crops-pack",
       "license": "CC0-1.0",
       "models": ["Tomato_1", "Tomato_2", "Tomato_3", "Tomato_4", "Tomato_5"]
     },
     "editedFile": "crops/EGGPLANT.blend",
     "stages": {
       "germination": "Tomato_1",
       "leaf": "Tomato_2",
       "structure": "Tomato_3",
       "flowering": "Tomato_4",
       "fruiting": "Tomato_5"
     },
     "excludeObjects": ["Ground", "Soil"],
     "targetHeightPx": 95,
     "modified": true,
     "notes": "Variante creada a partir del modelo de tomate con frutos púrpuras y flores lilas"
   }
   ```
4. **Regenerar**:
   ```bash
   npm run assets -- --crop=EGGPLANT
   ```

---

## 4. Comandos de Referencia

| Comando | Descripción |
|---|---|
| `npm run assets` | Renderiza todos los cultivos de `crops.json`, convierte a WebP y actualiza el manifiesto |
| `npm run assets -- --crop=<CODE>` | Renderiza y procesa únicamente el cultivo indicado (ej. `TOM`, `MAI`) |
| `npm run assets:render` | Ejecuta únicamente el renderizado en Blender (genera PNGs en `assets-src/out/`) |
| `npm run assets:build` | Convierte PNGs a WebP con validación de anclaje y genera `manifest.generated.ts` y `ATTRIBUTIONS.md` |
| `npm run sprites:sheet` | Genera la hoja de contactos visual en `scripts/out/sprite-sheet.png` |
| `npm run sprites:sheet -- --crops=TOM,MAI` | Hoja de contactos filtrada por cultivos específicos |
| `npm run sprites:sheet -- --raster-only` | Hoja de contactos mostrando exclusivamente la columna Raster |
