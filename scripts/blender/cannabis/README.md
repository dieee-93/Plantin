# 🌿 Pipeline de Cannabis / Cáñamo (Plantin v2)

Este directorio agrupa los scripts procedurales, texturas botánicas y utilidades de renderizado utilizados para generar y perfeccionar el modelo de cultivo de Cannabis / Cáñamo (`HEMP.blend`) para Plantin.

---

## 📁 Estructura del Directorio

```text
scripts/blender/cannabis/
├── make_plant.py         # Generador de las 5 etapas fenológicas y guardado en HEMP.blend
├── make_bud.py           # Generador del cogollo/cola maestra con cálices, tricomas y pistilos ámbar
├── make_leaf.py          # Generador de la hoja palmeada digitada de 3-7 folíolos con pecíolo arqueado
├── make_leaflet.py       # Generador del folíolo botánico individual lanceolado y aserrado
├── make_textures.py      # Generador de mapas de color y relieve (bump) con venación craspedódroma
├── ink_preview.py        # Post-procesador de entintado cartoon (línea de contorno cel-shaded)
├── textures/             # Texturas generadas utilizadas por los materiales
│   ├── cannabis_leaflet_color.png
│   └── cannabis_leaflet_bump.png
└── renders/              # Vistas previas y renders de referencia
    ├── cannabis_5_stages_progression.png # Tira panorámica comparativa de las 5 etapas lado a lado
    ├── cartoon_cannabis_stage1.png       # Etapa 1: Germinación / plántula
    ├── cartoon_cannabis_stage2.png       # Etapa 2: Vegetativo temprano
    ├── cartoon_cannabis_stage3.png       # Etapa 3: Estructura vegetativa desarrollada
    ├── cartoon_cannabis_stage4.png       # Etapa 4: Floración media con colas emergentes
    ├── cartoon_cannabis_stage5.png       # Etapa 5: Cosecha madura con 19 colas y pistilos ámbar
    ├── master_bud_preview.png            # Cogollo / cola floral maestra
    ├── master_leaf_preview.png           # Hoja palmeada (Fan Leaf) de 7 folíolos
    └── master_leaflet_preview.png        # Folíolo individual aserrado
```

---

## 🚀 Cómo Ejecutar los Scripts

Todos los scripts pueden ejecutarse sin interfaz gráfica mediante Blender Launcher o Python estándar:

### 1. Regenerar Texturas
Genera los mapas botánicos con venación craspedódroma característica:
```powershell
python scripts/blender/cannabis/make_textures.py
```

### 2. Generar Componentes Individuales
```powershell
# Folíolo individual
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/cannabis/make_leaflet.py' -Wait

# Hoja palmeada (Fan Leaf)
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/cannabis/make_leaf.py' -Wait

# Cogollo / Cola floral maestra
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/cannabis/make_bud.py' -Wait
```

### 3. Generar las 5 Etapas y Modelo Completo
Construye las etapas fenológicas completas en `assets-src/crops/HEMP.blend` (colecciones `stage1` a `stage5` con mallas `Hemp_1` a `Hemp_5`):
```powershell
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/cannabis/make_plant.py' -Wait
```

### 4. Aplicar Entintado Cartoon y Generar Tira de Progresión
Procesa los renders raw y genera los entintados individuales más la tira comparativa:
```powershell
python scripts/blender/cannabis/ink_preview.py --all
```

### 5. Actualizar Sprites del Juego (App)
Para renderizar las 5 etapas métricas en 160×200 RGBA y compilar los sprites WebP para el motor isométrico:
```powershell
# 1. Renderiza las 5 etapas desde HEMP.blend a assets-src/out/HEMP/
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/render_crop.py', '--', '--crop', 'HEMP' -Wait

# 2. Convierte PNG a WebP y actualiza manifest.generated.ts
npm run assets:build
```

---

## 🎨 Parámetros Botánicos Clave

- **`right_margin` en `make_leaflet.py`**: Perfil de borde lanceolado con 12-14 dientes aserrados hacia adelante y ápice agudo.
- **`leaflets_spec` en `make_leaf.py`**: Disposición palmeada de 7 folíolos con relación de escalas (1.0, 0.86, 0.65, 0.42) y ángulos en abanico.
- **`add_calyx_bract` y `add_curling_pistils` en `make_bud.py`**: Cálices piriformes agrupados en verticilos con estigmas ámbar curvados en espiral.
- **`cane_pts` y `foliage_leaves` en `make_plant.py`**: Altura de la caña erecta segmentada y pisos de verticilos foliares según la etapa fenológica.
