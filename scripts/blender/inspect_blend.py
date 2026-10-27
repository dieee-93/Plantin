import bpy

out_path = r"I:\Programacion\Proyectos\plantin\scripts\out\tom_collections.txt"
with open(out_path, "w", encoding="utf-8") as f:
    for c in bpy.data.collections:
        f.write(f"Collection: {c.name}\n")
        for o in c.objects:
            f.write(f"  Object: {o.name} (type: {o.type})\n")
    f.write("\nAll Objects:\n")
    for o in bpy.data.objects:
        f.write(f"Obj: {o.name} (type: {o.type})\n")
