import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math
import os

def generate_corn_leaf_textures(out_dir="scripts/out", size=1024):
    """
    Genera mapas de textura botanicos para la hoja acintada de Maiz (Zea mays - Poaceae):
    - Base de verde cereal fresco y luminoso (#2D6A28 a #387D32).
    - Nervadura central paralela prominente y blanquecina-lima (#B0D88B / #D4ECB8), 
      caracteristica botanica inconfundible de las gramineas de gran porte.
    - Venacion paralela fina en toda la lamina foliar.
    - Mapa de relieve (Bump) con canal/costilla central elevada y micro-estrias longitudinales.
    """
    os.makedirs(out_dir, exist_ok=True)
    this_dir = os.path.dirname(os.path.abspath(__file__))
    textures_dir = os.path.join(this_dir, "textures")
    os.makedirs(textures_dir, exist_ok=True)

    w = h = size
    cen_x = w // 2

    # 1. Base Color: Verde cereal brillante y vital
    base_r, base_g, base_b = 48, 115, 42    # Verde lamina
    edge_r, edge_g, edge_b = 36, 88, 30     # Bordes exteriores

    x_norm = np.linspace(-1.0, 1.0, w)
    dist_x = np.abs(x_norm)[None, :]
    dist_x = np.broadcast_to(dist_x, (h, w))

    r_map = (base_r * (1.0 - dist_x * 0.25) + edge_r * (dist_x * 0.25)).astype(np.uint8)
    g_map = (base_g * (1.0 - dist_x * 0.22) + edge_g * (dist_x * 0.22)).astype(np.uint8)
    b_map = (base_b * (1.0 - dist_x * 0.28) + edge_b * (dist_x * 0.28)).astype(np.uint8)

    img_color = Image.fromarray(np.stack([r_map, g_map, b_map], axis=-1), mode='RGB')
    draw_c = ImageDraw.Draw(img_color)

    # 2. Bump Map: 128 = plano neutro
    img_bump = Image.new('L', (w, h), 128)
    draw_b = ImageDraw.Draw(img_bump)

    # Trazar nervios secundarios paralelos (monocotiledónea)
    num_parallel_veins = 32
    col_vein_subtle = (56, 128, 48)

    for i in range(-num_parallel_veins // 2, num_parallel_veins // 2 + 1):
        if i == 0: continue
        frac = i / float(num_parallel_veins // 2)
        vx = cen_x + int(frac * (w * 0.46))
        thick = 1 if abs(i) % 2 == 0 else 2
        bump_val = 134 if thick == 1 else 138

        draw_b.line([(vx, 0), (vx, h)], fill=bump_val, width=thick)
        draw_c.line([(vx, 0), (vx, h)], fill=col_vein_subtle, width=thick)

    # Nervadura Central Conspicua (Ancha, elevada y de color crema-lima brillante)
    # En el maiz la quilla central es fuerte en la base y se afina suavemente hacia el ápice
    midrib_col_halo = (95, 175, 75)
    midrib_col_core = (175, 215, 140)
    midrib_col_center = (210, 235, 185)

    for y_idx in range(h):
        v = 1.0 - (y_idx / float(h))
        # Ancho decreciente hacia el ápice (de 24px en base a 8px en punta)
        half_w = max(4, int(14 * (1.0 - v * 0.65)))

        for off in range(-half_w, half_w + 1):
            nx = cen_x + off
            if 0 <= nx < w:
                weight = 1.0 - (abs(off) / float(half_w)) ** 1.5
                bump_v = int(128 + 38 * weight)
                img_bump.putpixel((nx, y_idx), max(img_bump.getpixel((nx, y_idx)), bump_v))

    draw_c.line([(cen_x, h), (cen_x, 0)], fill=midrib_col_halo, width=22)
    draw_c.line([(cen_x, h), (cen_x, 0)], fill=midrib_col_core, width=12)
    draw_c.line([(cen_x, h), (cen_x, 0)], fill=midrib_col_center, width=5)

    # Suavizado leve orgánico
    img_bump = img_bump.filter(ImageFilter.GaussianBlur(1.0))
    img_color = img_color.filter(ImageFilter.GaussianBlur(0.5))

    # Guardar texturas en corn/textures y scripts/out
    color_paths = [
        os.path.join(textures_dir, "corn_leaf_color.png"),
        os.path.join(out_dir, "corn_leaf_color.png")
    ]
    bump_paths = [
        os.path.join(textures_dir, "corn_leaf_bump.png"),
        os.path.join(out_dir, "corn_leaf_bump.png")
    ]

    for p in color_paths:
        img_color.save(p, "PNG")
    for p in bump_paths:
        img_bump.save(p, "PNG")

    print(f"[OK] Texturas de hoja de maiz generadas con exito:")
    print(f"   - Color: {color_paths[0]}")
    print(f"   - Bump:  {bump_paths[0]}")

if __name__ == "__main__":
    generate_corn_leaf_textures()
