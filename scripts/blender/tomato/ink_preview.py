import sys
import os
from PIL import Image, ImageFilter, ImageOps
import numpy as np

def apply_cartoon_ink(input_path, output_path, line_width=3, line_color=(20, 22, 28, 255)):
    """
    Aplica entintado cartoon estilo videojuego (Zelda / Animal Crossing):
    1. Contorno de silueta exterior limpio y nítido.
    2. Detección de bordes internos (pliegues, nervaduras y superposiciones).
    3. Trazo negro de tinta puro sin artefactos.
    """
    if not os.path.exists(input_path):
        print(f"Error: {input_path} no existe")
        return False

    im = Image.open(input_path).convert('RGBA')
    w, h = im.size

    # Separar canales
    r, g, b, a = im.split()

    # 1. Máscara de silueta exterior expandida (Dilation)
    alpha_np = np.array(a, dtype=np.uint8)
    if not np.any(alpha_np > 10):
        print("Imagen vacía")
        return False

    # Dilatar el canal alfa para crear el contorno externo
    dilated_alpha = a.filter(ImageFilter.MaxFilter(line_width * 2 + 1))
    # Borde exterior = dilated - original
    outer_edge = np.maximum(0, np.array(dilated_alpha, dtype=np.int16) - np.array(a, dtype=np.int16)).astype(np.uint8)

    # 2. Detección de aristas internas (contraste de brillo / normales / color)
    # Convertir a escala de grises para encontrar pliegues y transiciones
    rgb = im.convert('RGB')
    gray = ImageOps.grayscale(rgb)
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges_np = np.array(edges, dtype=np.uint8)

    # Filtrar bordes internos: solo donde hay alfa y el gradiente es suficiente
    internal_edge = np.where((alpha_np > 80) & (edges_np > 38), np.minimum(255, edges_np * 2), 0).astype(np.uint8)

    # Evitar círculos negros en los brillos especulares blancos de los tomates
    r_np = np.array(r, dtype=np.int16)
    g_np = np.array(g, dtype=np.int16)
    b_np = np.array(b, dtype=np.int16)
    is_spec = ((r_np > 180) & (g_np > 140) & (b_np > 140)).astype(np.uint8) * 255
    spec_dilated = np.array(Image.fromarray(is_spec, mode='L').filter(ImageFilter.MaxFilter(7)))
    internal_edge[spec_dilated > 0] = 0

    # Combinar bordes externos e internos
    combined_ink_mask = np.maximum(outer_edge, internal_edge)
    ink_mask_img = Image.fromarray(combined_ink_mask, mode='L')
    ink_mask_img = ink_mask_img.filter(ImageFilter.GaussianBlur(0.5))

    # Crear capa de tinta negra
    ink_layer = Image.new('RGBA', (w, h), line_color)

    # Fondo transparente final
    final = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    # Estampar la tinta usando la máscara combinada
    final.paste(ink_layer, (0, 0), mask=ink_mask_img)

    # Encima, estampar la imagen 3D original
    final.alpha_composite(im)

    # Guardar
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final.save(output_path, 'PNG')
    print(f"Entintado cartoon guardado en: {output_path}")
    return True

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else r"scripts/out/master_leaf_raw.png"
    dst = sys.argv[2] if len(sys.argv) > 2 else r"scripts/out/master_leaf_preview.png"
    apply_cartoon_ink(src, dst)
