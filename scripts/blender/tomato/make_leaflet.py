import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_leaflet_scene():
    """Configura la escena con iluminación toon botánica limpia y cámara ortográfica oblicua."""
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
    cam_obj = bpy.data.objects.new(name="LeafletCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.rotation_euler = (math.radians(38), 0, math.radians(25))

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

    mat_stem = bpy.data.materials.new("Cartoon_Leaf_Stem")
    mat_stem.use_nodes = True
    bsdf_s = mat_stem.node_tree.nodes.get("Principled BSDF")
    if bsdf_s:
        bsdf_s.inputs['Base Color'].default_value = (0.13, 0.36, 0.09, 1.0)
        bsdf_s.inputs['Roughness'].default_value = 0.34

    return mat_leaf, mat_stem

def build_single_master_leaflet():
    """
    Construye el FOLIOLO MAESTRO idéntico a la anatomía real de la tomatera (Solanum lycopersicum):
    - Forma 100% aprobada: orejuelas basales, senos profundos, dientes hacia adelante y ápice acuminado.
    """
    mat_leaf, mat_stem = create_materials()

    mesh = bpy.data.meshes.new("Tomato_Leaflet_Master_Mesh")
    obj = bpy.data.objects.new("Tomato_Leaflet_Master", mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(mat_leaf)
    obj.data.materials.append(mat_stem)

    MAT_LEAF = 0
    MAT_STEM = 1

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    L = 0.30
    W = 0.16

    right_margin = [
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
    midrib_verts = []
    for k in range(num_pts):
        u_r, v_r = right_margin[k]
        u_l, v_l = left_margin[k]
        v_mid = (v_r + v_l) * 0.5
        y_pos = L * (v_mid - 0.45)
        drop_z = -0.044 * (v_mid ** 1.6) * L
        midrib_v = bm.verts.new(Vector((0.0, y_pos, drop_z - 0.0010)))
        midrib_verts.append((midrib_v, v_mid))

    right_grid = []
    for k in range(num_pts):
        u_target, v_target = right_margin[k]
        v_mid = midrib_verts[k][1]
        row = [midrib_verts[k][0]]
        for col_idx in [1, 2, 3, 4]:
            frac = col_idx / 4.0
            u_c = u_target * frac
            v_c = v_mid + (v_target - v_mid) * frac
            x_pos = (W * 0.5) * u_c
            y_pos = L * (v_c - 0.45)
            drop_z = -0.044 * (v_c ** 1.6) * L
            v_cup = 0.0085 * (frac ** 1.3) * (1.0 - v_c * 0.28)
            z_pos = drop_z + v_cup
            row.append(bm.verts.new(Vector((x_pos, y_pos, z_pos))))
        right_grid.append(row)

    left_grid = []
    for k in range(num_pts):
        u_target, v_target = left_margin[k]
        v_mid = midrib_verts[k][1]
        row = [midrib_verts[k][0]]
        for col_idx in [1, 2, 3, 4]:
            frac = col_idx / 4.0
            u_c = u_target * frac
            v_c = v_mid + (v_target - v_mid) * frac
            x_pos = (W * 0.5) * u_c
            y_pos = L * (v_c - 0.45)
            drop_z = -0.044 * (v_c ** 1.6) * L
            v_cup = 0.0085 * (frac ** 1.3) * (1.0 - v_c * 0.28)
            z_pos = drop_z + v_cup
            row.append(bm.verts.new(Vector((x_pos, y_pos, z_pos))))
        left_grid.append(row)

    for i in range(num_pts - 1):
        for j in range(4):
            v0 = right_grid[i][j]
            v1 = right_grid[i][j + 1]
            v2 = right_grid[i + 1][j + 1]
            v3 = right_grid[i + 1][j]
            unique_verts = []
            for v in [v0, v1, v2, v3]:
                if v not in unique_verts:
                    unique_verts.append(v)
            if len(unique_verts) >= 3:
                try:
                    f = bm.faces.new(unique_verts)
                    f.material_index = MAT_LEAF
                    f.smooth = True
                    for loop in f.loops:
                        u_uv = (loop.vert.co.x / (W * 0.5)) * 0.5 + 0.5
                        v_uv = (loop.vert.co.y / L) + 0.45
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, v_uv)))
                except ValueError:
                    pass

    for i in range(num_pts - 1):
        for j in range(4):
            v0 = left_grid[i][j]
            v1 = left_grid[i + 1][j]
            v2 = left_grid[i + 1][j + 1]
            v3 = left_grid[i][j + 1]
            unique_verts = []
            for v in [v0, v1, v2, v3]:
                if v not in unique_verts:
                    unique_verts.append(v)
            if len(unique_verts) >= 3:
                try:
                    f = bm.faces.new(unique_verts)
                    f.material_index = MAT_LEAF
                    f.smooth = True
                    for loop in f.loops:
                        u_uv = (loop.vert.co.x / (W * 0.5)) * 0.5 + 0.5
                        v_uv = (loop.vert.co.y / L) + 0.45
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, v_uv)))
                except ValueError:
                    pass

    pet_len = 0.055
    p_base = Vector((0, -L * 0.45, 0))
    p_pet_start = p_base + Vector((0, -pet_len, -0.015))

    pet_ring_s = bmesh.ops.create_circle(
        bm, cap_ends=True, segments=10, radius=0.0050, matrix=Matrix.Translation(p_pet_start)
    )['verts']
    pet_ring_e = bmesh.ops.create_circle(
        bm, cap_ends=False, segments=10, radius=0.0038, matrix=Matrix.Translation(p_base)
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

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0016
    sol_mod.offset = 0.0
    sol_mod.use_rim = True

    sub_mod = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub_mod.levels = 1
    sub_mod.render_levels = 1

    return obj

def frame_camera(scene, cam_obj, obj):
    bpy.context.view_layer.update()
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    center = sum(bbox, Vector((0, 0, 0))) / 8.0
    min_c = Vector((min(c[0] for c in bbox), min(c[1] for c in bbox), min(c[2] for c in bbox)))
    max_c = Vector((max(c[0] for c in bbox), max(c[1] for c in bbox), max(c[2] for c in bbox)))
    diag = (max_c - min_c).length
    cam_rot = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = center + cam_rot @ Vector((0, 0, 10.0))
    cam_obj.data.ortho_scale = diag * 0.88

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\leaflet_master.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando creación del Foliolo Maestro V6 (Verde Oscuro Botánico)...\n")

        scene, cam_obj = setup_leaflet_scene()
        obj = build_single_master_leaflet()

        obj.rotation_euler = (math.radians(12), math.radians(-10), math.radians(16))
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
