import bpy
import bmesh
from mathutils import Vector

blend_path = "assets-src/crops/TOM.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("\n🌿 Mejorando materiales y geometría en TOM.blend...")

# 1. Ajustar Materiales
mat_red = bpy.data.materials.get("Red")
if mat_red and mat_red.use_nodes:
    bsdf = mat_red.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.92, 0.05, 0.05, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.22
        if 'Specular IOR Level' in bsdf.inputs:
            bsdf.inputs['Specular IOR Level'].default_value = 0.85
        elif 'Specular' in bsdf.inputs:
            bsdf.inputs['Specular'].default_value = 0.85
        print("  ✅ Material 'Red' actualizado a rojo tomate brillante y reflectivo")

mat_green = bpy.data.materials.get("Green")
if mat_green and mat_green.use_nodes:
    bsdf = mat_green.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.16, 0.58, 0.20, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.35
        print("  ✅ Material 'Green' actualizado a verde vegetal vivo")

# 2. Encontrar objetos en stage5 (fruiting) y escalar los frutos
stage5_col = bpy.data.collections.get("stage5")
if stage5_col:
    for obj in stage5_col.objects:
        if obj.type != 'MESH':
            continue
        
        bm = bmesh.new()
        bm.from_mesh(obj.data)
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

        print(f"  🌱 Objeto {obj.name}: {len(clusters)} tomates encontrados. Escalando a 2.4x...")
        for cluster in clusters:
            verts = list({v for face in cluster for v in face.verts})
            center = sum((v.co for v in verts), Vector()) / len(verts)
            for v in verts:
                v.co = center + (v.co - center) * 2.4

        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()

# Guardar cambios en TOM.blend
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("💾 Cambios guardados en assets-src/crops/TOM.blend")
