import bpy
import os
import bmesh

def generate_stages():
    base_glb = os.path.abspath("public/models/plants/plant_tomato_clay_a01.glb")
    models_dir = os.path.abspath("public/models/plants")
    
    # 1. Load base 30k model
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=base_glb)
    
    mesh_obj = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    mat = mesh_obj.data.materials[0]
    image = None
    for node in mat.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            image = node.image
            break
            
    if not image:
        raise RuntimeError("No texture image found on material")
        
    w, h = image.size
    pixels = list(image.pixels)
    mesh = mesh_obj.data
    uv_layer = mesh.uv_layers.active.data
    
    # Classify polygons
    tomato_poly_indices = set()
    flower_poly_indices = set()
    
    for poly in mesh.polygons:
        u_sum = sum(uv_layer[li].uv.x for li in poly.loop_indices)
        v_sum = sum(uv_layer[li].uv.y for li in poly.loop_indices)
        n = len(poly.loop_indices)
        u = (u_sum / n) % 1.0
        v = (v_sum / n) % 1.0
        
        px = int(u * w)
        py = int(v * h)
        idx = (py * w + px) * 4
        
        r = pixels[idx]
        g = pixels[idx + 1]
        b = pixels[idx + 2]
        
        if r > 0.35 and r > g * 1.35 and r > b * 1.35:
            tomato_poly_indices.add(poly.index)
        elif r > 0.4 and g > 0.35 and b < 0.25 and (r + g) > 0.8:
            flower_poly_indices.add(poly.index)
            
    print(f"Total: {len(mesh.polygons)} | Tomatoes: {len(tomato_poly_indices)} | Flowers: {len(flower_poly_indices)}")

    # Helper to export current mesh
    def export_current(out_filename):
        out_path = os.path.join(models_dir, out_filename)
        bpy.ops.object.mode_set(mode='OBJECT')
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format='GLB',
            use_selection=True,
            export_apply=True,
            export_yup=True
        )
        size_mb = os.path.getsize(out_path) / (1024 * 1024)
        poly_count = len(mesh_obj.data.polygons)
        print(f"Exported {out_filename}: {poly_count} faces, {size_mb:.2f} MB")

    # --- STAGE: FLOWERING (Remove tomatoes) ---
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(mesh_obj.data)
    bm.faces.ensure_lookup_table()
    
    faces_to_delete = [bm.faces[i] for i in tomato_poly_indices if i < len(bm.faces)]
    bmesh.ops.delete(bm, geom=faces_to_delete, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.update_edit_mesh(mesh_obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    export_current("plant_tomato_clay_flowering.glb")

    # --- STAGE: VEGETATIVE (Remove flowers from flowering) ---
    # Need to re-classify remaining faces for flowers in current bm
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(mesh_obj.data)
    bm.faces.ensure_lookup_table()
    uv_lay = bm.loops.layers.uv.active
    
    flower_faces = []
    for f in bm.faces:
        u = sum(l[uv_lay].uv.x for l in f.loops) / len(f.loops) % 1.0
        v = sum(l[uv_lay].uv.y for l in f.loops) / len(f.loops) % 1.0
        px = int(u * w)
        py = int(v * h)
        idx = (py * w + px) * 4
        r, g, b = pixels[idx], pixels[idx+1], pixels[idx+2]
        if r > 0.4 and g > 0.35 and b < 0.25 and (r + g) > 0.8:
            flower_faces.append(f)
            
    bmesh.ops.delete(bm, geom=flower_faces, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.update_edit_mesh(mesh_obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    export_current("plant_tomato_clay_vegetative.glb")

    # --- STAGE: SEEDLING (Cut top 75%, keep bottom 25% height) ---
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(mesh_obj.data)
    bm.faces.ensure_lookup_table()
    
    # Bottom elevation in world: find min Z and cut anything above min Z + 0.22m
    min_z = min(v.co.z for v in bm.verts)
    cutoff_z = min_z + 0.22
    
    high_faces = [f for f in bm.faces if any(v.co.z > cutoff_z for v in f.verts)]
    bmesh.ops.delete(bm, geom=high_faces, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.update_edit_mesh(mesh_obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Scale slightly for seedling realism
    mesh_obj.scale = (0.7, 0.7, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    
    export_current("plant_tomato_clay_seedling.glb")

    with open("scratch_stages_done.txt", "w", encoding="utf-8") as f:
        f.write("STAGES_GENERATED_SUCCESSFULLY")

if __name__ == "__main__":
    generate_stages()
