# Guía de Arte para Assets Ilustrados (Plantin 2.5D)

> Fuente única de verdad estilística, geométrica y cromática para la generación de assets ilustrados (Nano Banana / Gemini Imagen) en Plantin.
> Diseñada para que cualquier generador (humano o modelo de lenguaje) mantenga 100 % de coherencia visual y compatibilidad técnica con el motor dimétrico 2:1.
> Complementa `docs/specs/assets-pipeline.md` y `docs/isometric-art-guide.md`.

---

## 1. Dirección Estética y Estilo Visual

### 1.1 Estilo: 3D Estilizado ("Clay" / Juego Casual)
- **Volumen 3D tangible con proporciones de cartoon / juego casual**: formas limpias, redondeadas y amigables. Hojas gruesas con bordes suaves, frutos carnosos y ligeramente rechonchos, tallos firmes y bien definidos.
- **Pocas piezas grandes y silueta icónica**: evitar micro-detalles visuales que se empasten a baja resolución. Cada elemento debe leerse como un bloque volumétrico claro.
- **No hiperrealista ni fotorrealista**: nada de suciedad aleatoria, poros botánicos minúsculos, vellosidades microscópicas, texturas fotográficas rugosas o marchitez descontrolada.
- **Materiales**: acabado mate o satinado suave ("vinilo" o "arcilla pulida"). Brillo especular suave y puntual únicamente en superficies lisas o húmedas (frutos maduros como tomates/berenjenas, hojas lustrosas, piezas plásticas o metálicas).

### 1.2 Iluminación y Sombreado
- **Fuente de luz direccional cenital-noroeste (arriba a la izquierda)**:
  - Cara superior (top): iluminada y clara.
  - Cara izquierda (left): color base / tono medio natural.
  - Cara derecha e inferior (right / shadow): sombreado suave con tinte ligeramente más saturado y frío.
- **Oclusión ambiental (AO) sutil y limpia**: oscurecimiento suave en las junturas y encuentros (base de ramas con el tallo, unión fruto-pedúnculo, base del objeto).
- **Sin sombras proyectadas en el piso**: el asset no debe proyectar sombra sobre el suelo ni tener una base/pedestal dibujada. Las sombras en el piso las calcula y proyecta el motor SVG dinámicamente.
- **Sin profundidad de campo (Depth of Field)**: todo el asset debe estar 100 % enfocado de borde a borde.

### 1.3 Contornos y Definición de Bordes
- **Por defecto sin línea de contorno (no-outline)**: la separación entre formas la dan los contrastes tonales, la luz direccional y una oclusión sutil en los pliegues.
- **Separación de figura y fondo**: nítida, sin halos difusos ni degradados en el borde externo.

### 1.4 Elementos Prohibidos
- ❌ **Texto, números o letras**: nada de etiquetas escritas, números de lote ni marcas (los rótulos los dibuja el motor).
- ❌ **Macetas o tierra en plantas**: la planta debe flotar limpia con su base en un solo punto (las macetas y el sustrato son objetos independientes del motor).
- ❌ **Tallos seccionados o rebanados en el aire**: NUNCA dibujar el tallo como un corte plano transversal (aspecto de pepino cortado con cuchillo o florero).
- ❌ **Suelo, pasto o escenografía de fondo**: el fondo debe ser completamente liso y uniforme.
- ❌ **Bordes recortados**: el sujeto debe entrar completo en el cuadro, con un margen de aire de ~10–15 % respecto a los bordes.
- ❌ **Personajes, manos o herramientas de jardinería**: solo el vegetal u objeto específico.

---

## 2. Perspectiva Dimétrica y Compatibilidad con el Motor

### 2.1 Ángulo de Cámara
- **Perspectiva 3/4 isométrica / dimétrica 2:1**: elevación de aproximadamente 30° respecto a la horizontal.
- Las caras superiores de cajas, bandejas o bocas de macetas forman rombos con relación de aspecto horizontal:vertical de **2:1**.
- Se debe usar siempre la **guía de perspectiva** (`assets-src/guides/<assetId>.png`) como imagen de referencia en el prompt para asegurar que la cámara coincida exactamente.

