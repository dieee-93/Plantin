import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math
import os

def generate_tomato_leaf_textures(out_dir="scripts/out", size=1024):
    """
    Genera mapas de textura botánicos con el auténtico verde oscuro profundo de la tomatera:
    - Base de verde bosque profundo y rico (#1A4B18 a #143B13), característico del follaje maduro de tomate.
    - Nervaduras verde savia natural (#3B822A a #489934) perfectamente integradas sin contrastes estridentes.
    - Mapa de relieve (Bump) ultra-limpio con suaves hendiduras vasculares.
    """
    os.makedirs(out_dir, exist_ok=True)
    this_dir = os.path.dirname(os.path.abspath(__file__))
    textures_dir = os.path.join(this_dir, "textures")
    os.makedirs(textures_dir, exist_ok=True)

    w = h = size
    cen_x = w // 2

    # 1. Base Color: Verde oscuro botánico profundo propio del tomate
    base_r, base_g, base_b = 20, 58, 18    # Verde bosque profundo en el centro
    edge_r, edge_g, edge_b = 14, 42, 12    # Más oscuro hacia los bordes

    x_norm = np.linspace(-1.0, 1.0, w)
    dist_x = np.abs(x_norm)[None, :]
    dist_x = np.broadcast_to(dist_x, (h, w))

    r_map = (base_r * (1.0 - dist_x * 0.28) + edge_r * (dist_x * 0.28)).astype(np.uint8)
    g_map = (base_g * (1.0 - dist_x * 0.25) + edge_g * (dist_x * 0.25)).astype(np.uint8)
    b_map = (base_b * (1.0 - dist_x * 0.30) + edge_r * (dist_x * 0.30)).astype(np.uint8)

    img_color = Image.fromarray(np.stack([r_map, g_map, b_map], axis=-1), mode='RGB')
    draw_c = ImageDraw.Draw(img_color)

    # 2. Bump Map: 128 = plano neutro
    img_bump = Image.new('L', (w, h), 128)
    draw_b = ImageDraw.Draw(img_bump)

    # Colores sobrios y naturales para las nervaduras (verde savia natural sobre verde bosque oscuro)
    col_vein_halo = (28, 76, 24)    # Halo verde suave
    col_vein_core = (42, 102, 34)   # Nervio vivo natural
    col_vein_mid = (54, 122, 42)    # Nervio central

    vein_configs = [
        # 1. Orejuela basal
        (0.08, 0.16, 8, [(0.45, 0.11, 0.55)]),
        # 2. Lóbulo medio inferior
        (0.20, 0.36, 10, [(0.40, 0.28, 0.60), (0.70, 0.42, 0.45)]),
        # 3. Lóbulo medio principal
        (0.38, 0.56, 12, [(0.35, 0.48, 0.65), (0.65, 0.62, 0.50)]),
        # 4. Hombro sub-apical
        (0.58, 0.74, 9, [(0.45, 0.68, 0.55), (0.70, 0.80, 0.40)]),
        # 5. Pre-apical
        (0.74, 0.88, 7, [(0.50, 0.84, 0.45)]),
    ]

    for v_orig, v_dest, thick, branches in vein_configs:
        for side in (-1, 1):
            pts = []
            steps = 40
            for s in range(steps + 1):
                t = s / float(steps)
                u_norm = t ** 0.88
                x = cen_x + int(side * u_norm * (w * 0.46))
                v_curr = v_orig + (v_dest - v_orig) * (t ** 0.90) + 0.022 * math.sin(t * math.pi)
                y = h - int(v_curr * h)
                pts.append((x, y))

            for i in range(len(pts) - 1):
                frac = i / float(len(pts))
                cur_thick = max(1, int(thick * (1.0 - frac * 0.70)))
                p1 = pts[i]
                p2 = pts[i + 1]

                draw_b.line([p1, p2], fill=123, width=cur_thick + 2)
                draw_b.line([p1, p2], fill=118, width=cur_thick)

                draw_c.line([p1, p2], fill=col_vein_halo, width=cur_thick + 3)
                draw_c.line([p1, p2], fill=col_vein_core, width=max(1, cur_thick - 1))

            for t_split, v_sub_dest, len_frac in branches:
                idx_split = int(t_split * steps)
                x_split, y_split = pts[idx_split]
                v_split = v_orig + (v_dest - v_orig) * (t_split ** 0.90) + 0.022 * math.sin(t_split * math.pi)

                b_pts = [(x_split, y_split)]
                b_steps = 20
                for bs in range(1, b_steps + 1):
                    bt = bs / float(b_steps)
                    u_b = (t_split + (1.0 - t_split) * bt * len_frac) ** 0.88
                    x_b = cen_x + int(side * u_b * (w * 0.46))
                    v_b = v_split + (v_sub_dest - v_split) * bt + 0.010 * math.sin(bt * math.pi)
                    y_b = h - int(v_b * h)
                    b_pts.append((x_b, y_b))

                for bi in range(len(b_pts) - 1):
                    p1 = b_pts[bi]
                    p2 = b_pts[bi + 1]
                    draw_b.line([p1, p2], fill=124, width=2)
                    draw_c.line([p1, p2], fill=col_vein_halo, width=3)
                    draw_c.line([p1, p2], fill=col_vein_core, width=1)

    # 3. Nervadura Central Principal (Midrib)
    spine_pts = []
    for s in range(60 + 1):
        v = s / 60.0
        x = cen_x
        y = h - int(v * h)
        spine_pts.append((x, y))

    for s in range(len(spine_pts) - 1):
        v = s / float(len(spine_pts))
        thick_now = int(15 * (1.0 - v * 0.72))
        p1 = spine_pts[s]
        p2 = spine_pts[s + 1]

        draw_b.line([p1, p2], fill=114, width=thick_now + 2)
        draw_b.line([p1, p2], fill=121, width=thick_now + 4)

        draw_c.line([p1, p2], fill=col_vein_halo, width=thick_now + 4)
        draw_c.line([p1, p2], fill=col_vein_mid, width=max(2, thick_now - 1))

    img_bump_smooth = img_bump.filter(ImageFilter.GaussianBlur(1.8))
    img_color_smooth = img_color.filter(ImageFilter.GaussianBlur(1.2))

    paths_to_save = [
        (os.path.join(out_dir, "tomato_leaflet_color.png"), os.path.join(out_dir, "tomato_leaflet_bump.png")),
        (os.path.join(textures_dir, "tomato_leaflet_color.png"), os.path.join(textures_dir, "tomato_leaflet_bump.png")),
    ]

    for c_path, b_path in paths_to_save:
        img_color_smooth.save(c_path, 'PNG')
        img_bump_smooth.save(b_path, 'PNG')

    print(f"Texturas botánicas verde oscuro generadas con éxito:")
    print(f" - {paths_to_save[0][0]}")
    print(f" - {paths_to_save[1][0]}")
    return paths_to_save[0][0], paths_to_save[0][1]

if __name__ == "__main__":
    generate_tomato_leaf_textures()
