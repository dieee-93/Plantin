import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math
import os

def generate_cannabis_leaf_textures(out_dir="scripts/out", size=1024):
    """
    Genera mapas de textura botánicos para el folíolo de Cannabis sativa / indica:
    - Base de verde bosque vivo y rico (#1C4820 a #245826).
    - Venación craspedódroma característica: nervadura central prominente y 12-16 pares
      de nervios secundarios a 45-50° que apuntan exactamente al ápice de cada diente aserrado.
    - Mapa de relieve (Bump) ultra-limpio con canal vascular central y costillas secundarias.
    """
    os.makedirs(out_dir, exist_ok=True)
    this_dir = os.path.dirname(os.path.abspath(__file__))
    textures_dir = os.path.join(this_dir, "textures")
    os.makedirs(textures_dir, exist_ok=True)

    w = h = size
    cen_x = w // 2

    # 1. Base Color: Verde profundo y vibrante de cannabis saludable
    base_r, base_g, base_b = 26, 68, 28    # Centro verde bosque rico
    edge_r, edge_g, edge_b = 18, 48, 20    # Ligeramente más oscuro hacia bordes

    x_norm = np.linspace(-1.0, 1.0, w)
    dist_x = np.abs(x_norm)[None, :]
    dist_x = np.broadcast_to(dist_x, (h, w))

    r_map = (base_r * (1.0 - dist_x * 0.25) + edge_r * (dist_x * 0.25)).astype(np.uint8)
    g_map = (base_g * (1.0 - dist_x * 0.22) + edge_g * (dist_x * 0.22)).astype(np.uint8)
    b_map = (base_b * (1.0 - dist_x * 0.28) + edge_b * (dist_x * 0.28)).astype(np.uint8)

    img_color = Image.fromarray(np.stack([r_map, g_map, b_map], axis=-1), mode='RGB')
    draw_c = ImageDraw.Draw(img_color)

    # 2. Bump Map: 128 = neutro
    img_bump = Image.new('L', (w, h), 128)
    draw_b = ImageDraw.Draw(img_bump)

    # Colores botánicos para venación
    col_vein_halo = (34, 88, 38)     # Halo verde claro
    col_vein_core = (52, 120, 48)    # Nervio vivo
    col_vein_mid = (65, 142, 58)     # Nervio central más claro

    # Nervio central longitudinal (desde v=0.0 hasta v=1.0)
    for y_idx in range(h):
        v = 1.0 - (y_idx / float(h))
        # Grosor disminuye hacia el ápice
        thick = max(2, int(14 * (1.0 - v * 0.75)))
        # Dibujar en bump (resalte positivo)
        for offset in range(-thick // 2, thick // 2 + 1):
            nx = cen_x + offset
            if 0 <= nx < w:
                weight = 1.0 - abs(offset) / (thick * 0.6)
                bump_val = int(128 + 26 * weight)
                img_bump.putpixel((nx, y_idx), max(img_bump.getpixel((nx, y_idx)), bump_val))

    # Trazar nervio central en color
    draw_c.line([(cen_x, h), (cen_x, 0)], fill=col_vein_halo, width=12)
    draw_c.line([(cen_x, h), (cen_x, 0)], fill=col_vein_mid, width=6)

    # Pares de nervios laterales hacia los dientes de la sierra (craspedódromo)
    # v_start va de 0.08 a 0.92
    num_pairs = 14
    for i in range(num_pairs):
        v_start = 0.08 + (i / float(num_pairs)) * 0.82
        # Curvatura hacia adelante típica
        v_end = min(0.99, v_start + 0.06 + (1.0 - v_start) * 0.04)
        thick = max(1, int(7 * (1.0 - v_start * 0.65)))

        for side in (-1, 1):
            pts = []
            steps = 25
            for s in range(steps + 1):
                t = s / float(steps)
                u = (t ** 0.9)
                x = cen_x + int(side * u * (w * 0.44))
                v_curr = v_start + (v_end - v_start) * (t ** 0.85) + 0.012 * math.sin(t * math.pi)
                y = h - int(v_curr * h)
                pts.append((x, y))

            for j in range(len(pts) - 1):
                p1, p2 = pts[j], pts[j + 1]
                t_sub = j / float(len(pts))
                cur_w = max(1, int(thick * (1.0 - t_sub * 0.6)))

                # Bump: realce suave del nervio secundario
                draw_b.line([p1, p2], fill=138, width=cur_w + 2)
                draw_b.line([p1, p2], fill=144, width=cur_w)

                # Color
                draw_c.line([p1, p2], fill=col_vein_halo, width=cur_w + 2)
                draw_c.line([p1, p2], fill=col_vein_core, width=max(1, cur_w - 1))

    # Suavizado leve para realismo orgánico
    img_bump = img_bump.filter(ImageFilter.GaussianBlur(1.2))
    img_color = img_color.filter(ImageFilter.GaussianBlur(0.6))

    # Guardar en textures/ y scripts/out/
    color_paths = [
        os.path.join(textures_dir, "cannabis_leaflet_color.png"),
        os.path.join(out_dir, "cannabis_leaflet_color.png")
    ]
    bump_paths = [
        os.path.join(textures_dir, "cannabis_leaflet_bump.png"),
        os.path.join(out_dir, "cannabis_leaflet_bump.png")
    ]

    for p in color_paths:
        img_color.save(p, "PNG")
    for p in bump_paths:
        img_bump.save(p, "PNG")

    print(f"[OK] Texturas de cannabis generadas con exito:")
    print(f"   - Color: {color_paths[0]}")
    print(f"   - Bump:  {bump_paths[0]}")

if __name__ == "__main__":
    generate_cannabis_leaf_textures()