### 2.2 Anclaje y Morfología de Plantas
- **Punto de anclaje y cuello de raíz orgánico (Root Crown)**: el tallo o corona de la planta surge de un único punto central inferior que representa el cuello de la raíz (corona basal).
- **Orientación vertical al suelo**: la base del tallo debe orientarse verticalmente hacia abajo para posarse sobre el nivel de sustrato (`soilY`), no oblicua ni en el aire.
- **Enredaderas y rastreras (Zapallo, Melón)**: la corona central debe apoyar verticalmente en el centro inferior, mientras las guías y los frutos se extienden horizontalmente a los lados.
- Orientación: frontal-lateral, sin que ninguna hoja tape totalmente la visual del tallo o los frutos principales.

### 2.2.1 Regla Crítica de Enraizamiento (Lección Aprendida del Piloto B2)
> ⚠️ **Lección aprendida**: Si el prompt indica *"el tallo termina limpiamente en la base"*, los modelos de difusión (Gemini/Nano Banana) tienden a dibujar un tallo podado o cortado con una sección transversal visible (como si flotara en el aire una rama cortada con tijera).
> 
> **Requisito obligatorio para todos los especímenes futuros**:
> 1. **Cuello de raíz vivo (Root Crown)**: el tallo debe terminar de forma orgánica, ligeramente ensanchado o ahusado, como una planta viva lista para entrar al sustrato.
> 2. **Prohibición explícita de corte**: todos los prompts generados por `make-prompts.ts` incluyen la cláusula anti-patrón en inglés: *"CRITICAL: NEVER render a severed, flat, chopped, or sliced cross-section of a cylinder stem (no cut cucumber/pipe look). Must end organically as an intact living root crown grounded vertically into the soil"*.
> 3. **Guías visuales con recordatorio**: las imágenes guía en `assets-src/guides/` marcan el punto inferior con la indicación `▲ CUELLO DE RAÍZ ENRAIZADO (NO SECCIONADO NI CORTADO) ▲`.

### 2.3 Orientación de Objetos del Catálogo
- **Vista A (estándar)**: el frente del objeto apunta hacia abajo-izquierda (vector `+X` dimétrico).
- **Simetría y Vista B**: para la vista `b`, el motor aplica un reflejo horizontal (`scale(-1, 1)`). Por eso los objetos deben ser simétricos o funcionar perfectamente invertidos en espejo (sin texto ni asimetrías incompatibles).

---

## 3. Escala y Legibilidad

### 3.1 Tamaño en Pantalla y Regla de Miniatura
- En el canvas del motor, las plantas miden aproximadamente **80×100 unidades SVG**.
- A resolución retina **3×**, el asset raster final se procesa a **240×300 px** (≤ 30 KB en WebP).
- **Regla de oro de legibilidad**: achicado a una miniatura de **80×100 px**, el cultivo debe ser instantáneamente reconocible por un productor o agrónomo (fruto característico visible, forma de hoja típica, porte del arquetipo). Si a 80 px parece una mancha verde genérica, el asset debe simplificarse y regenerarse.

### 3.2 Tabla de Alturas por Arquetipo (Estado Adulto / Fructificación)
Basada en las unidades SVG relativas del motor:

| Arquetipo | Cultivos de Ejemplo | Altura Adulta (unidades SVG) | Ancho Máx (unidades SVG) | Altura a 3× (px) |
|---|---|---|---|---|
| **rosette_leafy** | Lechuga, Espinaca, Frutilla | 18 – 24 | 70 | 54 – 72 px |
| **root_tuber** | Zanahoria, Remolacha, Cebolla | 24 – 30 | 70 | 72 – 90 px |
| **generic_herb** | Aromáticas, Arabidopsis | 28 – 35 | 70 | 84 – 105 px |
| **vine_climber** | Zapallo, Pepino, Poroto, Vid | 45 – 55 | 80 | 135 – 165 px |
| **solanaceae_tall** | Tomate, Pimiento, Berenjena | 48 – 55 | 80 | 144 – 165 px |
| **cereal_grass** | Maíz, Trigo, Avena | 55 – 65 | 80 | 165 – 195 px |
| **woody_perennial** | Naranjo, Frutales, Café | 55 – 65 | 80 | 165 – 195 px |
| **palmate_cane** | Cannabis / Cáñamo | 55 – 65 | 80 | 165 – 195 px |
| **heliotropo_tall** | Girasol | 65 – 70 | 80 | 195 – 210 px |

