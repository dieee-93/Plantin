import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math
import os

def generate_tomato_leaf_textures(out_dir="scripts/out", size=1024):
    """
    Genera mapas de textura cartoon botánicos de alta fidelidad:
    - Nervaduras secundarias dirigidas a los lóbulos principales (estilo Nintendo / Zelda).
    - Celdas carnosas acolchadas (pillowing) entre nervios que capturan luz volumétrica.
    - Mapa de relieve (Bump) hiper-limpio sin ruido ni trazos artificiales.
    """
    os.makedirs(out_dir, exist_ok=True)
    w = h = size
    cen_x = w // 2

    # 1. Base Color: verde tomatera botánico vivo y rico (#247820)
    img_color = Image.new('RGB', (w, h), (34, 112, 28))
    draw_c = ImageDraw.Draw(img_color)

    # 2. Bump Map: 128 = plano
    img_bump = Image.new('L', (w, h), 128)
    draw_b = ImageDraw.Draw(img_bump)

    # Coordenadas botánicas de los nervios secundarios a ~45-50° hacia los lóbulos (Fotos de referencia del usuario):
    # (v_origen_midrib, v_destino_margen, grosor_base)
    vein_targets = [
        # Nervio hacia la oreja basal
        (0.08, 0.22, 11),
        # Nervio hacia el seno / lóbulo bajo
        (0.24, 0.40, 10),
        # Nervio principal hacia el lóbulo medio (más prominente)
        (0.40, 0.60, 13),
        # Nervio hacia el hombro sub-apical ancho
        (0.58, 0.76, 11),
        # Nervio pre-apical
        (0.74, 0.88, 8),
    ]

    # Acolchado carnoso (pillowing) entre pares de nervaduras diagonales:
    for i in range(len(vein_targets) - 1):
        v1_o, v1_d, _ = vein_targets[i]
        v2_o, v2_d, _ = vein_targets[i + 1]

        v_cen = (v1_o + v1_d + v2_o + v2_d) * 0.25
        y_cen = h - int(v_cen * h)

        for side in (-1, 1):
            x_cen = cen_x + int(side * (w * 0.22))

            rx = int(w * 0.15)
            ry = int(h * 0.07)
            bbox = [x_cen - rx, y_cen - ry, x_cen + rx, y_cen + ry]

            draw_b.ellipse(bbox, fill=155)
            draw_c.ellipse(bbox, fill=(44, 134, 34))

    # Suavizar el acolchado base antes de estampar los nervios oscuros
    img_bump = img_bump.filter(ImageFilter.GaussianBlur(8.0))
    img_color = img_color.filter(ImageFilter.GaussianBlur(6.0))
    draw_c = ImageDraw.Draw(img_color)
    draw_b = ImageDraw.Draw(img_bump)

    # Colores oscuros botánicos para las nervaduras (verde oscuro pedido por el usuario)
    col_vein_main = (12, 46, 10)    # Verde oscuro profundo botánico
    col_vein_soft = (22, 70, 18)    # Transición verde oscuro media

    # Dibujar nervaduras secundarias oscuras a 45° arqueadas
    for v_orig, v_dest, thick in vein_targets:
        for side in (-1, 1):
            pts = []
            steps = 32
            for s in range(steps + 1):
                t = s / float(steps)
                u_norm = (t ** 0.82)
                x = cen_x + int(side * u_norm * (w * 0.46))

                # V asciende en diagonal hacia el lóbulo
                v_curr = v_orig + (v_dest - v_orig) * (t ** 0.88) + 0.015 * math.sin(t * math.pi)
                y = h - int(v_curr * h)
                pts.append((x, y))

            # Hendidura sutil en Bump Map (108 = ligeramente rehundido en el haz)
            draw_b.line(pts, fill=112, width=thick + 2, joint="curve")
            draw_b.line(pts, fill=98, width=thick, joint="curve")

            # Color verde oscuro nítido
            draw_c.line(pts, fill=col_vein_soft, width=thick + 2, joint="curve")
            draw_c.line(pts, fill=col_vein_main, width=max(2, thick - 2), joint="curve")

    # Nervadura Central Principal (midrib / costilla oscura)
    spine_pts = []
    for s in range(45 + 1):
        v = s / 45.0
        x = cen_x
        y = h - int(v * h)
        spine_pts.append((x, y))

    for s in range(len(spine_pts) - 1):
        v = s / float(len(spine_pts))
        thick_now = int(18 * (1.0 - v * 0.70))
        p1 = spine_pts[s]
        p2 = spine_pts[s + 1]

        draw_b.line([p1, p2], fill=135, width=thick_now + 4)
        draw_c.line([p1, p2], fill=col_vein_soft, width=thick_now + 2)
        draw_c.line([p1, p2], fill=col_vein_main, width=thick_now)

    # Suavizado final
    img_bump_smooth = img_bump.filter(ImageFilter.GaussianBlur(2.2))
    img_color_smooth = img_color.filter(ImageFilter.GaussianBlur(1.2))

    color_path = os.path.abspath(os.path.join(out_dir, "tomato_leaflet_color.png"))
    bump_path = os.path.abspath(os.path.join(out_dir, "tomato_leaflet_bump.png"))

    img_color_smooth.save(color_path)
    img_bump_smooth.save(bump_path)

    print(f"Mapas botánicos limpios generados:\nColor: {color_path}\nBump: {bump_path}")
    return color_path, bump_path

if __name__ == "__main__":
    generate_tomato_leaf_textures()
