"""
Extractor de modelo de cultivo para edición en Blender (Plantin v2).
Toma los modelos de un cultivo desde el vendor pack y genera un único archivo
.blend en assets-src/crops/<CODE>.blend con 5 colecciones (stage1...stage5)
listas para que el usuario pueda abrir Blender, editar materiales, colores, hojas
o frutos, guardar y regenerar los sprites sin tocar código.

Uso:
  blender-launcher -b -P scripts/blender/extract_crop.py -- --crop TOM [--config assets-src/crops.json] [--out assets-src/crops]
"""

import argparse
import json
import os
import sys
import bpy


def parse_args():
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser(description="Extrae un cultivo a un único .blend para edición")
    parser.add_argument("--crop", type=str, required=True, help="Código del cultivo (p. ej. TOM)")
    parser.add_argument("--config", type=str, default="assets-src/crops.json", help="Ruta a crops.json")
    parser.add_argument("--out", type=str, default="assets-src/crops", help="Directorio de destino")
    return parser.parse_args(args)


def main():
    args = parse_args()
    config_path = os.path.abspath(args.config)
    with open(config_path, "r", encoding="utf-8") as f:
        crops_cfg = json.load(f)

    if args.crop not in crops_cfg:
        print(f"❌ Cultivo '{args.crop}' no encontrado en {config_path}")
        sys.exit(1)

    crop = crops_cfg[args.crop]
    stages = crop["stages"]
    vendor_dir = os.path.abspath("assets-src/vendor/quaternius-crops/Blends")
    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)
    out_blend = os.path.join(out_dir, f"{args.crop}.blend")

    # Crear escena limpia
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    phase_to_stage = {
        "germination": "stage1",
        "leaf": "stage2",
        "structure": "stage3",
        "flowering": "stage4",
        "fruiting": "stage5",
    }

    exclude_objects = set(crop.get("excludeObjects", []))

    for phase_name, model_name in stages.items():
        stage_name = phase_to_stage.get(phase_name, phase_name)
        vendor_blend = os.path.join(vendor_dir, f"{model_name}.blend")
        if not os.path.exists(vendor_blend):
            print(f"⚠️ Modelo no encontrado: {vendor_blend}")
            continue

        stage_col = bpy.data.collections.new(stage_name)
        scene.collection.children.link(stage_col)

        # Cargar objetos desde el archivo vendor
        with bpy.data.libraries.load(vendor_blend, link=False) as (data_from, data_to):
            data_to.objects = [name for name in data_from.objects if name not in exclude_objects]

        for obj in data_to.objects:
            if obj is not None:
                stage_col.objects.link(obj)
                obj.hide_render = False
                obj.hide_viewport = False

    # Guardar nuevo archivo blend
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"\n🎉 Cultivo {args.crop} extraído exitosamente a:")
    print(f"   {out_blend}")
    print(f"\nPara activarlo en Plantin:")
    print(f'1. Edita {config_path} y configura en "{args.crop}":')
    print(f'   "editedFile": "crops/{args.crop}.blend",')
    print(f'   "modified": true')
    print(f'2. Regenera los sprites con: npm run assets -- --crop={args.crop}\n')


if __name__ == "__main__":
    main()