### 3.3 Proporciones por Fase de Desarrollo (BBCH)
1. **Germinación (BBCH 00–09)**: ~20 % del alto adulto (plántula emergente, cotiledones visibles).
2. **Desarrollo foliar (BBCH 10–19)**: ~40 % del alto adulto (primeras 3–6 hojas verdaderas, roseta/tallo tierno).
3. **Estructura vegetativa (BBCH 20–49)**: ~70 % del alto adulto (ramificación definida, tallos firmes, botones florales cerrados).
4. **Floración (BBCH 50–69)**: ~90 % del alto adulto (flores abiertas llamativas, frutos incipientes verdes).
5. **Fructificación / Madurez (BBCH 70–89)**: 100 % de escala (frutos maduros de color definitivo, follaje frondoso).

---

## 4. Fondo para Recorte Automático (Chroma Key)

Para permitir un recorte limpio mediante scripts de procesamiento (`process.ts` con espacio de color CIE Lab y algoritmo despill), la generación debe tener un fondo de color plano absoluto:
- **Magenta `#FF00FF` (por defecto)**: usado en el 90 % de los casos (vegetales verdes, amarillos, naranjas, blancos y terrosos).
- **Cian `#00FFFF` (excepción obligatoria)**: para plantas y objetos que contengan tonos violetas, morados, fucsias o magenta (ej. **Remolacha**, **Berenjena**, **Vid**, flores rosadas o púrpuras).

> **Aviso**: el fondo debe ser completamente liso, sin viñeta, sin gradientes, sin piso y sin sombras de contacto.

---

## 5. Paleta Botánica y de Materiales Extraída del Motor

Para garantizar coherencia absoluta entre los elementos procedurales existentes y los nuevos renders ilustrados, los colores deben inspirarse en los valores OKLCH/Hex oficiales de `palette.ts` y `botanicalArchetypes.ts`:

### 5.1 Follajes y Tallos
| Tipo / Arquetipo | Tallo Base | Hoja Oscura (Shadow) | Hoja Media (Base) | Hoja Clara (Highlight) |
|---|---|---|---|---|
| **Solanáceas (Tomate, Pimiento)** | `#2D6A4F` | `#1B4332` | `#40916C` | `#74C69D` |
| **Palmeadas (Cannabis, Lúpulo)** | `#14532D` | `#064E3B` | `#059669` | `#34D399` |
| **Gramíneas / Cereales (Maíz, Trigo)** | `#65A30D` | `#3F6212` | `#65A30D` | `#A3E635` |
| **Cucurbitáceas / Enredaderas (Zapallo)** | `#3F6212` | `#14532D` | `#16A34A` | `#4ADE80` |
| **Rosetas / Hortalizas (Lechuga, Frutilla)**| `#4ADE80` | `#15803D` | `#22C55E` | `#86EFAC` |
| **Aliáceas / Bulbos (Cebolla, Ajo)** | `#15803D` | `#0F766E` | `#14B8A6` | `#5EEAD4` |
| **Leñosas (Frutales, Cítricos)** | `#78350F` | `#064E3B` | `#15803D` | `#4ADE80` |
| **Herbáceas Generales** | `#2D6A4F` | `#1B4332` | `#40916C` | `#74C69D` |

