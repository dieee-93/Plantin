import bpy
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion
import math
import os
import sys

def setup_plant_scene():
    """Configura la escena con iluminación cartoon e isométrica dimétrica estándar."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonPlantWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 0.38

    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 3.0
    sun_data.color = (1.0, 0.98, 0.93)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(48), math.radians(16), math.radians(40))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.2
    fill_data.color = (0.84, 0.90, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-22), math.radians(-140))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.6
    rim_data.color = (0.95, 1.0, 0.90)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-38), math.radians(22), math.radians(150))

    cam_data = bpy.data.cameras.new(name="IsoPlantCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 1.84  # Encuadre cómodo con margen para la silueta entintada
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
    """Crea la paleta de materiales cartoon con mapas de textura y relieve para las hojas."""
    color_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_color.png")
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
                    bsdf.inputs['Subsurface Radius'].default_value = (0.9, 0.25, 0.1)
        return mat

    mat_leaf = bpy.data.materials.new("Mat_Plant_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

    out_node = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf_leaf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf_leaf.inputs['Roughness'].default_value = 0.34
    if 'Specular IOR Level' in bsdf_leaf.inputs:
        bsdf_leaf.inputs['Specular IOR Level'].default_value = 0.35
    elif 'Specular' in bsdf_leaf.inputs:
        bsdf_leaf.inputs['Specular'].default_value = 0.35
    if 'Subsurface Weight' in bsdf_leaf.inputs:
        bsdf_leaf.inputs['Subsurface Weight'].default_value = 0.12
    links.new(bsdf_leaf.outputs['BSDF'], out_node.inputs['Surface'])

    if os.path.exists(color_tex_path):
        tex_color = nodes.new(type='ShaderNodeTexImage')
        tex_color.image = bpy.data.images.load(color_tex_path)
        links.new(tex_color.outputs['Color'], bsdf_leaf.inputs['Base Color'])
    else:
        bsdf_leaf.inputs['Base Color'].default_value = (0.055, 0.30, 0.040, 1.0)

    if os.path.exists(bump_tex_path):
        tex_bump = nodes.new(type='ShaderNodeTexImage')
        tex_bump.image = bpy.data.images.load(bump_tex_path)
        try:
            tex_bump.image.colorspace_settings.name = 'Non-Color'
        except:
            pass
        bump_node = nodes.new(type='ShaderNodeBump')
        bump_node.inputs['Strength'].default_value = 0.40
        bump_node.inputs['Distance'].default_value = 0.007
        links.new(tex_bump.outputs['Color'], bump_node.inputs['Height'])
        links.new(bump_node.outputs['Normal'], bsdf_leaf.inputs['Normal'])

    mats.append(mat_leaf) # Slot 0: MAT_LEAF
    mats.append(make_mat("Mat_Stem", (0.24, 0.56, 0.12, 1.0), 0.34, spec=0.35)) # Slot 1: MAT_STEM
    mats.append(make_mat("Mat_Tomato_Red", (0.86, 0.03, 0.04, 1.0), 0.20, spec=0.88, sss_weight=0.22)) # Slot 2: MAT_RED
    mats.append(make_mat("Mat_Tomato_Orange", (0.94, 0.42, 0.04, 1.0), 0.22, spec=0.85, sss_weight=0.18)) # Slot 3: MAT_ORANGE
    mats.append(make_mat("Mat_Tomato_BabyGreen", (0.36, 0.72, 0.16, 1.0), 0.26, spec=0.60)) # Slot 4: MAT_BABY_GREEN
    mats.append(make_mat("Mat_Pedicel_Pith", (0.78, 0.86, 0.65, 1.0), 0.45, spec=0.20)) # Slot 5: MAT_PITH
    mats.append(make_mat("Mat_Bamboo_Cane", (0.72, 0.60, 0.35, 1.0), 0.42, spec=0.25)) # Slot 6: MAT_CANE
    mats.append(make_mat("Mat_Raffia_Tie", (0.58, 0.48, 0.30, 1.0), 0.55, spec=0.15)) # Slot 7: MAT_TIE
    mats.append(make_mat("Mat_Flower_Yellow", (0.98, 0.86, 0.06, 1.0), 0.28, spec=0.50)) # Slot 8: MAT_FLOWER

    return mats

def get_tomato_skin_z(r, theta, r_xy, r_z):
    r_norm = min(1.0, max(0.0, r / r_xy))
    lobe_factor = 1.0 + 0.065 * math.cos(5.0 * theta)
    r_eff = r_norm / lobe_factor
    base_sphere_z = math.sqrt(max(0.0001, 1.0 - min(1.0, r_eff * 0.96) ** 2))
    dimple = 0.32 * math.exp(-((r_eff / 0.32) ** 2))
    return r_z * (base_sphere_z - dimple)

def add_master_tomato_fruit(bm, center_pos, radius_xy, mat_fruit_idx, mat_calyx_idx, mat_pith_idx, rotation_euler=(0,0,0)):
    r_xy = radius_xy
    r_z = radius_xy * 0.82

    num_rings = 14
    num_sectors = 20
    num_lobes = 5
    lobe_depth = 0.065

    R_rot = Euler(rotation_euler, 'XYZ').to_matrix().to_4x4()
    T_trans = Matrix.Translation(center_pos)
    T_final = T_trans @ R_rot

    vert_grid = []

    for ring_idx in range(num_rings + 1):
        v = ring_idx / float(num_rings)
        phi = v * math.pi
        z_sphere = math.cos(phi)
        sin_phi = math.sin(phi)
        r_ring_base = sin_phi * r_xy

        if v < 0.20:
            t = v / 0.20
            dimple_factor = 0.55 + 0.45 * math.sin(t * math.pi * 0.5)
            z_curr = (z_sphere * 0.65 - 0.12 * (1.0 - t)) * r_z
        elif v > 0.80:
            t = (v - 0.80) / 0.20
            dimple_factor = 1.0 - 0.15 * math.sin(t * math.pi * 0.5)
            z_curr = (z_sphere * 0.90 + 0.06 * t) * r_z
        else:
            dimple_factor = 1.0
            z_curr = z_sphere * r_z

        ring_verts = []
        for sec_idx in range(num_sectors):
            theta = (sec_idx / float(num_sectors)) * 2.0 * math.pi
            lobe_wave = 1.0 + lobe_depth * math.cos(num_lobes * theta)
            cur_r = r_ring_base * lobe_wave * dimple_factor

            x = cur_r * math.cos(theta)
            y = cur_r * math.sin(theta)
            z = z_curr

            p_world = T_final @ Vector((x, y, z))
            ring_verts.append(bm.verts.new(p_world))
        vert_grid.append(ring_verts)

    for ring_idx in range(num_rings):
        for sec_idx in range(num_sectors):
            v1 = vert_grid[ring_idx][sec_idx]
            v2 = vert_grid[ring_idx][(sec_idx + 1) % num_sectors]
            v3 = vert_grid[ring_idx + 1][(sec_idx + 1) % num_sectors]
            v4 = vert_grid[ring_idx + 1][sec_idx]

            face = bm.faces.new([v1, v2, v3, v4])
            face.material_index = mat_fruit_idx
            face.smooth = True

    top_center_local = Vector((0, 0, r_z * 0.60))
    receptacle_r = 0.024 * (r_xy / 0.20)
    receptacle_h = 0.012 * (r_xy / 0.20)

    rec_mesh = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=12,
        radius1=receptacle_r * 1.15,
        radius2=receptacle_r * 0.90,
        depth=receptacle_h,
        matrix=T_final @ Matrix.Translation(top_center_local + Vector((0, 0, receptacle_h * 0.5)))
    )
    for f in {f for v in rec_mesh['verts'] for f in v.link_faces}:
        f.material_index = mat_calyx_idx
        f.smooth = True

    num_sepals = 6
    sepal_len = 0.095 * (r_xy / 0.20)
    steps_len = 7

    for s_idx in range(num_sepals):
        angle = (s_idx / float(num_sepals)) * 2.0 * math.pi + 0.15
        dir_xy = Vector((math.cos(angle), math.sin(angle), 0.0))
        perp_xy = Vector((-math.sin(angle), math.cos(angle), 0.0))

        prev_verts = None
        for step in range(steps_len + 1):
            u = step / float(steps_len)
            r_dist = receptacle_r * 0.80 + u * sepal_len

            if u < 0.65:
                skin_z = get_tomato_skin_z(r_dist, angle, r_xy, r_z)
                z_sepal = skin_z + 0.0035 + 0.0015 * math.sin(u * math.pi)
            else:
                u_tip = (u - 0.65) / 0.35
                skin_z = get_tomato_skin_z(r_dist, angle, r_xy, r_z)
                curl_up = 0.016 * (u_tip ** 1.8) * (r_xy / 0.20)
                z_sepal = skin_z + 0.0035 + curl_up

            w_half = (0.016 * (1.0 - u ** 0.85)) * (r_xy / 0.20)
            p_cen = top_center_local + dir_xy * r_dist + Vector((0, 0, z_sepal))

            pos_spine = T_final @ (p_cen + Vector((0, 0, 0.0025 * (1.0 - u))))
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
        (Vector((0.000, 0.000, 0.000)), 0.0145 * scale_fac),
        (Vector((0.002, 0.002, 0.020 * scale_fac)), 0.0140 * scale_fac),
        (Vector((0.006, 0.005, 0.038 * scale_fac)), 0.0135 * scale_fac),
        (Vector((0.009, 0.007, 0.048 * scale_fac)), 0.0175 * scale_fac),
        (Vector((0.012, 0.009, 0.054 * scale_fac)), 0.0140 * scale_fac),
        (Vector((0.018, 0.014, 0.072 * scale_fac)), 0.0130 * scale_fac),
        (Vector((0.026, 0.020, 0.088 * scale_fac)), 0.0125 * scale_fac),
        (Vector((0.036, 0.028, 0.100 * scale_fac)), 0.0120 * scale_fac),
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

# Perfil botánico de foliolo carnoso, ancho y estilizado (estilo Nintendo / Animal Crossing)
LEAFLET_PROFILE_PLANT = [
    (0.00, 0.12, 0.000),
    (0.08, 0.50, 0.002), # Base amplia
    (0.20, 1.05, 0.006), # Lóbulo inferior carnoso
    (0.36, 0.65, 0.002), # Seno claro
    (0.56, 1.12, 0.008), # Lóbulo medio prominente
    (0.76, 0.82, 0.005), # Hombro suave
    (0.90, 0.45, 0.002),
    (1.00, 0.00, 0.000), # Punta
]

def add_master_leaflet_plant(bm, origin, direction, normal, length, width, uv_layer, mat_leaf_idx):
    dir_n = direction.normalized()
    norm_n = normal.normalized()
    side_n = dir_n.cross(norm_n).normalized()

    u_cols = [-1.0, -0.66, -0.33, 0.0, 0.33, 0.66, 1.0]
    num_cols = len(u_cols)
    num_rows = len(LEAFLET_PROFILE_PLANT)

    grid_verts = []
    grid_uvs = []

    for i, (y_rel, w_rel, pillow) in enumerate(LEAFLET_PROFILE_PLANT):
        dist_y = length * y_rel
        drop_z = -0.10 * (y_rel ** 1.4) * length
        p_row_cen = origin + dir_n * dist_y + norm_n * drop_z
        half_w = (width * 0.5) * w_rel

        row_verts = []
        row_uvs = []
        for u in u_cols:
            abs_u = abs(u)
            x_pos = u * half_w
            v_cup = 0.009 * (abs_u ** 1.3)
            z_offset = norm_n * (v_cup + pillow * math.sin(abs_u * math.pi))

            vert = bm.verts.new(p_row_cen + side_n * x_pos + z_offset)
            row_verts.append(vert)
            row_uvs.append(((u + 1.0) * 0.5, y_rel))

        grid_verts.append(row_verts)
        grid_uvs.append(row_uvs)

    for i in range(num_rows - 1):
        for j in range(num_cols - 1):
            unique_pairs = []
            for (v_c, uv_c) in [
                (grid_verts[i][j], grid_uvs[i][j]),
                (grid_verts[i][j+1], grid_uvs[i][j+1]),
                (grid_verts[i+1][j+1], grid_uvs[i+1][j+1]),
                (grid_verts[i+1][j], grid_uvs[i+1][j])
            ]:
                if not any(v_c == p[0] for p in unique_pairs):
                    unique_pairs.append((v_c, uv_c))

            if len(unique_pairs) >= 3:
                try:
                    face = bm.faces.new([p[0] for p in unique_pairs])
                    face.material_index = mat_leaf_idx
                    face.smooth = True
                    for loop in face.loops:
                        for (v_c, uv_c) in unique_pairs:
                            if loop.vert == v_c:
                                loop[uv_layer].uv = uv_c
                                break
                except ValueError:
                    pass

def interpolate_spline(pts, num_sub=4):
    """Genera una curva Catmull-Rom suave y doblada a partir de puntos de control."""
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
    Construye una Hoja Compuesta SIMPLIFICADA Y ESTILIZADA (3 a 5 foliolos anchos y abiertos):
    - Tallo doblado en cascada bajo gravedad.
    - 1 foliolo terminal grande y protagonista.
    - 1 o 2 pares laterales bien espaciados con foliolos anchos (cero apelmazamiento).
    """
    f_dir = Vector((forward_dir.x, forward_dir.y, 0)).normalized()
    up_v = Vector((0, 0, 1))

    side_v = f_dir.cross(up_v).normalized()
    roll_rad = math.radians(roll_deg)
    side_tilted = (side_v * math.cos(roll_rad) + up_v * math.sin(roll_rad)).normalized()

    total_len = 0.36 * scale
    num_steps = 12
    rachis_pts = []
    rachis_dirs = []

    prev_pt = origin
    for s in range(num_steps + 1):
        u = s / float(num_steps)
        z_curve = (0.04 * math.sin(u * math.pi * 0.40) - 0.36 * (u ** 1.35)) * total_len
        xy_reach = (u * 0.90 + 0.10 * (1.0 - math.cos(u * math.pi * 0.5))) * total_len
        side_curl = (math.sin(u * math.pi) * 0.15 * bend_side) * total_len

        p_curr = origin + f_dir * xy_reach + side_v * side_curl + up_v * z_curve
        rachis_pts.append(p_curr)

        if s > 0:
            rachis_dirs.append((p_curr - prev_pt).normalized())
        prev_pt = p_curr
    rachis_dirs.insert(0, rachis_dirs[0])

    # Raquis modelado
    prev_ring = None
    for s in range(num_steps + 1):
        u = s / float(num_steps)
        r_curr = 0.0080 * (1.0 - u * 0.58) * scale
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

    # 1. FOLIOLO TERMINAL (Grande, amplio, protagonista)
    p_term = rachis_pts[-1]
    dir_term = rachis_dirs[-1]
    norm_term = dir_term.cross(side_tilted).normalized()
    add_master_leaflet_plant(
        bm,
        origin=p_term,
        direction=dir_term,
        normal=norm_term,
        length=0.210 * scale,
        width=0.150 * scale,
        uv_layer=uv_layer,
        mat_leaf_idx=mat_leaf_idx
    )

    # 2. PARES LATERALES (Exactamente 1 o 2 pares bien espaciados, para un total de 3 a 5 foliolos)
    pairs = [
        (7, 36.0, 0.84),  # Par Principal Subterminal (amplio, a ~58% del largo)
        (3, 44.0, 0.64),  # Par Basal (a ~25% del largo)
    ]

    for (idx, ang_deg, rel_sc) in pairs:
        p_node = rachis_pts[idx]
        cur_dir = rachis_dirs[idx]
        cur_norm = cur_dir.cross(side_tilted).normalized()
        ang_rad = math.radians(ang_deg)

        for s_sign in (1.0, -1.0):
            lat_dir = (cur_dir * math.cos(ang_rad) + side_tilted * (s_sign * math.sin(ang_rad)) - up_v * 0.32).normalized()
            pet_len = 0.040 * scale * rel_sc

            p_pet_end = p_node + lat_dir * pet_len

            r_pet = 0.0038 * scale * rel_sc
            p_s = bmesh.ops.create_circle(bm, cap_ends=False, segments=5, radius=r_pet, matrix=Matrix.Translation(p_node))['verts']
            p_e = bmesh.ops.create_circle(bm, cap_ends=False, segments=5, radius=r_pet * 0.8, matrix=Matrix.Translation(p_pet_end))['verts']
            for k in range(len(p_s)):
                f = bm.faces.new([p_s[k], p_s[(k + 1) % len(p_s)], p_e[(k + 1) % len(p_e)], p_e[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
                for loop in f.loops:
                    loop[uv_layer].uv = (0.5, 0.0)

            leaf_norm = (cur_norm + side_tilted * (s_sign * 0.30) - up_v * 0.12).normalized()
            add_master_leaflet_plant(
                bm,
                origin=p_pet_end,
                direction=lat_dir,
                normal=leaf_norm,
                length=0.190 * scale * rel_sc,
                width=0.138 * scale * rel_sc,
                uv_layer=uv_layer,
                mat_leaf_idx=mat_leaf_idx
            )

def build_bamboo_cane(bm, base_pos, height, mat_cane_idx, mat_tie_idx):
    """Construye el tutor rústico de caña que queda envuelto dentro del follaje."""
    num_nodes = 5
    r_base = 0.022
    lean = Vector((0.004, 0.003, 0.0))

    for i in range(num_nodes):
        z_start = (height / num_nodes) * i
        z_end = (height / num_nodes) * (i + 1)
        z_mid = (z_start + z_end) * 0.5
        seg_h = z_end - z_start

        frac = i / float(num_nodes)
        r_seg = r_base * (1.0 - frac * 0.28)
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

    calyx_cone = bmesh.ops.create_cone(
        bm,
        cap_ends=False,
        segments=5,
        radius1=0.012,
        radius2=0.005,
        depth=0.010,
        matrix=Matrix.Translation(p_end) @ dir_n.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    )
    for f in {f for v in calyx_cone['verts'] for f in v.link_faces}:
        f.material_index = mat_stem_idx
        f.smooth = True

    num_petals = 5
    petal_len = size * 0.50
    for p_i in range(num_petals):
        p_ang = (p_i / float(num_petals)) * 2.0 * math.pi
        p_vec = side_n * math.cos(p_ang) + up_n * math.sin(p_ang)
        p_side = p_vec.cross(dir_n).normalized()

        p_tip = p_end + p_vec * petal_len + dir_n * (petal_len * 0.20)
        v_cen = bm.verts.new(p_end)
        v_left = bm.verts.new(p_end + p_vec * (petal_len * 0.4) - p_side * (petal_len * 0.25))
        v_right = bm.verts.new(p_end + p_vec * (petal_len * 0.4) + p_side * (petal_len * 0.25))
        v_tip = bm.verts.new(p_tip)

        f = bm.faces.new([v_cen, v_left, v_tip, v_right])
        f.material_index = mat_flower_idx
        f.smooth = True

def add_fruiting_truss(bm, stem_node, dir_outward, fruit_data, mat_stem_idx, mat_pith_idx):
    """
    Construye un RACIMO PÉNDULO BOTÁNICO:
    - Pedúnculo suavemente curvado y doblado que emerge del tallo y cae por gravedad.
    - Cada tomate cuelga hacia abajo de su propio pedicelo natural.
    """
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
        r_truss = 0.006 * (1.0 - (s / float(len(truss_pts))) * 0.4)
        ring = bmesh.ops.create_circle(
            bm, cap_ends=(s == 0 or s == len(truss_pts) - 1), segments=6, radius=r_truss, matrix=Matrix.Translation(p_curr)
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

    for (t_attach_idx, offset_hang, radius, mat_color, rot_euler) in fruit_data:
        p_knot = truss_pts[min(t_attach_idx * 3, len(truss_pts) - 1)]
        p_fruit_cen = p_knot + offset_hang

        ped_cyl = bmesh.ops.create_cone(
            bm,
            cap_ends=False,
            segments=6,
            radius1=0.005,
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
    """Construye un tallo o rama trepadora suave y doblada con interpolación spline."""
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
    - Mata tupida y abovedada con tallos y ramas MUCHO MÁS DOBLADOS.
    - El tallo se bifurca en 3 ramas trepadoras arqueadas que abrazan el tutor de caña.
    - Hojas en cascada con tallos doblados cayendo bajo gravedad orgánica.
    - Racimos péndulos con tomates colgando bajo el follaje.
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

    # =========================================================
    # 1. TUTOR DE CAÑA EN EL INTERIOR (altura 1.28m, envuelto)
    # =========================================================
    cane_base = Vector((0.00, 0.03, 0.0))
    build_bamboo_cane(bm, cane_base, 1.28, MAT_CANE, MAT_TIE)

    # =========================================================
    # 2. SISTEMA DE TALLOS TREPADORES DOBLADOS Y RAMIFICADOS
    # =========================================================
    # Tallo base común hasta la bifurcación
    stem_base = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.12)),
        Vector(( 0.02,  0.00, 0.25)), # Nudo de bifurcación
    ]
    build_vine_segment(bm, stem_base, 0.022, 0.018, uv_layer, MAT_STEM)

    # Rama 1 (Izquierda: sale del tallo principal con un codo doblado pronunciado)
    vine_left = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector((-0.04, -0.02, 0.30)), # Codo inicial de ramificación
        Vector((-0.10, -0.05, 0.38)), # Curva hacia afuera
        Vector((-0.16, -0.06, 0.52)), # Máxima amplitud lateral
        Vector((-0.15, -0.02, 0.68)), # Curva envolvente
        Vector((-0.10,  0.01, 0.84)),
        Vector((-0.04,  0.02, 1.02)),
    ]
    build_vine_segment(bm, vine_left, 0.016, 0.010, uv_layer, MAT_STEM)

    # Rama 2 (Derecha: sale doblada hacia la derecha abrazando el tutor)
    vine_right = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector(( 0.05, -0.02, 0.32)), # Codo de ramificación
        Vector(( 0.11, -0.05, 0.42)), # Curva doblada hacia afuera
        Vector(( 0.17, -0.05, 0.58)), # Amplitud lateral
        Vector(( 0.15, -0.01, 0.74)), # Curva envolvente
        Vector(( 0.10,  0.02, 0.90)),
        Vector(( 0.04,  0.02, 1.08)),
    ]
    build_vine_segment(bm, vine_right, 0.016, 0.010, uv_layer, MAT_STEM)

    # Rama 3 (Guía central: trepa ondulada ciñéndose a la caña)
    vine_center = [
        Vector(( 0.02,  0.00, 0.25)),
        Vector(( 0.01,  0.03, 0.42)),
        Vector((-0.02,  0.03, 0.62)),
        Vector(( 0.02,  0.02, 0.82)),
        Vector((-0.01,  0.01, 1.02)),
        Vector(( 0.01,  0.01, 1.18)),
        Vector(( 0.00, -0.02, 1.28)),
        Vector(( 0.00, -0.04, 1.34)), # Doblez en la corona
    ]
    build_vine_segment(bm, vine_center, 0.017, 0.009, uv_layer, MAT_STEM)

    # =========================================================
    # 3. FOLLAJE ESTILIZADO (14 hojas compactas y abiertas, estilo Nintendo)
    # =========================================================
    foliage_leaves = [
        # --- Falda Base (2 hojas que abrazan el suelo) ---
        (Vector(( 0.01, -0.01, 0.18)), Vector((-0.70, -0.45, 0)),  22.0, 1.15,  0.7),
        (Vector(( 0.01, -0.01, 0.20)), Vector(( 0.70, -0.35, 0)), -20.0, 1.05, -0.7),

        # --- Nivel Bajo / Lateral (3 hojas que abren el ancho) ---
        (Vector((-0.10, -0.05, 0.38)), Vector((-0.80, -0.15, 0)),  30.0, 1.15,  0.8), # Lateral izquierda baja
        (Vector(( 0.11, -0.05, 0.42)), Vector(( 0.80, -0.10, 0)), -30.0, 1.15, -0.8), # Lateral derecha baja
        (Vector(( 0.00,  0.03, 0.45)), Vector(( 0.10,  0.75, 0)),   5.0, 1.10,  0.4), # Espalda baja - telón de fondo

        # --- Nivel Medio (4 hojas enmarcando y cobijando los frutos) ---
        (Vector((-0.15, -0.03, 0.62)), Vector((-0.65, -0.50, 0)),  22.0, 1.10,  0.6), # Sobre racimo izquierdo
        (Vector(( 0.15, -0.02, 0.68)), Vector(( 0.65, -0.45, 0)), -22.0, 1.10, -0.6), # Sobre racimo derecho
        (Vector((-0.02,  0.03, 0.65)), Vector((-0.25,  0.70, 0)),  -8.0, 1.05, -0.4), # Espalda media
        (Vector(( 0.01, -0.01, 0.76)), Vector(( 0.05, -0.70, 0)),  10.0, 0.95,  0.5), # Central entre racimos

        # --- Nivel Alto (3 hojas en el tercio superior) ---
        (Vector((-0.08,  0.01, 0.88)), Vector((-0.70, -0.25, 0)),  25.0, 1.00,  0.6), # Lateral izquierda alta
        (Vector(( 0.08,  0.01, 0.92)), Vector(( 0.70, -0.20, 0)), -25.0, 1.00, -0.6), # Lateral derecha alta
        (Vector(( 0.00,  0.02, 0.98)), Vector(( 0.20,  0.70, 0)),   0.0, 0.95,  0.4), # Espalda alta

        # --- Corona Superior (2 hojas que cierran la copa en cúpula redondeada) ---
        (Vector(( 0.00, -0.02, 1.16)), Vector((-0.35, -0.45, 0)),  20.0, 0.85,  0.5), # Corona izquierda
        (Vector(( 0.00,  0.01, 1.22)), Vector(( 0.35, -0.40, 0)), -20.0, 0.80, -0.5), # Corona derecha
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

    # =========================================================
    # 4. RACIMOS PÉNDULOS COLGANTES (Tomates en primer plano)
    # =========================================================
    # Racimo 1 (Frontal Izquierdo, cuelga de la rama izquierda a z ≈ 0.48)
    truss_1_fruits = [
        (1, Vector((-0.04, -0.06, -0.10)), 0.096, MAT_RED,    ( 0.15,  0.10,  0.35)), # Maduro grande
        (2, Vector((-0.10,  0.00, -0.12)), 0.078, MAT_RED,    (-0.20,  0.12,  0.75)), # Maduro medio
        (3, Vector(( 0.03, -0.07, -0.08)), 0.062, MAT_ORANGE, ( 0.05, -0.25,  1.15)), # Naranja
    ]
    add_fruiting_truss(bm, Vector((-0.10, -0.05, 0.48)), Vector((-0.60, -0.65, 0)), truss_1_fruits, MAT_STEM, MAT_PITH)

    # Racimo 2 (Frontal Derecho, cuelga de la rama derecha a z ≈ 0.65)
    truss_2_fruits = [
        (1, Vector(( 0.04, -0.06, -0.10)), 0.090, MAT_RED,        (-0.12, -0.10, -0.45)), # Maduro grande
        (2, Vector(( 0.10,  0.00, -0.12)), 0.074, MAT_RED,        ( 0.18, -0.12, -0.85)), # Maduro medio
        (3, Vector((-0.02, -0.07, -0.08)), 0.054, MAT_BABY_GREEN, (-0.05,  0.20, -1.20)), # Verde bebé
    ]
    add_fruiting_truss(bm, Vector(( 0.11, -0.04, 0.65)), Vector(( 0.65, -0.55, 0)), truss_2_fruits, MAT_STEM, MAT_PITH)

    # Racimo 3 (Nivel Superior, cuelga de la guía central a z ≈ 0.90)
    truss_3_fruits = [
        (1, Vector((-0.03, -0.05, -0.08)), 0.066, MAT_ORANGE,     ( 0.10,  0.25,  2.05)), # Naranja
        (2, Vector(( 0.04, -0.03, -0.09)), 0.048, MAT_BABY_GREEN, (-0.15,  0.15,  1.45)), # Verde
    ]
    add_fruiting_truss(bm, Vector(( 0.00,  0.01, 0.90)), Vector(( 0.15, -0.70, 0)), truss_3_fruits, MAT_STEM, MAT_PITH)

    # =========================================================
    # 5. FLORES AMARILLAS EN LOS NUDOS SUPERIORES
    # =========================================================
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
    sol_mod.thickness = 0.0026
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
            f.write("Iniciando creación de Mata Abovedada de Tomate (3 Ramas Trepadoras y Cúpula Frondosa)...\n")

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
