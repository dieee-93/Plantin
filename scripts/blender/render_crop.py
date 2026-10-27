"""
Renderizador batch de cultivos para Plantin v2.
Ejecuta la calibración métrica o renderiza las 5 etapas fenológicas de un cultivo a PNG 160×200 RGBA.

Uso:
  blender-launcher -b -P scripts/blender/render_crop.py -- --crop TOM --config assets-src/crops.json --out assets-src/out
  blender-launcher -b -P scripts/blender/render_crop.py -- --calibrate --out assets-src/out
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

# Importar configuración de escena local
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)
import scene_setup

TARGET_BOTTOM_PX = 197.5
ORTHO_SCALE = 2.4

def parse_cli_args():
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
    else:
        args = []

    parser = argparse.ArgumentParser(description="Renderizador de cultivos Plantin")
    parser.add_argument("--crop", type=str, help="Código del cultivo (p. ej. TOM)")
    parser.add_argument("--config", type=str, default="assets-src/crops.json", help="Ruta a crops.json")
    parser.add_argument("--out", type=str, default="assets-src/out", help="Directorio de salida")
    parser.add_argument("--calibrate", action="store_true", help="Ejecutar calibración métrica")
    parser.add_argument("--outline", action="store_true", help="Activar contorno Freestyle")

    return parser.parse_args(args)

def run_calibration(out_dir):
    """
    Renderiza un marcador métrico (cubo de 1 cm y cilindro de 1.0 m) y verifica automáticamente:
    1. Base en el pixel esperado (±1 px de TARGET_BOTTOM_PX)
    2. Altura proyectada correspondiente a la escala esperada (±2 %)
    """
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    scene_setup.setup_scene(scene, ortho_scale=ORTHO_SCALE, target_bottom_px=TARGET_BOTTOM_PX)

    # Cubo de 1 cm en el origen
    bpy.ops.mesh.primitive_cube_add(size=0.01, location=(0, 0, 0.005))
    cube = bpy.context.active_object
    cube.name = "OriginMarker"

    # Cilindro de 1.0 m de altura en el origen
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=1.0, location=(0, 0, 0.5))
    cyl = bpy.context.active_object
    cyl.name = "HeightMarker"

    # Material de prueba
    mat = bpy.data.materials.new(name="CalibMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.2, 0.7, 0.4, 1.0)
    cube.data.materials.append(mat)
    cyl.data.materials.append(mat)

    # Proyección matemática de referencia
    cam_obj = scene.camera
    res_x = scene.render.resolution_x
    res_y = scene.render.resolution_y

    uv_base = world_to_camera_view(scene, cam_obj, Vector((0, 0, 0)))
    uv_top = world_to_camera_view(scene, cam_obj, Vector((0, 0, 1.0)))

    base_px_x = uv_base.x * res_x
    base_px_y = (1.0 - uv_base.y) * res_y
    top_px_y = (1.0 - uv_top.y) * res_y
    measured_height_px = base_px_y - top_px_y

    # Altura teórica: 1.0m * cos(30°) / ORTHO_SCALE * res_y
    expected_height_px = (1.0 * math.cos(math.radians(30)) / ORTHO_SCALE) * res_y
    height_error_pct = abs(measured_height_px - expected_height_px) / expected_height_px * 100.0
    base_error_px = abs(base_px_y - TARGET_BOTTOM_PX)

    calib_png = os.path.join(out_dir, "calibration.png")
    scene.render.filepath = calib_png
    bpy.ops.render.render(write_still=True)

    report = {
        "ortho_scale": ORTHO_SCALE,
        "target_bottom_px": TARGET_BOTTOM_PX,
        "base_px_x": round(base_px_x, 2),
        "base_px_y": round(base_px_y, 2),
        "base_error_px": round(base_error_px, 2),
        "measured_height_px": round(measured_height_px, 2),
        "expected_height_px": round(expected_height_px, 2),
        "height_error_pct": round(height_error_pct, 4),
        "base_in_tolerance": base_error_px <= 1.0,
        "height_in_tolerance": height_error_pct <= 2.0,
        "output_image": calib_png,
    }

    report_path = os.path.join(out_dir, "calibration_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 50)
    print("🎯 REPORTE DE CALIBRACIÓN ISOMÉTRICA (A2)")
    print(f"  Base X: {base_px_x:.2f} px (esperado: 80.00)")
    print(f"  Base Y: {base_px_y:.2f} px (esperado: {TARGET_BOTTOM_PX:.2f}, error: {base_error_px:.2f} px)")
    print(f"  Altura 1.0m: {measured_height_px:.2f} px (teórico: {expected_height_px:.2f} px, error: {height_error_pct:.2f}%)")
    print(f"  Tolerancias: Base {'✅ OK' if report['base_in_tolerance'] else '❌ ERROR'} | Altura {'✅ OK' if report['height_in_tolerance'] else '❌ ERROR'}")
    print(f"  PNG generado: {calib_png}")
    print("=" * 50 + "\n")

    if not (report['base_in_tolerance'] and report['height_in_tolerance']):
        raise RuntimeError("Calibración métrica fuera de tolerancia.")

def get_crop_bounds(objects, exclude_names):
    """
    Calcula el bounding box combinado en coordenadas de mundo de los objetos MESH válidos.
    """
    valid_objs = [obj for obj in objects if obj.type == 'MESH' and obj.name not in exclude_names]
    if not valid_objs:
        return None

    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')

    for obj in valid_objs:
        for corner in obj.bound_box:
            world_pt = obj.matrix_world @ Vector(corner)
            min_x = min(min_x, world_pt.x)
            max_x = max(max_x, world_pt.x)
            min_y = min(min_y, world_pt.y)
            max_y = max(max_y, world_pt.y)
            min_z = min(min_z, world_pt.z)
            max_z = max(max_z, world_pt.z)

    return {
        "min": Vector((min_x, min_y, min_z)),
        "max": Vector((max_x, max_y, max_z)),
        "size": Vector((max_x - min_x, max_y - min_y, max_z - min_z)),
        "center_xy": Vector(((min_x + max_x) / 2.0, (min_y + max_y) / 2.0)),
        "objects": valid_objs
    }

def compute_pixel_bounds(scene, cam_obj, objects, res_x, res_y):
    """Proyecta los vértices reales de la malla a coordenadas de píxel 2D."""
    all_uvs = []
    for obj in objects:
        for v in obj.data.vertices:
            world_pt = obj.matrix_world @ v.co
            uv = world_to_camera_view(scene, cam_obj, world_pt)
            all_uvs.append((uv.x * res_x, (1.0 - uv.y) * res_y))
    return {
        "min_x": min(pt[0] for pt in all_uvs),
        "max_x": max(pt[0] for pt in all_uvs),
        "min_y": min(pt[1] for pt in all_uvs),
        "max_y": max(pt[1] for pt in all_uvs),
    }

def render_edited_crop(crop_code, config_path, out_root, outline=False):
    """
    Renderiza un cultivo desde un único archivo .blend editado por el usuario
    (ubicado en assets-src/crops/<CODE>.blend con colecciones stage1..stage5).
    """
    with open(config_path, "r", encoding="utf-8") as f:
        crops_cfg = json.load(f)

    crop = crops_cfg[crop_code]
    label = crop.get("label", crop_code)
    edited_file_rel = crop.get("editedFile")
    edited_blend = os.path.abspath(os.path.join(os.path.dirname(config_path), edited_file_rel))
    stages = crop["stages"]
    target_height_px = crop.get("targetHeightPx", 100)
    exclude_objects = set(crop.get("excludeObjects", []))

    out_crop_dir = os.path.abspath(os.path.join(out_root, crop_code))
    os.makedirs(out_crop_dir, exist_ok=True)

    phase_to_stage = {
        "germination": "stage1",
        "leaf": "stage2",
        "structure": "stage3",
        "flowering": "stage4",
        "fruiting": "stage5",
        "harvested": "harvested",
    }

    # 1. Abrir archivo editado y calcular factor de escala sobre la etapa adulta
    bpy.ops.wm.open_mainfile(filepath=edited_blend)
    adult_col_name = phase_to_stage.get("fruiting", "stage5")
    adult_col = (
        bpy.data.collections.get(adult_col_name)
        or bpy.data.collections.get("fruiting")
        or bpy.data.collections.get("stage5")
    )
    adult_objs = adult_col.objects if adult_col else bpy.data.objects
    adult_bounds = get_crop_bounds(adult_objs, exclude_objects)
    if not adult_bounds:
        raise RuntimeError(f"No se encontraron mallas válidas en la etapa adulta de {edited_blend}")

    adult_world_height = adult_bounds["size"].z
    res_y = 200.0
    projected_px_at_scale_1 = (adult_world_height * math.cos(math.radians(30)) / ORTHO_SCALE) * res_y
    scale_factor = target_height_px / projected_px_at_scale_1

    print(f"\n🎨 Procesando cultivo EDITADO {crop_code} ({label}) desde {edited_file_rel}:")
    print(f"  Altura mundo adulto: {adult_world_height:.4f} m")
    print(f"  Altura objetivo: {target_height_px} px -> Factor de escala único: {scale_factor:.4f}")

    results = []
    for phase_name in stages.keys():
        bpy.ops.wm.open_mainfile(filepath=edited_blend)
        scene = bpy.context.scene
        scene_setup.setup_scene(scene, ortho_scale=ORTHO_SCALE, target_bottom_px=TARGET_BOTTOM_PX, outline=outline)

        stage_col_name = phase_to_stage.get(phase_name, phase_name)
        target_col = (
            bpy.data.collections.get(stage_col_name)
            or bpy.data.collections.get(phase_name)
        )

        if not target_col:
            print(f"  ⚠️ Colección '{stage_col_name}' no encontrada en {edited_blend}, omitiendo")
            continue

        # Asegurar visibilidad de capa
        for col in bpy.data.collections:
            col.hide_render = col != target_col
        for lc in bpy.context.view_layer.layer_collection.children:
            lc.exclude = False

        for obj in list(bpy.data.objects):
            if obj.name in exclude_objects:
                bpy.data.objects.remove(obj, do_unlink=True)

        bounds = get_crop_bounds(target_col.objects, exclude_objects)
        if not bounds:
            print(f"  ⚠️ Sin mallas válidas en {stage_col_name}")
            continue

        offset_x = -bounds["center_xy"].x
        offset_y = -bounds["center_xy"].y
        offset_z = -bounds["min"].z

        for obj in bounds["objects"]:
            obj.hide_render = False
            obj.hide_viewport = False
            obj.location.x += offset_x
            obj.location.y += offset_y
            obj.location.z += offset_z
            obj.scale *= scale_factor

        bpy.context.view_layer.update()

        cam_obj = scene.camera
        res_x = scene.render.resolution_x
        res_y = scene.render.resolution_y
        px_bounds = compute_pixel_bounds(scene, cam_obj, bounds["objects"], res_x, res_y)

        # Ajuste dinámico de shift_y para anclaje exacto en TARGET_BOTTOM_PX
        delta_px = TARGET_BOTTOM_PX - px_bounds["max_y"]
        delta_shift_y = delta_px / res_y
        cam_obj.data.shift_y += delta_shift_y
        bpy.context.view_layer.update()

        px_bounds = compute_pixel_bounds(scene, cam_obj, bounds["objects"], res_x, res_y)

        out_png = os.path.join(out_crop_dir, f"{phase_name}.png")
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)

        actual_h_px = px_bounds["max_y"] - px_bounds["min_y"]
        results.append({
            "phase": phase_name,
            "png": out_png,
            "bounds": px_bounds,
            "height_px": round(actual_h_px, 1),
            "bottom_y": round(px_bounds["max_y"], 1),
        })
        print(f"  ✅ Fase {phase_name:12s} -> {os.path.basename(out_png)} (h={actual_h_px:.1f}px, base_y={px_bounds['max_y']:.1f})")

    return results


def render_crop(crop_code, config_path, out_root, outline=False):
    """
    Renderiza las 5 etapas del cultivo aplicando:
    1. Un único factor de escala calculado sobre la etapa adulta (fruiting / etapa 5).
    2. Anclaje al origen de mundo (Z min = 0, XY centrado en 0).
    3. Render PNG RGBA 160×200 con fondo transparente.
    """
    with open(config_path, "r", encoding="utf-8") as f:
        crops_cfg = json.load(f)

    if crop_code not in crops_cfg:
        raise ValueError(f"Cultivo '{crop_code}' no encontrado en {config_path}")

    crop = crops_cfg[crop_code]
    edited_file_rel = crop.get("editedFile")
    edited_blend = os.path.abspath(os.path.join(os.path.dirname(config_path), edited_file_rel)) if edited_file_rel else None
    if edited_blend and os.path.exists(edited_blend):
        return render_edited_crop(crop_code, config_path, out_root, outline=outline)

    label = crop.get("label", crop_code)
    stages = crop["stages"]  # p. ej. {"germination": "Tomato_1", ...}
    exclude_objects = set(crop.get("excludeObjects", []))
    target_height_px = crop.get("targetHeightPx", 100)

    out_crop_dir = os.path.abspath(os.path.join(out_root, crop_code))
    os.makedirs(out_crop_dir, exist_ok=True)

    vendor_dir = os.path.abspath(r"assets-src/vendor/quaternius-crops/Blends")

    # 1. Determinar el factor de escala único a partir de la etapa 5 (fruiting)
    adult_model = stages.get("fruiting", list(stages.values())[-1])
    adult_blend = os.path.join(vendor_dir, f"{adult_model}.blend")
    if not os.path.exists(adult_blend):
        raise FileNotFoundError(f"Modelo adulto no encontrado: {adult_blend}")

    bpy.ops.wm.open_mainfile(filepath=adult_blend)
    adult_bounds = get_crop_bounds(bpy.data.objects, exclude_objects)
    if not adult_bounds:
        raise RuntimeError(f"No se encontraron mallas válidas en {adult_blend}")

    adult_world_height = adult_bounds["size"].z
    # Altura proyectada con escala 1.0:
    res_y = 200.0
    projected_px_at_scale_1 = (adult_world_height * math.cos(math.radians(30)) / ORTHO_SCALE) * res_y
    scale_factor = target_height_px / projected_px_at_scale_1

    print(f"\n🌿 Procesando cultivo {crop_code} ({label}):")
    print(f"  Modelo adulto de referencia: {adult_model}")
    print(f"  Altura mundo adulto: {adult_world_height:.4f} m")
    print(f"  Altura objetivo: {target_height_px} px -> Factor de escala único: {scale_factor:.4f}")

    # 2. Renderizar cada etapa fenológica
    results = []
    for phase_name, model_name in stages.items():
        blend_path = os.path.join(vendor_dir, f"{model_name}.blend")
        if not os.path.exists(blend_path):
            print(f"  ⚠️ Modelo no encontrado: {blend_path}, omitiendo fase {phase_name}")
            continue

        bpy.ops.wm.open_mainfile(filepath=blend_path)
        scene = bpy.context.scene
        scene_setup.setup_scene(scene, ortho_scale=ORTHO_SCALE, target_bottom_px=TARGET_BOTTOM_PX, outline=outline)

        # Ocultar o eliminar objetos excluidos
        for obj in list(bpy.data.objects):
            if obj.name in exclude_objects:
                bpy.data.objects.remove(obj, do_unlink=True)

        bounds = get_crop_bounds(bpy.data.objects, exclude_objects)
        if not bounds:
            print(f"  ⚠️ Sin mallas válidas en {model_name}")
            continue

        # Asegurar que todas las colecciones y capas de vista estén visibles para render
        for col in bpy.data.collections:
            col.hide_render = False
        for lc in bpy.context.view_layer.layer_collection.children:
            lc.exclude = False

        # Centrar XY en (0, 0), apoyar Z min en 0 y asegurar visibilidad
        offset_x = -bounds["center_xy"].x
        offset_y = -bounds["center_xy"].y
        offset_z = -bounds["min"].z

        for obj in bounds["objects"]:
            obj.hide_render = False
            obj.hide_viewport = False
            # Aplicar offset para anclar base al origen
            obj.location.x += offset_x
            obj.location.y += offset_y
            obj.location.z += offset_z
            # Aplicar escala unificada del cultivo
            obj.scale *= scale_factor

        bpy.context.view_layer.update()

        # Recalcular proyección de bounding box
        cam_obj = scene.camera
        res_x = scene.render.resolution_x
        res_y = scene.render.resolution_y

        def compute_pixel_bounds():
            all_uvs = []
            for obj in bounds["objects"]:
                # Proyectar vértices reales de la malla para precisión subpíxel exacta
                for v in obj.data.vertices:
                    world_pt = obj.matrix_world @ v.co
                    uv = world_to_camera_view(scene, cam_obj, world_pt)
                    all_uvs.append((uv.x * res_x, (1.0 - uv.y) * res_y))
            return (
                min(pt[0] for pt in all_uvs),
                max(pt[0] for pt in all_uvs),
                min(pt[1] for pt in all_uvs),
                max(pt[1] for pt in all_uvs),
            )

        min_px_x, max_px_x, min_px_y, max_px_y = compute_pixel_bounds()

        # Ajuste fino de shift_y para que la base inferior toque exactamente TARGET_BOTTOM_PX
        shift_diff_px = TARGET_BOTTOM_PX - max_px_y
        cam_obj.data.shift_y += (shift_diff_px / res_y)
        bpy.context.view_layer.update()

        min_px_x, max_px_x, min_px_y, max_px_y = compute_pixel_bounds()

        if min_px_x < -2 or max_px_x > res_x + 2 or min_px_y < -2 or max_px_y > res_y + 2:
            raise RuntimeError(f"El sprite {crop_code}-{phase_name} excede el cuadro: X[{min_px_x:.1f}, {max_px_x:.1f}], Y[{min_px_y:.1f}, {max_px_y:.1f}]")

        out_png = os.path.abspath(os.path.join(out_crop_dir, f"{phase_name}.png"))
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)

        file_size_kb = os.path.getsize(out_png) / 1024.0
        results.append({
            "phase": phase_name,
            "model": model_name,
            "png": out_png,
            "kb": round(file_size_kb, 1),
            "bounds_y": [round(min_px_y, 1), round(max_px_y, 1)],
            "height_px": round(max_px_y - min_px_y, 1),
        })
        print(f"  ✓ {phase_name.ljust(14)} ({model_name}) -> {file_size_kb:.1f} KB | altura: {max_px_y - min_px_y:.1f} px | base Y: {max_px_y:.1f} px")

    print(f"✅ Cultivo {crop_code} renderizado ({len(results)} fases) en: {out_crop_dir}\n")
    return results

def main():
    try:
        args = parse_cli_args()
        if args.calibrate:
            run_calibration(args.out)
        elif args.crop:
            render_crop(args.crop, args.config, args.out, outline=args.outline)
        else:
            print("Especifique --calibrate o --crop <CODE>")
            sys.exit(1)
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print(f"❌ Error fatal en render_crop.py:\n{err_msg}")
        try:
            with open("assets-src/out/error.txt", "w", encoding="utf-8") as f:
                f.write(err_msg)
        except Exception:
            pass
        sys.exit(1)

if __name__ == "__main__":
    main()

