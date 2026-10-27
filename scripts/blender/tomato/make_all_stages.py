import bpy
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion
import math
import os
import sys

def setup_stage_scene():
    """Configura la escena con iluminación dimétrica estándar Plantin (2:1)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonStagesWorld")
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

    cam_data = bpy.data.cameras.new(name="IsoStageCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 1.84
    cam_obj = bpy.data.objects.new(name="IsoStageCam", object_data=cam_data)
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

def create_all_plant_materials():
    """Crea los materiales PBR toon botánicos de la tomatera para todas las etapas."""
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

    # Slot 0: MAT_LEAF (Verde oscuro botánico profundo propio del tomate)
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
    mats.append(make_mat("Mat_Stem", (0.045, 0.14, 0.035, 1.0), 0.40, spec=0.22)) # Slot 1: MAT_STEM
    mats.append(make_mat("Mat_Tomato_Red", (0.88, 0.03, 0.04, 1.0), 0.18, spec=0.75, sss_weight=0.26)) # Slot 2: MAT_RED
    mats.append(make_mat("Mat_Tomato_Orange", (0.94, 0.38, 0.04, 1.0), 0.20, spec=0.70, sss_weight=0.20)) # Slot 3: MAT_ORANGE
    mats.append(make_mat("Mat_Tomato_BabyGreen", (0.28, 0.62, 0.14, 1.0), 0.26, spec=0.55, sss_weight=0.15)) # Slot 4: MAT_BABY_GREEN
    mats.append(make_mat("Mat_Pedicel_Pith", (0.44, 0.68, 0.28, 1.0), 0.40, spec=0.20)) # Slot 5: MAT_PITH
    mats.append(make_mat("Mat_Bamboo_Cane", (0.72, 0.60, 0.35, 1.0), 0.42, spec=0.25)) # Slot 6: MAT_CANE
    mats.append(make_mat("Mat_Raffia_Tie", (0.58, 0.48, 0.30, 1.0), 0.55, spec=0.15)) # Slot 7: MAT_TIE
    mats.append(make_mat("Mat_Flower_Yellow", (0.98, 0.86, 0.06, 1.0), 0.28, spec=0.50)) # Slot 8: MAT_FLOWER
    mats.append(make_mat("Mat_Cotyledon", (0.10, 0.30, 0.07, 1.0), 0.38, spec=0.25)) # Slot 9: MAT_COTYLEDON (Verde tierno seminal)
    mats.append(make_mat("Mat_Bud_Sepal", (0.07, 0.22, 0.05, 1.0), 0.36, spec=0.20)) # Slot 10: MAT_BUD
    mats.append(make_mat("Mat_Senescent_Leaf", (0.24, 0.22, 0.07, 1.0), 0.58, spec=0.12)) # Slot 11: MAT_SENESCENT_LEAF (Ocre seco otoñal)
    mats.append(make_mat("Mat_Dry_Stem", (0.18, 0.16, 0.09, 1.0), 0.52, spec=0.15)) # Slot 12: MAT_DRY_STEM (Tallo pardo pajizo)
    mats.append(make_mat("Mat_Overripe_Tomato", (0.48, 0.03, 0.04, 1.0), 0.40, spec=0.35, sss_weight=0.10)) # Slot 13: MAT_OVERRIPE
    mats.append(make_mat("Mat_Dry_Leaf", (0.27, 0.18, 0.06, 1.0), 0.62, spec=0.10)) # Slot 14: MAT_DRY_LEAF (Hoja pajiza marchita)
    mats.append(make_mat("Mat_Harvest_Scar", (0.75, 0.70, 0.52, 1.0), 0.60, spec=0.10)) # Slot 15: MAT_SCAR (Cicatriz leñosa)

    return mats

MAT_LEAF = 0
MAT_STEM = 1
MAT_RED = 2
MAT_ORANGE = 3
MAT_BABY_GREEN = 4
MAT_PITH = 5
MAT_CANE = 6
MAT_TIE = 7
MAT_FLOWER = 8
MAT_COTYLEDON = 9
MAT_BUD = 10
MAT_SENESCENT_LEAF = 11
MAT_DRY_STEM = 12
MAT_OVERRIPE = 13
MAT_DRY_LEAF = 14
MAT_SCAR = 15

def get_tomato_skin_z(r, theta, r_xy, r_z):
    u_r = min(0.999, r / r_xy)
    z_base = r_z * math.sqrt(max(0.0001, 1.0 - u_r**2))
    dip_radius = r_xy * 0.42
    if r < dip_radius:
        dip_frac = 1.0 - (r / dip_radius)
        z_base -= (dip_frac ** 2.0) * (r_z * 0.28)
    return z_base

def add_master_tomato_fruit(bm, center_pos, radius_xy, mat_fruit_idx, mat_calyx_idx, mat_pith_idx, rotation_euler=(0,0,0)):
    """Añade un fruto de tomate maestro con costillas en hombros, cáliz estelar curvado y cabo."""
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
        center_pos_s = top_center_local + Vector((0, 0, receptacle_h)) + offset_pos

        ring_geom = bmesh.ops.create_circle(
            bm,
            cap_ends=is_cap,
            segments=8,
            radius=ring_r,
            matrix=T_final @ Matrix.Translation(center_pos_s)
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

# Contorno botánico del foliolo
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

INTERCALARY_PROFILE = [
    (0.08, 0.00),
    (0.50, 0.20),
    (0.85, 0.45),
    (0.70, 0.65),
    (0.45, 0.85),
    (0.00, 1.00),
]

def add_master_leaflet_plant(bm, origin, direction, normal, length, width, uv_layer, mat_leaf_idx, is_intercalary=False):
    """Construye un foliolo botánico en una posición 3D arbitraria."""
    dir_y = direction.normalized()
    norm_z = normal.normalized()
    side_x = dir_y.cross(norm_z).normalized()
    norm_z = side_x.cross(dir_y).normalized()

    prof = INTERCALARY_PROFILE if is_intercalary else BOTANICAL_LEAFLET_PROFILE
    pts_count = len(prof)

    r_grid = []
    l_grid = []

    for k, (w_frac, l_frac) in enumerate(prof):
        y_pos = length * l_frac
        droop = -0.050 * (l_frac ** 1.6) * length

        p_spine = origin + dir_y * y_pos + norm_z * droop
        r_row = [bm.verts.new(p_spine)]
        l_row = [r_row[0]]

        w_actual = width * w_frac
        for c_idx in [1]:
            frac = 1.0
            x_off = w_actual * frac
            v_cup = 0.012 * length * w_frac

            p_r = origin + dir_y * y_pos + side_x * x_off + norm_z * (droop + v_cup)
            p_l = origin + dir_y * y_pos - side_x * x_off + norm_z * (droop + v_cup)

            r_row.append(bm.verts.new(p_r))
            l_row.append(bm.verts.new(p_l))
        r_grid.append(r_row)
        l_grid.append(l_row)

    for i in range(pts_count - 1):
        for j in range(1):
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
    """Construye una Hoja Compuesta Realista con rama curvada y foliolos proporcionados."""
    f_dir = Vector((forward_dir.x, forward_dir.y, 0)).normalized()
    up_v = Vector((0, 0, 1))

    side_v = f_dir.cross(up_v).normalized()
    roll_rad = math.radians(roll_deg)
    side_tilted = (side_v * math.cos(roll_rad) + up_v * math.sin(roll_rad)).normalized()

    total_len = 0.28 * scale
    num_steps = 14
    rachis_pts = []
    rachis_dirs = []

    prev_pt = origin
    for s in range(num_steps + 1):
        u = s / float(num_steps)
        z_curve = (0.22 * math.sin(u * math.pi * 0.48) - 0.45 * (u ** 1.42)) * total_len
        xy_reach = (u ** 0.92) * total_len
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

def add_cotyledon_leaf(bm, origin, direction, normal, length, width, uv_layer, mat_cotyledon_idx):
    """Construye una hoja cotiledonar seminal ovalada-lanceolada lisa y suavemente curvada."""
    dir_y = direction.normalized()
    norm_z = normal.normalized()
    side_x = dir_y.cross(norm_z).normalized()
    norm_z = side_x.cross(dir_y).normalized()

    # Perfil ovalado liso
    steps = 8
    r_grid = []
    l_grid = []

    for s in range(steps + 1):
        u = s / float(steps)
        # Forma ovalada-lanceolada
        w_frac = math.sin(u * math.pi) * (1.0 - 0.25 * u)
        y_pos = length * u
        droop = -0.040 * (u ** 1.5) * length
        v_cup = 0.015 * w_frac * length

        p_spine = origin + dir_y * y_pos + norm_z * droop
        v_spine = bm.verts.new(p_spine)
        r_row = [v_spine]
        l_row = [v_spine]

        w_act = width * 0.5 * w_frac
        if w_act > 0.0005:
            p_r = origin + dir_y * y_pos + side_x * w_act + norm_z * (droop + v_cup)
            p_l = origin + dir_y * y_pos - side_x * w_act + norm_z * (droop + v_cup)
            r_row.append(bm.verts.new(p_r))
            l_row.append(bm.verts.new(p_l))
        else:
            r_row.append(v_spine)
            l_row.append(v_spine)

        r_grid.append(r_row)
        l_grid.append(l_row)

    for i in range(steps):
        for j in range(1):
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
                    f.material_index = mat_cotyledon_idx
                    f.smooth = True
                    for loop in f.loops:
                        loop[uv_layer].uv = (0.5, i / float(steps))
                except ValueError:
                    pass

            v0 = l_grid[i][j]
            v1 = l_grid[i + 1][j]
            v2 = l_grid[i + 1][j + 1]
            v3 = l_grid[i + 1][j]
            unique = []
            for v in [v0, v1, v2, v3]:
                if v not in unique:
                    unique.append(v)
            if len(unique) >= 3:
                try:
                    f = bm.faces.new(unique)
                    f.material_index = mat_cotyledon_idx
                    f.smooth = True
                    for loop in f.loops:
                        loop[uv_layer].uv = (0.5, i / float(steps))
                except ValueError:
                    pass

def build_bamboo_cane(bm, base_pos, height, mat_cane_idx, mat_tie_idx):
    """Construye un tutor de caña de bambú como tubo continuo con nudos y ataduras de rafia (resistente a Subdivision)."""
    num_nodes = max(3, int(height / 0.22))
    r_base = 0.016
    lean = Vector((0.003, 0.002, 0.0))

    # Construir perfil vertical de la caña con anillos continuos
    z_pts = [0.0]
    for i in range(1, num_nodes):
        z_node = (height / num_nodes) * i
        z_pts.append(z_node - 0.008)
        z_pts.append(z_node)
        z_pts.append(z_node + 0.008)
    z_pts.append(height)

    rings = []
    for z in z_pts:
        frac = z / height
        r = r_base * (1.0 - frac * 0.35)
        is_node = any(abs(z - (height / num_nodes) * i) < 0.002 for i in range(1, num_nodes))
        if is_node:
            r *= 1.12

        p_c = base_pos + lean * frac + Vector((0, 0, z))
        ring = bmesh.ops.create_circle(
            bm,
            cap_ends=False,
            segments=10,
            radius=r,
            matrix=Matrix.Translation(p_c)
        )['verts']
        rings.append(ring)

    # Conectar anillos con caras cuádruples continuas
    for idx in range(len(rings) - 1):
        r1 = rings[idx]
        r2 = rings[idx + 1]
        for s in range(len(r1)):
            f = bm.faces.new([r1[s], r1[(s + 1) % len(r1)], r2[(s + 1) % len(r2)], r2[s]])
            f.material_index = mat_cane_idx
            f.smooth = True

    # Tapas base y punta
    f_bot = bm.faces.new(list(reversed(rings[0])))
    f_bot.material_index = mat_cane_idx
    f_bot.smooth = True

    f_top = bm.faces.new(rings[-1])
    f_top.material_index = mat_cane_idx
    f_top.smooth = True

    # Ataduras de rafia ceñidas
    tie_heights = [0.32, 0.68, 1.02]
    for th in tie_heights:
        if th < height * 0.90:
            frac_t = th / height
            r_cane_th = r_base * (1.0 - frac_t * 0.35) * 1.08
            tie_p = base_pos + lean * frac_t + Vector((0, 0, th))
            c_tie = bmesh.ops.create_cone(
                bm,
                cap_ends=True,
                segments=12,
                radius1=r_cane_th,
                radius2=r_cane_th * 0.96,
                depth=0.016,
                matrix=Matrix.Translation(tie_p)
            )
            for f in {f for v in c_tie['verts'] for f in v.link_faces}:
                f.material_index = mat_tie_idx
                f.smooth = True

def add_tomato_flower(bm, center_pos, direction, scale, mat_flower_idx, mat_stem_idx):
    """Construye una flor botánica estrellada de tomate de 5 pétalos recurvados con cono estaminal."""
    f_dir = direction.normalized()
    up_v = Vector((0, 0, 1))
    side_x = f_dir.cross(up_v).normalized()
    norm_z = side_x.cross(f_dir).normalized()

    # Receptáculo y pedicelo
    rec_r = 0.007 * scale
    rec_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=8,
        radius1=rec_r * 1.2,
        radius2=rec_r * 0.6,
        depth=0.012 * scale,
        matrix=Matrix.Translation(center_pos)
    )
    for f in {f for v in rec_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_stem_idx
        f.smooth = True

    # 5 pétalos estrellados amarillos recurvados
    num_petals = 5
    petal_len = 0.038 * scale
    for p_i in range(num_petals):
        ang = (p_i / float(num_petals)) * 2.0 * math.pi
        p_dir = (side_x * math.cos(ang) + norm_z * math.sin(ang)).normalized()
        p_perp = p_dir.cross(f_dir).normalized()

        v_base = bm.verts.new(center_pos + f_dir * 0.006 * scale)
        v_mid_l = bm.verts.new(center_pos + p_dir * petal_len * 0.45 - p_perp * 0.010 * scale + f_dir * 0.004 * scale)
        v_mid_r = bm.verts.new(center_pos + p_dir * petal_len * 0.45 + p_perp * 0.010 * scale + f_dir * 0.004 * scale)
        v_tip = bm.verts.new(center_pos + p_dir * petal_len - f_dir * 0.012 * scale)

        f_p = bm.faces.new([v_base, v_mid_l, v_tip, v_mid_r])
        f_p.material_index = mat_flower_idx
        f_p.smooth = True

    # Cono estaminal amarillo brillante
    cone_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=8,
        radius1=0.008 * scale,
        radius2=0.002 * scale,
        depth=0.020 * scale,
        matrix=Matrix.Translation(center_pos + f_dir * 0.012 * scale)
    )
    for f in {f for v in cone_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_flower_idx
        f.smooth = True

def add_fruiting_truss(bm, origin, direction, fruits_list, mat_stem_idx, mat_pith_idx):
    """Construye un racimo péndulo con tomates de distintos calibres y estados de maduración."""
    dir_main = direction.normalized()
    up_v = Vector((0, 0, 1))

    pts_truss = [
        origin,
        origin + dir_main * 0.05 - up_v * 0.02,
        origin + dir_main * 0.10 - up_v * 0.06,
        origin + dir_main * 0.14 - up_v * 0.12,
    ]
    smooth_truss = interpolate_spline(pts_truss, num_sub=4)

    prev_ring = None
    for idx, p in enumerate(smooth_truss):
        frac = idx / float(len(smooth_truss) - 1)
        r = 0.006 * (1.0 - frac * 0.45)
        ring = bmesh.ops.create_circle(bm, cap_ends=(idx == 0 or idx == len(smooth_truss) - 1), segments=6, radius=r, matrix=Matrix.Translation(p))['verts']
        if prev_ring:
            for s in range(len(ring)):
                f = bm.faces.new([prev_ring[s], prev_ring[(s + 1) % len(ring)], ring[(s + 1) % len(ring)], ring[s]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

    for (node_idx, p_offset, radius, mat_color, rot_euler) in fruits_list:
        p_anchor = pts_truss[min(node_idx, len(pts_truss) - 1)]
        p_fruit_cen = p_anchor + p_offset

        add_master_tomato_fruit(
            bm,
            center_pos=p_fruit_cen,
            radius_xy=radius,
            mat_fruit_idx=mat_color,
            mat_calyx_idx=mat_stem_idx,
            mat_pith_idx=mat_pith_idx,
            rotation_euler=rot_euler
        )

def add_empty_harvested_calyx(bm, center_pos, radius_calyx, mat_calyx_idx, mat_scar_idx, rotation_euler=(0,0,0)):
    """Construye un cáliz estelar vacío tras la cosecha (cabo huérfano con receptáculo, sépalos curvados y cicatriz de corte)."""
    rot_mat = Euler(rotation_euler, 'XYZ').to_matrix().to_4x4()
    T_final = Matrix.Translation(center_pos) @ rot_mat

    receptacle_r = 0.010
    receptacle_h = 0.006
    rec_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=8,
        radius1=receptacle_r * 1.05,
        radius2=receptacle_r * 0.75,
        depth=receptacle_h,
        matrix=T_final
    )
    for f in {f for v in rec_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_calyx_idx
        f.smooth = True

    # Cicatriz de abscisión / corte de la fruta cosechada
    scar_geom = bmesh.ops.create_circle(
        bm,
        cap_ends=True,
        segments=8,
        radius=receptacle_r * 0.70,
        matrix=T_final @ Matrix.Translation(Vector((0, 0, receptacle_h * 0.52)))
    )
    for f in {f for v in scar_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_scar_idx
        f.smooth = True

    # 5 sépalos marchitos recurvados hacia abajo/afuera
    num_sepals = 5
    sepal_len = 0.026
    for s_i in range(num_sepals):
        angle = (s_i / float(num_sepals)) * 2.0 * math.pi
        dir_xy = Vector((math.cos(angle), math.sin(angle), 0.0))
        perp_xy = Vector((-math.sin(angle), math.cos(angle), 0.0))

        vl_base = T_final @ (dir_xy * receptacle_r * 0.75 - perp_xy * 0.0035)
        vr_base = T_final @ (dir_xy * receptacle_r * 0.75 + perp_xy * 0.0035)
        vl_mid = T_final @ (dir_xy * sepal_len * 0.5 - perp_xy * 0.0022 + Vector((0, 0, 0.003)))
        vr_mid = T_final @ (dir_xy * sepal_len * 0.5 + perp_xy * 0.0022 + Vector((0, 0, 0.003)))
        v_tip = T_final @ (dir_xy * sepal_len + Vector((0, 0, -0.005)))

        f1 = bm.faces.new([bm.verts.new(vl_base), bm.verts.new(vr_base), bm.verts.new(vr_mid), bm.verts.new(vl_mid)])
        f2 = bm.faces.new([bm.verts.new(vl_mid), bm.verts.new(vr_mid), bm.verts.new(v_tip)])
        f1.material_index = mat_calyx_idx
        f2.material_index = mat_calyx_idx
        f1.smooth = True
        f2.smooth = True

def add_harvested_truss(bm, origin, direction, truss_items, mat_stem_idx, mat_pith_idx, mat_overripe_idx, mat_scar_idx):
    """Construye un racimo cosechado con pedicelos unidos al eje principal, cálices vacíos y frutos sobremaduros."""
    dir_main = direction.normalized()
    up_v = Vector((0, 0, 1))

    pts_truss = [
        origin,
        origin + dir_main * 0.05 - up_v * 0.03,
        origin + dir_main * 0.10 - up_v * 0.07,
        origin + dir_main * 0.13 - up_v * 0.12,
    ]
    smooth_truss = interpolate_spline(pts_truss, num_sub=4)

    prev_ring = None
    for idx, p in enumerate(smooth_truss):
        frac = idx / float(len(smooth_truss) - 1)
        r = 0.0055 * (1.0 - frac * 0.45)
        ring = bmesh.ops.create_circle(bm, cap_ends=(idx == 0 or idx == len(smooth_truss) - 1), segments=6, radius=r, matrix=Matrix.Translation(p))['verts']
        if prev_ring:
            for s in range(len(ring)):
                f = bm.faces.new([prev_ring[s], prev_ring[(s + 1) % len(ring)], ring[(s + 1) % len(ring)], ring[s]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

    for (node_idx, p_offset, is_fruit, rot_euler) in truss_items:
        p_anchor = pts_truss[min(node_idx, len(pts_truss) - 1)]
        p_item = p_anchor + p_offset

        # Pedicelo que une físicamente p_anchor con p_item
        p_diff = p_item - p_anchor
        p_dist = p_diff.length
        if p_dist > 0.006:
            p_mid = (p_anchor + p_item) * 0.5
            rot_ped = Vector((0, 0, 1)).rotation_difference(p_diff.normalized()).to_euler()
            ped_geom = bmesh.ops.create_cone(
                bm,
                cap_ends=True,
                segments=6,
                radius1=0.0036,
                radius2=0.0028,
                depth=p_dist,
                matrix=Matrix.Translation(p_mid) @ rot_ped.to_matrix().to_4x4()
            )
            for f in {f for v in ped_geom['verts'] for f in v.link_faces}:
                f.material_index = mat_stem_idx
                f.smooth = True

        if is_fruit:
            add_master_tomato_fruit(
                bm,
                center_pos=p_item,
                radius_xy=0.070,
                mat_fruit_idx=mat_overripe_idx,
                mat_calyx_idx=mat_stem_idx,
                mat_pith_idx=mat_pith_idx,
                rotation_euler=rot_euler
            )
        else:
            add_empty_harvested_calyx(
                bm,
                center_pos=p_item,
                radius_calyx=0.026,
                mat_calyx_idx=mat_stem_idx,
                mat_scar_idx=mat_scar_idx,
                rotation_euler=rot_euler
            )

def build_vine_segment(bm, points, r_base, r_tip, uv_layer, mat_stem_idx):
    """Construye un tallo o guía con suavizado spline y radio decreciente."""
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

# ==============================================================================
# 1. ETAPA 1: GERMINACIÓN / PLÁNTULA COTILEDONAR (Tomato_1)
# ==============================================================================
def build_stage1_germination(mats):
    """
    Etapa 1: Germinación (BBCH 00-09).
    - Hipocótilo curvo emergiendo de la tierra.
    - Par de cotiledones seminales opuestos lisos y convexos (verde tierno).
    - Primer par embrionario de hojas verdaderas asomando en el ápice (verde oscuro botánico serrado).
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Tallo hipocótilo
    hypocotyl = [
        Vector((0.000,  0.000, 0.000)),
        Vector((0.004, -0.003, 0.025)),
        Vector((0.006,  0.001, 0.050)),
        Vector((0.003,  0.002, 0.075)),
        Vector((0.000,  0.000, 0.090)),
    ]
    build_vine_segment(bm, hypocotyl, 0.0055, 0.0035, uv_layer, MAT_STEM)

    p_apex = hypocotyl[-1]

    # Cotiledones opuestos (izquierdo y derecho)
    # En tomate real son ovalados-lanceolados lisos, ligeramente carnosos y arqueados hacia abajo
    add_cotyledon_leaf(
        bm,
        origin=p_apex + Vector((-0.002, 0, 0)),
        direction=Vector((-0.75, -0.20, 0.25)),
        normal=Vector((-0.20, 0.00, 0.90)),
        length=0.048,
        width=0.022,
        uv_layer=uv_layer,
        mat_cotyledon_idx=MAT_COTYLEDON
    )
    add_cotyledon_leaf(
        bm,
        origin=p_apex + Vector((0.002, 0, 0)),
        direction=Vector((0.75, 0.20, 0.25)),
        normal=Vector((0.20, 0.00, 0.90)),
        length=0.048,
        width=0.022,
        uv_layer=uv_layer,
        mat_cotyledon_idx=MAT_COTYLEDON
    )

    # Primer par de hojas verdaderas diminutas serradas en el centro
    add_master_leaflet_plant(
        bm,
        origin=p_apex + Vector((0, -0.001, 0.003)),
        direction=Vector((0.15, -0.70, 0.50)),
        normal=Vector((0.0, 0.40, 0.85)),
        length=0.026,
        width=0.015,
        uv_layer=uv_layer,
        mat_leaf_idx=MAT_LEAF
    )
    add_master_leaflet_plant(
        bm,
        origin=p_apex + Vector((0, 0.001, 0.003)),
        direction=Vector((-0.15, 0.70, 0.50)),
        normal=Vector((0.0, -0.40, 0.85)),
        length=0.024,
        width=0.014,
        uv_layer=uv_layer,
        mat_leaf_idx=MAT_LEAF
    )

    mesh = bpy.data.meshes.new("Tomato_1_Mesh")
    obj = bpy.data.objects.new("Tomato_1", mesh)
    for m in mats:
        obj.data.materials.append(m)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0015
    sol.offset = 0.0

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return obj

