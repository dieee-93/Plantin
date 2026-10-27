import bpy
import bmesh
from mathutils import Vector, Matrix
import math
import os

blend_path = "assets-src/crops/TOM.blend"
vendor_dir = "assets-src/vendor/quaternius-crops/Blends"

# Reabrir escena limpia y volver a importar desde vendor para tener la base perfecta
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

phase_to_vendor = {
    "stage1": "Tomato_1",
    "stage2": "Tomato_2",
    "stage3": "Tomato_3",
    "stage4": "Tomato_3",
    "stage5": "Tomato_4",
}

# 1. Crear materiales mejorados únicos
mat_red = bpy.data.materials.new(name="Red")
mat_red.use_nodes = True
bsdf_r = mat_red.node_tree.nodes.get("Principled BSDF")
bsdf_r.inputs['Base Color'].default_value = (0.94, 0.05, 0.05, 1.0)
bsdf_r.inputs['Roughness'].default_value = 0.22
if 'Specular IOR Level' in bsdf_r.inputs:
    bsdf_r.inputs['Specular IOR Level'].default_value = 0.85
elif 'Specular' in bsdf_r.inputs:
    bsdf_r.inputs['Specular'].default_value = 0.85

mat_green = bpy.data.materials.new(name="Green")
mat_green.use_nodes = True
bsdf_g = mat_green.node_tree.nodes.get("Principled BSDF")
bsdf_g.inputs['Base Color'].default_value = (0.16, 0.58, 0.20, 1.0)
bsdf_g.inputs['Roughness'].default_value = 0.35

mat_yellow = bpy.data.materials.new(name="Yellow")
mat_yellow.use_nodes = True
bsdf_y = mat_yellow.node_tree.nodes.get("Principled BSDF")
bsdf_y.inputs['Base Color'].default_value = (0.98, 0.86, 0.12, 1.0)
bsdf_y.inputs['Roughness'].default_value = 0.3

