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
    sun_data.energy = 2.9
    sun_data.color = (1.0, 0.98, 0.94)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(16), math.radians(35))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.1
    fill_data.color = (0.84, 0.90, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(30), math.radians(-20), math.radians(-145))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.5
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

    # Inclinación isométrica
    cam_obj.rotation_euler = (math.radians(56.7), 0, math.radians(45))

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
    """Crea materiales cartoon botánicos sincronizados con slots [0: Leaf, 1: Stem]."""
    color_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_color.png")
    bump_tex_path = os.path.abspath(r"scripts/out/tomato_leaflet_bump.png")

    mat_leaf = bpy.data.materials.new("Cartoon_Tomato_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

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

    if os.path.exists(color_tex_path):
        tex_color = nodes.new(type='ShaderNodeTexImage')
        tex_color.image = bpy.data.images.load(color_tex_path)
        links.new(tex_color.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.055, 0.30, 0.040, 1.0)

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

    mat_stem = bpy.data.materials.new("Cartoon_Leaf_Stem")
    mat_stem.use_nodes = True
    bsdf_s = mat_stem.node_tree.nodes.get("Principled BSDF")
    if bsdf_s:
        bsdf_s.inputs['Base Color'].default_value = (0.24, 0.56, 0.12, 1.0)
        bsdf_s.inputs['Roughness'].default_value = 0.34

    return mat_leaf, mat_stem

def create_master_leaflet_mesh(mat_leaf, mat_stem):
    """Crea la malla base del Foliolo Maestro con coordenadas UV."""
    mesh = bpy.data.meshes.new("Tomato_Leaflet_Base")
    mesh.materials.append(mat_leaf) # Slot 0
    mesh.materials.append(mat_stem) # Slot 1

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    profile = [
        (0.00, 0.08, 0.000),
        (0.04, 0.22, 0.001),
        (0.09, 0.65, 0.004),
        (0.15, 0.98, 0.007),
        (0.21, 0.82, 0.004),
        (0.27, 0.34, 0.000),
        (0.34, 0.62, 0.004),
        (0.42, 0.94, 0.007),
        (0.50, 1.00, 0.008),
        (0.58, 0.82, 0.003),
        (0.66, 0.92, 0.007),
        (0.74, 0.78, 0.004),
        (0.82, 0.62, 0.002),
        (0.89, 0.40, 0.001),
        (0.95, 0.20, 0.000),
        (1.00, 0.00, 0.000),
    ]

    leaflet_len = 1.0
    leaflet_wid = 0.60

    u_cols = [-1.0, -0.80, -0.60, -0.40, -0.20, 0.0, 0.20, 0.40, 0.60, 0.80, 1.0]
    num_cols = len(u_cols)
    num_rows = len(profile)

    grid_verts = []
    grid_uvs = []

    for i, (y_rel, w_rel, pillow) in enumerate(profile):
        y_pos = leaflet_len * y_rel
        drop_z = -0.15 * (y_rel ** 1.6)

        saw_phase = (y_rel * 8.0) % 1.0
        saw_tooth = 1.0 + 0.035 * (saw_phase ** 0.7 - 0.3) if y_rel > 0.30 else 1.0
        half_w = (leaflet_wid * 0.5) * w_rel * saw_tooth

        row_verts = []
        row_uvs = []
        for u in u_cols:
            abs_u = abs(u)
            x_pos = u * half_w

            v_cup = 0.025 * (abs_u ** 1.5) * (1.0 - y_rel * 0.35)
            pillow_bump = pillow * math.sin(abs_u * math.pi) * 2.0

            z_pos = drop_z + v_cup + pillow_bump

            vert = bm.verts.new(Vector((x_pos, y_pos, z_pos)))
            row_verts.append(vert)

            u_coord = (u + 1.0) * 0.5
            v_coord = y_rel
            row_uvs.append((u_coord, v_coord))

        grid_verts.append(row_verts)
        grid_uvs.append(row_uvs)

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
                    face.material_index = 0  # MAT_LEAF
                    face.smooth = True
                    for loop in face.loops:
                        for (v_c, uv_c) in unique_pairs:
                            if loop.vert == v_c:
                                loop[uv_layer].uv = uv_c
                                break
                except ValueError:
                    pass

    bm.to_mesh(mesh)
    bm.free()
    return mesh

def build_master_compound_leaf():
    """
    Construye la HOJA COMPUESTA MAESTRA DE TOMATE (fiel a la Foto 2):
    - Raquis arqueado con caída orgánica.
    - Foliolo terminal grande en la punta.
    - Pares de foliolos laterales con peciólulos, apuntando hacia adelante (32°-44°).
    - Foliolos intercalares pequeños que pueblan el raquis.
    - Preserva los mapas UV y slots de materiales en la unión.
    """
    mat_leaf, mat_stem = create_materials()
    leaflet_mesh = create_master_leaflet_mesh(mat_leaf, mat_stem)

    leaf_group = []

    # Raquis central
    total_len = 0.44
    num_steps = 14
    rachis_pts = []

    # Orientación diagonal con arqueo en Z
    dir_main = Vector((0.707, 0.707, 0.28)).normalized()
    side_main = Vector((-0.707, 0.707, 0.0)).normalized()
    norm_main = dir_main.cross(side_main).normalized()

    mesh_rachis = bpy.data.meshes.new("Rachis_Mesh")
    mesh_rachis.materials.append(mat_leaf) # Slot 0
    mesh_rachis.materials.append(mat_stem) # Slot 1

    bm_r = bmesh.new()
    uv_r = bm_r.loops.layers.uv.new("UVMap")

    prev_ring = None
    for s in range(num_steps + 1):
        u = s / float(num_steps)
        # Caída por gravedad hacia la punta
        drop_z = -0.075 * (u ** 1.7) * total_len
        p_cen = dir_main * (total_len * u) + norm_main * drop_z
        rachis_pts.append(p_cen)

        r_curr = 0.0095 * (1.0 - u * 0.65)
        ring = bmesh.ops.create_circle(
            bm_r, cap_ends=(s == 0 or s == num_steps), segments=8, radius=r_curr, matrix=Matrix.Translation(p_cen)
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm_r.faces.new([
                    prev_ring[k],
                    prev_ring[(k + 1) % len(ring)],
                    ring[(k + 1) % len(ring)],
                    ring[k]
                ])
                f.material_index = 1 # MAT_STEM
                f.smooth = True
                for loop in f.loops:
                    loop[uv_r].uv = (0.5, 0.0) # Centro del tallo
        prev_ring = ring

    bm_r.to_mesh(mesh_rachis)
    bm_r.free()

    obj_rachis = bpy.data.objects.new("Rachis", mesh_rachis)
    bpy.context.collection.objects.link(obj_rachis)
    leaf_group.append(obj_rachis)

    # 1. Foliolo Terminal
    p_term = rachis_pts[-1]
    obj_term = bpy.data.objects.new("Leaflet_Terminal", leaflet_mesh)
    bpy.context.collection.objects.link(obj_term)
    obj_term.location = p_term
    obj_term.scale = Vector((0.19, 0.19, 0.19))
    obj_term.rotation_mode = 'QUATERNION'
    obj_term.rotation_quaternion = (dir_main + norm_main * -0.15).to_track_quat('Y', 'Z')
    leaf_group.append(obj_term)

    # 2. Pares Laterales e Intercalares (Foto 2)
    # (idx_raquis, angulo_adelante_deg, escala, largo_peciolo, es_intercalar)
    leaflet_configs = [
        # Par Subterminal (32° adelante)
        (11, 32.0, 0.160, 0.026, False),
        # Par Intercalar Superior (48° adelante, pequeño)
        (9,  48.0, 0.075, 0.012, True),
        # Par Medio Principal (38° adelante)
        (7,  38.0, 0.170, 0.036, False),
        # Par Intercalar Medio
        (5,  52.0, 0.065, 0.012, True),
        # Par Basal (44° adelante)
        (3,  44.0, 0.150, 0.040, False),
        # Par Intercalar Basal Diminuto
        (2,  60.0, 0.050, 0.010, True),
    ]

    for (idx, angle_deg, l_scale, pet_len, is_inter) in leaflet_configs:
        p_base = rachis_pts[idx]
        angle_rad = math.radians(angle_deg)

        for s_sign in (1.0, -1.0):
            lat_dir = (
                dir_main * math.cos(angle_rad) +
                side_main * (s_sign * math.sin(angle_rad)) +
                norm_main * -0.05
            ).normalized()

            p_pet_end = p_base + lat_dir * pet_len

            # Peciólulo con UVMap y material_index=1
            mesh_pet = bpy.data.meshes.new("Petiolule_Mesh")
            mesh_pet.materials.append(mat_leaf)
            mesh_pet.materials.append(mat_stem)
            bm_p = bmesh.new()
            uv_p = bm_p.loops.layers.uv.new("UVMap")
            r1 = 0.0045 if not is_inter else 0.0028
            r2 = 0.0032 if not is_inter else 0.0020
            p_s = bmesh.ops.create_circle(bm_p, cap_ends=False, segments=6, radius=r1, matrix=Matrix.Translation(p_base))['verts']
            p_e = bmesh.ops.create_circle(bm_p, cap_ends=False, segments=6, radius=r2, matrix=Matrix.Translation(p_pet_end))['verts']
            for k in range(len(p_s)):
                f = bm_p.faces.new([p_s[k], p_s[(k + 1) % len(p_s)], p_e[(k + 1) % len(p_e)], p_e[k]])
                f.material_index = 1 # MAT_STEM
                f.smooth = True
                for loop in f.loops:
                    loop[uv_p].uv = (0.5, 0.0)
            bm_p.to_mesh(mesh_pet)
            bm_p.free()

            obj_pet = bpy.data.objects.new("Petiolule", mesh_pet)
            bpy.context.collection.objects.link(obj_pet)
            leaf_group.append(obj_pet)

            # Foliolo Maestro
            obj_leaf = bpy.data.objects.new("Leaflet_Lateral", leaflet_mesh)
            bpy.context.collection.objects.link(obj_leaf)
            obj_leaf.location = p_pet_end
            obj_leaf.scale = Vector((l_scale, l_scale, l_scale))

            leaf_quat = lat_dir.to_track_quat('Y', 'Z')
            roll_quat = Quaternion(lat_dir, math.radians(s_sign * 22.0))
            obj_leaf.rotation_mode = 'QUATERNION'
            obj_leaf.rotation_quaternion = roll_quat @ leaf_quat
            leaf_group.append(obj_leaf)

    # Convertir instancias en copias reales de malla antes del join
    bpy.ops.object.select_all(action='DESELECT')
    for o in leaf_group:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obj_rachis
    bpy.ops.object.make_single_user(type='SELECTED_OBJECTS', object=True, obdata=True)
    bpy.ops.object.join()

    master_obj = bpy.context.active_object
    master_obj.name = "Tomato_Leaf_Master"

    sol = master_obj.modifiers.new("Solidify", 'SOLIDIFY')
    sol.thickness = 0.0028
    sol.offset = 0.0
    sol.use_rim = True

    sub = master_obj.modifiers.new("Subdivision", 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    return master_obj

def frame_camera(scene, cam_obj, obj):
    """Centra la cámara sobre la hoja compuesta completa."""
    bpy.context.view_layer.update()
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    center = sum(bbox, Vector((0, 0, 0))) / 8.0

    min_c = Vector((min(c[0] for c in bbox), min(c[1] for c in bbox), min(c[2] for c in bbox)))
    max_c = Vector((max(c[0] for c in bbox), max(c[1] for c in bbox), max(c[2] for c in bbox)))
    diag = (max_c - min_c).length

    cam_rot = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = center + cam_rot @ Vector((0, 0, 10.0))
    cam_obj.data.ortho_scale = diag * 0.92

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\leaf_compound.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando creación de la Hoja Compuesta Maestra (Foliolos con Nervaduras + Foto 2)...\n")

        scene, cam_obj = setup_leaf_scene()
        master_leaf = build_master_compound_leaf()

        # Inclinación diagonal isométrica
        master_leaf.rotation_euler = (math.radians(-10), math.radians(16), math.radians(-32))

        frame_camera(scene, cam_obj, master_leaf)

        blend_file = os.path.abspath(r"assets-src/crops/TOMATO_LEAF_MASTER.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_leaf_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Render 3D de hoja compuesta completado con éxito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
