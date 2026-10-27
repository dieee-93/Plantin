import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_leaflet_scene():
    """Configura la escena con iluminacion toon botanica limpia y camara ortografica oblicua."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonLeafletWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 0.35

    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 3.0
    sun_data.color = (1.0, 0.98, 0.94)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(48), math.radians(16), math.radians(35))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.1
    fill_data.color = (0.84, 0.90, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(30), math.radians(-20), math.radians(-145))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.4
    rim_data.color = (0.95, 1.0, 0.90)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-40), math.radians(20), math.radians(150))

    cam_data = bpy.data.cameras.new(name="LeafletCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 0.40
    cam_obj = bpy.data.objects.new(name="LeafletCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.rotation_euler = (math.radians(42), 0, math.radians(25))
    rot_mat = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = rot_mat @ Vector((0, 0, 5.0)) + Vector((0, 0, 0.05))

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
    """Crea materiales toon botanicos con el autentico verde vivo de Cannabis."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    color_tex_path = os.path.join(this_dir, "textures", "cannabis_leaflet_color.png")
    bump_tex_path = os.path.join(this_dir, "textures", "cannabis_leaflet_bump.png")

    mat_leaf = bpy.data.materials.new("Mat_Cannabis_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

    out_node = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.38
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.32
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = 0.32
    if 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = 0.12
        if 'Subsurface Radius' in bsdf.inputs:
            bsdf.inputs['Subsurface Radius'].default_value = (0.5, 0.8, 0.2)

    links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])

    if os.path.exists(color_tex_path):
        tex_color = nodes.new(type='ShaderNodeTexImage')
        tex_color.image = bpy.data.images.load(color_tex_path)
        links.new(tex_color.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.09, 0.32, 0.10, 1.0)

    if os.path.exists(bump_tex_path):
        tex_bump = nodes.new(type='ShaderNodeTexImage')
        tex_bump.image = bpy.data.images.load(bump_tex_path)
        try:
            tex_bump.image.colorspace_settings.name = 'Non-Color'
        except:
            pass

        bump_node = nodes.new(type='ShaderNodeBump')
        bump_node.inputs['Strength'].default_value = 0.28
        bump_node.inputs['Distance'].default_value = 0.006

        links.new(tex_bump.outputs['Color'], bump_node.inputs['Height'])
        links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])

    # Material del peciolo / peciolulo (verde con sutil toque rojizo en la base)
    mat_petiole = bpy.data.materials.new("Mat_Cannabis_Petiole")
    mat_petiole.use_nodes = True
    bsdf_p = mat_petiole.node_tree.nodes.get("Principled BSDF")
    if bsdf_p:
        bsdf_p.inputs['Base Color'].default_value = (0.16, 0.38, 0.12, 1.0)
        bsdf_p.inputs['Roughness'].default_value = 0.35

    return mat_leaf, mat_petiole

