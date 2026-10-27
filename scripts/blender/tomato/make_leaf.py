import bpy
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion
import math
import os
import sys

def setup_leaf_scene():
    """Configura la escena para el render de la Hoja Compuesta Maestra."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonLeafWorld")
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

    cam_data = bpy.data.cameras.new(name="LeafCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_obj = bpy.data.objects.new(name="LeafCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.rotation_euler = (math.radians(52), 0, math.radians(38))

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
    """Crea materiales toon botánicos con el auténtico verde oscuro de tomatera."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    color_tex_path = os.path.join(this_dir, "textures", "tomato_leaflet_color.png")
    if not os.path.exists(color_tex_path):
        color_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_color.png")

    bump_tex_path = os.path.join(this_dir, "textures", "tomato_leaflet_bump.png")
    if not os.path.exists(bump_tex_path):
        bump_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_bump.png")

    mat_leaf = bpy.data.materials.new("Cartoon_Tomato_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

    out_node = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.36
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.35
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = 0.35
    if 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = 0.16
        if 'Subsurface Radius' in bsdf.inputs:
            bsdf.inputs['Subsurface Radius'].default_value = (0.6, 0.8, 0.2)
    elif 'Subsurface' in bsdf.inputs:
        bsdf.inputs['Subsurface'].default_value = 0.16

    links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])

    if os.path.exists(color_tex_path):
        tex_color = nodes.new(type='ShaderNodeTexImage')
        tex_color.image = bpy.data.images.load(color_tex_path)
        links.new(tex_color.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.08, 0.28, 0.08, 1.0)

    if os.path.exists(bump_tex_path):
        tex_bump = nodes.new(type='ShaderNodeTexImage')
        tex_bump.image = bpy.data.images.load(bump_tex_path)
        try:
            tex_bump.image.colorspace_settings.name = 'Non-Color'
        except:
            pass

        bump_node = nodes.new(type='ShaderNodeBump')
        bump_node.inputs['Strength'].default_value = 0.26
        bump_node.inputs['Distance'].default_value = 0.005

        links.new(tex_bump.outputs['Color'], bump_node.inputs['Height'])
        links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])

    # Tallo/raquis verde botánico profundo natural
    mat_stem = bpy.data.materials.new("Cartoon_Leaf_Stem")
    mat_stem.use_nodes = True
    bsdf_s = mat_stem.node_tree.nodes.get("Principled BSDF")
    if bsdf_s:
        bsdf_s.inputs['Base Color'].default_value = (0.13, 0.36, 0.09, 1.0)
        bsdf_s.inputs['Roughness'].default_value = 0.34

    return mat_leaf, mat_stem

