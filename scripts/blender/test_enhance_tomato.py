import bpy
import os
import math
from mathutils import Vector

# Importar configuración de escena
import sys
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)
import scene_setup
from render_crop import get_crop_bounds, compute_pixel_bounds, ORTHO_SCALE, TARGET_BOTTOM_PX

vendor_blend = "assets-src/vendor/quaternius-crops/Blends/Tomato_4.blend"
out_orig = os.path.abspath("scripts/out/test_tomato_original.png")
out_enh = os.path.abspath("scripts/out/test_tomato_enhanced.png")

# --- 1. RENDER ORIGINAL ---
bpy.ops.wm.open_mainfile(filepath=vendor_blend)
scene = bpy.context.scene
scene_setup.setup_scene(scene, ortho_scale=ORTHO_SCALE, target_bottom_px=TARGET_BOTTOM_PX)

for col in bpy.data.collections:
    col.hide_render = False
for lc in bpy.context.view_layer.layer_collection.children:
    lc.exclude = False

bounds = get_crop_bounds(bpy.data.objects, set(["Ground", "Soil", "Base"]))
scale_factor = 105.0 / ((bounds["size"].z * math.cos(math.radians(30)) / ORTHO_SCALE) * 200.0)

for obj in bounds["objects"]:
    obj.hide_render = False
    obj.location.x -= bounds["center_xy"].x
    obj.location.y -= bounds["center_xy"].y
    obj.location.z -= bounds["min"].z
    obj.scale *= scale_factor

bpy.context.view_layer.update()
cam_obj = scene.camera
px_bounds = compute_pixel_bounds(cam_obj, scene, bounds["objects"], 160, 200)
cam_obj.data.shift_y += (TARGET_BOTTOM_PX - px_bounds["max_y"]) / 200.0
bpy.context.view_layer.update()

scene.render.filepath = out_orig
bpy.ops.render.render(write_still=True)
print(f"✅ Render original guardado en: {out_orig}")

# --- 2. RENDER MEJORADO (COLORES VIBRANTES + FRUTOS ESCALADOS) ---
bpy.ops.wm.open_mainfile(filepath=vendor_blend)
scene = bpy.context.scene
scene_setup.setup_scene(scene, ortho_scale=ORTHO_SCALE, target_bottom_px=TARGET_BOTTOM_PX)

obj = bpy.data.objects.get("Tomato_4")

# A. Mejorar Materiales
mat_red = bpy.data.materials.get("Red")
if mat_red and mat_red.use_nodes:
    bsdf = mat_red.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        # Rojo tomate brillante y jugoso con brillo especular
        bsdf.inputs['Base Color'].default_value = (0.88, 0.06, 0.06, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.25
        if 'Specular IOR Level' in bsdf.inputs:
            bsdf.inputs['Specular IOR Level'].default_value = 0.8
        elif 'Specular' in bsdf.inputs:
            bsdf.inputs['Specular'].default_value = 0.8

mat_green = bpy.data.materials.get("Green")
if mat_green and mat_green.use_nodes:
    bsdf = mat_green.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        # Verde vegetal vivo y saludable
        bsdf.inputs['Base Color'].default_value = (0.16, 0.58, 0.20, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.35

# B. Escalar los frutos individuales (polígonos con mat_idx == 0)
import bmesh
bm = bmesh.new()
bm.from_mesh(obj.data)

# Agrupar caras de frutos conectadas
fruit_faces = [f for f in bm.faces if f.material_index == 0]
visited = set()
clusters = []

for f in fruit_faces:
    if f in visited:
        continue
    cluster = []
    queue = [f]
    visited.add(f)
    while queue:
        curr = queue.pop(0)
        cluster.append(curr)
        for edge in curr.edges:
            for neighbor in edge.link_faces:
                if neighbor.material_index == 0 and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
    clusters.append(cluster)

print(f"🌱 Encontrados {len(clusters)} tomates individuales. Escalando 2.2x...")

for cluster in clusters:
    # Centro del fruto
    verts = list({v for face in cluster for v in face.verts})
    center = sum((v.co for v in verts), Vector()) / len(verts)
    # Escalar alrededor de su centro
    for v in verts:
        v.co = center + (v.co - center) * 2.2

bm.to_mesh(obj.data)
bm.free()
obj.data.update()

# C. Aumentar ligeramente el sol principal para más vivacidad
sun = bpy.data.lights.get("SunMain")
if sun:
    sun.energy = 3.0
world = scene.world
if world and world.use_nodes:
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Strength'].default_value = 0.55

bounds = get_crop_bounds(bpy.data.objects, set(["Ground", "Soil", "Base"]))
scale_factor = 105.0 / ((bounds["size"].z * math.cos(math.radians(30)) / ORTHO_SCALE) * 200.0)

for o in bounds["objects"]:
    o.hide_render = False
    o.location.x -= bounds["center_xy"].x
    o.location.y -= bounds["center_xy"].y
    o.location.z -= bounds["min"].z
    o.scale *= scale_factor

bpy.context.view_layer.update()
cam_obj = scene.camera
px_bounds = compute_pixel_bounds(cam_obj, scene, bounds["objects"], 160, 200)
cam_obj.data.shift_y += (TARGET_BOTTOM_PX - px_bounds["max_y"]) / 200.0
bpy.context.view_layer.update()

scene.render.filepath = out_enh
bpy.ops.render.render(write_still=True)
print(f"🎉 Render mejorado guardado en: {out_enh}")

