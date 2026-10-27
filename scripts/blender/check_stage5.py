import bpy

blend_path = "assets-src/crops/TOM.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)
col5 = bpy.data.collections.get("stage5")
with open("assets-src/out/stage5_check.txt", "w", encoding="utf-8") as out:
    for o in col5.objects:
        out.write(f"Stage5 object: {o.name}\n")
        out.write(f"  Vertices: {len(o.data.vertices)}\n")
        out.write(f"  Faces: {len(o.data.polygons)}\n")
        out.write(f"  Dims: {o.dimensions}\n")
