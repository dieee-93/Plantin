import os
import math
from PIL import Image, ImageDraw, ImageFilter

ASSETS_DIR = r"i:\Programacion\Proyectos\plantin\src\features\locations\isometric\renderers\raster\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

WIDTH, HEIGHT = 160, 200
BASE_X, BASE_Y = 80, 186

# Paleta OKLCH / sRGB curada con luz NW
STEM_BASE = (45, 106, 79, 255)       # #2d6a4f
STEM_LIGHT = (82, 183, 136, 255)     # #52b788
STEM_SHADOW = (27, 67, 50, 255)      # #1b4332

LEAF_BASE = (56, 128, 92, 255)       # #38805c
LEAF_LIGHT = (116, 198, 157, 255)    # #74c69d
LEAF_DARK = (40, 90, 65, 255)        # #285a41
LEAF_SHADOW = (20, 50, 35, 255)      # #143223

BAMBOO_BASE = (217, 119, 6, 255)     # #d97706
BAMBOO_LIGHT = (245, 158, 11, 255)   # #f59e0b
BAMBOO_DARK = (180, 83, 9, 255)      # #b45309

FLOWER_PETAL = (250, 204, 21, 255)   # #facc15
FLOWER_LIGHT = (254, 240, 138, 255)  # #fef08a
FLOWER_CENTER = (202, 138, 4, 255)   # #ca8a04

FRUIT_RED_BASE = (220, 38, 38, 255)  # #dc2626
FRUIT_RED_LIGHT = (248, 113, 113, 255) # #f87171
FRUIT_RED_SHADOW = (153, 27, 27, 255)  # #991b1b
FRUIT_ORANGE = (249, 115, 22, 255)   # #f97316
FRUIT_GREEN_UNRIPE = (101, 163, 13, 255) # #65a30d
FRUIT_GREEN_LIGHT = (163, 230, 53, 255)

TIE_YELLOW = (254, 243, 199, 255)

def draw_leaf(draw: ImageDraw.ImageDraw, cx, cy, rx, ry, angle_deg, color=LEAF_BASE, light_color=LEAF_LIGHT, dark_color=LEAF_DARK):
    """Dibuja una hoja compuesta de solanácea con luz NW y nervadura"""
    rad = math.radians(angle_deg)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    
    # Puntos de la elipse rotada
    points = []
    for step in range(16):
        t = step * (2 * math.pi / 16)
        x_local = rx * math.cos(t)
        y_local = ry * math.sin(t)
        # deformación para ápice agudo
        if math.cos(t) > 0.5:
            x_local *= 1.2
            y_local *= 0.7
        x_rot = cx + x_local * cos_a - y_local * sin_a
        y_rot = cy + x_local * sin_a + y_local * cos_a
        points.append((x_rot, y_rot))
    
    # Sombra y base
    draw.polygon(points, fill=color, outline=LEAF_SHADOW)
    
    # Iluminación en cara NW (mitad superior-izquierda)
    half_points = points[:9] + [(cx, cy)]
    draw.polygon(half_points, fill=light_color)
    
    # Nervadura central
    tip_x = cx + rx * 1.2 * cos_a
    tip_y = cy + rx * 1.2 * sin_a
    draw.line([(cx, cy), (tip_x, tip_y)], fill=dark_color, width=1)

