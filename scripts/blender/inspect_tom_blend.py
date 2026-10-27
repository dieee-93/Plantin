import bpy

blend_path = "assets-src/crops/TOM.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

with open("assets-src/out/tom_blend_structure.txt", "w", encoding="utf-8") as out:
    out.write("\n--- COLECCIONES Y OBJETOS EN TOM.BLEND ---\n")
    for col in bpy.data.collections:
        out.write(f"Colección: {col.name}\n")
        for obj in col.objects:
            dims = obj.dimensions
            out.write(f"  Objeto: {obj.name} (tipo: {obj.type}, verts: {len(obj.data.vertices) if obj.type == 'MESH' else 0})\n")
            out.write(f"    Dims: X={dims.x:.3f}, Y={dims.y:.3f}, Z={dims.z:.3f}\n")
            for i, s in enumerate(obj.material_slots):
                out.write(f"    Slot {i}: {s.material.name if s.material else 'None'}\n")
