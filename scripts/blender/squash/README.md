# Modelado 3D de Zapallo Criollo (*Cucurbita maxima / pepo*)

Este directorio contiene la arquitectura modular para la generación procedural de los modelos 3D y assets del cultivo de **Zapallo Criollo** (*Cucurbita maxima / pepo*), implementando la estética **Toon Botánico Prémium** (inspirada en Zelda: Breath of the Wild / Animal Crossing: New Horizons).

---

## 🌿 Anatomía Botánica Modelada

1. **Hojas en Sombrilla Cordadas-Pentalobuladas**:
   - Lámina foliar acorazonada con 5 lóbulos palmeados y seno peciolar profundo en la base.
   - Pecíolos largos, arqueados y estriados con distribución radial que abrazan el terreno formando un cojín rastrero denso.
   - Texturas procedurales con nervadura palmeada actinódroma de 5 nervios principales y máculas vasculares plateadas (*maculación foliar*).

2. **Zarcillos Espiralados (Tendrils)**:
   - Filamento helicoidal tridimensional tipo resorte que emerge en los nudos para el guiado rastrero.

3. **Flores Campanuladas Amarillas**:
   - Gran corola en embudo/campana amarilla-anaranjada brillante (`Mat_Squash_Flower`) con 5 lóbulos estrellados recurvados.
   - Flor femenina con ovario ínfero globoso verde tierno en la base (zapallito recién cuajado).

4. **Zapallo Criollo Acanalado (Fruit)**:
   - Fruto globoso oblatum achatado en los polos.
   - 8 a 10 gajos o costillas longitudinales profundas con surcos marcados.
   - Depresión peduncular superior donde se inserta el **pedúnculo leñoso pentagonal** con ensanchamiento estrellado de 5 puntas.
   - Piel naranja cálido brillante con dispersión subsuperficial (SSS).

---

## 📁 Estructura Modular de Scripts

- **`make_textures.py`**: Genera los mapas botánicos `squash_leaf_color.png` (nervaduras palmeadas y maculación) y `squash_leaf_bump.png`.
- **`make_leaf.py`**: Modelador de la hoja maestra cordada 3D y renderizador de preview.
- **`make_tendril.py`**: Modelador de los zarcillos helicoidales.
- **`make_flower.py`**: Modelador de la flor campanulada masculina y femenina.
- **`make_fruit.py`**: Modelador del zapallo maduro acanalado con pedúnculo pentagonal.
- **`make_all_stages.py`**: Compilador integral de los 6 Tiers de crecimiento directamente en `assets-src/crops/SQUASH.blend`.
- **`ink_preview.py` / `ink_all.py`**: Filtro de post-procesamiento toon que aplica contornos entintados negros y aristas internas limpias.

---

## 🎨 Los 6 Tiers de Crecimiento

| Etapa | Colección en Blender | Fase BBCH / Vitalidad | Descripción |
| :--- | :--- | :--- | :--- |
| **Tier 1** | `stage1` (`Squash_1`) | Germinación (BBCH 00–09) | Hipocótilo curvo grueso, 2 cotiledones ovales seminales y primera hoja verdadera palmeada. |
| **Tier 2** | `stage2` (`Squash_2`) | Desarrollo Foliar (BBCH 10–19) | Tallo rastrero inicial con 4 hojas sombrilla y primeros zarcillos espiralados. |
| **Tier 3** | `stage3` (`Squash_3`) | Estructura Rastrera (BBCH 20–49) | Guías ramificadas que reptan, 7 hojas grandes, zarcillos y capullo floral erecto. |
| **Tier 4** | `stage4` (`Squash_Flowering`) | Floración (BBCH 50–69) | Gran flor campanulada amarilla abierta + flor femenina con zapallito bebé recién cuajado. |
| **Tier 5** | `stage5` (`Squash_4`) | Fructificación (BBCH 70–89) | Gran zapallo criollo maduro protagonista en el frente + zapallito secundario + flor apical. |
| **Tier 6** | `harvested` (`Squash_Harvested`) | Cosecha / Senescencia (BBCH 90–99) | Hojas marchitas en paleta bimodal ocre/pardo, zarcillos secos, cicatriz de corte del zapallo cosechado. |