# 2. Cargar cada etapa desde vendor y enriquecer
for stage_name, vendor_model in phase_to_vendor.items():
    vendor_file = os.path.join(vendor_dir, f"{vendor_model}.blend")
    col = bpy.data.collections.new(stage_name)
    scene.collection.children.link(col)

    with bpy.data.libraries.load(vendor_file, link=False) as (data_from, data_to):
        data_to.objects = [o for o in data_from.objects if o not in ["Ground", "Soil", "Base"]]

    obj = data_to.objects[0]
    col.objects.link(obj)
    obj.name = f"Tomato_{stage_name}"
    obj.hide_render = False

    # Asignar materiales unificados
    for slot in obj.material_slots:
        if slot.material and "Red" in slot.material.name:
            slot.material = mat_red
        else:
            slot.material = mat_green

    # Enriquecer etapas avanzadas
    if stage_name == "stage5":
        # Asegurar slots
        obj.data.materials.clear()
        obj.data.materials.append(mat_red)    # slot 0
        obj.data.materials.append(mat_green)  # slot 1

        bm = bmesh.new()
        bm.from_mesh(obj.data)

        # A. Escalar los frutos existentes a 2.3x
        fruit_faces = [f for f in bm.faces if f.material_index == 0]
        visited = set()
        clusters = []
        for f in fruit_faces:
            if f in visited:
                continue
            cluster, queue = [], [f]
            visited.add(f)
            while queue:
                curr = queue.pop(0)
                cluster.append(curr)
                for edge in curr.edges:
                    for n in edge.link_faces:
                        if n.material_index == 0 and n not in visited:
                            visited.add(n)
                            queue.append(n)
            clusters.append(cluster)

        for cluster in clusters:
            verts = list({v for face in cluster for v in face.verts})
            center = sum((v.co for v in verts), Vector()) / len(verts)
            for v in verts:
                v.co = center + (v.co - center) * 2.3

        # B. Engrosar tallo central
        for v in bm.verts:
            if math.sqrt(v.co.x**2 + v.co.y**2) < 0.055 and v.co.z < 1.4:
                v.co.x *= 1.4
                v.co.y *= 1.4

        # C. Crear rama lateral izquierda (copa ancha arbustiva)
        # Seleccionar hojas y fruto superior
        upper_geom = [f for f in bm.faces if f.calc_center_median().z > 0.55]
        if upper_geom:
            left_dup = bmesh.ops.duplicate(bm, geom=upper_geom)
            # Matriz de transformación para rama izquierda: rotar en Y (-25°), en Z (75°), mover a la izquierda
            T_left = (
                Matrix.Translation(Vector((-0.18, 0.05, -0.22)))
                @ Matrix.Rotation(math.radians(-25), 4, 'Y')
                @ Matrix.Rotation(math.radians(75), 4, 'Z')
                @ Matrix.Scale(0.88, 4)
            )
            for v in [v for v in left_dup["geom"] if isinstance(v, bmesh.types.BMVert)]:
                v.co = T_left @ v.co

            # D. Crear rama lateral derecha
            right_dup = bmesh.ops.duplicate(bm, geom=upper_geom)
            T_right = (
                Matrix.Translation(Vector((0.20, -0.06, -0.35)))
                @ Matrix.Rotation(math.radians(30), 4, 'Y')
                @ Matrix.Rotation(math.radians(-85), 4, 'Z')
                @ Matrix.Scale(0.82, 4)
            )
            for v in [v for v in right_dup["geom"] if isinstance(v, bmesh.types.BMVert)]:
                v.co = T_right @ v.co

        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        print("  ✅ Stage 5 convertido en arbusto frondoso con ramas laterales y tomates abundantes")

    elif stage_name == "stage4":
        # Floración: Agregar material amarillo y 5 flores en axilas
        obj.data.materials.clear()
        obj.data.materials.append(mat_green)   # slot 0
        obj.data.materials.append(mat_yellow)  # slot 1

        bm = bmesh.new()
        bm.from_mesh(obj.data)

        # Dar volumen lateral a las hojas
        upper_geom = [f for f in bm.faces if f.calc_center_median().z > 0.45]
        if upper_geom:
            dup = bmesh.ops.duplicate(bm, geom=upper_geom)
            T = Matrix.Rotation(math.radians(95), 4, 'Z') @ Matrix.Scale(0.9, 4)
            for v in [v for v in dup["geom"] if isinstance(v, bmesh.types.BMVert)]:
                v.co = T @ v.co
                v.co.z -= 0.1

        # Crear flores amarillas brillantes
        flower_spots = [
            Vector((-0.18, 0.10, 0.70)),
            Vector((0.18, -0.08, 0.85)),
            Vector((-0.10, -0.15, 1.05)),
            Vector((0.12, 0.14, 1.20)),
            Vector((0.02, -0.10, 1.35)),
        ]
        for spot in flower_spots:
            ico = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.08, matrix=Matrix.Translation(spot))
            for f in ico["faces"]:
                f.material_index = 1

        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        print("  ✅ Stage 4 enriquecido con 5 flores amarillas visibles")

    elif stage_name == "stage3":
        # Estructura foliar vegetativa
        obj.data.materials.clear()
        obj.data.materials.append(mat_green)

        bm = bmesh.new()
        bm.from_mesh(obj.data)
        upper_geom = [f for f in bm.faces if f.calc_center_median().z > 0.45]
        if upper_geom:
            dup = bmesh.ops.duplicate(bm, geom=upper_geom)
            T = Matrix.Rotation(math.radians(80), 4, 'Z') @ Matrix.Scale(0.85, 4)
            for v in [v for v in dup["geom"] if isinstance(v, bmesh.types.BMVert)]:
                v.co = T @ v.co
                v.co.z -= 0.08

        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        print("  ✅ Stage 3 enriquecido con volumen foliar")

# Guardar cambios
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"🎉 Guardado exitosamente en: {blend_path}")
