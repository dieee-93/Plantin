import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_leaf_scene():
    """Configura la escena con iluminacion toon limpia para la Hoja Maestra de Maiz."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonCornWorld")
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
    cam_data.ortho_scale = 0.72
    cam_obj = bpy.data.objects.new(name="LeafCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.rotation_euler = (math.radians(50), 0, math.radians(35))
    rot_mat = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = rot_mat @ Vector((0, 0, 6.0)) + Vector((0, 0, 0.10))

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

def create_corn_leaf_material():
    """Crea material PBR toon para la hoja de maiz con su textura botánica."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    color_tex_path = os.path.join(this_dir, "textures", "corn_leaf_color.png")
    bump_tex_path = os.path.join(this_dir, "textures", "corn_leaf_bump.png")

    mat_leaf = bpy.data.materials.new("Mat_Corn_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

    out_node = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.36
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.30
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = 0.30
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
        bsdf.inputs['Base Color'].default_value = (0.18, 0.44, 0.16, 1.0)

    if os.path.exists(bump_tex_path):
        tex_bump = nodes.new(type='ShaderNodeTexImage')
        tex_bump.image = bpy.data.images.load(bump_tex_path)
        try:
            tex_bump.image.colorspace_settings.name = 'Non-Color'
        except:
            pass

        bump_node = nodes.new(type='ShaderNodeBump')
        bump_node.inputs['Strength'].default_value = 0.32
        bump_node.inputs['Distance'].default_value = 0.007

        links.new(tex_bump.outputs['Color'], bump_node.inputs['Height'])
        links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])

    return mat_leaf