def create_master_leaflet_mesh(mat_leaf, mat_stem):
    """Crea la malla base del Foliolo Maestro botánico con coordenadas UV (forma idéntica a la aprobada)."""
    mesh = bpy.data.meshes.new("Tomato_Leaflet_Base")
    mesh.materials.append(mat_leaf) # Slot 0
    mesh.materials.append(mat_stem) # Slot 1

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Contorno botánico idéntico al foliolo maestro aprobado
    right_margin = [
        (0.04, 0.00),
        (0.12, 0.03),
        (0.35, 0.06),
        (0.72, 0.10),
        (0.92, 0.125), # Orejuela basal
        (0.90, 0.135),
        (0.50, 0.16),
        (0.22, 0.19),  # Seno basal
        (0.24, 0.21),
        (0.58, 0.26),
        (0.94, 0.31),  # Diente 1
        (0.92, 0.32),
        (0.68, 0.36),
        (0.86, 0.40),  # Diente 2
        (0.84, 0.41),
        (0.32, 0.45),  # Seno medio
        (0.34, 0.47),
        (0.72, 0.52),
        (0.98, 0.57),  # Máximo ancho
        (0.96, 0.58),
        (0.68, 0.62),
        (0.78, 0.65),  # Diente
        (0.76, 0.66),
        (0.42, 0.69),  # Seno superior
        (0.43, 0.71),
        (0.48, 0.75),  # Lámina terminal lanceolada
        (0.42, 0.78),
        (0.38, 0.82),
        (0.32, 0.85),
        (0.28, 0.89),
        (0.20, 0.92),
        (0.12, 0.95),
        (0.05, 0.98),
        (0.00, 1.00),  # Ápice
    ]

    left_margin = [
        (-0.04, 0.00),
        (-0.10, 0.03),
        (-0.32, 0.06),
        (-0.68, 0.10),
        (-0.88, 0.12),
        (-0.86, 0.13),
        (-0.48, 0.155),
        (-0.20, 0.185),
        (-0.22, 0.205),
        (-0.55, 0.25),
        (-0.90, 0.30),
        (-0.88, 0.31),
        (-0.64, 0.35),
        (-0.82, 0.39),
        (-0.80, 0.40),
        (-0.30, 0.44),
        (-0.32, 0.46),
        (-0.68, 0.51),
        (-0.95, 0.56),
        (-0.93, 0.57),
        (-0.65, 0.61),
        (-0.75, 0.64),
        (-0.73, 0.65),
        (-0.40, 0.68),
        (-0.41, 0.70),
        (-0.45, 0.74),
        (-0.39, 0.77),
        (-0.35, 0.81),
        (-0.30, 0.84),
        (-0.26, 0.88),
        (-0.18, 0.91),
        (-0.11, 0.95),
        (-0.05, 0.98),
        (0.00, 1.00),
    ]

    num_pts = len(right_margin)
    L = 1.0
    W = 0.54

    midrib_verts = []
    for k in range(num_pts):
        u_r, v_r = right_margin[k]
        u_l, v_l = left_margin[k]
        v_mid = (v_r + v_l) * 0.5
        y_pos = L * v_mid
        drop_z = -0.14 * (v_mid ** 1.6) * L
        midrib_v = bm.verts.new(Vector((0.0, y_pos, drop_z - 0.003)))
        midrib_verts.append((midrib_v, v_mid))

    right_grid = []
    for k in range(num_pts):
        u_target, v_target = right_margin[k]
        v_mid = midrib_verts[k][1]
        row = [midrib_verts[k][0]]
        for col_idx in [1, 2, 3]:
            frac = col_idx / 3.0
            u_c = u_target * frac
            v_c = v_mid + (v_target - v_mid) * frac
            x_pos = (W * 0.5) * u_c
            y_pos = L * v_c
            drop_z = -0.14 * (v_c ** 1.6) * L
            v_cup = 0.026 * (frac ** 1.3) * (1.0 - v_c * 0.28)
            z_pos = drop_z + v_cup
            row.append(bm.verts.new(Vector((x_pos, y_pos, z_pos))))
        right_grid.append(row)

    left_grid = []
    for k in range(num_pts):
        u_target, v_target = left_margin[k]
        v_mid = midrib_verts[k][1]
        row = [midrib_verts[k][0]]
        for col_idx in [1, 2, 3]:
            frac = col_idx / 3.0
            u_c = u_target * frac
            v_c = v_mid + (v_target - v_mid) * frac
            x_pos = (W * 0.5) * u_c
            y_pos = L * v_c
            drop_z = -0.14 * (v_c ** 1.6) * L
            v_cup = 0.026 * (frac ** 1.3) * (1.0 - v_c * 0.28)
            z_pos = drop_z + v_cup
            row.append(bm.verts.new(Vector((x_pos, y_pos, z_pos))))
        left_grid.append(row)

    for i in range(num_pts - 1):
        for j in range(3):
            v0 = right_grid[i][j]
            v1 = right_grid[i][j + 1]
            v2 = right_grid[i + 1][j + 1]
            v3 = right_grid[i + 1][j]
            verts = [v0, v1, v2, v3]
            unique_verts = []
            for v in verts:
                if v not in unique_verts:
                    unique_verts.append(v)
            if len(unique_verts) >= 3:
                try:
                    f = bm.faces.new(unique_verts)
                    f.material_index = 0
                    f.smooth = True
                    for loop in f.loops:
                        u_uv = (loop.vert.co.x / (W * 0.5)) * 0.5 + 0.5
                        v_uv = loop.vert.co.y / L
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, v_uv)))
                except ValueError:
                    pass

    for i in range(num_pts - 1):
        for j in range(3):
            v0 = left_grid[i][j]
            v1 = left_grid[i + 1][j]
            v2 = left_grid[i + 1][j + 1]
            v3 = left_grid[i][j + 1]
            verts = [v0, v1, v2, v3]
            unique_verts = []
            for v in verts:
                if v not in unique_verts:
                    unique_verts.append(v)
            if len(unique_verts) >= 3:
                try:
                    f = bm.faces.new(unique_verts)
                    f.material_index = 0
                    f.smooth = True
                    for loop in f.loops:
                        u_uv = (loop.vert.co.x / (W * 0.5)) * 0.5 + 0.5
                        v_uv = loop.vert.co.y / L
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, v_uv)))
                except ValueError:
                    pass

    bm.to_mesh(mesh)
    bm.free()
    return mesh

