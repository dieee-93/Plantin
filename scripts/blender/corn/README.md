# 🌽 Pipeline de Maíz (Plantin v2)

Este directorio agrupa los scripts procedurales, texturas botánicas y utilidades de renderizado utilizados para generar y perfeccionar el modelo de cultivo de Maíz (`MAI.blend`) para Plantin.

---

## 📁 Estructura del Directorio

```text
scripts/blender/corn/
├── make_plant.py         # Generador de las 5 etapas fenológicas y guardado en MAI.blend
├── make_ear.py           # Generador de la mazorca/choclo con granos dorados, chalas y barbas
├── make_tassel.py        # Generador de la panoja/penacho apical masculino con anteras
├── make_leaf.py          # Generador de la hoja acintada arqueda con nervadura central y ondas
├── make_textures.py      # Generador de mapas de color y relieve (bump) con venación paralela
├── ink_preview.py        # Post-procesador de entintado cartoon (línea cel-shaded y tira comparativa)
├── textures/             # Texturas generadas utilizadas por los materiales
│   ├── corn_leaf_color.png
│   └── corn_leaf_bump.png
└── renders/              # Vistas previas y renders de referencia
    ├── corn_5_stages_progression.png # Tira panorámica comparativa de las 5 etapas lado a lado
    ├── cartoon_corn_stage1.png       # Etapa 1: Germinación / plántula
    ├── cartoon_corn_stage2.png       # Etapa 2: Vegetativo temprano
    ├── cartoon_corn_stage3.png       # Etapa 3: Estructura vegetativa con raíces fúlcreas
    ├── cartoon_corn_stage4.png       # Etapa 4: Floración / antesis con panoja abierta
    ├── cartoon_corn_stage5.png       # Etapa 5: Fructificación / cosecha madura con 2 mazorcas
    ├── master_ear_preview.png        # Mazorca maestra con granos dorados
    ├── master_leaf_preview.png       # Hoja acintada maestra arqueada
    └── master_tassel_preview.png     # Panoja apical maestra
```

---

## 🚀 Cómo Ejecutar los Scripts

### 1. Regenerar Texturas
Genera los mapas botánicos con la nervadura central prominente y estrías paralelas:
```powershell
python scripts/blender/corn/make_textures.py
```

### 2. Generar Componentes Individuales
```powershell
# Hoja acintada
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/corn/make_leaf.py' -Wait

# Mazorca / Choclo
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/corn/make_ear.py' -Wait

# Panoja apical
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/corn/make_tassel.py' -Wait
```

### 3. Generar las 5 Etapas y Modelo Completo
Construye las etapas fenológicas en `assets-src/crops/MAI.blend` (colecciones `stage1` a `stage5` con mallas `Corn_1` a `Corn_5`):
```powershell
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/corn/make_plant.py' -Wait
```

### 4. Aplicar Entintado Cartoon y Generar Tira de Progresión
Procesa los renders raw y genera los entintados individuales más la tira comparativa:
```powershell
python scripts/blender/corn/ink_preview.py --all
```

### 5. Actualizar Sprites del Juego (App)
Para renderizar las 5 etapas métricas en 160×200 RGBA y compilar los sprites WebP para el motor isométrico:
```powershell
# 1. Renderiza las 5 etapas desde MAI.blend a assets-src/out/MAI/
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/render_crop.py', '--', '--crop', 'MAI' -Wait

# 2. Convierte PNG a WebP y actualiza manifest.generated.ts
pnpm run assets:build
```

---

## 🎨 Parámetros Botánicos Clave

- **`append_corn_leaf` en `make_leaf.py`**: Curvatura parabólica en cascada, sección transversal en V con nervadura central prominente y ondulaciones marginales (*wave_factor*).
- **`append_corn_ear` en `make_ear.py`**: Mazorca cilíndrica con hileras de granos dorados facetados, chalas verde pálido entreabiertas y barbas de seda cobrizas.
- **`append_corn_tassel` en `make_tassel.py`**: Inflorescencia plumosa con espiga central y 8 ramas laterales provistas de anteras amarillas.
- **`add_brace_roots` en `make_plant.py`**: Verticilos de raíces adventicias fúlcreas que emergen en arco hacia el suelo desde los nudos basales.
