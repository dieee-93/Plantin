import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_stage_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 700
    scene.render.resolution_y = 700
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    world = bpy.data.worlds.new(name="ToonWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 0.25

    # Iluminación de 3 puntos
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.2
    sun_data.color = (1.0, 0.98, 0.94)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(18), math.radians(42))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.80
    fill_data.color = (0.85, 0.92, 1.0)
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    scene.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-140))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 0.90
    rim_data.color = (0.95, 1.0, 0.90)
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    scene.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-60), math.radians(20), math.radians(110))

    cam_data = bpy.data.cameras.new(name="IsoCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 1.0
    cam = bpy.data.objects.new(name="IsoCamera", object_data=cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    rot_mat = cam.rotation_euler.to_matrix()
    cam.location = rot_mat @ Vector((0, 0, 10.0)) + Vector((0.0, 0.0, 0.12))

    return scene

def create_all_squash_materials():
    mats = []
    this_dir = os.path.dirname(os.path.abspath(__file__))
    color_tex = os.path.join(this_dir, "textures", "squash_leaf_color.png")
    bump_tex = os.path.join(this_dir, "textures", "squash_leaf_bump.png")

    def make_mat(name, color_rgba, roughness=0.38, spec=0.25):
        m = bpy.data.materials.new(name=name)
        m.use_nodes = True
        ns = m.node_tree.nodes
        ns.clear()
        out_n = ns.new(type='ShaderNodeOutputMaterial')
        bsdf = ns.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = color_rgba
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Specular IOR Level' in bsdf.inputs:
            bsdf.inputs['Specular IOR Level'].default_value = spec
        m.node_tree.links.new(bsdf.outputs['BSDF'], out_n.inputs['Surface'])
        return m

    # Slot 0: Mat_Squash_Leaf (Hoja adulta verde bosque con texturas)
    mat_leaf = bpy.data.materials.new(name="Mat_Squash_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()
    out_n = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.42
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.22
    if 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = 0.0
    links.new(bsdf.outputs['BSDF'], out_n.inputs['Surface'])

    if os.path.exists(color_tex):
        tex_col = nodes.new(type='ShaderNodeTexImage')
        tex_col.image = bpy.data.images.load(color_tex)
        links.new(tex_col.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.03, 0.09, 0.035, 1.0)

    if os.path.exists(bump_tex):
        tex_bmp = nodes.new(type='ShaderNodeTexImage')
        tex_bmp.image = bpy.data.images.load(bump_tex)
        try:
            tex_bmp.image.colorspace_settings.name = 'Non-Color'
        except:
            pass
        bmp_node = nodes.new(type='ShaderNodeBump')
        bmp_node.inputs['Strength'].default_value = 0.28
        bmp_node.inputs['Distance'].default_value = 0.006
        links.new(tex_bmp.outputs['Color'], bmp_node.inputs['Height'])
        links.new(bmp_node.outputs['Normal'], bsdf.inputs['Normal'])

    # Slot 2: Mat_Squash_Orange (Naranja cálido vivo jugoso con dispersión subsuperficial)
    mat_orange = bpy.data.materials.new(name="Mat_Squash_Orange")
    mat_orange.use_nodes = True
    ns_o = mat_orange.node_tree.nodes
    ns_o.clear()
    out_o = ns_o.new(type='ShaderNodeOutputMaterial')
    bsdf_o = ns_o.new(type='ShaderNodeBsdfPrincipled')
    bsdf_o.inputs['Base Color'].default_value = (0.96, 0.35, 0.02, 1.0)
    bsdf_o.inputs['Roughness'].default_value = 0.20
    if 'Specular IOR Level' in bsdf_o.inputs:
        bsdf_o.inputs['Specular IOR Level'].default_value = 0.60
    elif 'Specular' in bsdf_o.inputs:
        bsdf_o.inputs['Specular'].default_value = 0.60
    if 'Subsurface Weight' in bsdf_o.inputs:
        bsdf_o.inputs['Subsurface Weight'].default_value = 0.16
        if 'Subsurface Radius' in bsdf_o.inputs:
            bsdf_o.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.10)
    mat_orange.node_tree.links.new(bsdf_o.outputs['BSDF'], out_o.inputs['Surface'])

    mats.append(mat_leaf) # Slot 0: MAT_LEAF
    mats.append(make_mat("Mat_Squash_Stem", (0.07, 0.22, 0.06, 1.0), 0.38, spec=0.25)) # Slot 1: MAT_STEM
    mats.append(mat_orange) # Slot 2: MAT_ORANGE
    mats.append(make_mat("Mat_Squash_Peduncle", (0.32, 0.28, 0.14, 1.0), 0.55, spec=0.18)) # Slot 3: MAT_PEDUNCLE
    mats.append(make_mat("Mat_Squash_Flower", (0.98, 0.68, 0.05, 1.0), 0.30, spec=0.40)) # Slot 4: MAT_FLOWER
    mats.append(make_mat("Mat_Squash_BabyGreen", (0.42, 0.65, 0.12, 1.0), 0.26, spec=0.35)) # Slot 5: MAT_BABY_GREEN
    mats.append(make_mat("Mat_Squash_Cotyledon", (0.12, 0.35, 0.08, 1.0), 0.36, spec=0.25)) # Slot 6: MAT_COTYLEDON
    mats.append(make_mat("Mat_Senescent_Leaf", (0.28, 0.23, 0.08, 1.0), 0.58, spec=0.12)) # Slot 7: MAT_SENESCENT_LEAF
    mats.append(make_mat("Mat_Dry_Stem", (0.22, 0.18, 0.10, 1.0), 0.55, spec=0.15)) # Slot 8: MAT_DRY_STEM
    mats.append(make_mat("Mat_Dry_Leaf", (0.30, 0.19, 0.06, 1.0), 0.65, spec=0.10)) # Slot 9: MAT_DRY_LEAF
    mats.append(make_mat("Mat_Harvest_Scar", (0.75, 0.70, 0.50, 1.0), 0.60, spec=0.10)) # Slot 10: MAT_SCAR

    return mats

MAT_LEAF = 0
MAT_STEM = 1
MAT_ORANGE = 2
MAT_PEDUNCLE = 3
MAT_FLOWER = 4
MAT_BABY_GREEN = 5
MAT_COTYLEDON = 6
MAT_SENESCENT_LEAF = 7
MAT_DRY_STEM = 8
MAT_DRY_LEAF = 9
MAT_SCAR = 10

def get_cucurbita_leaf_radius(theta):
    cos_t = math.cos(theta)
    cos_5t = math.cos(5.0 * theta)
    base_mask = (1.0 + cos_t) * 0.5
    cordate_shape = 0.35 + 0.65 * (base_mask ** 0.8)
    lobe_wave = 1.0 + 0.16 * cos_5t * base_mask
    teeth = 1.0 + 0.025 * math.cos(25.0 * theta)
    return cordate_shape * lobe_wave * teeth

def add_master_squash_leaf(bm, origin, petiole_len, blade_size, leaf_normal, uv_layer, mat_leaf_idx, mat_stem_idx, arch_dir=None):
    """Construye una hoja maestra de zapallo en sombrilla con pecíolo arqueado hacia afuera."""
    num_p_steps = 8
    pet_pts = []

    if arch_dir is None:
        norm_xy = Vector((leaf_normal.x, leaf_normal.y, 0.0))
        if norm_xy.length > 0.05:
            arch_dir = norm_xy.normalized()
        else:
            arch_dir = Vector((0.0, 1.0, 0.0))
    else:
        arch_dir = arch_dir.normalized()

    arch_side = arch_dir.cross(Vector((0, 0, 1))).normalized()

    for s in range(num_p_steps + 1):
        u = s / float(num_p_steps)
        # Sube con arco suave y se extiende hacia afuera
        z_p = petiole_len * (math.sin(u * math.pi * 0.58) * 0.72)
        reach_xy = petiole_len * (u ** 1.15) * 0.82
        wobble = petiole_len * math.sin(u * math.pi) * 0.04
        pet_pts.append(origin + arch_dir * reach_xy + arch_side * wobble + Vector((0, 0, z_p)))

    prev_ring = None
    r_base = 0.008 * (petiole_len / 0.22)
    for idx, pt in enumerate(pet_pts):
        frac = idx / float(num_p_steps)
        r_curr = r_base * (1.0 - frac * 0.25)
        ring = bmesh.ops.create_circle(
            bm, cap_ends=(idx == 0), segments=6, radius=r_curr, matrix=Matrix.Translation(pt)
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

    blade_insertion = pet_pts[-1]
    leaf_norm = leaf_normal.normalized()
    up_ref = Vector((0, 0, 1))
    if abs(leaf_norm.dot(up_ref)) > 0.95:
        up_ref = Vector((0, 1, 0))
    blade_x = leaf_norm.cross(up_ref).normalized()
    blade_y = blade_x.cross(leaf_norm).normalized()

    rings_count = 5
    rays_count = 24
    grid_verts = []

    v_center = bm.verts.new(blade_insertion)
    grid_verts.append([v_center] * rays_count)

    for r_i in range(1, rings_count + 1):
        u_r = r_i / float(rings_count)
        row = []
        for a_i in range(rays_count):
            theta = -math.pi + (a_i / float(rays_count)) * 2.0 * math.pi
            r_scale = get_cucurbita_leaf_radius(theta)
            dist = blade_size * u_r * r_scale

            dome_z = (math.sin(u_r * math.pi * 0.85) * 0.12 - (u_r ** 1.8) * 0.16) * blade_size
            lobe_undulation = 0.035 * math.cos(5.0 * theta) * (u_r ** 1.5) * blade_size

            pos_2d_x = math.sin(theta) * dist
            pos_2d_y = math.cos(theta) * dist

            p_pos = (blade_insertion +
                     blade_x * pos_2d_x +
                     blade_y * pos_2d_y +
                     leaf_norm * (dome_z + lobe_undulation))
            row.append(bm.verts.new(p_pos))
        grid_verts.append(row)

    for r_i in range(rings_count):
        for a_i in range(rays_count):
            a_next = (a_i + 1) % rays_count
            if r_i == 0:
                v0 = grid_verts[0][a_i]
                v1 = grid_verts[1][a_i]
                v2 = grid_verts[1][a_next]
                if v0 != v1 and v1 != v2:
                    try:
                        f = bm.faces.new([v0, v1, v2])
                        f.material_index = mat_leaf_idx
                        f.smooth = True
                        for loop in f.loops:
                            theta_l = -math.pi + ((a_i if loop.vert == v1 else a_next) / float(rays_count)) * 2.0 * math.pi
                            u_map = 0.5 + 0.45 * math.sin(theta_l) * (1.0 / float(rings_count) if loop.vert != v0 else 0.0)
                            v_map = 0.10 + 0.80 * (math.cos(theta_l) * 0.5 + 0.5) * (1.0 / float(rings_count) if loop.vert != v0 else 0.0)
                            loop[uv_layer].uv = (u_map, v_map)
                    except ValueError:
                        pass
            else:
                v0 = grid_verts[r_i][a_i]
                v1 = grid_verts[r_i + 1][a_i]
                v2 = grid_verts[r_i + 1][a_next]
                v3 = grid_verts[r_i][a_next]
                try:
                    f = bm.faces.new([v0, v1, v2, v3])
                    f.material_index = mat_leaf_idx
                    f.smooth = True
                    for loop in f.loops:
                        curr_r = (r_i + 1) if loop.vert in (v1, v2) else r_i
                        curr_a = a_next if loop.vert in (v2, v3) else a_i
                        theta_l = -math.pi + (curr_a / float(rays_count)) * 2.0 * math.pi
                        rad_frac = curr_r / float(rings_count)
                        u_map = 0.5 + 0.48 * math.sin(theta_l) * rad_frac
                        v_map = 0.10 + 0.85 * (math.cos(theta_l) * 0.5 + 0.5) * rad_frac
                        loop[uv_layer].uv = (u_map, v_map)
                except ValueError:
                    pass

def add_squash_tendril(bm, origin, direction, length=0.12, coil_turns=3.5, coil_radius=0.015, mat_stem_idx=1):
    """Construye un zarcillo espiralado tridimensional."""
    dir_fwd = direction.normalized()
    up_v = Vector((0, 0, 1))
    if abs(dir_fwd.dot(up_v)) > 0.95:
        up_v = Vector((0, 1, 0))
    side_v = dir_fwd.cross(up_v).normalized()
    up_ortho = side_v.cross(dir_fwd).normalized()

    num_steps = 32
    pts = []
    radii = []
    r_base_tendril = 0.0032
    straight_frac = 0.28

    for i in range(num_steps + 1):
        u = i / float(num_steps)
        if u < straight_frac:
            p_curr = origin + dir_fwd * (length * u)
            r_curr = r_base_tendril * (1.0 - u * 0.2)
        else:
            u_coil = (u - straight_frac) / (1.0 - straight_frac)
            angle = u_coil * coil_turns * 2.0 * math.pi
            r_coil = coil_radius * (1.0 - u_coil * 0.35)
            p_axis = origin + dir_fwd * (length * straight_frac + (length * (1.0 - straight_frac)) * u_coil)
            p_curr = p_axis + (side_v * math.cos(angle) + up_ortho * math.sin(angle)) * r_coil
            r_curr = r_base_tendril * (0.80 - u_coil * 0.55)
        pts.append(p_curr)
        radii.append(r_curr)

    prev_ring = None
    for idx, (p, r) in enumerate(zip(pts, radii)):
        if idx < len(pts) - 1:
            tangent = (pts[idx + 1] - p).normalized()
        else:
            tangent = (p - pts[idx - 1]).normalized()
        rot_ring = Vector((0, 0, 1)).rotation_difference(tangent).to_euler()
        ring = bmesh.ops.create_circle(
            bm, cap_ends=(idx == 0 or idx == len(pts) - 1), segments=6, radius=r,
            matrix=Matrix.Translation(p) @ rot_ring.to_matrix().to_4x4()
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

def add_squash_flower(bm, center_pos, direction, scale=1.0, is_female=True, mat_flower_idx=4, mat_stem_idx=1, mat_baby_idx=5):
    """Construye una flor campanulada de zapallo."""
    dir_fwd = direction.normalized()
    up_ref = Vector((0, 0, 1))
    if abs(dir_fwd.dot(up_ref)) > 0.95:
        up_ref = Vector((0, 1, 0))
    side_x = dir_fwd.cross(up_ref).normalized()
    side_y = side_x.cross(dir_fwd).normalized()

    rot_mat = Matrix((side_x, side_y, dir_fwd)).transposed().to_4x4()
    T_flower = Matrix.Translation(center_pos) @ rot_mat

    if is_female:
        r_ovary = 0.022 * scale
        ovary_geom = bmesh.ops.create_uvsphere(
            bm, u_segments=14, v_segments=8, radius=r_ovary,
            matrix=T_flower @ Matrix.Translation(Vector((0, 0, -r_ovary * 0.85)))
        )
        for f in {f for v in ovary_geom['verts'] for f in v.link_faces}:
            f.material_index = mat_baby_idx
            f.smooth = True

    calyx_r = 0.013 * scale
    calyx_h = 0.015 * scale
    calyx_geom = bmesh.ops.create_cone(
        bm, cap_ends=True, segments=10, radius1=calyx_r * 0.85, radius2=calyx_r * 1.15,
        depth=calyx_h, matrix=T_flower @ Matrix.Translation(Vector((0, 0, calyx_h * 0.5)))
    )
    for f in {f for v in calyx_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_stem_idx
        f.smooth = True

    sepal_len = 0.026 * scale
    for s_i in range(5):
        ang = (s_i / 5.0) * 2.0 * math.pi
        v_dir = Vector((math.cos(ang), math.sin(ang), 0))
        p_base = Vector((math.cos(ang) * calyx_r, math.sin(ang) * calyx_r, calyx_h))
        p_tip = p_base + v_dir * sepal_len + Vector((0, 0, sepal_len * 0.35))
        p_base_w = T_flower @ p_base
        p_tip_w = T_flower @ p_tip

        v_b1 = bm.verts.new(p_base_w + T_flower.to_3x3() @ (side_x.cross(v_dir) * 0.002))
        v_b2 = bm.verts.new(p_base_w - T_flower.to_3x3() @ (side_x.cross(v_dir) * 0.002))
        v_t = bm.verts.new(p_tip_w)
        f_sep = bm.faces.new([v_b1, v_b2, v_t])
        f_sep.material_index = mat_stem_idx
        f_sep.smooth = True

    tube_steps = 6
    pet_rays = 25
    corolla_h = 0.068 * scale
    corolla_r_top = 0.058 * scale
    corolla_grid = []

    for s in range(tube_steps + 1):
        u = s / float(tube_steps)
        z_curr = calyx_h + corolla_h * u
        r_base_tube = calyx_r * 1.1 + (corolla_r_top - calyx_r * 1.1) * (u ** 1.35)
        ring = []
        for r_i in range(pet_rays):
            ang = (r_i / float(pet_rays)) * 2.0 * math.pi
            lobe_wave = 1.0
            if u > 0.40:
                frac_top = (u - 0.40) / 0.60
                lobe_wave = 1.0 + 0.30 * math.cos(5.0 * ang) * frac_top
            r_act = r_base_tube * lobe_wave
            p_local = Vector((math.cos(ang) * r_act, math.sin(ang) * r_act, z_curr))
            if u > 0.75:
                flare = (u - 0.75) * 0.012 * scale * math.cos(5.0 * ang)
                p_local.z -= flare
            ring.append(bm.verts.new(T_flower @ p_local))
        corolla_grid.append(ring)

    for s in range(tube_steps):
        r1 = corolla_grid[s]
        r2 = corolla_grid[s + 1]
        for r_i in range(pet_rays):
            r_next = (r_i + 1) % pet_rays
            f = bm.faces.new([r1[r_i], r1[r_next], r2[r_next], r2[r_i]])
            f.material_index = mat_flower_idx
            f.smooth = True

    col_h = corolla_h * 0.42
    col_geom = bmesh.ops.create_cone(
        bm, cap_ends=True, segments=8, radius1=0.006 * scale, radius2=0.003 * scale,
        depth=col_h, matrix=T_flower @ Matrix.Translation(Vector((0, 0, calyx_h + col_h * 0.5)))
    )
    for f in {f for v in col_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_flower_idx
        f.smooth = True

def add_master_squash_fruit(bm, center_pos, radius_xy, height_ratio=0.72, num_ribs=8,
                            mat_fruit_idx=2, mat_peduncle_idx=3, rotation_euler=(0,0,0)):
    """Construye un zapallo criollo acanalado maestro con pedúnculo leñoso pentagonal."""
    r_xy = radius_xy
    r_z = radius_xy * height_ratio

    rot_mat = Euler(rotation_euler, 'XYZ').to_matrix().to_4x4()
    T_final = Matrix.Translation(center_pos) @ rot_mat

    u_seg = 36
    v_seg = 20
    sphere_geom = bmesh.ops.create_uvsphere(
        bm, u_segments=u_seg, v_segments=v_seg, radius=1.0, matrix=T_final
    )

    for v in sphere_geom['verts']:
        v_local = T_final.inverted() @ v.co
        z_norm = max(-1.0, min(1.0, v_local.z))
        theta = math.atan2(v_local.y, v_local.x)

        v_local.z = z_norm * r_z
        equator_w = math.sqrt(max(0.001, 1.0 - z_norm**2))
        rib_envelope = (1.0 - abs(z_norm) ** 3.0)
        rib_wave = 0.125 * math.cos(num_ribs * theta) * rib_envelope
        sub_rib = 0.020 * math.cos(num_ribs * 2 * theta) * rib_envelope
        r_actual = r_xy * equator_w * (1.0 + rib_wave + sub_rib)

        v_local.x = math.cos(theta) * r_actual
        v_local.y = math.sin(theta) * r_actual

        dist_xy = math.sqrt(v_local.x**2 + v_local.y**2)
        ped_dip_radius = r_xy * 0.40
        if z_norm > 0.15 and dist_xy < ped_dip_radius:
            dip_frac = 1.0 - (dist_xy / ped_dip_radius)
            v_local.z -= (dip_frac ** 2.0) * (r_z * 0.32)

        base_dip_radius = r_xy * 0.28
        if z_norm < -0.40 and dist_xy < base_dip_radius:
            dip_frac = 1.0 - (dist_xy / base_dip_radius)
            v_local.z += (dip_frac ** 2.0) * (r_z * 0.14)

        v.co = T_final @ v_local

    for f in {f for v in sphere_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_fruit_idx
        f.smooth = True

    ped_len = r_xy * 0.48
    r_ped_base = r_xy * 0.22
    num_ped_steps = 6
    ped_grid = []
    lean_vec = Vector((0.015, 0.012, 0.0))

    for s in range(num_ped_steps + 1):
        u = s / float(num_ped_steps)
        z_p = r_z * 0.68 + ped_len * u
        r_p = r_ped_base * (1.0 - u * 0.45)
        cen_p = lean_vec * (u ** 1.5)
        ring = []
        for k in range(15):
            ang = (k / 15.0) * 2.0 * math.pi
            star_factor = 1.0 + (0.24 if u < 0.3 else 0.14) * math.cos(5.0 * ang)
            r_k = r_p * star_factor
            pt_local = cen_p + Vector((math.cos(ang) * r_k, math.sin(ang) * r_k, z_p))
            ring.append(bm.verts.new(T_final @ pt_local))
        ped_grid.append(ring)

    for s in range(num_ped_steps):
        r1 = ped_grid[s]
        r2 = ped_grid[s + 1]
        for k in range(15):
            k_next = (k + 1) % 15
            f = bm.faces.new([r1[k], r1[k_next], r2[k_next], r2[k]])
            f.material_index = mat_peduncle_idx
            f.smooth = True

    f_top = bm.faces.new(ped_grid[-1])
    f_top.material_index = mat_peduncle_idx
    f_top.smooth = True

def build_vine_runner(bm, points, r_base, r_tip, mat_stem_idx):
    """Construye una guía rastrera con curvatura suave y sección estriada."""
    num_sub = 4
    smooth_pts = []
    for i in range(len(points) - 1):
        p0 = points[max(0, i - 1)]
        p1 = points[i]
        p2 = points[i + 1]
        p3 = points[min(len(points) - 1, i + 2)]
        for s in range(num_sub):
            t = s / float(num_sub)
            t2 = t * t
            t3 = t2 * t
            pt = 0.5 * (
                (2.0 * p1) +
                (-p0 + p2) * t +
                (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 +
                (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
            )
            smooth_pts.append(pt)
    smooth_pts.append(points[-1])

    prev_ring = None
    for idx, p in enumerate(smooth_pts):
        frac = idx / float(len(smooth_pts) - 1)
        r = r_base * (1.0 - frac) + r_tip * frac
        ring = bmesh.ops.create_circle(
            bm, cap_ends=(idx == 0 or idx == len(smooth_pts) - 1), segments=8, radius=r,
            matrix=Matrix.Translation(p)
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

# ==============================================================================
# 1. ETAPA 1: GERMINACIÓN / PLÁNTULA COTILEDONAR (Squash_1)
# ==============================================================================
def build_stage1_germination(mats):
    """
    Etapa 1: Germinación (BBCH 00-09).
    - Hipocótilo curvo grueso vigoroso emergiendo del sustrato.
    - Par de cotiledones seminales grandes, carnosos, redondeados-ovales (verde tierno).
    - Primera hoja verdadera pequeña con borde crenado y nervadura palmeada asomando en el ápice.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Hipocótilo arqueado
    hypo_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.005, -0.005, 0.025)),
        Vector(( 0.008,  0.002, 0.055)),
        Vector(( 0.002,  0.005, 0.085)),
        Vector(( 0.000,  0.000, 0.105)),
    ]
    build_vine_runner(bm, hypo_pts, 0.009, 0.0065, MAT_STEM)

    p_apex = hypo_pts[-1]

    # Par de cotiledones seminales grandes carnosos opuestos
    # Uno hacia (-0.7, -0.7, 0.3) y otro hacia (0.7, 0.7, 0.3)
    cot_dirs = [
        (Vector((-0.72, -0.45, 0.35)).normalized(), Vector((0.3, -0.5, 0.8)).normalized()),
        (Vector(( 0.72,  0.45, 0.35)).normalized(), Vector((-0.3, 0.5, 0.8)).normalized()),
    ]
    cot_len = 0.055
    cot_w = 0.038

    for d_cot, n_cot in cot_dirs:
        s_cot = d_cot.cross(n_cot).normalized()
        steps = 6
        r_grid, l_grid = [], []
        for s in range(steps + 1):
            u = s / float(steps)
            w_frac = math.sin(u * math.pi) * (1.0 - 0.20 * u)
            y_pos = cot_len * u
            droop = -0.012 * (u ** 1.6) * cot_len
            v_spine = bm.verts.new(p_apex + d_cot * y_pos + n_cot * droop)
            r_row, l_row = [v_spine], [v_spine]
            w_act = cot_w * 0.5 * w_frac
            if w_act > 0.001:
                p_r = p_apex + d_cot * y_pos + s_cot * w_act + n_cot * droop
                p_l = p_apex + d_cot * y_pos - s_cot * w_act + n_cot * droop
                r_row.append(bm.verts.new(p_r))
                l_row.append(bm.verts.new(p_l))
            else:
                r_row.append(v_spine)
                l_row.append(v_spine)
            r_grid.append(r_row)
            l_grid.append(l_row)

        for i in range(steps):
            for side_grid in (r_grid, l_grid):
                v0, v1, v2, v3 = side_grid[i][0], side_grid[i][1], side_grid[i + 1][1], side_grid[i + 1][0]
                unique = []
                for v in [v0, v1, v2, v3]:
                    if v not in unique:
                        unique.append(v)
                if len(unique) >= 3:
                    try:
                        f = bm.faces.new(unique)
                        f.material_index = MAT_COTYLEDON
                        f.smooth = True
                    except ValueError:
                        pass

    # Primera hoja verdadera pequeña palmeada asomando en el ápice
    add_master_squash_leaf(
        bm,
        origin=p_apex + Vector((0, 0, 0.005)),
        petiole_len=0.045,
        blade_size=0.048,
        leaf_normal=Vector((0.2, -0.6, 0.75)),
        uv_layer=uv_layer,
        mat_leaf_idx=MAT_LEAF,
        mat_stem_idx=MAT_STEM
    )

    mesh = bpy.data.meshes.new("Squash_1_Mesh")
    obj = bpy.data.objects.new("Squash_1", mesh)
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
# 2. ETAPA 2: DESARROLLO FOLIAR VEGETATIVO (Squash_2)
# ==============================================================================
def build_stage2_leaf(mats):
    """
    Etapa 2: Desarrollo vegetativo (BBCH 10-19).
    - Tallo rastrero inicial con base firme.
    - 4 hojas grandes en sombrilla con pecíolos arqueados y nervaduras palmeadas.
    - 2 primeros zarcillos espiralados exploratorios.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Tallo rastrero corto
    runner_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.04)),
        Vector((-0.02,  0.02, 0.07)),
        Vector(( 0.00,  0.03, 0.09)),
    ]
    build_vine_runner(bm, runner_pts, 0.012, 0.009, MAT_STEM)

    # 4 Hojas sombrilla en abanico
    leaves_cfg = [
        (runner_pts[1], 0.14, 0.11, Vector((-0.65, -0.45, 0.60))),
        (runner_pts[2], 0.16, 0.13, Vector(( 0.60, -0.40, 0.68))),
        (runner_pts[2], 0.15, 0.12, Vector((-0.20,  0.65, 0.72))),
        (runner_pts[3], 0.13, 0.10, Vector(( 0.35,  0.55, 0.75))),
    ]

    for p_orig, p_len, b_sz, norm_v in leaves_cfg:
        add_master_squash_leaf(
            bm, origin=p_orig, petiole_len=p_len, blade_size=b_sz,
            leaf_normal=norm_v, uv_layer=uv_layer,
            mat_leaf_idx=MAT_LEAF, mat_stem_idx=MAT_STEM
        )

    # 2 Zarcillos espiralados iniciales
    add_squash_tendril(bm, runner_pts[2] + Vector((0.01, -0.01, 0)), Vector(( 0.75, -0.40, 0.25)), length=0.10, coil_turns=3.0, coil_radius=0.014, mat_stem_idx=MAT_STEM)
    add_squash_tendril(bm, runner_pts[3] + Vector((-0.01, 0.01, 0)), Vector((-0.65,  0.60, 0.30)), length=0.11, coil_turns=3.5, coil_radius=0.015, mat_stem_idx=MAT_STEM)

    mesh = bpy.data.meshes.new("Squash_2_Mesh")
    obj = bpy.data.objects.new("Squash_2", mesh)
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
# 3. ETAPA 3: FORMACIÓN DE GUÍAS Y ESTRUCTURA RASTRERA (Squash_3)
# ==============================================================================
def build_stage3_structure(mats):
    """
    Etapa 3: Estructura y Guiado Rastrero (BBCH 20-49).
    - Guía principal rastrera reptando sobre el terreno.
    - Guía secundaria lateral ramificada.
    - 7 hojas sombrilla exuberantes en diferentes orientaciones.
    - Zarcillos espiralados en los nudos.
    - Capullos florales cerrados erectos.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Guía principal rastrera
    main_runner = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector((-0.04, -0.02, 0.04)),
        Vector((-0.09, -0.05, 0.05)),
        Vector((-0.15, -0.06, 0.05)),
        Vector((-0.22, -0.04, 0.04)),
    ]
    build_vine_runner(bm, main_runner, 0.014, 0.009, MAT_STEM)

    # Guía secundaria lateral
    sec_runner = [
        main_runner[2],
        Vector((-0.08,  0.05, 0.05)),
        Vector((-0.05,  0.13, 0.04)),
        Vector((-0.01,  0.20, 0.03)),
    ]
    build_vine_runner(bm, sec_runner, 0.011, 0.008, MAT_STEM)

    # 7 Hojas grandes
    leaves_cfg = [
        (main_runner[1], 0.18, 0.14, Vector((-0.70, -0.35, 0.62))),
        (main_runner[2], 0.20, 0.16, Vector((-0.45, -0.65, 0.60))),
        (main_runner[3], 0.19, 0.15, Vector((-0.72,  0.20, 0.65))),
        (main_runner[4], 0.16, 0.13, Vector((-0.60, -0.40, 0.68))),
        (sec_runner[1],  0.18, 0.15, Vector(( 0.45, -0.55, 0.70))),
        (sec_runner[2],  0.19, 0.15, Vector(( 0.20,  0.72, 0.65))),
        (sec_runner[3],  0.15, 0.12, Vector(( 0.60,  0.45, 0.65))),
    ]

    for p_orig, p_len, b_sz, norm_v in leaves_cfg:
        add_master_squash_leaf(
            bm, origin=p_orig, petiole_len=p_len, blade_size=b_sz,
            leaf_normal=norm_v, uv_layer=uv_layer,
            mat_leaf_idx=MAT_LEAF, mat_stem_idx=MAT_STEM
        )

    # Zarcillos espiralados
    add_squash_tendril(bm, main_runner[3], Vector((-0.70, -0.50, 0.35)), length=0.13, coil_turns=4.0, coil_radius=0.016, mat_stem_idx=MAT_STEM)
    add_squash_tendril(bm, sec_runner[2],  Vector(( 0.70,  0.50, 0.35)), length=0.12, coil_turns=3.5, coil_radius=0.015, mat_stem_idx=MAT_STEM)

    # Capullo floral cerrado erecto
    p_bud_origin = main_runner[2] + Vector((0.02, -0.02, 0.02))
    bmesh.ops.create_cone(
        bm, cap_ends=True, segments=8, radius1=0.012, radius2=0.002, depth=0.035,
        matrix=Matrix.Translation(p_bud_origin + Vector((0, -0.02, 0.05))) @ Euler((math.radians(20), math.radians(-15), 0)).to_matrix().to_4x4()
    )

    mesh = bpy.data.meshes.new("Squash_3_Mesh")
    obj = bpy.data.objects.new("Squash_3", mesh)
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
# 4. ETAPA 4: FLORACIÓN ACTIVA Y CUAJE TEMPRANO (Squash_Flowering)
# ==============================================================================
def build_stage4_flowering(mats):
    """
    Etapa 4: Floración (BBCH 50-69).
    - Espectacular flor campanulada amarilla abierta en primer plano.
    - Flor femenina con zapallito bebé recién cuajado visible.
    - Guías rastreras, zarcillos vigorosos y 8 hojas grandes.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    main_runner = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector((-0.05, -0.03, 0.04)),
        Vector((-0.11, -0.06, 0.05)),
        Vector((-0.18, -0.07, 0.05)),
        Vector((-0.26, -0.04, 0.04)),
    ]
    build_vine_runner(bm, main_runner, 0.016, 0.010, MAT_STEM)

    sec_runner = [
        main_runner[2],
        Vector((-0.08,  0.06, 0.05)),
        Vector((-0.04,  0.15, 0.04)),
        Vector(( 0.02,  0.22, 0.03)),
    ]
    build_vine_runner(bm, sec_runner, 0.012, 0.008, MAT_STEM)

    # 8 Hojas
    leaves_cfg = [
        (main_runner[1], 0.20, 0.16, Vector((-0.72, -0.30, 0.62))),
        (main_runner[2], 0.22, 0.17, Vector((-0.40, -0.70, 0.58))),
        (main_runner[3], 0.21, 0.16, Vector((-0.75,  0.15, 0.64))),
        (main_runner[4], 0.17, 0.13, Vector((-0.65, -0.35, 0.66))),
        (sec_runner[1],  0.20, 0.16, Vector(( 0.40, -0.60, 0.68))),
        (sec_runner[2],  0.21, 0.16, Vector(( 0.15,  0.75, 0.64))),
        (sec_runner[3],  0.16, 0.13, Vector(( 0.65,  0.40, 0.65))),
        (main_runner[0], 0.18, 0.14, Vector(( 0.20, -0.65, 0.72))),
    ]

    for p_orig, p_len, b_sz, norm_v in leaves_cfg:
        add_master_squash_leaf(
            bm, origin=p_orig, petiole_len=p_len, blade_size=b_sz,
            leaf_normal=norm_v, uv_layer=uv_layer,
            mat_leaf_idx=MAT_LEAF, mat_stem_idx=MAT_STEM
        )

    # 1. Gran flor campanulada amarilla masculina abierta hacia el frente
    add_squash_flower(
        bm,
        center_pos=main_runner[1] + Vector((0.04, -0.08, 0.06)),
        direction=Vector((0.35, -0.75, 0.55)),
        scale=1.15,
        is_female=False,
        mat_flower_idx=MAT_FLOWER,
        mat_stem_idx=MAT_STEM,
        mat_baby_idx=MAT_BABY_GREEN
    )

    # 2. Flor femenina con zapallito bebé recién cuajado verde limón
    add_squash_flower(
        bm,
        center_pos=sec_runner[1] + Vector((0.06, -0.04, 0.04)),
        direction=Vector((0.60, -0.55, 0.58)),
        scale=1.05,
        is_female=True,
        mat_flower_idx=MAT_FLOWER,
        mat_stem_idx=MAT_STEM,
        mat_baby_idx=MAT_BABY_GREEN
    )

    # Zarcillos
    add_squash_tendril(bm, main_runner[3], Vector((-0.70, -0.55, 0.35)), length=0.14, coil_turns=4.0, coil_radius=0.016, mat_stem_idx=MAT_STEM)
    add_squash_tendril(bm, sec_runner[2],  Vector(( 0.75,  0.45, 0.35)), length=0.13, coil_turns=3.5, coil_radius=0.015, mat_stem_idx=MAT_STEM)

    mesh = bpy.data.meshes.new("Squash_Flowering_Mesh")
    obj = bpy.data.objects.new("Squash_Flowering", mesh)
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
# 5. ETAPA 5: FRUCTIFICACIÓN DEFINITIVA / ZAPALLO MADURO (Squash_4)
# ==============================================================================
def build_stage5_fruiting(mats):
    """
    Etapa 5: Fructificación madura (BBCH 70-89).
    - Gran zapallo criollo acanalado maduro protagonista en el centro-frente.
    - Segundo zapallito mediano madurando a un lado.
    - Guías rastreras, zarcillos y 10 hojas sombrilla exuberantes.
    - Flor persistente en ápice de la guía.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    main_runner = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector((-0.06, -0.04, 0.04)),
        Vector((-0.13, -0.07, 0.05)),
        Vector((-0.21, -0.08, 0.05)),
        Vector((-0.30, -0.05, 0.04)),
    ]
    build_vine_runner(bm, main_runner, 0.018, 0.011, MAT_STEM)

    sec_runner = [
        main_runner[2],
        Vector((-0.09,  0.07, 0.05)),
        Vector((-0.05,  0.17, 0.04)),
        Vector(( 0.03,  0.24, 0.03)),
    ]
    build_vine_runner(bm, sec_runner, 0.013, 0.009, MAT_STEM)

    # 10 Hojas sombrilla desplegadas
    leaves_cfg = [
        (main_runner[1], 0.22, 0.17, Vector((-0.70, -0.30, 0.64))),
        (main_runner[2], 0.24, 0.18, Vector((-0.35, -0.72, 0.60))),
        (main_runner[3], 0.23, 0.17, Vector((-0.75,  0.15, 0.64))),
        (main_runner[4], 0.19, 0.14, Vector((-0.65, -0.35, 0.66))),
        (sec_runner[1],  0.21, 0.16, Vector(( 0.40, -0.60, 0.68))),
        (sec_runner[2],  0.22, 0.17, Vector(( 0.15,  0.75, 0.64))),
        (sec_runner[3],  0.18, 0.14, Vector(( 0.65,  0.40, 0.65))),
        (main_runner[0], 0.19, 0.15, Vector(( 0.25, -0.65, 0.70))),
        (Vector((-0.16,  0.03, 0.05)), 0.20, 0.15, Vector((-0.20,  0.68, 0.70))),
        (Vector(( 0.08,  0.10, 0.04)), 0.17, 0.13, Vector(( 0.55,  0.50, 0.66))),
    ]

    for p_orig, p_len, b_sz, norm_v in leaves_cfg:
        add_master_squash_leaf(
            bm, origin=p_orig, petiole_len=p_len, blade_size=b_sz,
            leaf_normal=norm_v, uv_layer=uv_layer,
            mat_leaf_idx=MAT_LEAF, mat_stem_idx=MAT_STEM
        )

    # 1. Gran Zapallo Criollo Maduro Principal (Protagonista)
    # Ubicado al frente-centro
    add_master_squash_fruit(
        bm,
        center_pos=Vector((-0.03, -0.14, 0.09)),
        radius_xy=0.155,
        height_ratio=0.68,
        num_ribs=8,
        mat_fruit_idx=MAT_ORANGE,
        mat_peduncle_idx=MAT_PEDUNCLE,
        rotation_euler=(math.radians(10), math.radians(-12), math.radians(20))
    )

    # 2. Zapallo secundario mediano madurando hacia el lado
    add_master_squash_fruit(
        bm,
        center_pos=Vector((-0.24,  0.08, 0.07)),
        radius_xy=0.095,
        height_ratio=0.72,
        num_ribs=8,
        mat_fruit_idx=MAT_ORANGE,
        mat_peduncle_idx=MAT_PEDUNCLE,
        rotation_euler=(math.radians(-15), math.radians(10), math.radians(-40))
    )

    # Zarcillos espiralados
    add_squash_tendril(bm, main_runner[3], Vector((-0.65, -0.60, 0.35)), length=0.14, coil_turns=4.0, coil_radius=0.016, mat_stem_idx=MAT_STEM)
    add_squash_tendril(bm, sec_runner[2],  Vector(( 0.75,  0.45, 0.35)), length=0.13, coil_turns=3.5, coil_radius=0.015, mat_stem_idx=MAT_STEM)

    # Flor remanente en el ápice de la guía
    add_squash_flower(
        bm,
        center_pos=sec_runner[-1] + Vector((0.02, 0.02, 0.02)),
        direction=Vector((0.4, 0.7, 0.6)),
        scale=0.90,
        is_female=False,
        mat_flower_idx=MAT_FLOWER,
        mat_stem_idx=MAT_STEM,
        mat_baby_idx=MAT_BABY_GREEN
    )

    mesh = bpy.data.meshes.new("Squash_4_Mesh")
    obj = bpy.data.objects.new("Squash_4", mesh)
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
# 6. ETAPA 6: COSECHA Y SENESCENCIA (Squash_Harvested)
# ==============================================================================
def build_stage_harvested(mats):
    """
    Etapa 6: Cosecha y Senescencia (BBCH 90-99 / PlantVitality: 'harvested').
    - Guías secas marchitas en verde pardo pajizo.
    - Zarcillos deshidratados quebradizos.
    - Hojas caídas marchitas en paleta bimodal (ocre-oliva y pardo pajizo).
    - Pedúnculo cortado con cicatriz en la guía principal donde se cosechó el zapallo.
    - Un zapallito secundario residual sobremaduro arrugado.
    """
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    main_runner = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector((-0.06, -0.04, 0.04)),
        Vector((-0.13, -0.07, 0.05)),
        Vector((-0.21, -0.08, 0.05)),
        Vector((-0.30, -0.05, 0.04)),
    ]
    build_vine_runner(bm, main_runner, 0.017, 0.010, MAT_DRY_STEM)

    sec_runner = [
        main_runner[2],
        Vector((-0.09,  0.07, 0.05)),
        Vector((-0.05,  0.17, 0.04)),
        Vector(( 0.03,  0.24, 0.03)),
    ]
    build_vine_runner(bm, sec_runner, 0.012, 0.008, MAT_DRY_STEM)

    # 5 Hojas senescentes marchitas con declive y tonos otoñales
    senescent_leaves = [
        (main_runner[1], 0.20, 0.15, Vector((-0.70, -0.30, 0.35)), MAT_SENESCENT_LEAF),
        (main_runner[3], 0.21, 0.15, Vector((-0.75,  0.15, 0.32)), MAT_DRY_LEAF),
        (sec_runner[1],  0.19, 0.14, Vector(( 0.40, -0.60, 0.38)), MAT_SENESCENT_LEAF),
        (sec_runner[2],  0.20, 0.15, Vector(( 0.15,  0.75, 0.30)), MAT_DRY_LEAF),
        (main_runner[0], 0.17, 0.13, Vector(( 0.25, -0.65, 0.36)), MAT_SENESCENT_LEAF),
    ]

    for p_orig, p_len, b_sz, norm_v, mat_l in senescent_leaves:
        add_master_squash_leaf(
            bm, origin=p_orig, petiole_len=p_len, blade_size=b_sz,
            leaf_normal=norm_v, uv_layer=uv_layer,
            mat_leaf_idx=mat_l, mat_stem_idx=MAT_DRY_STEM
        )

    # Cicatriz de corte de cosecha en la guía principal
    p_scar_origin = main_runner[1] + Vector((0.02, -0.06, 0.04))
    scar_geom = bmesh.ops.create_cone(
        bm, cap_ends=True, segments=8, radius1=0.016, radius2=0.013, depth=0.020,
        matrix=Matrix.Translation(p_scar_origin) @ Euler((math.radians(25), math.radians(-10), 0)).to_matrix().to_4x4()
    )
    for f in {f for v in scar_geom['verts'] for f in v.link_faces}:
        f.material_index = MAT_DRY_STEM
        f.smooth = True

    # Superficie cortada con cicatriz leñosa
    top_scar = bmesh.ops.create_circle(
        bm, cap_ends=True, segments=8, radius=0.013,
        matrix=Matrix.Translation(p_scar_origin + Vector((0.005, -0.01, 0.012)))
    )
    for f in {f for v in top_scar['verts'] for f in v.link_faces}:
        f.material_index = MAT_SCAR
        f.smooth = True

    # Zapallito secundario residual sobremaduro deshidratado
    add_master_squash_fruit(
        bm,
        center_pos=Vector((-0.22, 0.07, 0.06)),
        radius_xy=0.082,
        height_ratio=0.68,
        num_ribs=8,
        mat_fruit_idx=MAT_ORANGE,
        mat_peduncle_idx=MAT_DRY_STEM,
        rotation_euler=(math.radians(-15), math.radians(10), math.radians(-40))
    )

    # Zarcillos secos quebradizos
    add_squash_tendril(bm, main_runner[3], Vector((-0.65, -0.60, 0.20)), length=0.12, coil_turns=3.5, coil_radius=0.013, mat_stem_idx=MAT_DRY_STEM)

    mesh = bpy.data.meshes.new("Squash_Harvested_Mesh")
    obj = bpy.data.objects.new("Squash_Harvested", mesh)
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
# MAIN PIPELINE
# ==============================================================================
def main():
    log_file = os.path.abspath(r"scripts/out/build_squash_stages.log")
    import traceback
    try:
        with open(log_file, "w", encoding="utf-8") as f:
            f.write("Iniciando generación de los 6 Tiers de Zapallo Criollo...\n")

        scene = setup_stage_scene()
        mats = create_all_squash_materials()

        print("-> Construyendo Etapa 1 (Germinacion)...")
        obj1 = build_stage1_germination(mats)

        print("-> Construyendo Etapa 2 (Desarrollo Foliar)...")
        obj2 = build_stage2_leaf(mats)

        print("-> Construyendo Etapa 3 (Estructura Rastrera)...")
        obj3 = build_stage3_structure(mats)

        print("-> Construyendo Etapa 4 (Floracion y Cuaje)...")
        obj4 = build_stage4_flowering(mats)

        print("-> Construyendo Etapa 5 (Fructificacion Definitiva)...")
        obj5 = build_stage5_fruiting(mats)

        print("-> Construyendo Etapa 6 (Cosecha / Senescencia)...")
        obj6 = build_stage_harvested(mats)

        stage_mapping = [
            ("stage1", obj1),
            ("stage2", obj2),
            ("stage3", obj3),
            ("stage4", obj4),
            ("stage5", obj5),
            ("harvested", obj6),
        ]

        # Vincular a colecciones en SQUASH.blend
        for stage_name, obj in stage_mapping:
            col = bpy.data.collections.get(stage_name)
            if not col:
                col = bpy.data.collections.new(stage_name)
                bpy.context.scene.collection.children.link(col)

            for old_o in list(col.objects):
                col.objects.unlink(old_o)

            col.objects.link(obj)

        blend_file = os.path.abspath(r"assets-src/crops/SQUASH.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        # Renders individuales
        out_dir = os.path.abspath(r"scripts/out")
        stage_cams = {
            "stage1": (0.35, Vector((0, 0, 0.05))),
            "stage2": (0.60, Vector((0, 0, 0.08))),
            "stage3": (0.85, Vector((-0.05, 0.02, 0.10))),
            "stage4": (0.95, Vector((-0.05, 0.02, 0.12))),
            "stage5": (1.05, Vector((-0.06, 0.02, 0.12))),
            "harvested": (1.05, Vector((-0.06, 0.02, 0.10))),
        }

        rot_mat = scene.camera.rotation_euler.to_matrix()

        for stage_name, obj in stage_mapping:
            for s_name, o in stage_mapping:
                o.hide_render = (s_name != stage_name)

            o_scale, target_lookat = stage_cams[stage_name]
            scene.camera.data.ortho_scale = o_scale
            scene.camera.location = rot_mat @ Vector((0, 0, 10.0)) + target_lookat

            raw_path = os.path.join(out_dir, f"cartoon_squash_{stage_name}_raw.png")
            scene.render.filepath = raw_path
            bpy.ops.render.render(write_still=True)

        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"Todos los tiers guardados con éxito en {blend_file}\n")

    except Exception as e:
        err = traceback.format_exc()
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