def append_corn_leaf(bm, origin, direction, length=0.55, width=0.085, arch_factor=1.0, wave_factor=1.0, uv_layer=None, mat_idx=0):
    """
    Construye una hoja acintada de maiz organica y arqueada en la bmesh dada.
    - direction: direccion inicial en el plano horizontal (proyeccion).
    - arch_factor: grado de caida/curvatura en cascada de la punta.
    - wave_factor: intensidad de las ondulaciones de los bordes.
    """
    dir_fwd = direction.normalized()
    up_v = Vector((0, 0, 1))
    side_vec = dir_fwd.cross(up_v).normalized()

    steps = 18
    # 1. Trayectoria de la quilla / nervadura central (curva parabolica en cascada)
    spine_pts = []
    spine_dirs = []
    prev_pos = origin

    for s in range(steps + 1):
        u = s / float(steps)
        # Alcance hacia adelante
        reach = (u ** 0.92) * length
        # Curvatura vertical: sube con fuerza los primeros 30% y luego se arquea hacia abajo en cascada
        arch_z = (0.28 * math.sin(u * math.pi * 0.48) - 0.42 * (u ** 1.65)) * length * arch_factor
        pos = origin + dir_fwd * reach + up_v * arch_z
        spine_pts.append((pos, u))

    # 2. Generar grilla transversal (nervio central y 3 subdivisiones por semilamina)
    r_grid = []
    l_grid = []

    for s in range(steps + 1):
        pos, u = spine_pts[s]
        # Direccion local del segmento
        if s < steps:
            seg_dir = (spine_pts[s + 1][0] - pos).normalized()
        else:
            seg_dir = (pos - spine_pts[s - 1][0]).normalized()

        seg_side = seg_dir.cross(up_v).normalized()
        seg_up = seg_side.cross(seg_dir).normalized()

        # Ancho segun perfil de hoja de maiz: estrecho en la vaina/base (u=0),
        # maximo en el tercio inferior (u~0.25 - 0.40) y afinandose en la punta (u=1.0)
        blade_w = width * math.sin(u * math.pi * 0.94) * (1.2 - 0.4 * u)
        if u < 0.08:
            blade_w = width * (0.35 + 0.65 * (u / 0.08))

        # Ondulacion del margen (ripples caracteristicos)
        wave_r = 0.007 * math.sin(u * math.pi * 7.0) * wave_factor * (u ** 0.5)
        wave_l = 0.007 * math.sin(u * math.pi * 7.0 + math.pi * 0.5) * wave_factor * (u ** 0.5)

        mv = bm.verts.new(pos)
        row_r = [mv]
        row_l = [mv]

        for col in [1, 2, 3]:
            frac = col / 3.0
            x_r = (blade_w * 0.5) * frac
            x_l = -(blade_w * 0.5) * frac

            # V-shape transversal (la hoja tiene quilla en el nervio y sube hacia los costados)
            v_cup = 0.008 * (frac ** 1.3) * (1.0 - u * 0.3)
            # En el borde exterior, aplicar la ondulacion vertical
            z_r = v_cup + (wave_r if col == 3 else 0.0)
            z_l = v_cup + (wave_l if col == 3 else 0.0)

            p_r = pos + seg_side * x_r + seg_up * z_r
            p_l = pos + seg_side * x_l + seg_up * z_l

            row_r.append(bm.verts.new(p_r))
            row_l.append(bm.verts.new(p_l))

        r_grid.append(row_r)
        l_grid.append(row_l)

    # 3. Crear caras quad
    for s in range(steps):
        for col in range(3):
            # Lado derecho
            v1 = r_grid[s][col]
            v2 = r_grid[s][col + 1]
            v3 = r_grid[s + 1][col + 1]
            v4 = r_grid[s + 1][col]
            unique_r = []
            for v in [v1, v2, v3, v4]:
                if v not in unique_r: unique_r.append(v)
            if len(unique_r) >= 3:
                try:
                    f = bm.faces.new(unique_r)
                    f.material_index = mat_idx
                    f.smooth = True
                    if uv_layer:
                        for loop in f.loops:
                            rel_u = (col / 3.0) * 0.45 + 0.5
                            rel_v = s / float(steps)
                            loop[uv_layer].uv = (min(1.0, max(0.0, rel_u)), min(1.0, max(0.0, rel_v)))
                except ValueError:
                    pass

            # Lado izquierdo
            v1 = l_grid[s][col]
            v2 = l_grid[s + 1][col]
            v3 = l_grid[s + 1][col + 1]
            v4 = l_grid[s][col + 1]
            unique_l = []
            for v in [v1, v2, v3, v4]:
                if v not in unique_l: unique_l.append(v)
            if len(unique_l) >= 3:
                try:
                    f = bm.faces.new(unique_l)
                    f.material_index = mat_idx
                    f.smooth = True
                    if uv_layer:
                        for loop in f.loops:
                            rel_u = 0.5 - (col / 3.0) * 0.45
                            rel_v = s / float(steps)
                            loop[uv_layer].uv = (min(1.0, max(0.0, rel_u)), min(1.0, max(0.0, rel_v)))
                except ValueError:
                    pass

def build_single_master_leaf():
    """Construye la HOJA MAESTRA de Maiz con su peciolo/vaina y arqueo botánico."""
    scene, cam_obj = setup_leaf_scene()
    mat_leaf = create_corn_leaf_material()

    mesh = bpy.data.meshes.new("Corn_Leaf_Master_Mesh")
    obj = bpy.data.objects.new("Corn_Leaf_Master", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat_leaf)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    append_corn_leaf(
        bm=bm,
        origin=Vector((0, 0, 0)),
        direction=Vector((0.707, 0.707, 0)),
        length=0.62,
        width=0.092,
        arch_factor=1.05,
        wave_factor=1.1,
        uv_layer=uv_layer,
        mat_idx=0
    )

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0012
    sol_mod.offset = 0.0
    sol_mod.use_rim = True

    return scene, obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\leaf_corn.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando generacion de Hoja Maestra de Maiz...\n")

        scene, obj = build_single_master_leaf()

        blend_file = os.path.abspath(r"assets-src/crops/CORN_LEAF_MASTER.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_corn_leaf_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Hoja Maestra completada con exito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
