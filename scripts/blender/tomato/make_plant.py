import bpy
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion
import math
import os
import sys

def setup_plant_scene():
    """Configura la escena con iluminación toon botánica e isométrica dimétrica estándar (Plantin 2:1)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonPlantWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 0.22

    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.0
    sun_data.color = (1.0, 0.98, 0.93)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(48), math.radians(16), math.radians(40))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.70
    fill_data.color = (0.84, 0.90, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-22), math.radians(-140))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 0.90
    rim_data.color = (0.95, 1.0, 0.90)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-38), math.radians(22), math.radians(150))

    cam_data = bpy.data.cameras.new(name="IsoPlantCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 1.84
    cam_obj = bpy.data.objects.new(name="IsoPlantCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.rotation_euler = (math.radians(58), 0, math.radians(45))
    rot_mat = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = rot_mat @ Vector((0, 0, 10.0)) + Vector((0, 0, 0.68))

    scene.render.resolution_x = 480
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except:
        scene.render.engine = 'BLENDER_EEVEE'

    scene.view_settings.view_transform = 'Standard'

    return scene

def create_cartoon_plant_materials():
    """Crea los materiales PBR toon botánicos de la planta completa con el verde oscuro propio del tomate."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    color_tex_path = os.path.join(this_dir, "textures", "tomato_leaflet_color.png")
    if not os.path.exists(color_tex_path):
        color_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_color.png")

    bump_tex_path = os.path.join(this_dir, "textures", "tomato_leaflet_bump.png")
    if not os.path.exists(bump_tex_path):
        bump_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_bump.png")

    mats = []

    def make_mat(name, color, roughness, spec=0.4, sss_weight=0.0):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = color
            bsdf.inputs['Roughness'].default_value = roughness
            if 'Specular IOR Level' in bsdf.inputs:
                bsdf.inputs['Specular IOR Level'].default_value = spec
            elif 'Specular' in bsdf.inputs:
                bsdf.inputs['Specular'].default_value = spec
            if sss_weight > 0 and 'Subsurface Weight' in bsdf.inputs:
                bsdf.inputs['Subsurface Weight'].default_value = sss_weight
                if 'Subsurface Radius' in bsdf.inputs:
                    bsdf.inputs['Subsurface Radius'].default_value = (0.7, 0.25, 0.1)
        return mat

    # Slot 0: MAT_LEAF (Verde oscuro profundo del tomate)
    mat_leaf = bpy.data.materials.new("Mat_Plant_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

    out_node = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf_leaf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf_leaf.inputs['Roughness'].default_value = 0.44
    if 'Specular IOR Level' in bsdf_leaf.inputs:
        bsdf_leaf.inputs['Specular IOR Level'].default_value = 0.22
    elif 'Specular' in bsdf_leaf.inputs:
        bsdf_leaf.inputs['Specular'].default_value = 0.22
    if 'Subsurface Weight' in bsdf_leaf.inputs:
        bsdf_leaf.inputs['Subsurface Weight'].default_value = 0.0
    links.new(bsdf_leaf.outputs['BSDF'], out_node.inputs['Surface'])

    if os.path.exists(color_tex_path):
        tex_color = nodes.new(type='ShaderNodeTexImage')
        tex_color.image = bpy.data.images.load(color_tex_path)
        links.new(tex_color.outputs['Color'], bsdf_leaf.inputs['Base Color'])
    else:
        bsdf_leaf.inputs['Base Color'].default_value = (0.025, 0.08, 0.025, 1.0)

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
        links.new(bump_node.outputs['Normal'], bsdf_leaf.inputs['Normal'])

    mats.append(mat_leaf) # Slot 0: MAT_LEAF
    mats.append(make_mat("Mat_Stem", (0.045, 0.14, 0.035, 1.0), 0.40, spec=0.22)) # Slot 1: MAT_STEM (Verde tallo profundo del tomate)
    mats.append(make_mat("Mat_Tomato_Red", (0.88, 0.03, 0.04, 1.0), 0.18, spec=0.75, sss_weight=0.26)) # Slot 2: MAT_RED
    mats.append(make_mat("Mat_Tomato_Orange", (0.94, 0.38, 0.04, 1.0), 0.20, spec=0.70, sss_weight=0.20)) # Slot 3: MAT_ORANGE
    mats.append(make_mat("Mat_Tomato_BabyGreen", (0.28, 0.62, 0.14, 1.0), 0.26, spec=0.55, sss_weight=0.15)) # Slot 4: MAT_BABY_GREEN
    mats.append(make_mat("Mat_Pedicel_Pith", (0.44, 0.68, 0.28, 1.0), 0.40, spec=0.20)) # Slot 5: MAT_PITH
    mats.append(make_mat("Mat_Bamboo_Cane", (0.72, 0.60, 0.35, 1.0), 0.42, spec=0.25)) # Slot 6: MAT_CANE
    mats.append(make_mat("Mat_Raffia_Tie", (0.58, 0.48, 0.30, 1.0), 0.55, spec=0.15)) # Slot 7: MAT_TIE
    mats.append(make_mat("Mat_Flower_Yellow", (0.98, 0.86, 0.06, 1.0), 0.28, spec=0.50)) # Slot 8: MAT_FLOWER

    return mats

def get_tomato_skin_z(r, theta, r_xy, r_z):
    u_r = min(0.999, r / r_xy)
    z_base = r_z * math.sqrt(max(0.0001, 1.0 - u_r**2))
    dip_radius = r_xy * 0.42
    if r < dip_radius:
        dip_frac = 1.0 - (r / dip_radius)
        z_base -= (dip_frac ** 2.0) * (r_z * 0.28)
    return z_base

def add_master_tomato_fruit(bm, center_pos, radius_xy, mat_fruit_idx, mat_calyx_idx, mat_pith_idx, rotation_euler=(0,0,0)):
    """Añade un fruto de tomate maestro con costillas en hombros, cáliz curvado y cabo con nudo."""
    r_xy = radius_xy
    r_z = radius_xy * 0.80

    rot_mat = Euler(rotation_euler, 'XYZ').to_matrix().to_4x4()
    T_final = Matrix.Translation(center_pos) @ rot_mat

    u_seg = 32
    v_seg = 18
    sphere_geom = bmesh.ops.create_uvsphere(
        bm,
        u_segments=u_seg,
        v_segments=v_seg,
        radius=1.0,
        matrix=T_final
    )

    num_lobes = 6
    for v in sphere_geom['verts']:
        v_local = T_final.inverted() @ v.co
        z_norm = max(-1.0, min(1.0, v_local.z / r_z))
        theta = math.atan2(v_local.y, v_local.x)

        v_local.z = z_norm * r_z
        equator_w = math.sqrt(max(0.001, 1.0 - z_norm**2))
        shoulder_profile = 1.0 + 0.10 * (1.0 - z_norm**2)

        lobe_envelope = max(0.0, (z_norm + 0.3) / 1.3) * (1.0 - z_norm**4)
        rib_wave = (0.075 * math.cos(num_lobes * theta) + 0.018 * math.cos(num_lobes * 2 * theta)) * lobe_envelope
        r_actual = r_xy * equator_w * shoulder_profile * (1.0 + rib_wave)

        v_local.x = math.cos(theta) * r_actual
        v_local.y = math.sin(theta) * r_actual

        dist_xy = math.sqrt(v_local.x**2 + v_local.y**2)
        if z_norm > 0.20 and dist_xy < (r_xy * 0.42):
            dip_factor = 1.0 - (dist_xy / (r_xy * 0.42))
            v_local.z -= (dip_factor ** 2.0) * (r_z * 0.28)

        if z_norm < -0.55 and dist_xy < (r_xy * 0.28):
            bot_factor = 1.0 - (dist_xy / (r_xy * 0.28))
            v_local.z += (bot_factor ** 2.0) * (r_z * 0.08)

        v.co = T_final @ v_local

    for f in {f for v in sphere_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_fruit_idx
        f.smooth = True

    z_skin_top = get_tomato_skin_z(0.0, 0.0, r_xy, r_z)
    top_center_local = Vector((0, 0, z_skin_top))

    receptacle_r = 0.020 * (r_xy / 0.20)
    receptacle_h = 0.008 * (r_xy / 0.20)
    rec_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=12,
        radius1=receptacle_r * 1.05,
        radius2=receptacle_r * 0.75,
        depth=receptacle_h,
        matrix=T_final @ Matrix.Translation(top_center_local + Vector((0, 0, receptacle_h * 0.5 + 0.002)))
    )
    for f in {f for v in rec_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_calyx_idx
        f.smooth = True

    num_sepals = 6
    sepal_len = r_xy * 0.65
    steps_len = 7

    for s_i in range(num_sepals):
        angle = (s_i / float(num_sepals)) * 2.0 * math.pi + 0.15
        dir_xy = Vector((math.cos(angle), math.sin(angle), 0.0))
        perp_xy = Vector((-math.sin(angle), math.cos(angle), 0.0))

        prev_verts = None
        for step in range(steps_len + 1):
            u = step / float(steps_len)
            r_dist = receptacle_r * 0.75 + u * sepal_len

            if u <= 0.60:
                skin_z = get_tomato_skin_z(r_dist, angle, r_xy, r_z)
                z_sepal = skin_z + 0.0025
            else:
                u_tip = (u - 0.60) / 0.40
                skin_z = get_tomato_skin_z(r_dist, angle, r_xy, r_z)
                curl_up = 0.024 * (u_tip ** 1.6) * (r_xy / 0.20)
                z_sepal = skin_z + 0.0025 + curl_up

            w_half = (0.011 * ((1.0 - u) ** 1.2) + 0.001) * (r_xy / 0.20)
            p_cen = top_center_local + dir_xy * r_dist + Vector((0, 0, z_sepal))

            pos_spine = T_final @ (p_cen + Vector((0, 0, 0.002 * (1.0 - u))))
            pos_left = T_final @ (p_cen - perp_xy * w_half)
            pos_right = T_final @ (p_cen + perp_xy * w_half)

            vl = bm.verts.new(pos_left)
            vs = bm.verts.new(pos_spine)
            vr = bm.verts.new(pos_right)
            curr = (vl, vs, vr)

            if prev_verts:
                f1 = bm.faces.new([prev_verts[0], curr[0], curr[1], prev_verts[1]])
                f2 = bm.faces.new([prev_verts[1], curr[1], curr[2], prev_verts[2]])
                f1.material_index = mat_calyx_idx
                f2.material_index = mat_calyx_idx
                f1.smooth = True
                f2.smooth = True
            prev_verts = curr

    scale_fac = r_xy / 0.20
    stem_path = [
        (Vector((0.000, 0.000, 0.000)), 0.0105 * scale_fac),
        (Vector((0.001, 0.001, 0.016 * scale_fac)), 0.0100 * scale_fac),
        (Vector((0.003, 0.003, 0.030 * scale_fac)), 0.0095 * scale_fac),
        (Vector((0.006, 0.005, 0.038 * scale_fac)), 0.0135 * scale_fac),
        (Vector((0.009, 0.008, 0.044 * scale_fac)), 0.0105 * scale_fac),
        (Vector((0.015, 0.013, 0.058 * scale_fac)), 0.0095 * scale_fac),
        (Vector((0.024, 0.020, 0.072 * scale_fac)), 0.0090 * scale_fac),
        (Vector((0.035, 0.028, 0.082 * scale_fac)), 0.0085 * scale_fac),
    ]

    prev_ring = None
    for idx, (offset_pos, ring_r) in enumerate(stem_path):
        is_cap = (idx == len(stem_path) - 1)
        center_pos = top_center_local + Vector((0, 0, receptacle_h)) + offset_pos

        ring_geom = bmesh.ops.create_circle(
            bm,
            cap_ends=is_cap,
            segments=8,
            radius=ring_r,
            matrix=T_final @ Matrix.Translation(center_pos)
        )
        curr_ring = ring_geom['verts']
        if prev_ring:
            for s in range(len(curr_ring)):
                f = bm.faces.new([
                    prev_ring[s],
                    prev_ring[(s + 1) % len(curr_ring)],
                    curr_ring[(s + 1) % len(curr_ring)],
                    curr_ring[s]
                ])
                f.material_index = mat_calyx_idx
                f.smooth = True
        if is_cap:
            for f in {f for v in curr_ring for f in v.link_faces}:
                f.material_index = mat_pith_idx
                f.smooth = True
        prev_ring = curr_ring

# Contorno botánico idéntico al foliolo maestro
BOTANICAL_LEAFLET_PROFILE = [
    (0.04, 0.00),
    (0.12, 0.03),
    (0.35, 0.06),
    (0.72, 0.10),
    (0.92, 0.125),
    (0.90, 0.135),
    (0.50, 0.16),
    (0.22, 0.19),
    (0.24, 0.21),
    (0.58, 0.26),
    (0.94, 0.31),
    (0.92, 0.32),
    (0.68, 0.36),
    (0.86, 0.40),
    (0.84, 0.41),
    (0.32, 0.45),
    (0.34, 0.47),
    (0.72, 0.52),
    (0.98, 0.57),
    (0.96, 0.58),
    (0.68, 0.62),
    (0.78, 0.65),
    (0.76, 0.66),
    (0.42, 0.69),
    (0.43, 0.71),
    (0.48, 0.75),
    (0.42, 0.78),
    (0.38, 0.82),
    (0.32, 0.85),
    (0.28, 0.89),
    (0.20, 0.92),
    (0.12, 0.95),
    (0.05, 0.98),
    (0.00, 1.00),
]

def add_master_leaflet_plant(bm, origin, direction, normal, length, width, uv_layer, mat_leaf_idx, is_intercalary=False):
    """Añade un foliolo botánico al bmesh general de la planta."""
    dir_n = direction.normalized()
    norm_n = normal.normalized()
    side_n = dir_n.cross(norm_n).normalized()

    prof = BOTANICAL_LEAFLET_PROFILE
    pts_count = len(prof)

    r_grid = []
    l_grid = []
    midrib = []

    for k in range(pts_count):
        u_t, v_t = prof[k]
        y_pos = length * v_t
        drop_z = -0.12 * (v_t ** 1.6) * length
        p_mid = origin + dir_n * y_pos + norm_n * drop_z

        v_m = bm.verts.new(p_mid)
        midrib.append(v_m)

        r_row = [v_m]
        l_row = [v_m]
        for col_idx in [1, 2]:
            frac = col_idx / 2.0
            x_offset = (width * 0.5) * u_t * frac
            v_cup = 0.016 * (frac ** 1.3) * (1.0 - v_t * 0.28) * length
            p_r = p_mid + side_n * x_offset + norm_n * v_cup
            p_l = p_mid - side_n * x_offset + norm_n * v_cup
            r_row.append(bm.verts.new(p_r))
            l_row.append(bm.verts.new(p_l))
        r_grid.append(r_row)
        l_grid.append(l_row)

    for i in range(pts_count - 1):
        for j in range(2):
            v0 = r_grid[i][j]
            v1 = r_grid[i][j + 1]
            v2 = r_grid[i + 1][j + 1]
            v3 = r_grid[i + 1][j]
            unique = []
            for v in [v0, v1, v2, v3]:
                if v not in unique:
                    unique.append(v)
            if len(unique) >= 3:
                try:
                    f = bm.faces.new(unique)
                    f.material_index = mat_leaf_idx
                    f.smooth = True
                    for loop in f.loops:
                        rel_v = prof[i if loop.vert in (v0, v1) else i+1][1]
                        rel_u = (0.5 + 0.5 * (prof[i][0] if loop.vert in (v1, v2) else 0.0))
                        loop[uv_layer].uv = (rel_u, rel_v)
                except ValueError:
                    pass

            v0 = l_grid[i][j]
            v1 = l_grid[i + 1][j]
            v2 = l_grid[i + 1][j + 1]
            v3 = l_grid[i][j + 1]
            unique = []
            for v in [v0, v1, v2, v3]:
                if v not in unique:
                    unique.append(v)
            if len(unique) >= 3:
                try:
                    f = bm.faces.new(unique)
                    f.material_index = mat_leaf_idx
                    f.smooth = True
                    for loop in f.loops:
                        rel_v = prof[i if loop.vert in (v0, v3) else i+1][1]
                        rel_u = (0.5 - 0.5 * (prof[i][0] if loop.vert in (v2, v3) else 0.0))
                        loop[uv_layer].uv = (rel_u, rel_v)
                except ValueError:
                    pass

def interpolate_spline(pts, num_sub=4):
    if len(pts) < 3:
        return pts
    result = []
    ext_pts = [pts[0] + (pts[0] - pts[1])] + list(pts) + [pts[-1] + (pts[-1] - pts[-2])]
    for i in range(1, len(ext_pts) - 2):
        p0, p1, p2, p3 = ext_pts[i-1], ext_pts[i], ext_pts[i+1], ext_pts[i+2]
        for s in range(num_sub):
            t = s / float(num_sub)
            t2 = t * t
            t3 = t2 * t
            p = 0.5 * (
                (2.0 * p1) +
                (-p0 + p2) * t +
                (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 +
                (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
            )
            result.append(p)
    result.append(pts[-1])
    return result

def add_cascading_compound_leaf(bm, origin, forward_dir, roll_deg, scale, uv_layer, mat_leaf_idx, mat_stem_idx, bend_side=0.0):
    """
    Construye una Hoja Compuesta Realista con RAMA CURVADA Y COMPACTA (no recta ni larga):
    - Curvatura tridimensional en arco (sube a la salida del nudo y cae en cascada).
    - Curva lateral orgánica en S.
    """
    f_dir = Vector((forward_dir.x, forward_dir.y, 0)).normalized()
    up_v = Vector((0, 0, 1))

    side_v = f_dir.cross(up_v).normalized()
    roll_rad = math.radians(roll_deg)
    side_tilted = (side_v * math.cos(roll_rad) + up_v * math.sin(roll_rad)).normalized()

    # Longitud más compacta y proporcionada
    total_len = 0.28 * scale
    num_steps = 14
    rachis_pts = []
    rachis_dirs = []

    prev_pt = origin
    for s in range(num_steps + 1):
        u = s / float(num_steps)
        # Curvatura vertical en arco pronunciado: sube al salir del tallo y cae con el peso de los foliolos
        z_curve = (0.22 * math.sin(u * math.pi * 0.48) - 0.45 * (u ** 1.42)) * total_len
        # Avance frontal suave
        xy_reach = (u ** 0.92) * total_len
        # Curvatura lateral ondulada en S (curva botánica no rígida)
        side_curl = (math.sin(u * math.pi) * 0.22 * bend_side) * total_len

        p_curr = origin + f_dir * xy_reach + side_v * side_curl + up_v * z_curve
        rachis_pts.append(p_curr)

        if s > 0:
            rachis_dirs.append((p_curr - prev_pt).normalized())
        prev_pt = p_curr
    rachis_dirs.insert(0, rachis_dirs[0])

    prev_ring = None
    for s in range(num_steps + 1):
        u = s / float(num_steps)
        r_curr = 0.0062 * (1.0 - u * 0.55) * scale
        ring = bmesh.ops.create_circle(
            bm, cap_ends=(s == 0 or s == num_steps), segments=6, radius=r_curr, matrix=Matrix.Translation(rachis_pts[s])
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
                for loop in f.loops:
                    loop[uv_layer].uv = (0.5, 0.0)
        prev_ring = ring

    # 1. Foliolo Terminal
    p_term = rachis_pts[-1]
    dir_term = (rachis_dirs[-1] - up_v * 0.20).normalized()
    norm_term = dir_term.cross(side_tilted).normalized()
    add_master_leaflet_plant(
        bm,
        origin=p_term,
        direction=dir_term,
        normal=norm_term,
        length=0.120 * scale,
        width=0.072 * scale,
        uv_layer=uv_layer,
        mat_leaf_idx=mat_leaf_idx
    )

    # 2. Pares Laterales e Intercalares
    pairs = [
        (11, 32.0, 0.85, False, 16.0),
        (9,  46.0, 0.40, True,  12.0),
        (7,  38.0, 0.95, False, 18.0),
        (5,  48.0, 0.38, True,  12.0),
        (3,  42.0, 0.82, False, 20.0),
    ]

    for (idx, ang_deg, rel_sc, is_inter, droop_deg) in pairs:
        p_node = rachis_pts[idx]
        cur_dir = rachis_dirs[idx]
        cur_norm = cur_dir.cross(side_tilted).normalized()
        ang_rad = math.radians(ang_deg)

        for s_sign in (1.0, -1.0):
            lat_dir = (
                cur_dir * math.cos(ang_rad) +
                side_tilted * (s_sign * math.sin(ang_rad)) -
                up_v * math.radians(droop_deg)
            ).normalized()

            pet_len = (0.024 if not is_inter else 0.010) * scale * rel_sc
            p_pet_end = p_node + lat_dir * pet_len

            r_pet = (0.0028 if not is_inter else 0.0018) * scale * rel_sc
            p_s = bmesh.ops.create_circle(bm, cap_ends=False, segments=5, radius=r_pet, matrix=Matrix.Translation(p_node))['verts']
            p_e = bmesh.ops.create_circle(bm, cap_ends=False, segments=5, radius=r_pet * 0.8, matrix=Matrix.Translation(p_pet_end))['verts']
            for k in range(len(p_s)):
                f = bm.faces.new([p_s[k], p_s[(k + 1) % len(p_s)], p_e[(k + 1) % len(p_e)], p_e[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
                for loop in f.loops:
                    loop[uv_layer].uv = (0.5, 0.0)

            leaf_norm = (cur_norm + side_tilted * (s_sign * 0.28) - up_v * 0.15).normalized()
            add_master_leaflet_plant(
                bm,
                origin=p_pet_end,
                direction=lat_dir,
                normal=leaf_norm,
                length=(0.105 if not is_inter else 0.046) * scale * rel_sc,
                width=(0.062 if not is_inter else 0.027) * scale * rel_sc,
                uv_layer=uv_layer,
                mat_leaf_idx=mat_leaf_idx,
                is_intercalary=is_inter
            )

def build_bamboo_cane(bm, base_pos, height, mat_cane_idx, mat_tie_idx):
    num_nodes = 5
    r_base = 0.020
    lean = Vector((0.004, 0.003, 0.0))

    for i in range(num_nodes):
        z_start = (height / num_nodes) * i
        z_end = (height / num_nodes) * (i + 1)
        z_mid = (z_start + z_end) * 0.5
        seg_h = z_end - z_start

        frac = i / float(num_nodes)
        r_seg = r_base * (1.0 - frac * 0.25)
        p_center = base_pos + lean * frac + Vector((0, 0, z_mid))

        cane_seg = bmesh.ops.create_cone(
            bm,
            cap_ends=(i == 0 or i == num_nodes - 1),
            segments=10,
            radius1=r_seg * 1.02,
            radius2=r_seg * 0.98,
            depth=seg_h,
            matrix=Matrix.Translation(p_center)
        )
        for f in {f for v in cane_seg['verts'] for f in v.link_faces}:
            f.material_index = mat_cane_idx
            f.smooth = True

        if i > 0:
            p_node = base_pos + lean * frac + Vector((0, 0, z_start))
            node_geom = bmesh.ops.create_cone(
                bm,
                cap_ends=False,
                segments=10,
                radius1=r_seg * 1.25,
                radius2=r_seg * 1.22,
                depth=0.030,
                matrix=Matrix.Translation(p_node)
            )
            for f in {f for v in node_geom['verts'] for f in v.link_faces}:
                f.material_index = mat_cane_idx
                f.smooth = True

    tie_heights = [0.35, 0.70, 1.05]
    for th in tie_heights:
        p_tie = base_pos + lean * (th / height) + Vector((0, 0, th))
        tie_geom = bmesh.ops.create_cone(
            bm,
            cap_ends=False,
            segments=10,
            radius1=r_base * 1.45,
            radius2=r_base * 1.40,
            depth=0.040,
            matrix=Matrix.Translation(p_tie)
        )
        for f in {f for v in tie_geom['verts'] for f in v.link_faces}:
            f.material_index = mat_tie_idx
            f.smooth = True

def add_tomato_flower(bm, origin, direction, size, mat_flower_idx, mat_stem_idx):
    dir_n = direction.normalized()
    side_n = dir_n.cross(Vector((0, 0, 1))).normalized()
    up_n = side_n.cross(dir_n).normalized()

    p_end = origin + dir_n * (size * 0.40)
    stem_cyl = bmesh.ops.create_cone(
        bm,
        cap_ends=False,
        segments=5,
        radius1=0.004,
        radius2=0.003,
        depth=size * 0.40,
        matrix=Matrix.Translation((origin + p_end) * 0.5) @ dir_n.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    )
    for f in {f for v in stem_cyl['verts'] for f in v.link_faces}:
        f.material_index = mat_stem_idx
        f.smooth = True

    num_petals = 5
    petal_len = size * 0.50
    for p_i in range(num_petals):
        p_ang = (p_i / float(num_petals)) * 2.0 * math.pi
        p_vec = side_n * math.cos(p_ang) + up_n * math.sin(p_ang)
        p_side = p_vec.cross(dir_n).normalized()

        p_tip = p_end + p_vec * petal_len - dir_n * (petal_len * 0.15)
        v_cen = bm.verts.new(p_end + dir_n * 0.005)
        v_left = bm.verts.new(p_end + p_vec * (petal_len * 0.35) - p_side * (petal_len * 0.22))
        v_right = bm.verts.new(p_end + p_vec * (petal_len * 0.35) + p_side * (petal_len * 0.22))
        v_tip = bm.verts.new(p_tip)

        f = bm.faces.new([v_cen, v_left, v_tip, v_right])
        f.material_index = mat_flower_idx
        f.smooth = True

def add_fruiting_truss(bm, stem_node, dir_outward, fruit_data, mat_stem_idx, mat_pith_idx):
    dir_h = Vector((dir_outward.x, dir_outward.y, 0)).normalized()

    raw_truss_pts = [
        stem_node,
        stem_node + dir_h * 0.04 + Vector((0, 0,  0.015)),
        stem_node + dir_h * 0.09 - Vector((0, 0,  0.035)),
        stem_node + dir_h * 0.14 - Vector((0, 0,  0.105)),
    ]
    truss_pts = interpolate_spline(raw_truss_pts, num_sub=3)

    prev_ring = None
    for s in range(len(truss_pts)):
        p_curr = truss_pts[s]
        r_truss = 0.0055 * (1.0 - (s / float(len(truss_pts))) * 0.35)
        ring = bmesh.ops.create_circle(
            bm, cap_ends=(s == 0 or s == len(truss_pts) - 1), segments=6, radius=r_truss, matrix=Matrix.Translation(p_curr)
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

    for (node_idx, offset_local, radius, mat_color, rot_euler) in fruit_data:
        pt_idx = min(len(truss_pts) - 1, node_idx * 3)
        p_knot = truss_pts[pt_idx]
        p_fruit_cen = p_knot + offset_local

        offset_hang = p_fruit_cen - p_knot
        ped_cyl = bmesh.ops.create_cone(
            bm,
            cap_ends=False,
            segments=6,
            radius1=0.0048,
            radius2=0.0035,
            depth=offset_hang.length,
            matrix=Matrix.Translation((p_knot + p_fruit_cen) * 0.5) @ offset_hang.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        )
        for f in {f for v in ped_cyl['verts'] for f in v.link_faces}:
            f.material_index = mat_stem_idx
            f.smooth = True

        add_master_tomato_fruit(
            bm,
            center_pos=p_fruit_cen,
            radius_xy=radius,
            mat_fruit_idx=mat_color,
            mat_calyx_idx=mat_stem_idx,
            mat_pith_idx=mat_pith_idx,
            rotation_euler=rot_euler
        )

def build_vine_segment(bm, points, r_base, r_tip, uv_layer, mat_stem_idx):
    smooth_pts = interpolate_spline(points, num_sub=4)
    prev_ring = None
    for idx, p_pos in enumerate(smooth_pts):
        frac = idx / float(len(smooth_pts) - 1)
        r_curr = r_base * (1.0 - frac) + r_tip * frac
        ring_g = bmesh.ops.create_circle(
            bm,
            cap_ends=(idx == 0 or idx == len(smooth_pts) - 1),
            segments=8,
            radius=r_curr,
            matrix=Matrix.Translation(p_pos)
        )
        curr_ring = ring_g['verts']
        if prev_ring:
            for s in range(len(curr_ring)):
                f = bm.faces.new([prev_ring[s], prev_ring[(s + 1) % len(curr_ring)], curr_ring[(s + 1) % len(curr_ring)], curr_ring[s]])
                f.material_index = mat_stem_idx
                f.smooth = True
                for loop in f.loops:
                    loop[uv_layer].uv = (0.5, 0.0)
        prev_ring = curr_ring

def build_stage5_master_plant():
    """
    Construye la PLANTA DEFINITIVA DE TOMATE (Etapa 5):
    - Mata orgánica tupida y redondeada con ramas secundarias curvadas y compactas.
    - Hojas compuestas botánicas con el verde oscuro propio del tomate.
    """
    mats = create_cartoon_plant_materials()

    mesh = bpy.data.meshes.new("Tomato_4_Mesh")
    obj = bpy.data.objects.new("Tomato_4", mesh)
    bpy.context.collection.objects.link(obj)

    for m in mats:
        obj.data.materials.append(m)

    MAT_LEAF = 0
    MAT_STEM = 1
    MAT_RED = 2
    MAT_ORANGE = 3
    MAT_BABY_GREEN = 4
    MAT_PITH = 5
    MAT_CANE = 6
    MAT_TIE = 7
    MAT_FLOWER = 8

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # 1. Tutor de caña
    cane_base = Vector((0.00, 0.03, 0.0))
    build_bamboo_cane(bm, cane_base, 1.28, MAT_CANE, MAT_TIE)

    # 2. Tallos trepadores sinuosos y curvados
    stem_base = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.12)),
        Vector(( 0.02,  0.00, 0.25)),
    ]
    build_vine_segment(bm, stem_base, 0.022, 0.018, uv_layer, MAT_STEM)

    vine_left = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector((-0.04, -0.02, 0.30)),
        Vector((-0.09, -0.04, 0.38)),
        Vector((-0.14, -0.05, 0.52)),
        Vector((-0.13, -0.02, 0.68)),
        Vector((-0.09,  0.01, 0.84)),
        Vector((-0.04,  0.02, 1.02)),
    ]
    build_vine_segment(bm, vine_left, 0.016, 0.010, uv_layer, MAT_STEM)

    vine_right = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector(( 0.05, -0.02, 0.32)),
        Vector(( 0.10, -0.04, 0.42)),
        Vector(( 0.15, -0.04, 0.58)),
        Vector(( 0.13, -0.01, 0.74)),
        Vector(( 0.09,  0.02, 0.90)),
        Vector(( 0.04,  0.02, 1.08)),
    ]
    build_vine_segment(bm, vine_right, 0.016, 0.010, uv_layer, MAT_STEM)

    vine_center = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector(( 0.00,  0.02, 0.45)),
        Vector((-0.02,  0.01, 0.65)),
        Vector(( 0.01, -0.01, 0.85)),
        Vector(( 0.00,  0.01, 1.10)),
        Vector(( 0.00, -0.01, 1.34)),
    ]
    build_vine_segment(bm, vine_center, 0.018, 0.008, uv_layer, MAT_STEM)

    # 3. Hojas compuestas con ramas curvadas y compactas (verde oscuro)
    foliage_leaves = [
        # --- Nivel Bajo ---
        (Vector((-0.09, -0.04, 0.38)), Vector((-0.72, -0.22, 0)),  28.0, 1.05,  0.7),
        (Vector(( 0.10, -0.04, 0.42)), Vector(( 0.72, -0.18, 0)), -28.0, 1.05, -0.7),
        (Vector(( 0.00,  0.03, 0.45)), Vector(( 0.10,  0.75, 0)),   5.0, 1.00,  0.4),
        (Vector((-0.04,  0.02, 0.50)), Vector((-0.40,  0.65, 0)), -15.0, 0.95, -0.5),

        # --- Nivel Medio ---
        (Vector((-0.13, -0.02, 0.62)), Vector((-0.68, -0.36, 0)),  22.0, 1.00,  0.6),
        (Vector(( 0.13, -0.02, 0.68)), Vector(( 0.68, -0.32, 0)), -22.0, 1.00, -0.6),
        (Vector((-0.02,  0.03, 0.65)), Vector((-0.25,  0.70, 0)),  -8.0, 0.95, -0.4),
        (Vector(( 0.04,  0.03, 0.72)), Vector(( 0.35,  0.65, 0)),  12.0, 0.92,  0.4),
        (Vector(( 0.01, -0.01, 0.76)), Vector(( 0.05, -0.70, 0)),  10.0, 0.90,  0.3),

        # --- Nivel Alto ---
        (Vector((-0.07,  0.01, 0.88)), Vector((-0.62, -0.32, 0)),  24.0, 0.88,  0.5),
        (Vector(( 0.07,  0.01, 0.92)), Vector(( 0.62, -0.28, 0)), -24.0, 0.88, -0.5),
        (Vector(( 0.00,  0.02, 0.98)), Vector(( 0.20,  0.70, 0)),   0.0, 0.82,  0.3),
        (Vector((-0.02, -0.01, 1.05)), Vector((-0.45, -0.50, 0)),  15.0, 0.80,  0.4),

        # --- Corona Superior ---
        (Vector(( 0.00, -0.02, 1.16)), Vector((-0.35, -0.45, 0)),  18.0, 0.78,  0.4),
        (Vector(( 0.00,  0.01, 1.22)), Vector(( 0.35, -0.40, 0)), -18.0, 0.75, -0.4),
        (Vector(( 0.00,  0.02, 1.28)), Vector(( 0.10,  0.60, 0)),   5.0, 0.70,  0.3),
    ]

    for p_orig, p_fwd, roll_d, p_scale, b_side in foliage_leaves:
        add_cascading_compound_leaf(
            bm,
            origin=p_orig,
            forward_dir=p_fwd,
            roll_deg=roll_d,
            scale=p_scale,
            uv_layer=uv_layer,
            mat_leaf_idx=MAT_LEAF,
            mat_stem_idx=MAT_STEM,
            bend_side=b_side
        )

    # 4. Racimos péndulos con tomates jugosos en primer plano
    truss_1_fruits = [
        (1, Vector((-0.04, -0.06, -0.10)), 0.112, MAT_RED,    ( 0.16,  0.10,  0.35)),
        (2, Vector((-0.11,  0.00, -0.12)), 0.092, MAT_RED,    (-0.20,  0.12,  0.75)),
        (3, Vector(( 0.04, -0.07, -0.08)), 0.072, MAT_ORANGE, ( 0.05, -0.25,  1.15)),
    ]
    add_fruiting_truss(bm, Vector((-0.09, -0.04, 0.48)), Vector((-0.60, -0.65, 0)), truss_1_fruits, MAT_STEM, MAT_PITH)

    truss_2_fruits = [
        (1, Vector(( 0.04, -0.06, -0.10)), 0.108, MAT_RED,        (-0.12, -0.10, -0.45)),
        (2, Vector(( 0.11,  0.00, -0.12)), 0.088, MAT_RED,        ( 0.18, -0.12, -0.85)),
        (3, Vector((-0.02, -0.07, -0.08)), 0.065, MAT_BABY_GREEN, (-0.05,  0.20, -1.20)),
    ]
    add_fruiting_truss(bm, Vector(( 0.10, -0.03, 0.65)), Vector(( 0.65, -0.55, 0)), truss_2_fruits, MAT_STEM, MAT_PITH)

    truss_3_fruits = [
        (1, Vector((-0.03, -0.05, -0.08)), 0.078, MAT_ORANGE,     ( 0.10,  0.25,  2.05)),
        (2, Vector(( 0.04, -0.03, -0.09)), 0.058, MAT_BABY_GREEN, (-0.15,  0.15,  1.45)),
    ]
    add_fruiting_truss(bm, Vector(( 0.00,  0.01, 0.90)), Vector(( 0.15, -0.70, 0)), truss_3_fruits, MAT_STEM, MAT_PITH)

    # 5. Flores amarillas
    flower_spots = [
        (Vector((-0.04,  0.02, 1.02)), Vector((-0.4, -0.6, -0.2)), 0.085),
        (Vector(( 0.04,  0.02, 1.08)), Vector(( 0.5, -0.5, -0.2)), 0.080),
        (Vector(( 0.00,  0.01, 1.25)), Vector(( 0.2, -0.6,  0.1)), 0.075),
        (Vector(( 0.00, -0.01, 1.32)), Vector((-0.2, -0.4,  0.2)), 0.070),
    ]

    for f_orig, f_dir, f_sz in flower_spots:
        add_tomato_flower(bm, f_orig, f_dir, f_sz, MAT_FLOWER, MAT_STEM)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0018
    sol_mod.offset = 0.0
    sol_mod.use_rim = True

    sub_mod = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub_mod.levels = 1
    sub_mod.render_levels = 1

    return obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\plant_tomato.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando creación de Mata Completa de Tomate con Ramas Curvadas y Verde Oscuro Botánico...\n")

        scene = setup_plant_scene()
        obj = build_stage5_master_plant()

        blend_file = os.path.abspath(r"assets-src/crops/TOM.blend")
        col_stage5 = bpy.data.collections.get("stage5")
        if not col_stage5:
            col_stage5 = bpy.data.collections.new("stage5")
            bpy.context.scene.collection.children.link(col_stage5)

        for old_obj in list(col_stage5.objects):
            if old_obj.name.startswith("Tomato_4"):
                col_stage5.objects.unlink(old_obj)

        if obj.name not in col_stage5.objects:
            col_stage5.objects.link(obj)

        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/cartoon_tomato_stage5_raw.png")
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
