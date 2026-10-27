import bpy
import bmesh
from mathutils import Vector, Matrix
import math

blend_path = "assets-src/crops/TOM.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("\n🌿 Enriqueciendo geometría y volumen en TOM.blend...")

# 1. Unificar y vivificar todos los materiales Green y Red
for mat in bpy.data.materials:
    if mat.use_nodes and mat.node_tree:
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if not bsdf:
            continue
        if "Green" in mat.name:
            bsdf.inputs['Base Color'].default_value = (0.16, 0.58, 0.20, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.35
        elif "Red" in mat.name:
            bsdf.inputs['Base Color'].default_value = (0.92, 0.05, 0.05, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.22
            if 'Specular IOR Level' in bsdf.inputs:
                bsdf.inputs['Specular IOR Level'].default_value = 0.85
            elif 'Specular' in bsdf.inputs:
                bsdf.inputs['Specular'].default_value = 0.85

# Crear material Yellow para floración si no existe
mat_yellow = bpy.data.materials.get("Yellow")
if not mat_yellow:
    mat_yellow = bpy.data.materials.new(name="Yellow")
    mat_yellow.use_nodes = True
    bsdf = mat_yellow.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.98, 0.85, 0.12, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.3

# 2. Enriquecer stage5 (Tomato_4 - Fructificación)
col5 = bpy.data.collections.get("stage5")
obj5 = col5.objects.get("Tomato_4") if col5 else None
if obj5:
    bm = bmesh.new()
    bm.from_mesh(obj5.data)

    leaf_faces = [f for f in bm.faces if f.material_index == 1]
    fruit_faces = [f for f in bm.faces if f.material_index == 0]

    # Engrosar tallo central: vértices cercanos al eje Z
    for v in bm.verts:
        dist_xy = math.sqrt(v.co.x**2 + v.co.y**2)
        if dist_xy < 0.055 and v.co.z < 1.4:
            v.co.x *= 1.35
            v.co.y *= 1.35

    # Duplicar y rotar hojas para crear una copa tupida
    top_leaf_faces = [f for f in leaf_faces if f.calc_center_median().z > 0.45]
    if top_leaf_faces:
        rot_mat = Matrix.Rotation(math.radians(110), 4, 'Z')
        new_geom = bmesh.ops.duplicate(bm, geom=top_leaf_faces)
        new_verts = [v for v in new_geom["geom"] if isinstance(v, bmesh.types.BMVert)]
        for v in new_verts:
            v.co = rot_mat @ v.co
            v.co.z += 0.06
            v.co.x *= 1.05
            v.co.y *= 1.05

        rot_mat2 = Matrix.Rotation(math.radians(-85), 4, 'Z')
        new_geom2 = bmesh.ops.duplicate(bm, geom=top_leaf_faces)
        new_verts2 = [v for v in new_geom2["geom"] if isinstance(v, bmesh.types.BMVert)]
        for v in new_verts2:
            v.co = rot_mat2 @ v.co
            v.co.z -= 0.10
            v.co.x *= 0.95
            v.co.y *= 0.95

    # Duplicar y colocar otro racimo de tomates en el lado opuesto
    if fruit_faces:
        rot_fruit = Matrix.Rotation(math.radians(130), 4, 'Z')
        fruit_geom = bmesh.ops.duplicate(bm, geom=fruit_faces)
        fruit_verts = [v for v in fruit_geom["geom"] if isinstance(v, bmesh.types.BMVert)]
        for v in fruit_verts:
            v.co = rot_fruit @ v.co
            v.co.z += 0.04
            v.co.x *= 1.08
            v.co.y *= 1.08

    bm.to_mesh(obj5.data)
    bm.free()
    obj5.data.update()
    print("  ✅ Stage 5 enriquecido con copa tupida y racimos de tomate abundantes")

# 3. Enriquecer stage4 (Tomato_3.001 - Floración) con flores amarillas
col4 = bpy.data.collections.get("stage4")
obj4 = col4.objects.get("Tomato_3.001") if col4 else None
if obj4:
    if "Yellow" not in [s.material.name for s in obj4.material_slots if s.material]:
        obj4.data.materials.append(mat_yellow)
    yellow_idx = [i for i, s in enumerate(obj4.material_slots) if s.material and s.material.name == "Yellow"][0]

    bm = bmesh.new()
    bm.from_mesh(obj4.data)

    top_leaf_faces = [f for f in bm.faces if f.calc_center_median().z > 0.4]
    if top_leaf_faces:
        rot_mat = Matrix.Rotation(math.radians(95), 4, 'Z')
        new_geom = bmesh.ops.duplicate(bm, geom=top_leaf_faces)
        for v in [v for v in new_geom["geom"] if isinstance(v, bmesh.types.BMVert)]:
            v.co = rot_mat @ v.co
            v.co.z += 0.05

    flower_positions = [
        Vector((-0.14, 0.12, 0.78)),
        Vector((0.16, -0.09, 0.95)),
        Vector((-0.10, -0.14, 1.15)),
        Vector((0.12, 0.14, 1.30)),
    ]
    for pos in flower_positions:
        res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.07, matrix=Matrix.Translation(pos))
        for f in res["faces"]:
            f.material_index = yellow_idx

    bm.to_mesh(obj4.data)
    bm.free()
    obj4.data.update()
    print("  ✅ Stage 4 enriquecido con flores amarillas llamativas y follaje")

# 4. Enriquecer stage3 (Tomato_3 - Estructura)
col3 = bpy.data.collections.get("stage3")
obj3 = col3.objects.get("Tomato_3") if col3 else None
if obj3:
    bm = bmesh.new()
    bm.from_mesh(obj3.data)
    top_leaf_faces = [f for f in bm.faces if f.calc_center_median().z > 0.4]
    if top_leaf_faces:
        rot_mat = Matrix.Rotation(math.radians(85), 4, 'Z')
        new_geom = bmesh.ops.duplicate(bm, geom=top_leaf_faces)
        for v in [v for v in new_geom["geom"] if isinstance(v, bmesh.types.BMVert)]:
            v.co = rot_mat @ v.co
            v.co.z += 0.04
    bm.to_mesh(obj3.data)
    bm.free()
    obj3.data.update()
    print("  ✅ Stage 3 enriquecido con volumen foliar vegetativo")

bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("💾 TOM.blend guardado con éxito.")
