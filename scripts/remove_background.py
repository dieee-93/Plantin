"""Script de utilidad para convertir fondos sólidos en transparencia real (RGBA).
Soporta antialiasing suave, eliminación de halos (un-matting), detección automática
del color de fondo y procesamiento por lotes o archivo individual.

Uso:
    python scripts/remove_background.py ruta/a/imagen.jpg
    python scripts/remove_background.py ruta/a/imagen.jpg -o ruta/a/salida.png
    python scripts/remove_background.py ruta/a/carpeta/ -o ruta/salida/ --trim
"""

import argparse
import os
import sys
from pathlib import Path
import numpy as np
from PIL import Image


def remove_solid_background(
    image: Image.Image,
    bg_color: tuple[int, int, int] | None = None,
    t0: float = 12.0,
    t1: float = 38.0,
    trim: bool = False,
) -> Image.Image:
    """Convierte un fondo sólido en transparencia alfa limpia con desvanecido y corrección de halo."""
    rgb_img = image.convert("RGB")
    arr = np.array(rgb_img, dtype=np.float32)

    # 1. Si no se especificó color de fondo, autodetectar promediando las 4 esquinas
    if bg_color is None:
        corners = np.array([
            arr[0, 0],
            arr[0, -1],
            arr[-1, 0],
            arr[-1, -1]
        ])
        bg = np.median(corners, axis=0)
    else:
        bg = np.array(bg_color, dtype=np.float32)

    # 2. Calcular distancia euclídea en espacio RGB hacia el color de fondo
    dist = np.linalg.norm(arr - bg, axis=2)

    # 3. Mapear distancia a alfa continuo (0.0 = transparente, 1.0 = opaco)
    alpha = np.clip((dist - t0) / (t1 - t0), 0.0, 1.0)

    # 4. Un-matting (eliminar sangrado del fondo en los píxeles semitransparentes del borde)
    out_rgb = arr.copy()
    semi_mask = (alpha > 0.0) & (alpha < 1.0)
    for c in range(3):
        out_rgb[:, :, c][semi_mask] = np.clip(
            (arr[:, :, c][semi_mask] - (1.0 - alpha[semi_mask]) * bg[c]) / alpha[semi_mask],
            0.0,
            255.0,
        )

    # 5. Ensamblar imagen RGBA
    rgba = np.dstack([out_rgb.astype(np.uint8), (alpha * 255.0).astype(np.uint8)])
    result = Image.fromarray(rgba, mode="RGBA")

    # 6. Recorte opcional del espacio vacío sobrante (autocrop)
    if trim:
        bbox = result.getbbox()
        if bbox:
            result = result.crop(bbox)

    return result


def parse_color(color_str: str) -> tuple[int, int, int]:
    """Parsea colores comunes o valores hex (#ffffff)."""
    s = color_str.strip().lower()
    if s == "white":
        return (255, 255, 255)
    if s == "black":
        return (0, 0, 0)
    if s.startswith("#"):
        s = s.lstrip("#")
        if len(s) == 3:
            s = "".join(c * 2 for c in s)
        return tuple(int(s[i : i + 2], 16) for i in (0, 2, 4))
    parts = s.split(",")
    if len(parts) == 3:
        return tuple(int(p.strip()) for p in parts)
    raise ValueError(f"Formato de color no reconocido: {color_str}")


def process_file(
    input_file: Path,
    output_file: Path | None,
    bg_color: tuple[int, int, int] | None,
    t0: float,
    t1: float,
    trim: bool,
):
    if output_file is None:
        output_file = input_file.with_suffix(".png")

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(input_file) as img:
        out_img = remove_solid_background(img, bg_color=bg_color, t0=t0, t1=t1, trim=trim)
        out_img.save(output_file, "PNG")
    print(f" [OK] {input_file.name} -> {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Recorta fondos sólidos y genera PNGs con transparencia limpia (antialiasing + halo fix)."
    )
    parser.add_argument("input", help="Ruta de la imagen o carpeta a procesar.")
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Ruta del archivo de salida o carpeta de destino (por defecto genera .png al lado).",
    )
    parser.add_argument(
        "--bg",
        default=None,
        help="Color de fondo ('white', 'black', '#ffffff', '255,255,255'). Si se omite, se autodetecta.",
    )
    parser.add_argument(
        "--t0",
        type=float,
        default=12.0,
        help="Umbral inferior de transparencia (distancia de color donde empieza el recorte, default: 12.0).",
    )
    parser.add_argument(
        "--t1",
        type=float,
        default=38.0,
        help="Umbral superior de opacidad (distancia de color donde es 100%% opaco, default: 38.0).",
    )
    parser.add_argument(
        "--trim",
        action="store_true",
        help="Recorta los márgenes transparentes vacíos sobrantes (auto-crop al contenido).",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    bg_color = parse_color(args.bg) if args.bg else None

    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    if input_path.is_file():
        out_path = Path(args.output) if args.output else None
        process_file(input_path, out_path, bg_color, args.t0, args.t1, args.trim)
    elif input_path.is_dir():
        out_dir = Path(args.output) if args.output else input_path / "transparent_pngs"
        files = [f for f in input_path.iterdir() if f.is_file() and f.suffix.lower() in valid_extensions]
        if not files:
            print(f"No se encontraron imágenes compatibles en: {input_path}")
            return
        print(f"Procesando {len(files)} imágenes en '{input_path}'...")
        for f in files:
            dest = out_dir / f"{f.stem}.png"
            process_file(f, dest, bg_color, args.t0, args.t1, args.trim)
    else:
        print(f"Error: la ruta especificada no existe: {input_path}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