# ==============================================================================
# 2. ETAPA 2: DESARROLLO VEGETATIVO / PLANTÍN (Tomato_2)
# ==============================================================================
def build_stage2_leaf(mats):
    """
    Etapa 2: Desarrollo vegetativo / Plantín joven (BBCH 10-19).
    - Tallo autosostenible erguido y verde (~0.32 m).
    - 4 hojas compuestas completas con raquis curvado en cascada y verde oscuro botánico.
    - Ápice terminal vigoroso con nuevas hojas en formación.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    stem = [
        Vector(( 0.000,  0.000, 0.000)),
        Vector(( 0.005, -0.004, 0.080)),
        Vector((-0.003,  0.005, 0.160)),
        Vector(( 0.006,  0.002, 0.240)),
        Vector(( 0.000,  0.000, 0.320)),
    ]
    build_vine_segment(bm, stem, 0.011, 0.006, uv_layer, MAT_STEM)

    # 4 Hojas compuestas en filotaxis alterna espiral
    leaves_stage2 = [
        (Vector((-0.002, -0.003, 0.090)), Vector((-0.70, -0.30, 0)),  20.0, 0.58,  0.5),
        (Vector(( 0.004, -0.002, 0.150)), Vector(( 0.70, -0.25, 0)), -20.0, 0.65, -0.5),
        (Vector((-0.003,  0.004, 0.210)), Vector((-0.25,  0.72, 0)), -10.0, 0.62, -0.4),
        (Vector(( 0.005,  0.002, 0.270)), Vector(( 0.40,  0.65, 0)),  15.0, 0.55,  0.4),
    ]

    for p_orig, p_fwd, roll_d, p_scale, b_side in leaves_stage2:
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

    # Brote apical
    p_top = stem[-1]
    add_master_leaflet_plant(
        bm,
        origin=p_top,
        direction=Vector((0.0, -0.3, 0.8)),
        normal=Vector((0.0, 0.6, 0.3)),
        length=0.050,
        width=0.030,
        uv_layer=uv_layer,
        mat_leaf_idx=MAT_LEAF
    )

    mesh = bpy.data.meshes.new("Tomato_2_Mesh")
    obj = bpy.data.objects.new("Tomato_2", mesh)
    for m in mats:
        obj.data.materials.append(m)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0016
    sol.offset = 0.0

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return obj

# ==============================================================================
# 3. ETAPA 3: FORMACIÓN DE ESTRUCTURA Y ENCAÑE (Tomato_3)
# ==============================================================================
def build_stage3_structure(mats):
    """
    Etapa 3: Estructura y Encañe (BBCH 20-49).
    - Tutor de caña de bambú colocado (0.80 m) con 1 atadura de rafia.
    - Tallo principal trepador guiado (~0.65 m).
    - 7 hojas compuestas densas con verde oscuro botánico.
    - Racimo de capullos florales cerrados inmaduros en el tercio superior.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Tutor de bambú inicial
    cane_base = Vector((0.00, 0.025, 0.0))
    build_bamboo_cane(bm, cane_base, 0.82, MAT_CANE, MAT_TIE)

    # Tallo principal guiado
    stem = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.12)),
        Vector((-0.03, -0.02, 0.25)),
        Vector((-0.06, -0.01, 0.40)),
        Vector((-0.04,  0.01, 0.52)),
        Vector(( 0.00,  0.01, 0.65)),
    ]
    build_vine_segment(bm, stem, 0.018, 0.009, uv_layer, MAT_STEM)

    # 7 Hojas compuestas
    leaves_stage3 = [
        (Vector(( 0.01, -0.01, 0.14)), Vector(( 0.70, -0.20, 0)), -25.0, 0.80, -0.6),
        (Vector((-0.02, -0.02, 0.22)), Vector((-0.68, -0.25, 0)),  25.0, 0.85,  0.6),
        (Vector((-0.04,  0.02, 0.28)), Vector(( 0.10,  0.72, 0)),   5.0, 0.80,  0.4),
        (Vector((-0.06, -0.01, 0.38)), Vector((-0.65, -0.40, 0)),  20.0, 0.85,  0.5),
        (Vector((-0.05,  0.01, 0.46)), Vector(( 0.60, -0.35, 0)), -20.0, 0.85, -0.5),
        (Vector((-0.02,  0.02, 0.54)), Vector((-0.20,  0.70, 0)),  -8.0, 0.78, -0.4),
        (Vector(( 0.00,  0.00, 0.62)), Vector(( 0.10, -0.65, 0)),  12.0, 0.72,  0.3),
    ]

    for p_orig, p_fwd, roll_d, p_scale, b_side in leaves_stage3:
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

    # Racimo de capullos florales cerrados inmaduros
    p_bud_origin = Vector((-0.03, -0.01, 0.56))
    dir_bud = Vector((-0.5, -0.5, -0.2)).normalized()
    bmesh.ops.create_cone(
        bm, cap_ends=True, segments=6, radius1=0.007, radius2=0.002, depth=0.016,
        matrix=Matrix.Translation(p_bud_origin + dir_bud * 0.02)
    )

    mesh = bpy.data.meshes.new("Tomato_3_Mesh")
    obj = bpy.data.objects.new("Tomato_3", mesh)
    for m in mats:
        obj.data.materials.append(m)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0017
    sol.offset = 0.0

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return obj

