import bpy
import os

# Clean factory settings
bpy.ops.wm.read_factory_settings(use_empty=True)

raw_glb = os.path.abspath("public/models/plants/plant_tomato_clay_a01_raw.glb")
out_glb = os.path.abspath("public/models/plants/plant_tomato_clay_a01.glb")

print(f"Importing {raw_glb}...")
bpy.ops.import_scene.gltf(filepath=raw_glb)

mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
if not mesh_objs:
    raise RuntimeError("No mesh objects found in GLB")

main_obj = mesh_objs[0]
bpy.context.view_layer.objects.active = main_obj
main_obj.select_set(True)

initial_faces = len(main_obj.data.polygons)
initial_verts = len(main_obj.data.vertices)
print(f"Initial: {initial_verts} verts, {initial_faces} faces")

# 1. Clean up loose and duplicates in edit mode
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.0002)
bpy.ops.mesh.delete_loose()
bpy.ops.object.mode_set(mode='OBJECT')

after_clean_faces = len(main_obj.data.polygons)
print(f"After clean: {len(main_obj.data.vertices)} verts, {after_clean_faces} faces")

# 2. Add Decimate modifier
decimate_mod = main_obj.modifiers.new(name="Decimate", type='DECIMATE')
decimate_mod.decimate_type = 'COLLAPSE'
# Target around 30,000 faces
target_faces = 30000
ratio = max(0.005, min(1.0, target_faces / float(after_clean_faces)))
decimate_mod.ratio = ratio
decimate_mod.use_collapse_triangulate = True
print(f"Applying Decimate with ratio {ratio:.5f} (target ~{target_faces} faces)...")

# Apply modifier
bpy.ops.object.modifier_apply(modifier="Decimate")

final_faces = len(main_obj.data.polygons)
final_verts = len(main_obj.data.vertices)
print(f"Final: {final_verts} verts, {final_faces} faces")

# 3. Apply all transforms
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# 4. Recalculate normals
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

# 5. Export clean GLB
print(f"Exporting optimized GLB to {out_glb}...")
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_yup=True
)

file_size_mb = os.path.getsize(out_glb) / (1024 * 1024)
log_msg = f"SUCCESS: Exported {out_glb} ({file_size_mb:.2f} MB, {final_faces} faces, {final_verts} verts)"
print(log_msg)

with open("scratch_opt_result.txt", "w", encoding="utf-8") as f:
    f.write(log_msg)
