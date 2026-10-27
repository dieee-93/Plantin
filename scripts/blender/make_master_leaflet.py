import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_leaflet_scene():
    """Configura la escena con iluminación de estudio cartoon y cámara oblicua 3/4."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonLeafletWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 0.35

    # Sol principal cálido Noroeste (revela el relieve y las nervaduras)
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.9
    sun_data.color = (1.0, 0.98, 0.94)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(16), math.radians(35))

    # Luz de relleno suave opuesta
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.1
    fill_data.color = (0.84, 0.90, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(30), math.radians(-20), math.radians(-145))

    # Rim light para acentuar el borde de los lóbulos
    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.5
    rim_data.color = (0.95, 1.0, 0.90)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-40), math.radians(20), math.radians(150))

    # Cámara ortográfica orientada a 38° de inclinación
    cam_data = bpy.data.cameras.new(name="LeafletCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_obj = bpy.data.objects.new(name="LeafletCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.rotation_euler = (math.radians(38), 0, math.radians(25))

    # Render 512x512
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except:
        scene.render.engine = 'BLENDER_EEVEE'

    scene.view_settings.view_transform = 'Standard'

    return scene, cam_obj

def create_materials():
    """Crea materiales cartoon botánicos con mapas de nervaduras y relieve (Bump)."""
    # Rutas absolutas a las texturas generadas
    color_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_color.png")
    bump_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_bump.png")

    mat_leaf = bpy.data.materials.new("Cartoon_Tomato_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

    # Nodos principales
    out_node = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.34
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.35
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = 0.35
    if 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = 0.12
    elif 'Subsurface' in bsdf.inputs:
        bsdf.inputs['Subsurface'].default_value = 0.12

    links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])

    # Nodo de Textura UV para el color con nervaduras
    if os.path.exists(color_tex_path):
        tex_color = nodes.new(type='ShaderNodeTexImage')
        tex_color.image = bpy.data.images.load(color_tex_path)
        links.new(tex_color.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.055, 0.30, 0.040, 1.0)

    # Nodo de Bump para relieve 3D de las nervaduras y celdas acolchadas
    if os.path.exists(bump_tex_path):
        tex_bump = nodes.new(type='ShaderNodeTexImage')
        tex_bump.image = bpy.data.images.load(bump_tex_path)
        try:
            tex_bump.image.colorspace_settings.name = 'Non-Color'
        except:
            pass

        bump_node = nodes.new(type='ShaderNodeBump')
        bump_node.inputs['Strength'].default_value = 0.45
        bump_node.inputs['Distance'].default_value = 0.008

        links.new(tex_bump.outputs['Color'], bump_node.inputs['Height'])
        links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])

    # Material del pecíolo basal y nervadura cilíndrica
    mat_stem = bpy.data.materials.new("Cartoon_Leaf_Stem")
    mat_stem.use_nodes = True
    bsdf_s = mat_stem.node_tree.nodes.get("Principled BSDF")
    if bsdf_s:
        bsdf_s.inputs['Base Color'].default_value = (0.24, 0.56, 0.12, 1.0)
        bsdf_s.inputs['Roughness'].default_value = 0.32

    return mat_leaf, mat_stem

def build_single_master_leaflet():
    """
    Construye el FOLIOLO MAESTRO idéntico a la Foto 1 de referencia con coordenadas UV completas:
    - Base peciolar.
    - OREJAS BASALES redondeadas y amplias.
    - SENO PROFUNDO que corta hasta casi el nervio.
    - LÓBULO MEDIO ancho con festones ondulados hacia adelante.
    - HOMBROS SUB-APICALES amplios.
    - Ápice acuminado.
    - Mapeo UV [0,1]x[0,1] alineado para que cada nervadura coincida con su lóbulo.
    """
    mat_leaf, mat_stem = create_materials()

    mesh = bpy.data.meshes.new("Tomato_Leaflet_Master_Mesh")
    obj = bpy.data.objects.new("Tomato_Leaflet_Master", mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(mat_leaf) # Slot 0: Lámina foliar con textura y bump
    obj.data.materials.append(mat_stem) # Slot 1: Pecíolo

    MAT_LEAF = 0
    MAT_STEM = 1

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Perfil botánico de alta definición inspirado en la Foto 1:
    # (y_rel, ancho_rel, pillow_relief)
    profile = [
        (0.00, 0.08, 0.000),  # Inserción peciolar
        (0.04, 0.22, 0.001),  # Cuello
        (0.09, 0.65, 0.004),  # Subida rápida a la oreja basal
        (0.15, 0.98, 0.007),  # PICO DE LA OREJA BASAL (Foto 1)
        (0.21, 0.82, 0.004),  # Borde anterior de la oreja
        (0.27, 0.34, 0.000),  # SENO PROFUNDO (escotadura que corta la hoja)
        (0.34, 0.62, 0.004),  # Subida hacia el cuerpo principal
        (0.42, 0.94, 0.007),  # Primer lóbulo del cuerpo medio
        (0.50, 1.00, 0.008),  # LÓBULO MEDIO PRINCIPAL (máximo ancho)
        (0.58, 0.82, 0.003),  # Muesca media
        (0.66, 0.92, 0.007),  # Lóbulo superior (hombro ancho)
        (0.74, 0.78, 0.004),  # Muesca sub-apical
        (0.82, 0.62, 0.002),  # Segundo hombro sub-apical
        (0.89, 0.40, 0.001),  # Afinamiento
        (0.95, 0.20, 0.000),  # Pre-punta
        (1.00, 0.00, 0.000),  # Punta aguda
    ]

    leaflet_len = 0.28  # 28 cm de largo
    leaflet_wid = 0.17  # 17 cm de ancho

    # 11 columnas transversales
    u_cols = [-1.0, -0.80, -0.60, -0.40, -0.20, 0.0, 0.20, 0.40, 0.60, 0.80, 1.0]
    num_cols = len(u_cols)
    num_rows = len(profile)

    grid_verts = []
    grid_uvs = []

    for i, (y_rel, w_rel, pillow) in enumerate(profile):
        y_pos = leaflet_len * (y_rel - 0.5)
        drop_z = -0.042 * (y_rel ** 1.6) * leaflet_len

        # Festón botánico fino a lo largo del margen
        saw_phase = (y_rel * 8.0) % 1.0
        saw_tooth = 1.0 + 0.035 * (saw_phase ** 0.7 - 0.3) if y_rel > 0.30 else 1.0
        half_w = (leaflet_wid * 0.5) * w_rel * saw_tooth

        row_verts = []
        row_uvs = []
        for u in u_cols:
            abs_u = abs(u)
            x_pos = u * half_w

            # Forma en V / cuenca conduplicada
            v_cup = 0.0070 * (abs_u ** 1.5) * (1.0 - y_rel * 0.35)
            pillow_bump = pillow * math.sin(abs_u * math.pi) * 0.6

            z_pos = drop_z + v_cup + pillow_bump

            vert = bm.verts.new(Vector((x_pos, y_pos, z_pos)))
            row_verts.append(vert)

            # Mapeo UV [0, 1]
            u_coord = (u + 1.0) * 0.5
            v_coord = y_rel
            row_uvs.append((u_coord, v_coord))

        grid_verts.append(row_verts)
        grid_uvs.append(row_uvs)

    # Caras cuadriláteras con coordenadas UV asignadas
    for i in range(num_rows - 1):
        for j in range(num_cols - 1):
            v_bl = grid_verts[i][j]
            v_br = grid_verts[i][j + 1]
            v_tr = grid_verts[i + 1][j + 1]
            v_tl = grid_verts[i + 1][j]

            uv_bl = grid_uvs[i][j]
            uv_br = grid_uvs[i][j + 1]
            uv_tr = grid_uvs[i + 1][j + 1]
            uv_tl = grid_uvs[i + 1][j]

            unique_pairs = []
            for (v_c, uv_c) in [(v_bl, uv_bl), (v_br, uv_br), (v_tr, uv_tr), (v_tl, uv_tl)]:
                if not any(v_c == p[0] for p in unique_pairs):
                    unique_pairs.append((v_c, uv_c))

            if len(unique_pairs) >= 3:
                try:
                    face = bm.faces.new([p[0] for p in unique_pairs])
                    face.material_index = MAT_LEAF
                    face.smooth = True

                    # Asignar UVs a cada bucle de la cara
                    for loop in face.loops:
                        for (v_c, uv_c) in unique_pairs:
                            if loop.vert == v_c:
                                loop[uv_layer].uv = uv_c
                                break
                except ValueError:
                    pass

    # Peciolo basal cilíndrico
    pet_len = 0.045
    p_base = Vector((0, -leaflet_len * 0.5, 0))
    p_pet_start = p_base + Vector((0, -pet_len, -0.008))

    pet_ring_s = bmesh.ops.create_circle(
        bm, cap_ends=True, segments=8, radius=0.0055, matrix=Matrix.Translation(p_pet_start)
    )['verts']
    pet_ring_e = bmesh.ops.create_circle(
        bm, cap_ends=False, segments=8, radius=0.0045, matrix=Matrix.Translation(p_base)
    )['verts']

    for k in range(len(pet_ring_s)):
        f = bm.faces.new([
            pet_ring_s[k],
            pet_ring_s[(k + 1) % len(pet_ring_s)],
            pet_ring_e[(k + 1) % len(pet_ring_e)],
            pet_ring_e[k]
        ])
        f.material_index = MAT_STEM
        f.smooth = True

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    # Modificador Solidify para dar grosor físico de hoja (2.8mm)
    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0028
    sol_mod.offset = 0.0
    sol_mod.use_rim = True

    # Modificador Subdivision Surface para curvatura impecable
    sub_mod = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub_mod.levels = 2
    sub_mod.render_levels = 2

    return obj

def frame_camera(scene, cam_obj, obj):
    """Centra la cámara sobre el foliolo maestro asegurando encuadre completo."""
    bpy.context.view_layer.update()
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    center = sum(bbox, Vector((0, 0, 0))) / 8.0

    min_c = Vector((min(c[0] for c in bbox), min(c[1] for c in bbox), min(c[2] for c in bbox)))
    max_c = Vector((max(c[0] for c in bbox), max(c[1] for c in bbox), max(c[2] for c in bbox)))
    diag = (max_c - min_c).length

    cam_rot = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = center + cam_rot @ Vector((0, 0, 10.0))
    cam_obj.data.ortho_scale = diag * 0.90

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\leaflet_master.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando creación del Foliolo Maestro V4 (Nervaduras Botánicas + Textura y Bump)...\n")

        scene, cam_obj = setup_leaflet_scene()
        obj = build_single_master_leaflet()

        # Inclinación diagonal elegante para mostrar la silueta y relieve (como la foto 1)
        obj.rotation_euler = (math.radians(10), math.radians(-15), math.radians(20))

        frame_camera(scene, cam_obj, obj)

        blend_file = os.path.abspath(r"assets-src/crops/TOMATO_LEAFLET_MASTER.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_leaflet_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Render 3D completado con éxito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