# ==============================================================================
# 4. ETAPA 4: FLORACIÓN ACTIVA Y CUAJE TEMPRANO (Tomato_Flowering)
# ==============================================================================
def build_stage4_flowering(mats):
    """
    Etapa 4: Floración (BBCH 50-69).
    - Tutor de bambú alto (1.15 m) con 2 ataduras.
    - Tallos robustos trepadores (~1.05 m).
    - 10 hojas compuestas densas con verde oscuro botánico.
    - 2 racimos florales con flores amarillas estrelladas bien abiertas.
    - 1 racimo con 2 tomatitos bebé recién cuajados (verde pálido, 4 cm).
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Tutor de bambú
    cane_base = Vector((0.00, 0.025, 0.0))
    build_bamboo_cane(bm, cane_base, 1.15, MAT_CANE, MAT_TIE)

    # Tallos trepadores
    stem_base = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.12)),
        Vector(( 0.02,  0.00, 0.25)),
    ]
    build_vine_segment(bm, stem_base, 0.020, 0.016, uv_layer, MAT_STEM)

    vine_left = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector((-0.04, -0.02, 0.32)),
        Vector((-0.09, -0.03, 0.44)),
        Vector((-0.12, -0.02, 0.58)),
        Vector((-0.09,  0.01, 0.74)),
        Vector((-0.04,  0.02, 0.92)),
    ]
    build_vine_segment(bm, vine_left, 0.015, 0.009, uv_layer, MAT_STEM)

    vine_right = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector(( 0.05, -0.02, 0.35)),
        Vector(( 0.09, -0.02, 0.50)),
        Vector(( 0.10,  0.00, 0.68)),
        Vector(( 0.06,  0.02, 0.86)),
        Vector(( 0.02,  0.01, 1.05)),
    ]
    build_vine_segment(bm, vine_right, 0.015, 0.008, uv_layer, MAT_STEM)

    # 10 Hojas compuestas densas
    leaves_stage4 = [
        # Nivel Bajo
        (Vector((-0.08, -0.03, 0.36)), Vector((-0.70, -0.22, 0)),  28.0, 1.00,  0.7),
        (Vector(( 0.08, -0.02, 0.40)), Vector(( 0.70, -0.18, 0)), -28.0, 1.00, -0.7),
        (Vector(( 0.00,  0.03, 0.42)), Vector(( 0.10,  0.75, 0)),   5.0, 0.95,  0.4),

        # Nivel Medio
        (Vector((-0.12, -0.02, 0.56)), Vector((-0.65, -0.40, 0)),  22.0, 0.95,  0.6),
        (Vector(( 0.10, -0.01, 0.62)), Vector(( 0.65, -0.35, 0)), -22.0, 0.95, -0.6),
        (Vector((-0.02,  0.03, 0.60)), Vector((-0.25,  0.70, 0)),  -8.0, 0.90, -0.4),
        (Vector(( 0.01, -0.01, 0.70)), Vector(( 0.05, -0.70, 0)),  10.0, 0.88,  0.3),

        # Nivel Alto
        (Vector((-0.07,  0.01, 0.82)), Vector((-0.60, -0.30, 0)),  24.0, 0.85,  0.5),
        (Vector(( 0.06,  0.01, 0.86)), Vector(( 0.60, -0.25, 0)), -24.0, 0.85, -0.5),
        (Vector(( 0.00,  0.02, 0.94)), Vector(( 0.20,  0.70, 0)),   0.0, 0.80,  0.3),
    ]

    for p_orig, p_fwd, roll_d, p_scale, b_side in leaves_stage4:
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

    # 1. Racimo de cuaje temprano: 2 tomatitos bebé verde pálido en nivel medio
    truss_early = [
        (1, Vector((-0.04, -0.06, -0.08)), 0.052, MAT_BABY_GREEN, ( 0.15,  0.10,  0.35)),
        (2, Vector((-0.08,  0.00, -0.09)), 0.040, MAT_BABY_GREEN, (-0.20,  0.12,  0.75)),
    ]
    add_fruiting_truss(bm, Vector((-0.08, -0.03, 0.46)), Vector((-0.60, -0.60, 0)), truss_early, MAT_STEM, MAT_PITH)

    # 2. Racimos de flores amarillas estrelladas bien abiertas en niveles medio y alto (claramente visibles hacia la cámara)
    flower_clusters = [
        # Cima media hacia el frente
        (Vector(( 0.08, -0.06, 0.62)), Vector(( 0.5, -0.8, -0.1)), 1.15),
        (Vector(( 0.12, -0.04, 0.65)), Vector(( 0.7, -0.6,  0.2)), 1.05),
        (Vector(( 0.06, -0.08, 0.60)), Vector(( 0.3, -0.9, -0.2)), 1.00),

        # Cima superior en la corona
        (Vector((-0.03, -0.05, 0.94)), Vector((-0.2, -0.9,  0.1)), 1.10),
        (Vector(( 0.02, -0.06, 0.98)), Vector(( 0.3, -0.9,  0.2)), 1.05),
        (Vector((-0.01, -0.07, 0.90)), Vector(( 0.0, -1.0, -0.2)), 1.00),
        (Vector(( 0.04, -0.04, 1.04)), Vector(( 0.4, -0.7,  0.3)), 0.95),
    ]

    for f_orig, f_dir, f_sz in flower_clusters:
        add_tomato_flower(bm, f_orig, f_dir, f_sz, MAT_FLOWER, MAT_STEM)

    mesh = bpy.data.meshes.new("Tomato_Flowering_Mesh")
    obj = bpy.data.objects.new("Tomato_Flowering", mesh)
    for m in mats:
        obj.data.materials.append(m)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0018
    sol.offset = 0.0

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return obj

# ==============================================================================
# 5. ETAPA 5: FRUCTIFICACIÓN Y COSECHA (Tomato_4)
# ==============================================================================
def build_stage5_fruiting(mats):
    """
    Etapa 5: Fructificación madura (BBCH 70-89).
    - Tutor de bambú completo (1.28 m) con ataduras de rafia.
    - Tallos trepadores robustos (~1.34 m).
    - 16 hojas compuestas densas con verde oscuro botánico.
    - Racimos péndulos con tomates jugosos beefsteak maduros rojos, naranjas y verdes bebé.
    - Flores amarillas en la corona apical.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Tutor de caña
    cane_base = Vector((0.00, 0.03, 0.0))
    build_bamboo_cane(bm, cane_base, 1.28, MAT_CANE, MAT_TIE)

    # Tallos trepadores sinuosos
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

    # 16 Hojas compuestas densas
    foliage_leaves = [
        # Nivel Bajo
        (Vector((-0.09, -0.04, 0.38)), Vector((-0.72, -0.22, 0)),  28.0, 1.05,  0.7),
        (Vector(( 0.10, -0.04, 0.42)), Vector(( 0.72, -0.18, 0)), -28.0, 1.05, -0.7),
        (Vector(( 0.00,  0.03, 0.45)), Vector(( 0.10,  0.75, 0)),   5.0, 1.00,  0.4),
        (Vector((-0.04,  0.02, 0.50)), Vector((-0.40,  0.65, 0)), -15.0, 0.95, -0.5),

        # Nivel Medio
        (Vector((-0.13, -0.02, 0.62)), Vector((-0.68, -0.36, 0)),  22.0, 1.00,  0.6),
        (Vector(( 0.13, -0.02, 0.68)), Vector(( 0.68, -0.32, 0)), -22.0, 1.00, -0.6),
        (Vector((-0.02,  0.03, 0.65)), Vector((-0.25,  0.70, 0)),  -8.0, 0.95, -0.4),
        (Vector(( 0.04,  0.03, 0.72)), Vector(( 0.35,  0.65, 0)),  12.0, 0.92,  0.4),
        (Vector(( 0.01, -0.01, 0.76)), Vector(( 0.05, -0.70, 0)),  10.0, 0.90,  0.3),

        # Nivel Alto
        (Vector((-0.07,  0.01, 0.88)), Vector((-0.62, -0.32, 0)),  24.0, 0.88,  0.5),
        (Vector(( 0.07,  0.01, 0.92)), Vector(( 0.62, -0.28, 0)), -24.0, 0.88, -0.5),
        (Vector(( 0.00,  0.02, 0.98)), Vector(( 0.20,  0.70, 0)),   0.0, 0.82,  0.3),
        (Vector((-0.02, -0.01, 1.05)), Vector((-0.45, -0.50, 0)),  15.0, 0.80,  0.4),

        # Corona Superior
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

    # Racimos de tomates beefsteak
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

    # Flores amarillas
    flower_spots = [
        (Vector((-0.03, -0.05, 1.15)), Vector((-0.3, -0.9,  0.2)), 1.00),
        (Vector(( 0.03, -0.06, 1.22)), Vector(( 0.4, -0.9,  0.2)), 0.95),
        (Vector(( 0.00, -0.05, 1.30)), Vector(( 0.1, -0.9,  0.3)), 0.90),
    ]

    for f_orig, f_dir, f_sz in flower_spots:
        add_tomato_flower(bm, f_orig, f_dir, f_sz, MAT_FLOWER, MAT_STEM)

    mesh = bpy.data.meshes.new("Tomato_4_Mesh")
    obj = bpy.data.objects.new("Tomato_4", mesh)
    for m in mats:
        obj.data.materials.append(m)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0018
    sol.offset = 0.0

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return obj

# ==============================================================================
# 6. ETAPA POST-FLORACIÓN / COSECHA Y SENESCENCIA (Tomato_Harvested)
# ==============================================================================
def build_stage_harvested(mats):
    """
    Etapa Post-Fructificación / Cosechada / Senescencia (BBCH 90-99).
    - Tutor de bambú completo (1.28 m) con ataduras de rafia.
    - Tallos principales con mayor declive por pérdida de turgencia en verde pardo seco.
    - Follaje senescente en tonos ocre, mostaza seco y pardo oliváceo.
    - Racimos cosechados con cálices estelares abiertos vacíos (cabos cortados).
    - Fruto residual sobremaduro oscuro deshidratado.
    - Ápice con flores secas marchitas.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    cane_base = Vector((0.00, 0.03, 0.0))
    build_bamboo_cane(bm, cane_base, 1.28, MAT_CANE, MAT_TIE)

    stem_base = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.12)),
        Vector(( 0.02,  0.00, 0.25)),
    ]
    build_vine_segment(bm, stem_base, 0.021, 0.017, uv_layer, MAT_DRY_STEM)

    vine_left = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector((-0.04, -0.02, 0.30)),
        Vector((-0.10, -0.04, 0.37)),
        Vector((-0.15, -0.05, 0.50)),
        Vector((-0.14, -0.02, 0.65)),
        Vector((-0.10,  0.01, 0.81)),
        Vector((-0.05,  0.02, 0.98)),
    ]
    build_vine_segment(bm, vine_left, 0.015, 0.009, uv_layer, MAT_DRY_STEM)

    vine_right = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector(( 0.05, -0.02, 0.32)),
        Vector(( 0.11, -0.04, 0.41)),
        Vector(( 0.16, -0.04, 0.56)),
        Vector(( 0.14, -0.01, 0.72)),
        Vector(( 0.09,  0.02, 0.88)),
        Vector(( 0.04,  0.02, 1.05)),
    ]
    build_vine_segment(bm, vine_right, 0.015, 0.009, uv_layer, MAT_DRY_STEM)

    vine_center = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector(( 0.00,  0.02, 0.45)),
        Vector((-0.02,  0.01, 0.65)),
        Vector(( 0.01, -0.01, 0.85)),
        Vector(( 0.00,  0.01, 1.08)),
        Vector(( 0.00, -0.01, 1.30)),
    ]
    build_vine_segment(bm, vine_center, 0.017, 0.007, uv_layer, MAT_DRY_STEM)

    # Hojas compuestas senescentes dispersas (8 hojas: defoliación basal típica, caída acentuada y marchitez)
    foliage_leaves = [
        # Nivel Medio (hojas caídas hacia los lados con fuerte declive)
        (Vector((-0.13, -0.02, 0.62)), Vector((-0.68, -0.36, 0)),  35.0, 0.90,  0.8, MAT_SENESCENT_LEAF),
        (Vector(( 0.13, -0.02, 0.68)), Vector(( 0.68, -0.32, 0)), -35.0, 0.90, -0.8, MAT_DRY_LEAF),
        (Vector((-0.02,  0.03, 0.65)), Vector((-0.25,  0.70, 0)), -18.0, 0.85, -0.6, MAT_SENESCENT_LEAF),
        (Vector(( 0.04,  0.03, 0.72)), Vector(( 0.35,  0.65, 0)),  20.0, 0.82,  0.6, MAT_DRY_LEAF),

        # Nivel Alto
        (Vector((-0.07,  0.01, 0.88)), Vector((-0.62, -0.32, 0)),  30.0, 0.78,  0.7, MAT_SENESCENT_LEAF),
        (Vector(( 0.07,  0.01, 0.92)), Vector(( 0.62, -0.28, 0)), -30.0, 0.78, -0.7, MAT_DRY_LEAF),
        (Vector(( 0.00,  0.02, 0.98)), Vector(( 0.20,  0.70, 0)),   8.0, 0.75,  0.5, MAT_SENESCENT_LEAF),

        # Corona Superior
        (Vector(( 0.00, -0.02, 1.16)), Vector((-0.35, -0.45, 0)),  25.0, 0.68,  0.5, MAT_DRY_LEAF),
        (Vector(( 0.00,  0.01, 1.22)), Vector(( 0.35, -0.40, 0)), -25.0, 0.65, -0.5, MAT_SENESCENT_LEAF),
    ]

    for p_orig, p_fwd, roll_d, p_scale, b_side, leaf_m in foliage_leaves:
        add_cascading_compound_leaf(
            bm,
            origin=p_orig,
            forward_dir=p_fwd,
            roll_deg=roll_d,
            scale=p_scale,
            uv_layer=uv_layer,
            mat_leaf_idx=leaf_m,
            mat_stem_idx=MAT_DRY_STEM,
            bend_side=b_side
        )

    # Racimos cosechados
    # Racimo 1 (inferior): 3 cálices vacíos (recolectados, cabos huérfanos con cicatriz)
    truss_1_harvested = [
        (1, Vector((-0.025, -0.030, -0.025)), False, ( 0.16,  0.10,  0.35)),
        (2, Vector((-0.035,  0.015, -0.030)), False, (-0.20,  0.12,  0.75)),
        (3, Vector(( 0.020, -0.025, -0.025)), False, ( 0.05, -0.25,  1.15)),
    ]
    add_harvested_truss(bm, Vector((-0.09, -0.04, 0.48)), Vector((-0.60, -0.65, 0)), truss_1_harvested, MAT_DRY_STEM, MAT_PITH, MAT_OVERRIPE, MAT_SCAR)

    # Racimo 2 (medio): 2 cálices vacíos y 1 tomate sobremaduro residual arrugado
    truss_2_harvested = [
        (1, Vector(( 0.030, -0.030, -0.040)), True,  (-0.12, -0.10, -0.45)),
        (2, Vector(( 0.035,  0.015, -0.030)), False, ( 0.18, -0.12, -0.85)),
        (3, Vector((-0.020, -0.025, -0.025)), False, (-0.05,  0.20, -1.20)),
    ]
    add_harvested_truss(bm, Vector(( 0.10, -0.03, 0.65)), Vector(( 0.65, -0.55, 0)), truss_2_harvested, MAT_DRY_STEM, MAT_PITH, MAT_OVERRIPE, MAT_SCAR)

    # Racimo 3 (superior): 2 cálices vacíos
    truss_3_harvested = [
        (1, Vector((-0.025, -0.020, -0.025)), False, ( 0.10,  0.25,  2.05)),
        (2, Vector(( 0.025, -0.020, -0.030)), False, (-0.15,  0.15,  1.45)),
    ]
    add_harvested_truss(bm, Vector(( 0.00,  0.01, 0.90)), Vector(( 0.15, -0.70, 0)), truss_3_harvested, MAT_DRY_STEM, MAT_PITH, MAT_OVERRIPE, MAT_SCAR)

    # Flores marchitas en el ápice
    dry_buds = [
        (Vector((-0.03, -0.05, 1.15)), Vector((-0.3, -0.9,  0.2))),
        (Vector(( 0.03, -0.06, 1.22)), Vector(( 0.4, -0.9,  0.2))),
    ]
    for b_orig, b_dir in dry_buds:
        bmesh.ops.create_cone(
            bm, cap_ends=True, segments=6, radius1=0.006, radius2=0.001, depth=0.015,
            matrix=Matrix.Translation(b_orig + b_dir.normalized() * 0.01)
        )

    mesh = bpy.data.meshes.new("Tomato_Harvested_Mesh")
    obj = bpy.data.objects.new("Tomato_Harvested", mesh)
    for m in mats:
        obj.data.materials.append(m)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol.thickness = 0.0018
    sol.offset = 0.0

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return obj

def main():
    log_path = r"I:\Programacion\Proyectos\plantin\scripts\out\build_all_stages.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando generación de los Tiers Botánicos de Tomatera...\n")

        scene = setup_stage_scene()
        mats = create_all_plant_materials()

        # Generar las etapas
        print("-> Construyendo Etapa 1 (Germinación)...")
        obj1 = build_stage1_germination(mats)

        print("-> Construyendo Etapa 2 (Desarrollo Vegetativo)...")
        obj2 = build_stage2_leaf(mats)

        print("-> Construyendo Etapa 3 (Estructura y Encañe)...")
        obj3 = build_stage3_structure(mats)

        print("-> Construyendo Etapa 4 (Floración y Cuaje)...")
        obj4 = build_stage4_flowering(mats)

        print("-> Construyendo Etapa 5 (Fructificación Definitiva)...")
        obj5 = build_stage5_fruiting(mats)

        print("-> Construyendo Etapa 6 (Cosecha / Senescencia)...")
        obj_harvested = build_stage_harvested(mats)

        stage_mapping = [
            ("stage1", obj1),
            ("stage2", obj2),
            ("stage3", obj3),
            ("stage4", obj4),
            ("stage5", obj5),
            ("harvested", obj_harvested),
        ]

        # Vincular a las colecciones en TOM.blend
        for stage_name, obj in stage_mapping:
            col = bpy.data.collections.get(stage_name)
            if not col:
                col = bpy.data.collections.new(stage_name)
                bpy.context.scene.collection.children.link(col)

            # Limpiar objetos antiguos de esa etapa
            for old_o in list(col.objects):
                col.objects.unlink(old_o)

            col.objects.link(obj)

        blend_file = os.path.abspath(r"assets-src/crops/TOM.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        # Renderizar previews individuales con entintado
        renders_dir = os.path.abspath(r"scripts/blender/tomato/renders")
        os.makedirs(renders_dir, exist_ok=True)
        raw_out_dir = os.path.abspath(r"scripts/out")

        # Ajuste de cámara por etapa para preview claro
        stage_cams = {
            "stage1": (0.35, Vector((0, 0, 0.05))),
            "stage2": (0.65, Vector((0, 0, 0.16))),
            "stage3": (1.10, Vector((0, 0, 0.38))),
            "stage4": (1.45, Vector((0, 0, 0.52))),
            "stage5": (1.84, Vector((0, 0, 0.68))),
            "harvested": (1.84, Vector((0, 0, 0.68))),
        }

        rot_mat = scene.camera.rotation_euler.to_matrix()

        for stage_name, obj in stage_mapping:
            for s_name, o in stage_mapping:
                o.hide_render = (s_name != stage_name)

            o_scale, target_lookat = stage_cams[stage_name]
            scene.camera.data.ortho_scale = o_scale
            scene.camera.location = rot_mat @ Vector((0, 0, 10.0)) + target_lookat

            raw_path = os.path.join(raw_out_dir, f"cartoon_tomato_{stage_name}_raw.png")
            scene.render.filepath = raw_path
            bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Todos los tiers (incluyendo Cosecha/Senescencia) guardados con éxito en {blend_file}\n")

    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