def create_intercalary_leaflet_mesh(mat_leaf, mat_stem):
    """Crea la malla del foliólulo intercalar (pequeño y simplificado)."""
    mesh = bpy.data.meshes.new("Tomato_Leaflet_Intercalary")
    mesh.materials.append(mat_leaf)
    mesh.materials.append(mat_stem)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    inter_profile = [
        (0.04, 0.00),
        (0.20, 0.06),
        (0.65, 0.16),
        (0.95, 0.32),
        (0.70, 0.48),
        (0.90, 0.64),
        (0.55, 0.78),
        (0.25, 0.90),
        (0.00, 1.00),
    ]

    L = 1.0
    W = 0.65
    pts = len(inter_profile)

    midrib = []
    for k in range(pts):
        _, v = inter_profile[k]
        v_mid = bm.verts.new(Vector((0.0, L * v, -0.08 * (v ** 1.5))))
        midrib.append(v_mid)

    r_grid = []
    l_grid = []
    for k in range(pts):
        u_t, v_t = inter_profile[k]
        r_row = [midrib[k]]
        l_row = [midrib[k]]
        for c in [1, 2]:
            frac = c / 2.0
            x = (W * 0.5) * u_t * frac
            y = L * v_t
            z = -0.08 * (v_t ** 1.5) + 0.018 * (frac ** 1.3)
            r_row.append(bm.verts.new(Vector((x, y, z))))
            l_row.append(bm.verts.new(Vector((-x, y, z))))
        r_grid.append(r_row)
        l_grid.append(l_row)

    for i in range(pts - 1):
        for j in range(2):
            for grid, is_left in [(r_grid, False), (l_grid, True)]:
                if not is_left:
                    verts = [grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]]
                else:
                    verts = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]
                unique = []
                for v in verts:
                    if v not in unique:
                        unique.append(v)
                if len(unique) >= 3:
                    try:
                        f = bm.faces.new(unique)
                        f.material_index = 0
                        f.smooth = True
                        for loop in f.loops:
                            u_uv = (loop.vert.co.x / (W * 0.5)) * 0.5 + 0.5
                            v_uv = loop.vert.co.y / L
                            loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, v_uv)))
                    except ValueError:
                        pass

    bm.to_mesh(mesh)
    bm.free()
    return mesh

