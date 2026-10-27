import bpy

bpy.ops.wm.open_mainfile(filepath="assets-src/vendor/quaternius-crops/Blends/Tomato_4.blend")
obj = bpy.data.objects.get("Tomato_4")

with open("assets-src/out/tomato_mesh_details.txt", "w", encoding="utf-8") as out:
    out.write(f"Mesh: {obj.name}\n")
    # Analizar polígonos por material
    poly_mat_counts = {}
    for p in obj.data.polygons:
        mat_idx = p.material_index
        poly_mat_counts[mat_idx] = poly_mat_counts.get(mat_idx, 0) + 1
    
    out.write(f"Polígonos por material: {poly_mat_counts}\n")
    for slot_idx, slot in enumerate(obj.material_slots):
        out.write(f"Slot {slot_idx}: {slot.material.name} -> {poly_mat_counts.get(slot_idx, 0)} polys\n")

    # Calcular bounding box de los polígonos del fruto (Slot 0 = Red)
    red_verts = set()
    for p in obj.data.polygons:
        if p.material_index == 0:
            for v_idx in p.vertices:
                red_verts.add(v_idx)
    
    if red_verts:
        coords = [obj.data.vertices[i].co for i in red_verts]
        min_x = min(c.x for c in coords)
        max_x = max(c.x for c in coords)
        min_y = min(c.y for c in coords)
        max_y = max(c.y for c in coords)
        min_z = min(c.z for c in coords)
        max_z = max(c.z for c in coords)
        out.write(f"Tomates (Red) - Vertices: {len(red_verts)}\n")
        out.write(f"  Bounds X: [{min_x:.3f}, {max_x:.3f}] (ancho: {max_x-min_x:.3f} m)\n")
        out.write(f"  Bounds Y: [{min_y:.3f}, {max_y:.3f}]\n")
        out.write(f"  Bounds Z: [{min_z:.3f}, {max_z:.3f}] (altura: {max_z-min_z:.3f} m)\n")