def draw_bamboo_stake(draw: ImageDraw.ImageDraw, x, top_y, bottom_y, width=6):
    """Dibuja tutor de bambú cilíndrico con estrías y nudos"""
    draw.rounded_rectangle([x - width//2, top_y, x + width//2, bottom_y], radius=2, fill=BAMBOO_BASE, outline=BAMBOO_DARK)
    # Highlight cara izquierda
    draw.line([x - width//2 + 1, top_y + 2, x - width//2 + 1, bottom_y - 2], fill=BAMBOO_LIGHT, width=1)
    # Nudos
    for ny in range(top_y + 15, bottom_y - 5, 25):
        draw.line([x - width//2 - 1, ny, x + width//2 + 1, ny], fill=BAMBOO_DARK, width=2)
        draw.line([x - width//2, ny - 1, x + width//2, ny - 1], fill=BAMBOO_LIGHT, width=1)

def draw_flower(draw: ImageDraw.ImageDraw, cx, cy, size=6):
    """Flor estrellada amarilla de solanácea con corola"""
    petals = []
    for i in range(5):
        angle = i * (2 * math.pi / 5) - math.pi / 2
        px = cx + size * math.cos(angle)
        py = cy + size * math.sin(angle)
        petals.append((px, py))
        draw.polygon([(cx, cy), (cx + (size*0.4)*math.cos(angle - 0.5), cy + (size*0.4)*math.sin(angle - 0.5)), (px, py), (cx + (size*0.4)*math.cos(angle + 0.5), cy + (size*0.4)*math.sin(angle + 0.5))], fill=FLOWER_PETAL, outline=FLOWER_CENTER)
    draw.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=FLOWER_LIGHT, outline=FLOWER_CENTER)

def draw_tomato(draw: ImageDraw.ImageDraw, cx, cy, radius=10, ripe_state='ripe'):
    """Tomate volumétrico esférico con brillo especular y cáliz estrellado"""
    base = FRUIT_RED_BASE if ripe_state == 'ripe' else FRUIT_ORANGE if ripe_state == 'turning' else FRUIT_GREEN_UNRIPE
    light = FRUIT_RED_LIGHT if ripe_state == 'ripe' else (253, 186, 116, 255) if ripe_state == 'turning' else FRUIT_GREEN_LIGHT
    shadow = FRUIT_RED_SHADOW if ripe_state == 'ripe' else (194, 65, 12, 255) if ripe_state == 'turning' else (54, 83, 20, 255)
    
    # Sombra arrojada propia inferior
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=base, outline=shadow)
    
    # Iluminación volumétrica NW
    highlight_cx = cx - radius * 0.35
    highlight_cy = cy - radius * 0.35
    draw.ellipse([highlight_cx - radius*0.4, highlight_cy - radius*0.3, highlight_cx + radius*0.4, highlight_cy + radius*0.3], fill=light)
    # Brillo especular
    draw.ellipse([highlight_cx - 2, highlight_cy - 2, highlight_cx + 1, highlight_cy + 1], fill=(255, 255, 255, 230))
    
    # Cáliz estrellado verde superior
    calyx_y = cy - radius + 1
    for angle_deg in [-50, -20, 20, 50, 90]:
        rad = math.radians(angle_deg)
        tx = cx + (radius * 0.5) * math.sin(rad)
        ty = calyx_y - (radius * 0.4) * math.cos(rad)
        draw.line([(cx, calyx_y), (tx, ty)], fill=LEAF_LIGHT, width=2)

def generate_germination():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Tallo hipocótilo emergente
    draw.line([(BASE_X, BASE_Y), (BASE_X - 2, BASE_Y - 14), (BASE_X - 1, BASE_Y - 26)], fill=STEM_BASE, width=3)
    draw.line([(BASE_X - 1, BASE_Y - 26), (BASE_X, BASE_Y - 32)], fill=STEM_LIGHT, width=2)
    
    # 2 hojas cotiledonares tiernas
    draw_leaf(draw, BASE_X - 12, BASE_Y - 34, rx=12, ry=6, angle_deg=160, color=LEAF_LIGHT, light_color=(167, 243, 208, 255))
    draw_leaf(draw, BASE_X + 11, BASE_Y - 35, rx=13, ry=6, angle_deg=20, color=LEAF_BASE, light_color=LEAF_LIGHT)
    
    # Primordio foliar diminuto al centro
    draw.polygon([(BASE_X, BASE_Y - 34), (BASE_X - 3, BASE_Y - 42), (BASE_X + 3, BASE_Y - 42)], fill=LEAF_LIGHT)
    return img

def generate_leaf():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Tallo principal
    draw.line([(BASE_X, BASE_Y), (BASE_X - 1, BASE_Y - 25), (BASE_X + 1, BASE_Y - 55)], fill=STEM_BASE, width=4)
    draw.line([(BASE_X - 1, BASE_Y - 5), (BASE_X - 2, BASE_Y - 50)], fill=STEM_LIGHT, width=2)
    
    # Nivel 1 de hojas compuestas
    draw_leaf(draw, BASE_X - 24, BASE_Y - 28, rx=20, ry=9, angle_deg=150)
    draw_leaf(draw, BASE_X - 36, BASE_Y - 32, rx=12, ry=6, angle_deg=140, color=LEAF_LIGHT)
    draw_leaf(draw, BASE_X + 25, BASE_Y - 32, rx=22, ry=9, angle_deg=25)
    draw_leaf(draw, BASE_X + 38, BASE_Y - 36, rx=13, ry=6, angle_deg=35, color=LEAF_LIGHT)
    
    # Nivel 2
    draw_leaf(draw, BASE_X - 20, BASE_Y - 48, rx=18, ry=8, angle_deg=135)
    draw_leaf(draw, BASE_X + 22, BASE_Y - 52, rx=19, ry=8, angle_deg=30)
    
    # Ápice
    draw_leaf(draw, BASE_X, BASE_Y - 68, rx=14, ry=7, angle_deg=-85, color=LEAF_LIGHT)
    return img

def generate_structure():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Tutor de bambú vertical
    draw_bamboo_stake(draw, BASE_X + 8, top_y=BASE_Y - 110, bottom_y=BASE_Y, width=6)
    
    # Tallo principal sinuoso
    draw.line([(BASE_X - 2, BASE_Y), (BASE_X - 3, BASE_Y - 35), (BASE_X + 2, BASE_Y - 70), (BASE_X + 5, BASE_Y - 95)], fill=STEM_BASE, width=5)
    draw.line([(BASE_X - 4, BASE_Y - 5), (BASE_X - 4, BASE_Y - 35), (BASE_X + 1, BASE_Y - 70)], fill=STEM_LIGHT, width=2)
    
    # Ataduras al tutor
    for tie_y in [BASE_Y - 30, BASE_Y - 65, BASE_Y - 90]:
        draw.line([BASE_X - 4, tie_y, BASE_X + 11, tie_y], fill=TIE_YELLOW, width=2)
    
    # Hojas traseras
    draw_leaf(draw, BASE_X - 30, BASE_Y - 40, rx=22, ry=9, angle_deg=160, color=LEAF_DARK)
    draw_leaf(draw, BASE_X + 32, BASE_Y - 45, rx=22, ry=9, angle_deg=20, color=LEAF_DARK)
    
    # Hojas medias
    draw_leaf(draw, BASE_X - 28, BASE_Y - 65, rx=24, ry=10, angle_deg=145)
    draw_leaf(draw, BASE_X + 28, BASE_Y - 75, rx=22, ry=9, angle_deg=25)
    
    # Hojas superiores
    draw_leaf(draw, BASE_X - 22, BASE_Y - 90, rx=20, ry=8, angle_deg=130)
    draw_leaf(draw, BASE_X + 20, BASE_Y - 98, rx=18, ry=8, angle_deg=35)
    draw_leaf(draw, BASE_X + 5, BASE_Y - 108, rx=16, ry=7, angle_deg=-80, color=LEAF_LIGHT)
    return img

def generate_flowering():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Tutor de bambú
    draw_bamboo_stake(draw, BASE_X + 8, top_y=BASE_Y - 120, bottom_y=BASE_Y, width=6)
    
    # Tallo
    draw.line([(BASE_X - 2, BASE_Y), (BASE_X - 3, BASE_Y - 40), (BASE_X + 3, BASE_Y - 80), (BASE_X + 6, BASE_Y - 110)], fill=STEM_BASE, width=5)
    draw.line([(BASE_X - 4, BASE_Y - 5), (BASE_X - 4, BASE_Y - 40), (BASE_X + 1, BASE_Y - 80)], fill=STEM_LIGHT, width=2)
    
    # Ataduras
    for tie_y in [BASE_Y - 35, BASE_Y - 75, BASE_Y - 105]:
        draw.line([BASE_X - 4, tie_y, BASE_X + 12, tie_y], fill=TIE_YELLOW, width=2)
    
    # Follaje abundante en capas
    # Nivel 1 inferior
    draw_leaf(draw, BASE_X - 34, BASE_Y - 35, rx=25, ry=10, angle_deg=165, color=LEAF_DARK)
    draw_leaf(draw, BASE_X + 35, BASE_Y - 40, rx=26, ry=10, angle_deg=15, color=LEAF_DARK)
    
    # Nivel 2 medio
    draw_leaf(draw, BASE_X - 32, BASE_Y - 65, rx=24, ry=10, angle_deg=145)
    draw_leaf(draw, BASE_X + 30, BASE_Y - 70, rx=23, ry=9, angle_deg=25)
    
    # Nivel 3 superior
    draw_leaf(draw, BASE_X - 25, BASE_Y - 95, rx=21, ry=8, angle_deg=135)
    draw_leaf(draw, BASE_X + 24, BASE_Y - 100, rx=20, ry=8, angle_deg=35)
    draw_leaf(draw, BASE_X + 6, BASE_Y - 118, rx=17, ry=7, angle_deg=-85, color=LEAF_LIGHT)
    
    # Racimos florales amarillos (inflorescencias)
    draw.line([(BASE_X - 2, BASE_Y - 55), (BASE_X - 16, BASE_Y - 58)], fill=STEM_BASE, width=2)
    draw_flower(draw, BASE_X - 16, BASE_Y - 60, size=7)
    draw_flower(draw, BASE_X - 22, BASE_Y - 56, size=6)
    
    draw.line([(BASE_X + 4, BASE_Y - 85), (BASE_X + 18, BASE_Y - 88)], fill=STEM_BASE, width=2)
    draw_flower(draw, BASE_X + 18, BASE_Y - 90, size=7)
    draw_flower(draw, BASE_X + 24, BASE_Y - 86, size=6)
    return img

def generate_fruiting():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Tutor de bambú
    draw_bamboo_stake(draw, BASE_X + 9, top_y=BASE_Y - 130, bottom_y=BASE_Y, width=6)
    
    # Tallo principal
    draw.line([(BASE_X - 2, BASE_Y), (BASE_X - 3, BASE_Y - 45), (BASE_X + 4, BASE_Y - 88), (BASE_X + 7, BASE_Y - 120)], fill=STEM_BASE, width=6)
    draw.line([(BASE_X - 4, BASE_Y - 5), (BASE_X - 4, BASE_Y - 45), (BASE_X + 2, BASE_Y - 88)], fill=STEM_LIGHT, width=2)
    
    # Ataduras
    for tie_y in [BASE_Y - 38, BASE_Y - 80, BASE_Y - 115]:
        draw.line([BASE_X - 5, tie_y, BASE_X + 13, tie_y], fill=TIE_YELLOW, width=2)
    
    # Follaje denso de fondo
    draw_leaf(draw, BASE_X - 36, BASE_Y - 42, rx=26, ry=11, angle_deg=165, color=LEAF_DARK)
    draw_leaf(draw, BASE_X + 38, BASE_Y - 46, rx=27, ry=11, angle_deg=15, color=LEAF_DARK)
    draw_leaf(draw, BASE_X - 34, BASE_Y - 78, rx=25, ry=10, angle_deg=145)
    draw_leaf(draw, BASE_X + 32, BASE_Y - 82, rx=24, ry=10, angle_deg=25)
    draw_leaf(draw, BASE_X - 26, BASE_Y - 106, rx=22, ry=9, angle_deg=135)
    draw_leaf(draw, BASE_X + 25, BASE_Y - 110, rx=21, ry=9, angle_deg=35)
    draw_leaf(draw, BASE_X + 7, BASE_Y - 128, rx=18, ry=8, angle_deg=-85, color=LEAF_LIGHT)
    
    # Racimo de frutos maduros inferiores (rojo rubí profundo)
    draw.line([(BASE_X - 2, BASE_Y - 48), (BASE_X - 18, BASE_Y - 44)], fill=STEM_BASE, width=2)
    draw_tomato(draw, BASE_X - 12, BASE_Y - 38, radius=13, ripe_state='ripe')
    draw_tomato(draw, BASE_X - 25, BASE_Y - 45, radius=10, ripe_state='ripe')
    
    # Racimo de frutos medios (naranja/en maduración)
    draw.line([(BASE_X + 3, BASE_Y - 72), (BASE_X + 20, BASE_Y - 70)], fill=STEM_BASE, width=2)
    draw_tomato(draw, BASE_X + 16, BASE_Y - 66, radius=11, ripe_state='turning')
    draw_tomato(draw, BASE_X + 28, BASE_Y - 72, radius=9, ripe_state='turning')
    
    # Frutos apicales verdes inmaduros + flores remanentes
    draw.line([(BASE_X - 1, BASE_Y - 96), (BASE_X - 14, BASE_Y - 96)], fill=STEM_BASE, width=2)
    draw_tomato(draw, BASE_X - 14, BASE_Y - 94, radius=8, ripe_state='unripe')
    draw_flower(draw, BASE_X - 22, BASE_Y - 98, size=5)
    
    return img

def main():
    generators = {
        "tom-germination.webp": generate_germination,
        "tom-leaf.webp": generate_leaf,
        "tom-structure.webp": generate_structure,
        "tom-flowering.webp": generate_flowering,
        "tom-fruiting.webp": generate_fruiting,
    }
    
    total_size = 0
    print("[INFO] Generando assets WebP para el piloto raster de Tomate (TOM)...")
    for filename, gen_fn in generators.items():
        img = gen_fn()
        filepath = os.path.join(ASSETS_DIR, filename)
        # Guardar en WebP lossless o con calidad alta para mantener transparencia impecable
        img.save(filepath, "WEBP", quality=90, method=6)
        size_kb = os.path.getsize(filepath) / 1024
        total_size += size_kb
        print(f"  OK {filename}: {size_kb:.2f} KB (dimension: {img.size[0]}x{img.size[1]})")
        assert size_kb <= 20, f"{filename} excede 20 KB: {size_kb:.2f} KB"
        
    print(f"\n[INFO] Peso total de los assets del piloto: {total_size:.2f} KB (Limite spec: <= 100 KB)")
    assert total_size <= 100, f"Peso total excede 100 KB: {total_size:.2f} KB"
    print("[SUCCESS] Todos los assets cumplen estrictamente el presupuesto!")

if __name__ == "__main__":
    main()