def build_single_master_leaflet():
    """
    Construye el FOLIOLO MAESTRO de Cannabis sativa / indica:
    - Silueta lanceolada aserrada (dientes agudos hacia adelante).
    - Nervio central con curvatura descendente organica.
    - Curvatura transversal y mapeo UV optimizado.
    """
    mat_leaf, mat_petiole = create_materials()

    mesh = bpy.data.meshes.new("Cannabis_Leaflet_Master_Mesh")
    obj = bpy.data.objects.new("Cannabis_Leaflet_Master", mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(mat_leaf)
    obj.data.materials.append(mat_petiole)

    MAT_LEAF = 0
    MAT_PETIOLE = 1

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    L = 0.28  # Largo del foliolo maestro (28 cm de foliolo central adulto)
    W = 0.068 # Ancho maximo proporcionado (relacion de aspecto ~4:1 tipica de sativa/hibrido vigoroso)

    # Margen derecho con dientes de sierra agudos (u: ancho relativo, v: altura relativa de 0.0 a 1.0)
    right_margin = [
        # Base y peciolulo liso
        (0.04, 0.00),
        (0.10, 0.04),
        (0.20, 0.08),
        (0.35, 0.12),

        # Diente 1
        (0.52, 0.16),
        (0.38, 0.175), # Seno

        # Diente 2
        (0.66, 0.22),
        (0.48, 0.235),

        # Diente 3
        (0.80, 0.28),
        (0.60, 0.295),

        # Diente 4
        (0.92, 0.35),
        (0.70, 0.365),

        # Diente 5 (zona de mayor anchura ~0.42 - 0.48)
        (0.98, 0.42),
        (0.75, 0.435),

        # Diente 6
        (1.00, 0.49),
        (0.76, 0.505),

        # Diente 7
        (0.95, 0.56),
        (0.72, 0.575),

        # Diente 8
        (0.88, 0.63),
        (0.65, 0.645),

        # Diente 9
        (0.78, 0.70),
        (0.56, 0.715),

        # Diente 10
        (0.66, 0.77),
        (0.46, 0.785),

        # Diente 11
        (0.52, 0.84),
        (0.34, 0.855),

        # Diente 12
        (0.36, 0.91),
        (0.22, 0.925),

        # Apice acuminado estrecho
        (0.12, 0.96),
        (0.04, 0.985),
        (0.00, 1.00),
    ]

    # Margen izquierdo simetrico
    left_margin = [(-u, v) for (u, v) in right_margin]

    num_pts = len(right_margin)

    # 1. Crear vertices del nervio central (midrib) con curvatura botánica realista
    midrib_verts = []
    for k in range(num_pts):
        v_mid = right_margin[k][1]
        y_pos = L * v_mid
        # Arco parabolico suave: sube levemente al inicio y cae suavemente hacia la punta
        drop_z = -0.048 * (v_mid ** 1.7) * L + 0.008 * math.sin(v_mid * math.pi) * L
        midrib_v = bm.verts.new(Vector((0.0, y_pos, drop_z)))
        midrib_verts.append((midrib_v, v_mid))

    # 2. Grilla transversal derecha (3 subdivisiones desde nervio a borde)
    right_grid = []
    for k in range(num_pts):
        u_target, v_target = right_margin[k]
        v_mid = midrib_verts[k][1]
        row = [midrib_verts[k][0]]
        for col_idx in [1, 2, 3]:
            frac = col_idx / 3.0
            u_c = u_target * frac
            v_c = v_mid
            x_pos = (W * 0.5) * u_c
            y_pos = L * v_c
            drop_z = -0.048 * (v_c ** 1.7) * L + 0.008 * math.sin(v_c * math.pi) * L
            # Ligera V-shape transversal (la hoja se pliega sutilmente en el nervio)
            v_cup = 0.006 * (frac ** 1.2) * (1.0 - v_c * 0.4)
            z_pos = drop_z + v_cup
            row.append(bm.verts.new(Vector((x_pos, y_pos, z_pos))))
        right_grid.append(row)

    # 3. Grilla transversal izquierda
    left_grid = []
    for k in range(num_pts):
        u_target, v_target = left_margin[k]
        v_mid = midrib_verts[k][1]
        row = [midrib_verts[k][0]]
        for col_idx in [1, 2, 3]:
            frac = col_idx / 3.0
            u_c = u_target * frac
            v_c = v_mid
            x_pos = (W * 0.5) * u_c
            y_pos = L * v_c
            drop_z = -0.048 * (v_c ** 1.7) * L + 0.008 * math.sin(v_c * math.pi) * L
            v_cup = 0.006 * (frac ** 1.2) * (1.0 - v_c * 0.4)
            z_pos = drop_z + v_cup
            row.append(bm.verts.new(Vector((x_pos, y_pos, z_pos))))
        left_grid.append(row)

    # 4. Crear caras quad entre los vertices de la grilla
    for i in range(num_pts - 1):
        for j in range(3):
            # Lado derecho
            v1 = right_grid[i][j]
            v2 = right_grid[i][j + 1]
            v3 = right_grid[i + 1][j + 1]
            v4 = right_grid[i + 1][j]
            unique_r = []
            for v in [v1, v2, v3, v4]:
                if v not in unique_r:
                    unique_r.append(v)
            if len(unique_r) >= 3:
                try:
                    f = bm.faces.new(unique_r)
                    f.material_index = MAT_LEAF
                    f.smooth = True
                    for loop in f.loops:
                        u_uv = (loop.vert.co.x / (W * 0.5)) * 0.45 + 0.5
                        v_uv = loop.vert.co.y / L
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, v_uv)))
                except ValueError:
                    pass

            # Lado izquierdo
            v1 = left_grid[i][j]
            v2 = left_grid[i + 1][j]
            v3 = left_grid[i + 1][j + 1]
            v4 = left_grid[i][j + 1]
            unique_l = []
            for v in [v1, v2, v3, v4]:
                if v not in unique_l:
                    unique_l.append(v)
            if len(unique_l) >= 3:
                try:
                    f = bm.faces.new(unique_l)
                    f.material_index = MAT_LEAF
                    f.smooth = True
                    for loop in f.loops:
                        u_uv = (loop.vert.co.x / (W * 0.5)) * 0.45 + 0.5
                        v_uv = loop.vert.co.y / L
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, v_uv)))
                except ValueError:
                    pass

    # 5. Corto peciolulo basal de conexion
    p_len = 0.025
    p_rad = 0.003
    p_steps = 4
    p_rings = []
    for s in range(p_steps + 1):
        frac = s / float(p_steps)
        y_p = -p_len * (1.0 - frac)
        z_p = -0.005 * (1.0 - frac)
        rad = p_rad * (0.8 + 0.3 * frac)
        ring = []
        for ang_idx in range(6):
            ang = ang_idx * (2.0 * math.pi / 6.0)
            px = rad * math.cos(ang)
            pz = z_p + rad * math.sin(ang)
            ring.append(bm.verts.new(Vector((px, y_p, pz))))
        p_rings.append(ring)

    for s in range(p_steps):
        for ang_idx in range(6):
            next_ang = (ang_idx + 1) % 6
            v1 = p_rings[s][ang_idx]
            v2 = p_rings[s + 1][ang_idx]
            v3 = p_rings[s + 1][next_ang]
            v4 = p_rings[s][next_ang]
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = MAT_PETIOLE
                f.smooth = True
            except ValueError:
                pass

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    # Modificador Solidify muy sutil para dar cuerpo sin engrosar excesivamente
    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0008
    sol_mod.offset = 0.0
    sol_mod.use_rim = True

    return obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\leaflet_cannabis.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando generacion de Foliolo Maestro de Cannabis...\n")

        scene, cam_obj = setup_leaflet_scene()
        obj = build_single_master_leaflet()

        blend_file = os.path.abspath(r"assets-src/crops/CANNABIS_LEAFLET_MASTER.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_cannabis_leaflet_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Foliolo Maestro completado con exito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
