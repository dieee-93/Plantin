import bpy

blend_path = "assets-src/crops/TOM.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)
col4 = bpy.data.collections.get("stage4")
for o in col4.objects:
    print(f"Stage4 obj: {o.name}, verts: {len(o.data.vertices)}")
    for i, s in enumerate(o.material_slots):
        print(f"  slot {i}: {s.material.name if s.material else 'None'}")
    poly_mats = [p.material_index for p in o.data.polygons]
    print(f"  materials used in polygons: {set(poly_mats)}")
