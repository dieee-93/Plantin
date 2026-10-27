import sys
import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw
import numpy as np

def apply_cartoon_ink(input_path, output_path, line_width=3, line_color=(20, 22, 28, 255)):
    """
    Aplica entintado cartoon estilo videojuego (Zelda / Animal Crossing):
    1. Contorno de silueta exterior limpio y nitido.
    2. Deteccion de bordes internos (pliegues, nervaduras y superposiciones).
    3. Trazo negro de tinta puro sin artefactos.
    """
    if not os.path.exists(input_path):
        print(f"Error: {input_path} no existe")
        return False

    im = Image.open(input_path).convert('RGBA')
    w, h = im.size

    # Separar canales
    r, g, b, a = im.split()

    # 1. Mascara de silueta exterior expandida (Dilation)
    alpha_np = np.array(a, dtype=np.uint8)
    if not np.any(alpha_np > 10):
        print(f"Aviso: {input_path} esta vacia o transparente")
        return False

    # Dilatar el canal alfa para crear el contorno externo
    dilated_alpha = a.filter(ImageFilter.MaxFilter(line_width * 2 + 1))
    outer_edge = np.maximum(0, np.array(dilated_alpha, dtype=np.int16) - np.array(a, dtype=np.int16)).astype(np.uint8)

    # 2. Deteccion de aristas internas
    rgb = im.convert('RGB')
    gray = ImageOps.grayscale(rgb)
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges_np = np.array(edges, dtype=np.uint8)

    # Filtrar bordes internos: solo donde hay alfa y el gradiente es suficiente
    internal_edge = np.where((alpha_np > 80) & (edges_np > 36), np.minimum(255, edges_np * 2), 0).astype(np.uint8)

    # Proteger reflejos/brillos de resina (tricomas) y pistilos brillantes
    r_np = np.array(r, dtype=np.int16)
    g_np = np.array(g, dtype=np.int16)
    b_np = np.array(b, dtype=np.int16)
    is_spec = ((r_np > 200) & (g_np > 200) & (b_np > 180)).astype(np.uint8) * 255
    spec_dilated = np.array(Image.fromarray(is_spec, mode='L').filter(ImageFilter.MaxFilter(5)))
    internal_edge[spec_dilated > 0] = 0

    # Combinar bordes externos e internos
    combined_ink_mask = np.maximum(outer_edge, internal_edge)
    ink_mask_img = Image.fromarray(combined_ink_mask, mode='L')
    ink_mask_img = ink_mask_img.filter(ImageFilter.GaussianBlur(0.5))

    # Crear capa de tinta negra
    ink_layer = Image.new('RGBA', (w, h), line_color)

    # Fondo transparente final
    final = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    # Estampar la tinta usando la mascara combinada
    final.paste(ink_layer, (0, 0), mask=ink_mask_img)

    # Encima, estampar la imagen 3D original
    final.alpha_composite(im)

    # Guardar
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final.save(output_path, 'PNG')
    print(f"Entintado cartoon guardado en: {output_path}")
    return True

def process_all_stages():
    """Entinta las 5 etapas y genera una tira comparativa de progresion horizontal."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    renders_dir = os.path.join(this_dir, "renders")
    os.makedirs(renders_dir, exist_ok=True)

    stages = [
        (1, "1. Germinacion", "cartoon_cannabis_stage1"),
        (2, "2. Vegetativo Temprano", "cartoon_cannabis_stage2"),
        (3, "3. Estructura Vegetativa", "cartoon_cannabis_stage3"),
        (4, "4. Floracion Media", "cartoon_cannabis_stage4"),
        (5, "5. Cosecha Madura", "cartoon_cannabis_stage5"),
    ]

    inked_list = []
    tile_w = 480
    tile_h = 540

    for idx, label, stem in stages:
        raw_p = os.path.abspath(f"scripts/out/{stem}_raw.png")
        ink_p = os.path.join(renders_dir, f"{stem}.png")

        if os.path.exists(raw_p):
            apply_cartoon_ink(raw_p, ink_p)
            inked_list.append((ink_p, label))
        else:
            print(f"Aviso: {raw_p} no encontrado")

    if inked_list:
        sample = Image.open(inked_list[0][0])
        tile_w, tile_h = sample.size

        total_w = tile_w * len(inked_list)
        banner_h = tile_h + 50

        # Fondo gris azulado oscuro mate estilo UI / showroom
        banner = Image.new('RGBA', (total_w, banner_h), (20, 24, 30, 255))
        draw = ImageDraw.Draw(banner)

        for i, (p_img, lbl) in enumerate(inked_list):
            im = Image.open(p_img).convert('RGBA')
            banner.paste(im, (i * tile_w, 10), mask=im)

            # Linea divisoria vertical sutil
            if i > 0:
                draw.line([(i * tile_w, 20), (i * tile_w, banner_h - 40)], fill=(40, 48, 58, 255), width=1)

            # Etiqueta
            cx = i * tile_w + tile_w // 2
            cy = banner_h - 22
            draw.text((cx, cy), lbl, fill=(220, 230, 225, 255), anchor="mm")

        prog_out = os.path.join(renders_dir, "cannabis_5_stages_progression.png")
        banner.save(prog_out, 'PNG')
        print(f"\n[OK] Hoja de progresion generada en: {prog_out}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] not in ["--all", "-a"]:
        src = sys.argv[1]
        dst = sys.argv[2] if len(sys.argv) > 2 else r"scripts/blender/cannabis/renders/master_leaflet_preview.png"
        apply_cartoon_ink(src, dst)
    else:
        process_all_stages()
