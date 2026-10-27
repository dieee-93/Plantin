import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math
import os

def generate_squash_leaf_textures(out_dir=None, size=1024):
    """
    Genera mapas de textura botánicos para hojas de Zapallo (Cucurbita maxima / pepo):
    - Color base verde esmeralda profundo botánico (#1A4E22 a #133D1A).
    - Nervadura palmeada actinódroma de 5 nervios principales radiando desde el punto peciolar basal.
    - Maculación plateada/blanquecina típica (manchas plateadas a lo largo de las comisuras de nervios).
    - Mapa de relieve (Bump) con nervios principales y secundarios en relieve pronunciado.
    """
    this_dir = os.path.dirname(os.path.abspath(__file__))
    textures_dir = os.path.join(this_dir, "textures") if out_dir is None else out_dir
    os.makedirs(textures_dir, exist_ok=True)

    w = h = size
    cen_x = w // 2
    petiole_y = int(h * 0.90) # Punto de inserción peciolar en la base de la hoja acorazonada

    # 1. Base Color: Gradiente verde profundo
    base_r, base_g, base_b = 26, 78, 34    # Verde bosque de cucurbitácea
    edge_r, edge_g, edge_b = 18, 54, 24    # Borde más oscuro

    # Mapa de distancia radial desde el punto peciolar
    yy, xx = np.mgrid[0:h, 0:w]
    dist_origin = np.sqrt(((xx - cen_x) / (w * 0.5))**2 + ((yy - petiole_y) / (h * 0.8))**2)
    dist_origin = np.clip(dist_origin, 0.0, 1.0)

    r_map = (base_r * (1.0 - dist_origin * 0.28) + edge_r * (dist_origin * 0.28)).astype(np.uint8)
    g_map = (base_g * (1.0 - dist_origin * 0.25) + edge_g * (dist_origin * 0.25)).astype(np.uint8)
    b_map = (base_b * (1.0 - dist_origin * 0.30) + edge_r * (dist_origin * 0.30)).astype(np.uint8)

    img_color = Image.fromarray(np.stack([r_map, g_map, b_map], axis=-1), mode='RGB')
    draw_c = ImageDraw.Draw(img_color)

    # 2. Bump Map: 128 = plano neutro
    img_bump = Image.new('L', (w, h), 128)
    draw_b = ImageDraw.Draw(img_bump)

    # 3. Capa de maculación plateada (manchas blanquecinas en comisuras de nervios)
    img_maculation = Image.new('L', (w, h), 0)
    draw_m = ImageDraw.Draw(img_maculation)

    # Definición de los 5 nervios principales palmeados (ángulo, longitud, peso)
    # Nervio 0: Central superior
    # Nervios 1, 2: Laterales superiores
    # Nervios 3, 4: Laterales basales hacia las orejuelas
    main_rays = [
        (-math.pi / 2, 0.82, 14),             # Central (hacia arriba)
        (-math.pi / 2 - 0.44, 0.72, 11),      # Superior izquierdo
        (-math.pi / 2 + 0.44, 0.72, 11),      # Superior derecho
        (-math.pi / 2 - 0.95, 0.58, 9),       # Basal izquierdo
        (-math.pi / 2 + 0.95, 0.58, 9),       # Basal derecho
    ]

    # Dibujar nervios principales
    col_vein_halo = (44, 112, 54)
    col_vein_core = (68, 158, 80)
    col_vein_light = (98, 186, 110)

    for ang, ray_len, width_b in main_rays:
        start_pt = (cen_x, petiole_y)
        end_x = cen_x + math.cos(ang) * (w * ray_len)
        end_y = petiole_y + math.sin(ang) * (h * ray_len)
        end_pt = (end_x, end_y)

        # Nervio principal: Halo difuso + núcleo
        draw_c.line([start_pt, end_pt], fill=col_vein_halo, width=int(width_b * 1.8))
        draw_c.line([start_pt, end_pt], fill=col_vein_core, width=int(width_b))
        draw_c.line([start_pt, end_pt], fill=col_vein_light, width=max(1, int(width_b * 0.4)))

        # Bump: Nervio en relieve
        draw_b.line([start_pt, end_pt], fill=210, width=int(width_b * 1.5))
        draw_b.line([start_pt, end_pt], fill=245, width=max(1, int(width_b * 0.6)))

        # Ramificaciones secundarias a lo largo de cada nervio
        num_sub = 7
        for s in range(1, num_sub + 1):
            frac = s / float(num_sub + 1)
            px = cen_x + math.cos(ang) * (w * ray_len) * frac
            py = petiole_y + math.sin(ang) * (h * ray_len) * frac

            for side in (-1, 1):
                sub_ang = ang + side * 0.65
                sub_len = (w * 0.16) * (1.0 - frac * 0.4)
                sub_end = (px + math.cos(sub_ang) * sub_len, py + math.sin(sub_ang) * sub_len)

                draw_c.line([(px, py), sub_end], fill=col_vein_halo, width=5)
                draw_c.line([(px, py), sub_end], fill=col_vein_core, width=3)
                draw_b.line([(px, py), sub_end], fill=175, width=4)

                # Maculación plateada alrededor de las bifurcaciones
                if frac > 0.20 and frac < 0.85:
                    spot_rad = int(22 * (1.0 - frac * 0.3))
                    spot_center = (int(px + math.cos(sub_ang) * (sub_len * 0.35)),
                                   int(py + math.sin(sub_ang) * (sub_len * 0.35)))
                    draw_m.ellipse([
                        spot_center[0] - spot_rad, spot_center[1] - int(spot_rad * 0.7),
                        spot_center[0] + spot_rad, spot_center[1] + int(spot_rad * 0.7)
                    ], fill=160)

    # Suavizar máculas plateadas
    img_maculation = img_maculation.filter(ImageFilter.GaussianBlur(14))

    # Fusionar maculación sobre el color base
    # Color plateado/grisáceo suave: (175, 205, 178)
    mac_np = np.array(img_maculation, dtype=np.float32) / 255.0
    c_np = np.array(img_color, dtype=np.float32)

    silver_tint = np.array([168.0, 198.0, 172.0], dtype=np.float32)
    for ch in range(3):
        c_np[:, :, ch] = c_np[:, :, ch] * (1.0 - mac_np[:, :] * 0.45) + silver_tint[ch] * (mac_np[:, :] * 0.45)

    img_color = Image.fromarray(np.clip(c_np, 0, 255).astype(np.uint8), mode='RGB')

    # Suavizado suave de bump map
    img_bump = img_bump.filter(ImageFilter.GaussianBlur(1.8))

    # Guardar texturas
    color_path = os.path.join(textures_dir, "squash_leaf_color.png")
    bump_path = os.path.join(textures_dir, "squash_leaf_bump.png")

    img_color.save(color_path, "PNG")
    img_bump.save(bump_path, "PNG")

    print("Texturas de hoja de zapallo generadas con exito:")
    print(f"  - Color: {color_path}")
    print(f"  - Bump:  {bump_path}")

    return color_path, bump_path

if __name__ == "__main__":
    generate_squash_leaf_textures()
