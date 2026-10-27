# 🍅 Pipeline del Tomate (Plantin v2)

Este directorio agrupa todos los scripts procedurales, texturas y utilidades de renderizado utilizados para generar y perfeccionar el modelo de cultivo de Tomate (`TOM.blend`) para Plantin.

---

## 📁 Estructura del Directorio

```text
scripts/blender/tomato/
├── make_plant.py         # Generador de la mata completa (Etapa 5) y guardado en TOM.blend
├── make_fruit.py         # Generador del fruto maestro de tomate beefsteak lobulado
├── make_leaf.py          # Generador de la hoja compuesta estilizada de 3-5 foliolos
├── make_leaflet.py       # Generador del foliolo botánico individual con lóbulos
├── make_textures.py      # Generador de mapas de color (nervaduras oscuras) y relieve (bump)
├── ink_preview.py        # Post-procesador de entintado cartoon (línea negra de contorno)
├── textures/             # Texturas generadas utilizadas por los materiales
│   ├── tomato_leaflet_color.png
│   └── tomato_leaflet_bump.png
└── renders/              # Vistas previas y renders de referencia
    ├── cartoon_tomato_stage5.png
    ├── master_tomato_preview.png
    ├── master_leaf_preview.png
    └── master_leaflet_preview.png
```

---

## 🚀 Cómo Ejecutar los Scripts

Todos los scripts están diseñados para ejecutarse sin interfaz gráfica mediante Blender Launcher o Python estándar:

### 1. Regenerar Texturas
Genera los mapas botánicos con nervaduras verde oscuro a 45°:
```powershell
python scripts/blender/tomato/make_textures.py
```

### 2. Generar y Renderizar la Planta Completa
Construye la mata, la guarda en `assets-src/crops/TOM.blend` (colección `stage5`, objeto `Tomato_4`) y genera el render raw:
```powershell
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/tomato/make_plant.py' -Wait
```

### 3. Aplicar Entintado Cartoon
Aplica el contorno exterior negro y trazos interiores protegiendo los brillos especulares de los frutos:
```powershell
python scripts/blender/tomato/ink_preview.py scripts/out/cartoon_tomato_stage5_raw.png scripts/blender/tomato/renders/cartoon_tomato_stage5.png
```

### 4. Actualizar Sprites del Juego (App)
Para compilar los sprites WebP (160×200) que utiliza el motor isométrico en `http://localhost:5173`:
```powershell
# 1. Renderiza las 5 etapas desde TOM.blend a assets-src/out/TOM/
Start-Process 'C:\Users\Diego\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe' -ArgumentList '-b', '-P', 'scripts/blender/render_crop.py', '--', '--crop', 'TOM' -Wait

# 2. Convierte PNG a WebP y actualiza manifest.generated.ts
npm run assets:build
```

---

## 🎨 Parámetros Clave para Modificaciones

En `make_plant.py`:
- **`foliage_leaves`**: Lista de tuplas `(posición, dirección, roll, escala, bend_side)`. Controla la posición, ángulo y curvatura de cada hoja compuesta.
- **`total_len` en `add_cascading_compound_leaf()`**: Largo del pecíolo/raquis.
- **`truss_1_fruits`, `truss_2_fruits`, `truss_3_fruits`**: Frutos en racimos péndulos con su radio, color (`MAT_RED`, `MAT_ORANGE`, `MAT_BABY_GREEN`) y rotación.
- **`LEAFLET_PROFILE_PLANT`**: Curva de ancho a lo largo del foliolo (lobulado carnoso estilo Nintendo).