### 5.2 Flores y Frutos
| Cultivo | Flor / Pétalos | Centro Flor | Fruto Inmaduro | Fruto Maduro | Acento / Trazo |
|---|---|---|---|---|---|
| **Zapallo (SQUASH)** | `#FACC15` (campanulada) | `#CA8A04` | `#84CC16` | `#F59E0B` (calabaza) | `#B45309` |
| **Tomate (TOM)** | `#FDE047` | `#CA8A04` | `#84CC16` | `#EF4444` (rojo vivo) | `#991B1B` |
| **Berenjena (EGGPLANT)** | `#C084FC` | `#CA8A04` | `#84CC16` | `#581C87` (morado) | `#3B0764` |
| **Pimiento (PEPPER)** | `#FFFFFF` | `#FDE047` | `#84CC16` | `#EA580C` (escarlata) | `#9A3412` |
| **Maíz (MAI)** | `#FDE68A` | `#B45309` | `#BEF264` | `#FACC15` (choclo oro) | `#A16207` |
| **Girasol (SUN_OIL)** | `#FACC15` | `#451A03` | `#CA8A04` | `#451A03` (disco) | `#FACC15` |
| **Zanahoria (CARROT)** | `#F8FAFC` | `#CBD5E1` | `#FB923C` | `#EA580C` (naranja) | `#9A3412` |
| **Remolacha (BEETROOT)**| `#F8FAFC` | `#CBD5E1` | `#F43F5E` | `#9F1239` (remolacha) | `#881337` |
| **Frutilla (STRAWBERRY)**| `#FFFFFF` | `#EAB308` | `#86EFAC` | `#EF4444` (fresa) | `#991B1B` |
| **Cáñamo (HEMP)** | `#A7F3D0` | `#D97706` | `#10B981` | `#047857` (cola resina)| `#B45309` |
| **Vid (GRAPE)** | `#E9D5FF` | `#CA8A04` | `#84CC16` | `#6D28D9` (uva morada) | `#4C1D95` |
| **Cítrico (CITRUS_ORANGE)**| `#FFFFFF` (azahar) | `#FDE047` | `#84CC16` | `#F97316` (naranja) | `#C2410C` |

### 5.3 Materiales de Objetos de Cultivo
| Material | Color Base | Cara Superior (Top) | Sombra (Right/Shadow) | Acento |
|---|---|---|---|---|
| **Plástico Maceta (Terracota)** | `#EA580C` | `#FB923C` | `#9A3412` | `#7C2D12` |
| **Sustrato Fértil (Tierra húmeda)** | `#451A03` | `#5C2404` | `#290E02` | `#1C0A01` |
| **Plástico Semillero (Negro mate)** | `#1E293B` | `#334155` | `#0F172A` | `#020617` |
| **Acero Galvanizado / Chapa** | `#94A3B8` | `#CBD5E1` | `#64748B` | `#475569` |
| **Madera Carteles / Estacas** | `#D97706` | `#F59E0B` | `#B45309` | `#78350F` |
| **Polietileno Tanque (Azul técnico)**| `#0284C7` | `#38BDF8` | `#0369A1` | `#075985` |

---

## 6. Flujo de Trabajo y Metodología entre Fases

1. **Generar primero la planta adulta (fase fructificación / 5)**:
   - Es la versión más compleja y característica del cultivo.
   - Se ajusta y se itera hasta lograr la aprobación del dueño.
2. **Edición descendente hacia fases jóvenes**:
   - Una vez aprobada la adulta, se sube como imagen de referencia principal a la herramienta de generación.
   - Se usa la plantilla `plant-stage-edit.md` solicitando la misma planta en fase floración (`flowering`), luego estructura (`structure`), hoja (`leaf`), y finalmente germinación (`germination`).
   - Esto asegura que las 5 fases conserven la misma especie botánica, el mismo estilo visual y las proporciones coherentes.
3. **Objetos de tamaño fijo**:
   - Se generan ajustados a su caja de alambre de perspectiva (`make-guides.ts`), cuidando que los contenedores muestren claramente la cara superior con el sustrato para poder calcular `soilY`.
