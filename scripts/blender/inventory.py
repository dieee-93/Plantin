"""
Script de inventario batch para Blender:
Inspecciona todos los archivos .blend de assets-src/vendor/quaternius-crops/Blends/
y genera assets-src/out/inventory.json con objetos, tipos, dimensiones y materiales.
"""

import bpy
import glob
import json
import os
import sys

def run_inventory():
    vendor_dir = os.path.abspath(r"assets-src/vendor/quaternius-crops/Blends")
    out_dir = os.path.abspath(r"assets-src/out")
    os.makedirs(out_dir, exist_ok=True)
    out_json = os.path.join(out_dir, "inventory.json")

    blend_files = sorted(glob.glob(os.path.join(vendor_dir, "*.blend")))
    print(f"🌿 Analizando {len(blend_files)} archivos .blend en {vendor_dir}...")

    inventory = {}

    for blend_path in blend_files:
        filename = os.path.basename(blend_path)
        base_name = os.path.splitext(filename)[0]

        try:
            bpy.ops.wm.open_mainfile(filepath=blend_path)
        except Exception as e:
            print(f"⚠️ Error abriendo {filename}: {e}")
            continue

        objects_data = []
        for obj in bpy.data.objects:
            dims = [round(float(v), 4) for v in obj.dimensions]
            materials = [slot.material.name for slot in obj.material_slots if slot.material]
            objects_data.append({
                "name": obj.name,
                "type": obj.type,
                "dimensions": dims,
                "materials": materials,
                "collections": [c.name for c in obj.users_collection],
            })

        inventory[base_name] = {
            "filename": filename,
            "objects": objects_data,
            "all_materials": sorted(list(set(m.name for m in bpy.data.materials if m.name))),
        }

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(inventory, f, indent=2, ensure_ascii=False)

    print(f"✅ Inventario generado exitosamente en: {out_json} ({len(inventory)} modelos catalogados)")

if __name__ == "__main__":
    run_inventory()
