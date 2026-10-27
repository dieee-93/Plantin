import bpy
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion
import math
import os
import sys

def setup_leaf_scene():
    """Configura la escena para el render de la Hoja Palmeada Compuesta Maestra (Fan Leaf)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonFanLeafWorld")
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
    cam_data.ortho_scale = 0.58
    cam_obj = bpy.data.objects.new(name="LeafCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.rotation_euler = (math.radians(52), 0, math.radians(38))
    rot_mat = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = rot_mat @ Vector((0, 0, 5.0)) + Vector((0, 0, 0.08))

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
    """Crea materiales toon botanicos para la hoja palmeada completa."""
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

    # Material del peciolo principal: verde con suave matiz rojizo/púrpura
    mat_petiole = bpy.data.materials.new("Mat_Cannabis_Petiole")
    mat_petiole.use_nodes = True
    bsdf_p = mat_petiole.node_tree.nodes.get("Principled BSDF")
    if bsdf_p:
        bsdf_p.inputs['Base Color'].default_value = (0.24, 0.32, 0.14, 1.0)
        bsdf_p.inputs['Roughness'].default_value = 0.34

    return mat_leaf, mat_petiole

def append_cannabis_leaflet(bm, origin, direction, up_normal, scale, uv_layer, mat_leaf_idx, mat_petiole_idx, bend_curve=1.0):
    """
    Agrega un foliolo aserrado individual a la malla bmesh en la posicion, orientacion y escala dadas.
    - direction: vector hacia el que apunta el apice del foliolo.
    - up_normal: vector normal de la cara superior de la hoja.
    - bend_curve: factor multiplicador del arco de curvatura descendente.
    """
    dir_y = direction.normalized()
    nor_z = up_normal.normalized()
    side_x = dir_y.cross(nor_z).normalized()
    nor_z = side_x.cross(dir_y).normalized() # Re-ortogonalizar

    L = 0.26 * scale
    W = 0.065 * scale

    right_margin = [
        (0.04, 0.00), (0.10, 0.04), (0.20, 0.08), (0.35, 0.12),
        (0.52, 0.16), (0.38, 0.175),
        (0.66, 0.22), (0.48, 0.235),
        (0.80, 0.28), (0.60, 0.295),
        (0.92, 0.35), (0.70, 0.365),
        (0.98, 0.42), (0.75, 0.435),
        (1.00, 0.49), (0.76, 0.505),
        (0.95, 0.56), (0.72, 0.575),
        (0.88, 0.63), (0.65, 0.645),
        (0.78, 0.70), (0.56, 0.715),
        (0.66, 0.77), (0.46, 0.785),
        (0.52, 0.84), (0.34, 0.855),
        (0.36, 0.91), (0.22, 0.925),
        (0.12, 0.96), (0.04, 0.985), (0.00, 1.00),
    ]
    left_margin = [(-u, v) for (u, v) in right_margin]
    num_pts = len(right_margin)

    # Vertices del nervio central con curvatura descendente
    midrib_verts = []
    for k in range(num_pts):
        v_mid = right_margin[k][1]
        y_loc = L * v_mid
        drop_z = (-0.052 * (v_mid ** 1.7) * L + 0.006 * math.sin(v_mid * math.pi) * L) * bend_curve
        pos_3d = origin + dir_y * y_loc + nor_z * drop_z
        mv = bm.verts.new(pos_3d)
        midrib_verts.append((mv, v_mid))

    right_grid = []
    left_grid = []
    for k in range(num_pts):
        v_mid = midrib_verts[k][1]
        row_r = [midrib_verts[k][0]]
        row_l = [midrib_verts[k][0]]

        u_r, _ = right_margin[k]
        u_l, _ = left_margin[k]

        for col in [1, 2, 3]:
            frac = col / 3.0
            drop_z = (-0.052 * (v_mid ** 1.7) * L + 0.006 * math.sin(v_mid * math.pi) * L) * bend_curve
            v_cup = 0.005 * (frac ** 1.2) * (1.0 - v_mid * 0.4) * scale

            # Lado derecho
            x_r = (W * 0.5) * u_r * frac
            p_r = origin + dir_y * (L * v_mid) + side_x * x_r + nor_z * (drop_z + v_cup)
            row_r.append(bm.verts.new(p_r))

            # Lado izquierdo
            x_l = (W * 0.5) * u_l * frac
            p_l = origin + dir_y * (L * v_mid) + side_x * x_l + nor_z * (drop_z + v_cup)
            row_l.append(bm.verts.new(p_l))

        right_grid.append(row_r)
        left_grid.append(row_l)

    # Caras
    for i in range(num_pts - 1):
        for j in range(3):
            # Derecho
            vr = [right_grid[i][j], right_grid[i][j + 1], right_grid[i + 1][j + 1], right_grid[i + 1][j]]
            ur = []
            for v in vr:
                if v not in ur: ur.append(v)
            if len(ur) >= 3:
                try:
                    f = bm.faces.new(ur)
                    f.material_index = mat_leaf_idx
                    f.smooth = True
                    for loop in f.loops:
                        # UV aproximado
                        rel_v = right_margin[i][1]
                        u_uv = (j / 3.0) * 0.45 + 0.5
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, rel_v)))
                except ValueError:
                    pass

            # Izquierdo
            vl = [left_grid[i][j], left_grid[i + 1][j], left_grid[i + 1][j + 1], left_grid[i][j + 1]]
            ul = []
            for v in vl:
                if v not in ul: ul.append(v)
            if len(ul) >= 3:
                try:
                    f = bm.faces.new(ul)
                    f.material_index = mat_leaf_idx
                    f.smooth = True
                    for loop in f.loops:
                        rel_v = left_margin[i][1]
                        u_uv = 0.5 - (j / 3.0) * 0.45
                        loop[uv_layer].uv = (min(1.0, max(0.0, u_uv)), min(1.0, max(0.0, rel_v)))
                except ValueError:
                    pass

def build_master_fan_leaf():
    """
    Construye la HOJA PALMEADA COMPUESTA MAESTRA (Fan Leaf):
    - 7 foliolos aserrados radiando desde el nudo peciolar comun.
    - Peciolo tubular arqueado botanicamente.
    - Proporciones armoniosas con cascada organica.
    """
    mat_leaf, mat_petiole = create_materials()

    mesh = bpy.data.meshes.new("Cannabis_Fan_Leaf_Master_Mesh")
    obj = bpy.data.objects.new("Cannabis_Fan_Leaf_Master", mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(mat_leaf)     # Slot 0
    obj.data.materials.append(mat_petiole)  # Slot 1

    MAT_LEAF = 0
    MAT_PETIOLE = 1

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # 1. Modelado del peciolo alargado
    petiole_len = 0.16
    p_steps = 10
    rad_base = 0.0045
    rad_tip = 0.0032

    dir_fwd = Vector((0.707, 0.707, 0.0)).normalized()
    side_vec = Vector((-0.707, 0.707, 0.0)).normalized()
    up_v = Vector((0.0, 0.0, 1.0))

    petiole_pts = []
    petiole_dirs = []
    for s in range(p_steps + 1):
        u = s / float(p_steps)
        reach = (u ** 0.95) * petiole_len
        # Arco: sube a 25° y se aplana suavemente al aproximarse al verticilo foliar
        arch_z = (0.22 * math.sin(u * math.pi * 0.5) - 0.08 * (u ** 1.5)) * petiole_len
        p_curr = dir_fwd * reach + up_v * arch_z
        petiole_pts.append(p_curr)

    # Anillos cilindricos del peciolo
    p_rings = []
    for s in range(p_steps + 1):
        u = s / float(p_steps)
        rad = rad_base * (1.0 - u * 0.28)
        pos = petiole_pts[s]

        if s < p_steps:
            seg_dir = (petiole_pts[s + 1] - pos).normalized()
        else:
            seg_dir = (pos - petiole_pts[s - 1]).normalized()

        seg_side = seg_dir.cross(up_v).normalized()
        seg_up = seg_side.cross(seg_dir).normalized()

        ring = []
        for a_idx in range(8):
            ang = a_idx * (2.0 * math.pi / 8.0)
            offset = seg_side * (rad * math.cos(ang)) + seg_up * (rad * math.sin(ang))
            ring.append(bm.verts.new(pos + offset))
        p_rings.append(ring)

    for s in range(p_steps):
        for a_idx in range(8):
            n_idx = (a_idx + 1) % 8
            v1 = p_rings[s][a_idx]
            v2 = p_rings[s + 1][a_idx]
            v3 = p_rings[s + 1][n_idx]
            v4 = p_rings[s][n_idx]
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = MAT_PETIOLE
                f.smooth = True
            except ValueError:
                pass

    # Vertice focal donde se unen los 7 foliolos
    junction_pt = petiole_pts[-1]
    tip_dir = (petiole_pts[-1] - petiole_pts[-2]).normalized()
    tip_side = tip_dir.cross(up_v).normalized()
    tip_up = tip_side.cross(tip_dir).normalized()

    # 2. Especificacion de los 7 foliolos (angulo en plano de la hoja, escala, arco de caída)
    # Angulo 0 = foliolo central que continua la direccion del peciolo
    leaflets_spec = [
        # (angulo_grados, escala, factor_caida)
        (  0.0, 1.00, 1.05), # Foliolo central apical (el mas largo)
        ( 28.0, 0.86, 1.00), # Par lateral 1 derecho
        (-28.0, 0.86, 1.00), # Par lateral 1 izquierdo
        ( 58.0, 0.65, 0.95), # Par lateral 2 derecho
        (-58.0, 0.65, 0.95), # Par lateral 2 izquierdo
        ( 88.0, 0.42, 0.85), # Par basal 3 derecho (pequeño)
        (-88.0, 0.42, 0.85), # Par basal 3 izquierdo (pequeño)
    ]

    for ang_deg, scale, bend_factor in leaflets_spec:
        rad_ang = math.radians(ang_deg)
        # Vector direccion en el plano definido por tip_dir y tip_side
        f_dir = (tip_dir * math.cos(rad_ang) + tip_side * math.sin(rad_ang)).normalized()
        # Ligera inclinacion descendente para los foliolos laterales
        f_dir = (f_dir + tip_up * (-0.08 * abs(math.sin(rad_ang)))).normalized()
        f_up = tip_up

        append_cannabis_leaflet(
            bm=bm,
            origin=junction_pt,
            direction=f_dir,
            up_normal=f_up,
            scale=scale,
            uv_layer=uv_layer,
            mat_leaf_idx=MAT_LEAF,
            mat_petiole_idx=MAT_PETIOLE,
            bend_curve=bend_factor
        )

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0010
    sol_mod.offset = 0.0
    sol_mod.use_rim = True

    return obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\leaf_cannabis.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando generacion de Hoja Palmeada Maestra de Cannabis (Fan Leaf)...\n")

        scene, cam_obj = setup_leaf_scene()
        obj = build_master_fan_leaf()

        blend_file = os.path.abspath(r"assets-src/crops/CANNABIS_LEAF_MASTER.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_cannabis_leaf_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Hoja Palmeada completada con exito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