def build_master_compound_leaf():
    """
    Construye la HOJA COMPUESTA MAESTRA con RAMA CURVADA Y COMPACTA:
    - Raquis con arco botánico 3D: se arquea hacia arriba y hacia afuera, y cae suavemente en la punta.
    - Curva lateral orgánica en 'S' (la rama NO es una línea recta rígida).
    - Longitud equilibrada y compacta (~34 cm).
    - Foliolos con peciólulos arqueados orientados al sol.
    """
    mat_leaf, mat_stem = create_materials()
    leaflet_mesh = create_master_leaflet_mesh(mat_leaf, mat_stem)
    inter_mesh = create_intercalary_leaflet_mesh(mat_leaf, mat_stem)

    leaf_group = []

    # Raquis curvado orgánico
    total_len = 0.35  # Más compacta y natural (35 cm)
    num_steps = 18
    rachis_pts = []
    rachis_dirs = []
    rachis_sides = []

    # Vectores base del espacio
    dir_fwd = Vector((0.707, 0.707, 0.0)).normalized()
    side_base = Vector((-0.707, 0.707, 0.0)).normalized()
    up_v = Vector((0.0, 0.0, 1.0))

    prev_p = Vector((0, 0, 0))
    for s in range(num_steps + 1):
        u = s / float(num_steps)

        # 1. Avance hacia adelante suave
        reach_xy = (u ** 0.94) * total_len

        # 2. Curvatura vertical (arco parabólico: sube a 30° al inicio, corona en u~0.25 y cae en cascada)
        arch_z = (0.24 * math.sin(u * math.pi * 0.55) - 0.44 * (u ** 1.45)) * total_len

        # 3. Curvatura lateral (S-curve orgánica: la rama serpentea naturalmente)
        bend_lat = (0.16 * math.sin(u * math.pi) - 0.04 * math.sin(2.0 * u * math.pi)) * total_len

        p_curr = dir_fwd * reach_xy + side_base * bend_lat + up_v * arch_z
        rachis_pts.append(p_curr)

        if s > 0:
            d_seg = (p_curr - prev_p).normalized()
            rachis_dirs.append(d_seg)
            # Normal y lado locales al segmento
            s_seg = d_seg.cross(up_v).normalized()
            rachis_sides.append(s_seg)
        prev_p = p_curr

    # Duplicar el primer vector para el paso 0
    rachis_dirs.insert(0, rachis_dirs[0])
    rachis_sides.insert(0, rachis_sides[0])

    # Modelado del raquis curvado cilíndrico
    mesh_rachis = bpy.data.meshes.new("Rachis_Mesh")
    mesh_rachis.materials.append(mat_leaf)
    mesh_rachis.materials.append(mat_stem)

    bm_r = bmesh.new()
    uv_r = bm_r.loops.layers.uv.new("UVMap")

    prev_ring = None
    for s in range(num_steps + 1):
        u = s / float(num_steps)
        p_cen = rachis_pts[s]
        d_tan = rachis_dirs[s]

        r_curr = 0.0085 * (1.0 - u * 0.62)
        # Anillo perpendicular a la tangente local de la curva
        rot_ring = d_tan.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        ring = bmesh.ops.create_circle(
            bm_r,
            cap_ends=(s == 0 or s == num_steps),
            segments=8,
            radius=r_curr,
            matrix=Matrix.Translation(p_cen) @ rot_ring
        )['verts']

        if prev_ring:
            for k in range(len(ring)):
                f = bm_r.faces.new([
                    prev_ring[k],
                    prev_ring[(k + 1) % len(ring)],
                    ring[(k + 1) % len(ring)],
                    ring[k]
                ])
                f.material_index = 1
                f.smooth = True
                for loop in f.loops:
                    loop[uv_r].uv = (0.5, 0.0)
        prev_ring = ring

    bm_r.to_mesh(mesh_rachis)
    bm_r.free()

    obj_rachis = bpy.data.objects.new("Rachis", mesh_rachis)
    bpy.context.collection.objects.link(obj_rachis)
    leaf_group.append(obj_rachis)

    # 1. Foliolo Terminal (sigue la tangente curvada final hacia abajo)
    p_term = rachis_pts[-1]
    dir_term = (rachis_dirs[-1] - up_v * 0.20).normalized()
    obj_term = bpy.data.objects.new("Leaflet_Terminal", leaflet_mesh)
    bpy.context.collection.objects.link(obj_term)
    obj_term.location = p_term
    obj_term.scale = Vector((0.18, 0.18, 0.18))
    obj_term.rotation_mode = 'QUATERNION'
    obj_term.rotation_quaternion = dir_term.to_track_quat('Y', 'Z')
    leaf_group.append(obj_term)

    # 2. Configuración de Foliolos Laterales e Intercalares:
    # (idx_raquis, angulo_adelante_deg, escala, largo_peciolo, es_intercalar, roll_deg, droop_deg)
    leaflet_configs = [
        # Subterminal (cerca de la punta, orientado hacia adelante)
        (14, 30.0, 0.155, 0.024, False, 26.0, 16.0),
        # Intercalar Superior (pequeño)
        (12, 46.0, 0.070, 0.012, True,  20.0, 10.0),
        # Medio Principal (el más grande, sobre el arco de la rama)
        (9,  36.0, 0.170, 0.034, False, 28.0, 18.0),
        # Intercalar Medio
        (7,  50.0, 0.065, 0.012, True,  22.0, 10.0),
        # Basal (amplio y arqueado)
        (4,  42.0, 0.145, 0.036, False, 30.0, 20.0),
        # Intercalar Basal
        (2,  56.0, 0.052, 0.010, True,  24.0, 8.0),
    ]

    for (idx, angle_deg, l_scale, pet_len, is_inter, roll_deg, droop_deg) in leaflet_configs:
        p_base = rachis_pts[idx]
        cur_dir = rachis_dirs[idx]
        cur_side = rachis_sides[idx]
        cur_norm = cur_dir.cross(cur_side).normalized()
        ang_rad = math.radians(angle_deg)

        for s_sign in (1.0, -1.0):
            # Dirección del peciólulo: nace en ángulo hacia adelante y se arquea suavemente
            lat_dir = (
                cur_dir * math.cos(ang_rad) +
                cur_side * (s_sign * math.sin(ang_rad)) -
                up_v * math.radians(droop_deg * 0.5)
            ).normalized()

            p_pet_end = p_base + lat_dir * pet_len

            # Peciólulo 3D
            mesh_pet = bpy.data.meshes.new("Petiolule_Mesh")
            mesh_pet.materials.append(mat_leaf)
            mesh_pet.materials.append(mat_stem)
            bm_p = bmesh.new()
            uv_p = bm_p.loops.layers.uv.new("UVMap")
            r1 = 0.0038 if not is_inter else 0.0024
            r2 = 0.0028 if not is_inter else 0.0016
            p_s = bmesh.ops.create_circle(bm_p, cap_ends=False, segments=6, radius=r1, matrix=Matrix.Translation(p_base))['verts']
            p_e = bmesh.ops.create_circle(bm_p, cap_ends=False, segments=6, radius=r2, matrix=Matrix.Translation(p_pet_end))['verts']
            for k in range(len(p_s)):
                f = bm_p.faces.new([p_s[k], p_s[(k + 1) % len(p_s)], p_e[(k + 1) % len(p_e)], p_e[k]])
                f.material_index = 1
                f.smooth = True
                for loop in f.loops:
                    loop[uv_p].uv = (0.5, 0.0)
            bm_p.to_mesh(mesh_pet)
            bm_p.free()

            obj_pet = bpy.data.objects.new("Petiolule", mesh_pet)
            bpy.context.collection.objects.link(obj_pet)
            leaf_group.append(obj_pet)

            used_mesh = inter_mesh if is_inter else leaflet_mesh
            obj_leaf = bpy.data.objects.new("Leaflet", used_mesh)
            bpy.context.collection.objects.link(obj_leaf)
            obj_leaf.location = p_pet_end
            obj_leaf.scale = Vector((l_scale, l_scale, l_scale))

            # Rotación orgánica: hacia adelante + roll hacia la luz + caída por gravedad
            leaf_dir = (lat_dir - up_v * math.radians(droop_deg)).normalized()
            leaf_quat = leaf_dir.to_track_quat('Y', 'Z')
            roll_quat = Quaternion(leaf_dir, math.radians(s_sign * roll_deg))

            obj_leaf.rotation_mode = 'QUATERNION'
            obj_leaf.rotation_quaternion = roll_quat @ leaf_quat
            leaf_group.append(obj_leaf)

    bpy.ops.object.select_all(action='DESELECT')
    for o in leaf_group:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obj_rachis
    bpy.ops.object.make_single_user(type='SELECTED_OBJECTS', object=True, obdata=True)
    bpy.ops.object.join()

    master_obj = bpy.context.active_object
    master_obj.name = "Tomato_Leaf_Master"

    sol = master_obj.modifiers.new("Solidify", 'SOLIDIFY')
    sol.thickness = 0.0018
    sol.offset = 0.0
    sol.use_rim = True

    sub = master_obj.modifiers.new("Subdivision", 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return master_obj

def frame_camera(scene, cam_obj, obj):
    """Centra la cámara sobre la hoja compuesta completa asegurando encuadre óptimo."""
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
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\leaf_compound.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando creación de Hoja Compuesta con Rama Curvada y Verde Oscuro Botánico...\n")

        scene, cam_obj = setup_leaf_scene()
        master_leaf = build_master_compound_leaf()

        # Inclinación limpia
        master_leaf.rotation_euler = (math.radians(-6), math.radians(12), math.radians(-26))

        frame_camera(scene, cam_obj, master_leaf)

        blend_file = os.path.abspath(r"assets-src/crops/TOMATO_LEAF_MASTER.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_leaf_raw.png")
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
