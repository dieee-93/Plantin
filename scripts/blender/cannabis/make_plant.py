import bpy
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion
import math
import os
import sys

# Asegurar que el directorio del script este en sys.path para importar make_leaf y make_bud
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

def setup_plant_scene():
    """Configura la escena con iluminacion toon botanica e isometrica dimetrica estandar (Plantin 2:1)."""
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
    sun_data.energy = 2.2
    sun_data.color = (1.0, 0.98, 0.93)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(48), math.radians(16), math.radians(40))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.80
    fill_data.color = (0.84, 0.90, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-22), math.radians(-140))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.0
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
    cam_obj.location = rot_mat @ Vector((0, 0, 10.0)) + Vector((0, 0, 0.65))

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

def create_plant_materials():
    """Crea los materiales PBR toon para la planta de Cannabis completa."""
    this_dir = os.path.dirname(os.path.abspath(__file__))
    color_tex_path = os.path.join(this_dir, "textures", "cannabis_leaflet_color.png")
    bump_tex_path = os.path.join(this_dir, "textures", "cannabis_leaflet_bump.png")

    mats = {}

    def make_mat(name, color, roughness, spec=0.35, sss=0.0):
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
            if sss > 0 and 'Subsurface Weight' in bsdf.inputs:
                bsdf.inputs['Subsurface Weight'].default_value = sss
        return mat

    # Slot 0: Hojas grandes
    mat_leaf = bpy.data.materials.new("Mat_Cannabis_Leaf")
    mat_leaf.use_nodes = True
    bsdf = mat_leaf.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Roughness'].default_value = 0.40
        if 'Specular IOR Level' in bsdf.inputs:
            bsdf.inputs['Specular IOR Level'].default_value = 0.28
        elif 'Specular' in bsdf.inputs:
            bsdf.inputs['Specular'].default_value = 0.28

    if os.path.exists(color_tex_path):
        tex_color = mat_leaf.node_tree.nodes.new(type='ShaderNodeTexImage')
        tex_color.image = bpy.data.images.load(color_tex_path)
        mat_leaf.node_tree.links.new(tex_color.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.09, 0.32, 0.10, 1.0)

    if os.path.exists(bump_tex_path):
        tex_bump = mat_leaf.node_tree.nodes.new(type='ShaderNodeTexImage')
        tex_bump.image = bpy.data.images.load(bump_tex_path)
        try:
            tex_bump.image.colorspace_settings.name = 'Non-Color'
        except:
            pass
        bump_node = mat_leaf.node_tree.nodes.new(type='ShaderNodeBump')
        bump_node.inputs['Strength'].default_value = 0.22
        bump_node.inputs['Distance'].default_value = 0.005
        mat_leaf.node_tree.links.new(tex_bump.outputs['Color'], bump_node.inputs['Height'])
        mat_leaf.node_tree.links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])

    mats['leaf'] = mat_leaf

    # Slot 1: Tallo principal y peciolos (verde cana vivo con toques rojizos)
    mats['cane'] = make_mat("Mat_Cannabis_Cane", (0.19, 0.38, 0.14, 1.0), 0.38)

    # Slot 2: Calices / brácteas de cogollo (verde escarchado con tricomas)
    mats['calyx'] = make_mat("Mat_Cannabis_Calyx", (0.28, 0.54, 0.22, 1.0), 0.36, spec=0.45, sss=0.15)

    # Slot 3: Pistilos ambar / estigmas
    mats['pistil'] = make_mat("Mat_Cannabis_Pistil", (0.92, 0.44, 0.12, 1.0), 0.42, spec=0.25)

    # Slot 4: Hojitas de azucar pequeñas en cogollos
    mats['sugar_leaf'] = make_mat("Mat_Cannabis_SugarLeaf", (0.16, 0.42, 0.18, 1.0), 0.34, spec=0.35)

    # Slot 5: Cotiledones (verde claro redondeado para etapa 1)
    mats['cotyledon'] = make_mat("Mat_Cannabis_Cotyledon", (0.25, 0.48, 0.15, 1.0), 0.35)

    return mats

def assign_plant_material_slots(obj, mats):
    obj.data.materials.append(mats['leaf'])        # 0
    obj.data.materials.append(mats['cane'])        # 1
    obj.data.materials.append(mats['calyx'])       # 2
    obj.data.materials.append(mats['pistil'])      # 3
    obj.data.materials.append(mats['sugar_leaf'])  # 4
    obj.data.materials.append(mats['cotyledon'])   # 5

def build_segmented_cane(bm, points, rad_base, rad_tip, mat_idx=1):
    """Construye un tallo o rama cilindrica segmentada a traves de una lista de puntos 3D."""
    steps = len(points) - 1
    rings = []
    up_v = Vector((0, 0, 1))

    for s in range(len(points)):
        frac = s / float(steps)
        r = rad_base * (1.0 - frac) + rad_tip * frac
        pos = points[s]

        if s < steps:
            seg_dir = (points[s + 1] - pos).normalized()
        else:
            seg_dir = (pos - points[s - 1]).normalized()

        seg_side = seg_dir.cross(up_v).normalized() if abs(seg_dir.z) < 0.9 else seg_dir.cross(Vector((1, 0, 0))).normalized()
        seg_up = seg_side.cross(seg_dir).normalized()

        ring = []
        for a_idx in range(8):
            ang = a_idx * (2.0 * math.pi / 8.0)
            offset = seg_side * (r * math.cos(ang)) + seg_up * (r * math.sin(ang))
            ring.append(bm.verts.new(pos + offset))
        rings.append(ring)

    for s in range(steps):
        for a_idx in range(8):
            n_idx = (a_idx + 1) % 8
            v1 = rings[s][a_idx]
            v2 = rings[s + 1][a_idx]
            v3 = rings[s + 1][n_idx]
            v4 = rings[s][n_idx]
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = mat_idx
                f.smooth = True
            except ValueError:
                pass

def add_cannabis_fan_leaf(bm, origin, direction, num_leaflets=7, scale=1.0, petiole_len=0.14, bend_curve=1.0, uv_layer=None):
    """
    Agrega una hoja palmeada completa orientada en el espacio.
    - num_leaflets: 3, 5 o 7 foliolos segun la etapa/altura.
    """
    dir_fwd = direction.normalized()
    up_v = Vector((0, 0, 1))
    side_vec = dir_fwd.cross(up_v).normalized()
    nor_v = side_vec.cross(dir_fwd).normalized()

    # 1. Peciolo
    p_steps = 6
    p_pts = []
    for s in range(p_steps + 1):
        u = s / float(p_steps)
        reach = (u ** 0.95) * (petiole_len * scale)
        arch_z = (0.18 * math.sin(u * math.pi * 0.5) - 0.08 * (u ** 1.5)) * (petiole_len * scale)
        p_pts.append(origin + dir_fwd * reach + up_v * arch_z)

    build_segmented_cane(bm, p_pts, rad_base=0.0040 * scale, rad_tip=0.0025 * scale, mat_idx=1)

    # 2. Verticilo de foliolos
    junction_pt = p_pts[-1]
    tip_dir = (p_pts[-1] - p_pts[-2]).normalized()
    tip_side = tip_dir.cross(up_v).normalized()
    tip_up = tip_side.cross(tip_dir).normalized()

    if num_leaflets == 7:
        spec = [
            (  0.0, 1.00, 1.05),
            ( 26.0, 0.85, 1.00),
            (-26.0, 0.85, 1.00),
            ( 54.0, 0.64, 0.95),
            (-54.0, 0.64, 0.95),
            ( 82.0, 0.40, 0.85),
            (-82.0, 0.40, 0.85),
        ]
    elif num_leaflets == 5:
        spec = [
            (  0.0, 1.00, 1.00),
            ( 30.0, 0.82, 0.95),
            (-30.0, 0.82, 0.95),
            ( 62.0, 0.55, 0.88),
            (-62.0, 0.55, 0.88),
        ]
    else: # 3 foliolos
        spec = [
            (  0.0, 1.00, 0.95),
            ( 35.0, 0.72, 0.88),
            (-35.0, 0.72, 0.88),
        ]

    for ang_deg, f_scale, b_factor in spec:
        rad_ang = math.radians(ang_deg)
        f_dir = (tip_dir * math.cos(rad_ang) + tip_side * math.sin(rad_ang)).normalized()
        f_dir = (f_dir + tip_up * (-0.08 * abs(math.sin(rad_ang)))).normalized()
        f_up = tip_up

        from make_leaf import append_cannabis_leaflet
        append_cannabis_leaflet(
            bm=bm,
            origin=junction_pt,
            direction=f_dir,
            up_normal=f_up,
            scale=scale * f_scale,
            uv_layer=uv_layer,
            mat_leaf_idx=0,
            mat_petiole_idx=1,
            bend_curve=bend_curve * b_factor
        )

def add_bud_cola(bm, origin, direction, length=0.15, radius=0.035, density_tiers=6):
    """Agrega una cola floral resinosa con calices y pistilos ambar."""
    from make_bud import add_calyx_bract, add_curling_pistils, add_sugar_leaf

    dir_fwd = direction.normalized()
    up_ref = Vector((0, 0, 1)) if abs(dir_fwd.z) < 0.9 else Vector((1, 0, 0))
    side_u = dir_fwd.cross(up_ref).normalized()
    side_v = side_u.cross(dir_fwd).normalized()

    # Eje central de la flor
    stem_pts = [origin + dir_fwd * (length * (s / float(density_tiers))) for s in range(density_tiers + 1)]
    build_segmented_cane(bm, stem_pts, rad_base=0.005, rad_tip=0.002, mat_idx=1)

    for tier in range(density_tiers):
        t_frac = tier / float(density_tiers)
        z_pos = origin + dir_fwd * (length * (0.10 + t_frac * 0.85))
        tier_rad = radius * (1.0 - t_frac * 0.45) * (0.8 + 0.4 * math.sin(t_frac * math.pi))
        num_calyx = 5

        for c_idx in range(num_calyx):
            ang = tier * 1.35 + c_idx * (2.0 * math.pi / num_calyx)
            c_dir = (side_u * math.cos(ang) + side_v * math.sin(ang) + dir_fwd * 0.3).normalized()
            c_orig = z_pos + (side_u * math.cos(ang) + side_v * math.sin(ang)) * 0.006

            tip, fwd = add_calyx_bract(
                bm=bm,
                origin=c_orig,
                direction=c_dir,
                radius=tier_rad * 0.38,
                length=tier_rad * 0.95,
                mat_idx=2
            )
            add_curling_pistils(bm, tip, fwd, length=tier_rad * 0.70, mat_idx=3)

            # Hojitas de azucar
            if c_idx % 2 == 0:
                s_dir = (c_dir - dir_fwd * 0.2).normalized()
                add_sugar_leaf(
                    bm=bm,
                    origin=c_orig + c_dir * 0.010,
                    direction=s_dir,
                    length=tier_rad * 1.4,
                    width=tier_rad * 0.4,
                    mat_idx=4
                )

# ==========================================
# GENERADORES DE ETAPAS (1 a 5)
# ==========================================

def build_stage1_germination(mats):
    """Etapa 1: Germinacion (Plantula con cotiledones y primer par de hojas verdaderas)."""
    mesh = bpy.data.meshes.new("Hemp_1_Mesh")
    obj = bpy.data.objects.new("Hemp_1", mesh)
    assign_plant_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Tallito inicial
    stem_pts = [Vector((0, 0, 0.0)), Vector((0, 0, 0.05)), Vector((0.002, 0, 0.10))]
    build_segmented_cane(bm, stem_pts, rad_base=0.003, rad_tip=0.002, mat_idx=1)

    # Cotiledones ovalados opuestos
    for sign in (-1, 1):
        c_orig = Vector((sign * 0.003, 0, 0.08))
        c_dir = Vector((sign * 0.7, 0, 0.3)).normalized()
        c_side = Vector((0, 1, 0))

        # Hoja ovalada carnosa simple
        steps = 5
        cot_pts = []
        for s in range(steps + 1):
            t = s / float(steps)
            w = 0.012 * math.sin(t * math.pi)
            p = c_orig + c_dir * (0.022 * t)
            v_mid = bm.verts.new(p)
            v_r = bm.verts.new(p + c_side * w)
            v_l = bm.verts.new(p - c_side * w)
            cot_pts.append((v_mid, v_r, v_l))

        for s in range(steps):
            f1 = bm.faces.new([cot_pts[s][0], cot_pts[s][1], cot_pts[s + 1][1], cot_pts[s + 1][0]])
            f1.material_index = 5
            f1.smooth = True
            f2 = bm.faces.new([cot_pts[s][0], cot_pts[s + 1][0], cot_pts[s + 1][2], cot_pts[s][2]])
            f2.material_index = 5
            f2.smooth = True

    # Primer par de hojitas verdaderas aserradas a 90 grados
    for sign in (-1, 1):
        add_cannabis_fan_leaf(
            bm=bm,
            origin=Vector((0, sign * 0.003, 0.095)),
            direction=Vector((0, sign * 0.8, 0.4)).normalized(),
            num_leaflets=3,
            scale=0.30,
            petiole_len=0.035,
            bend_curve=0.8,
            uv_layer=uv_layer
        )

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage2_vegetative_early(mats):
    """Etapa 2: Vegetativo temprano (Caña corta con 2 nudos y pares de hojas de 3 y 5 foliolos)."""
    mesh = bpy.data.meshes.new("Hemp_2_Mesh")
    obj = bpy.data.objects.new("Hemp_2", mesh)
    assign_plant_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    cane_pts = [
        Vector((0.00, 0.00, 0.00)),
        Vector((0.01, 0.00, 0.12)),
        Vector((-0.01, 0.01, 0.24)),
        Vector((0.00, 0.00, 0.36)),
    ]
    build_segmented_cane(bm, cane_pts, rad_base=0.006, rad_tip=0.003, mat_idx=1)

    # Nudo 1 (z = 0.14): par opuesto de 3 foliolos
    add_cannabis_fan_leaf(bm, Vector((0, -0.01, 0.14)), Vector((-0.7, -0.7, 0.1)), num_leaflets=3, scale=0.55, petiole_len=0.08, uv_layer=uv_layer)
    add_cannabis_fan_leaf(bm, Vector((0,  0.01, 0.14)), Vector(( 0.7,  0.7, 0.1)), num_leaflets=3, scale=0.55, petiole_len=0.08, uv_layer=uv_layer)

    # Nudo 2 (z = 0.26): par perpendicular de 5 foliolos
    add_cannabis_fan_leaf(bm, Vector((-0.01, 0, 0.26)), Vector((-0.7,  0.7, 0.2)), num_leaflets=5, scale=0.75, petiole_len=0.10, uv_layer=uv_layer)
    add_cannabis_fan_leaf(bm, Vector(( 0.01, 0, 0.26)), Vector(( 0.7, -0.7, 0.2)), num_leaflets=5, scale=0.75, petiole_len=0.10, uv_layer=uv_layer)

    # Apice apical (hojita terminal)
    add_cannabis_fan_leaf(bm, Vector((0, 0, 0.35)), Vector((0.2, 0.2, 0.9)), num_leaflets=3, scale=0.45, petiole_len=0.04, uv_layer=uv_layer)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage3_structure(mats):
    """Etapa 3: Estructura vegetativa desarrollada (Caña alta segmentada, ramas laterales, hojas de 5 y 7 foliolos)."""
    mesh = bpy.data.meshes.new("Hemp_3_Mesh")
    obj = bpy.data.objects.new("Hemp_3", mesh)
    assign_plant_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    cane_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.18)),
        Vector((-0.01,  0.01, 0.38)),
        Vector(( 0.01,  0.00, 0.58)),
        Vector(( 0.00,  0.00, 0.76)),
    ]
    build_segmented_cane(bm, cane_pts, rad_base=0.009, rad_tip=0.004, mat_idx=1)

    # Ramas laterales y verticilos foliares
    fan_specs = [
        # Nivel bajo (z ~ 0.20): 5 foliolos
        (Vector((-0.01, -0.01, 0.20)), Vector((-0.75, -0.55, 0.05)), 5, 0.85, 0.12),
        (Vector(( 0.01,  0.01, 0.20)), Vector(( 0.75,  0.55, 0.05)), 5, 0.85, 0.12),
        # Nivel medio (z ~ 0.40): 7 foliolos exuberantes
        (Vector((-0.01,  0.01, 0.40)), Vector((-0.60,  0.72, 0.12)), 7, 1.00, 0.14),
        (Vector(( 0.01, -0.01, 0.40)), Vector(( 0.60, -0.72, 0.12)), 7, 1.00, 0.14),
        # Nivel sub-apical (z ~ 0.60): 5 y 7 foliolos
        (Vector(( 0.01,  0.01, 0.60)), Vector(( 0.72, -0.35, 0.15)), 5, 0.90, 0.11),
        (Vector((-0.01, -0.01, 0.60)), Vector((-0.72,  0.35, 0.15)), 5, 0.90, 0.11),
        # Corona superior
        (Vector(( 0.00,  0.01, 0.72)), Vector(( 0.30,  0.60, 0.45)), 5, 0.75, 0.08),
        (Vector(( 0.00, -0.01, 0.74)), Vector((-0.30, -0.60, 0.45)), 5, 0.75, 0.08),
    ]

    for p_orig, p_dir, n_leaf, sc, p_len in fan_specs:
        add_cannabis_fan_leaf(bm, p_orig, p_dir, num_leaflets=n_leaf, scale=sc, petiole_len=p_len, uv_layer=uv_layer)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage4_flowering(mats):
    """Etapa 4: Floracion inicial / media (Cogollos formandose en nudos y punta apical con pistilos)."""
    mesh = bpy.data.meshes.new("Hemp_4_Mesh")
    obj = bpy.data.objects.new("Hemp_4", mesh)
    assign_plant_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    cane_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.22)),
        Vector((-0.01,  0.01, 0.46)),
        Vector(( 0.01, -0.01, 0.72)),
        Vector(( 0.00,  0.00, 1.02)),
    ]
    build_segmented_cane(bm, cane_pts, rad_base=0.011, rad_tip=0.004, mat_idx=1)

    # Follaje abundante
    leaves = [
        (Vector((-0.01, -0.01, 0.26)), Vector((-0.78, -0.45, 0.05)), 5, 0.90, 0.12),
        (Vector(( 0.01,  0.01, 0.26)), Vector(( 0.78,  0.45, 0.05)), 5, 0.90, 0.12),
        (Vector((-0.01,  0.01, 0.50)), Vector((-0.55,  0.75, 0.10)), 7, 1.05, 0.14),
        (Vector(( 0.01, -0.01, 0.50)), Vector(( 0.55, -0.75, 0.10)), 7, 1.05, 0.14),
        (Vector(( 0.01,  0.01, 0.76)), Vector(( 0.70, -0.38, 0.15)), 7, 0.95, 0.13),
        (Vector((-0.01, -0.01, 0.76)), Vector((-0.70,  0.38, 0.15)), 7, 0.95, 0.13),
        (Vector(( 0.00,  0.01, 0.90)), Vector(( 0.35,  0.65, 0.35)), 5, 0.80, 0.10),
        (Vector(( 0.00, -0.01, 0.92)), Vector((-0.35, -0.65, 0.35)), 5, 0.80, 0.10),
    ]
    for p_orig, p_dir, n_leaf, sc, p_len in leaves:
        add_cannabis_fan_leaf(bm, p_orig, p_dir, num_leaflets=n_leaf, scale=sc, petiole_len=p_len, uv_layer=uv_layer)

    # Cogollos axilares medianos y cola apical en desarrollo (Etapa 4)
    stage4_colas = [
        # Nivel medio (z ~ 0.50 - 0.55)
        (Vector((-0.04,  0.02, 0.52)), Vector((-0.55,  0.55, 0.60)), 0.09, 0.026, 4),
        (Vector(( 0.04, -0.02, 0.52)), Vector(( 0.55, -0.55, 0.60)), 0.09, 0.026, 4),
        (Vector((-0.02, -0.03, 0.62)), Vector((-0.40, -0.60, 0.65)), 0.09, 0.026, 4),
        (Vector(( 0.02,  0.03, 0.62)), Vector(( 0.40,  0.60, 0.65)), 0.09, 0.026, 4),
        # Nivel alto (z ~ 0.75 - 0.82)
        (Vector(( 0.03,  0.03, 0.78)), Vector(( 0.60, -0.30, 0.70)), 0.11, 0.030, 5),
        (Vector((-0.03, -0.03, 0.78)), Vector((-0.60,  0.30, 0.70)), 0.11, 0.030, 5),
        (Vector((-0.03,  0.03, 0.85)), Vector((-0.45,  0.55, 0.70)), 0.10, 0.028, 5),
        (Vector(( 0.03, -0.03, 0.85)), Vector(( 0.45, -0.55, 0.70)), 0.10, 0.028, 5),
    ]
    for c_orig, c_dir, c_len, c_rad, c_tiers in stage4_colas:
        add_bud_cola(bm, c_orig, c_dir, length=c_len, radius=c_rad, density_tiers=c_tiers)

    # Cola apical principal en desarrollo
    add_bud_cola(bm, Vector((0.00, 0.00, 0.94)), Vector((0.05, 0.05, 1.0)), length=0.15, radius=0.038, density_tiers=7)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage5_master_plant(mats):
    """
    Etapa 5: Floracion Plena / Cosecha Madura (Hemp_5):
    - Gran caña erecta de ~1.25m con estructura ramificada.
    - Magnífica cola apical principal frotada y gruesa (la corona resinosa).
    - 4 colas sub-apicales superiores rodeando el cogollo central.
    - 8 colas laterales robustas en ramas medias y altas apuntando hacia los 4 cuadrantes.
    - 6 cogollos axilares satélite (nugs) en los nudos del tallo.
    - Gran cantidad de hojas palmeadas de 7 folíolos en cascada exuberante.
    """
    mesh = bpy.data.meshes.new("Hemp_5_Mesh")
    obj = bpy.data.objects.new("Hemp_5", mesh)
    assign_plant_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Caña central robusta
    cane_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.01, 0.25)),
        Vector((-0.01,  0.02, 0.52)),
        Vector(( 0.02, -0.01, 0.80)),
        Vector((-0.01,  0.01, 1.05)),
        Vector(( 0.00,  0.00, 1.25)),
    ]
    build_segmented_cane(bm, cane_pts, rad_base=0.013, rad_tip=0.005, mat_idx=1)

    # Follaje completo en 4 niveles cardinales
    foliage_leaves = [
        # --- Nivel 1 (Bajo z ~ 0.30 - 0.35) ---
        (Vector((-0.02, -0.02, 0.30)), Vector((-0.82, -0.42, 0.05)), 7, 1.15, 0.16, 1.15),
        (Vector(( 0.02,  0.02, 0.32)), Vector(( 0.82,  0.42, 0.05)), 7, 1.15, 0.16, 1.15),
        (Vector(( 0.02, -0.02, 0.36)), Vector(( 0.45, -0.80, 0.08)), 7, 1.10, 0.15, 1.10),
        (Vector((-0.02,  0.02, 0.38)), Vector((-0.45,  0.80, 0.08)), 7, 1.10, 0.15, 1.10),

        # --- Nivel 2 (Medio z ~ 0.55 - 0.65) ---
        (Vector((-0.02, -0.01, 0.58)), Vector((-0.80, -0.35, 0.12)), 7, 1.20, 0.17, 1.20),
        (Vector(( 0.02,  0.01, 0.60)), Vector(( 0.80,  0.35, 0.12)), 7, 1.20, 0.17, 1.20),
        (Vector((-0.01,  0.02, 0.65)), Vector((-0.35,  0.82, 0.14)), 7, 1.15, 0.16, 1.15),
        (Vector(( 0.01, -0.02, 0.67)), Vector(( 0.35, -0.82, 0.14)), 7, 1.15, 0.16, 1.15),

        # --- Nivel 3 (Alto z ~ 0.85 - 0.95) ---
        (Vector((-0.01, -0.01, 0.88)), Vector((-0.72, -0.45, 0.18)), 7, 1.05, 0.15, 1.05),
        (Vector(( 0.01,  0.01, 0.90)), Vector(( 0.72,  0.45, 0.18)), 7, 1.05, 0.15, 1.05),
        (Vector(( 0.01, -0.01, 0.94)), Vector(( 0.48, -0.72, 0.20)), 7, 1.00, 0.14, 1.00),
        (Vector((-0.01,  0.01, 0.96)), Vector((-0.48,  0.72, 0.20)), 7, 1.00, 0.14, 1.00),

        # --- Nivel 4 (Corona Sub-Apical z ~ 1.08 - 1.15) ---
        (Vector((-0.01,  0.00, 1.08)), Vector((-0.65,  0.25, 0.28)), 5, 0.88, 0.12, 0.90),
        (Vector(( 0.01,  0.00, 1.10)), Vector(( 0.65, -0.25, 0.28)), 5, 0.88, 0.12, 0.90),
        (Vector(( 0.00,  0.01, 1.14)), Vector(( 0.25,  0.65, 0.32)), 5, 0.82, 0.11, 0.90),
        (Vector(( 0.00, -0.01, 1.16)), Vector((-0.25, -0.65, 0.32)), 5, 0.82, 0.11, 0.90),
    ]

    for p_orig, p_dir, n_leaf, sc, p_len, b_curve in foliage_leaves:
        add_cannabis_fan_leaf(
            bm=bm,
            origin=p_orig,
            direction=p_dir,
            num_leaflets=n_leaf,
            scale=sc,
            petiole_len=p_len,
            bend_curve=b_curve,
            uv_layer=uv_layer
        )

    # 1. Colas Laterales Medias-Bajas (4 colas principales a z ~ 0.65 - 0.75)
    lower_mid_colas = [
        (Vector((-0.10, -0.06, 0.66)), Vector((-0.60, -0.40, 0.65)), 0.13, 0.034),
        (Vector(( 0.10,  0.06, 0.70)), Vector(( 0.60,  0.40, 0.65)), 0.13, 0.034),
        (Vector((-0.07,  0.09, 0.72)), Vector((-0.45,  0.60, 0.65)), 0.13, 0.033),
        (Vector(( 0.07, -0.09, 0.74)), Vector(( 0.45, -0.60, 0.65)), 0.13, 0.033),
    ]
    for c_orig, c_dir, c_len, c_rad in lower_mid_colas:
        add_bud_cola(bm, c_orig, c_dir, length=c_len, radius=c_rad, density_tiers=6)

    # 2. Colas Laterales Medias-Altas (4 colas robustas a z ~ 0.88 - 0.96)
    upper_mid_colas = [
        (Vector((-0.08, -0.05, 0.88)), Vector((-0.55, -0.45, 0.70)), 0.14, 0.036),
        (Vector(( 0.08,  0.05, 0.90)), Vector(( 0.55,  0.45, 0.70)), 0.14, 0.036),
        (Vector((-0.06,  0.08, 0.93)), Vector((-0.45,  0.55, 0.70)), 0.14, 0.036),
        (Vector(( 0.06, -0.08, 0.95)), Vector(( 0.45, -0.55, 0.70)), 0.14, 0.036),
    ]
    for c_orig, c_dir, c_len, c_rad in upper_mid_colas:
        add_bud_cola(bm, c_orig, c_dir, length=c_len, radius=c_rad, density_tiers=6)

    # 3. Colas Sub-Apicales (4 colas compactas rodeando la corona apical a z ~ 1.05 - 1.10)
    sub_apical_colas = [
        (Vector((-0.04, -0.04, 1.06)), Vector((-0.45, -0.45, 0.75)), 0.12, 0.033),
        (Vector(( 0.04,  0.04, 1.07)), Vector(( 0.45,  0.45, 0.75)), 0.12, 0.033),
        (Vector((-0.04,  0.04, 1.09)), Vector((-0.45,  0.45, 0.75)), 0.12, 0.033),
        (Vector(( 0.04, -0.04, 1.10)), Vector(( 0.45, -0.45, 0.75)), 0.12, 0.033),
    ]
    for c_orig, c_dir, c_len, c_rad in sub_apical_colas:
        add_bud_cola(bm, c_orig, c_dir, length=c_len, radius=c_rad, density_tiers=5)

    # 4. Cogollos Axilares Satelite / Nugs en los nudos del tallo
    nodal_nugs = [
        (Vector((-0.03, -0.01, 0.46)), Vector((-0.7, -0.4, 0.4)), 0.075, 0.026),
        (Vector(( 0.03,  0.01, 0.48)), Vector(( 0.7,  0.4, 0.4)), 0.075, 0.026),
        (Vector(( 0.01, -0.03, 0.54)), Vector(( 0.4, -0.7, 0.4)), 0.070, 0.025),
        (Vector((-0.01,  0.03, 0.56)), Vector((-0.4,  0.7, 0.4)), 0.070, 0.025),
        (Vector((-0.02, -0.02, 0.80)), Vector((-0.6, -0.5, 0.5)), 0.080, 0.028),
        (Vector(( 0.02,  0.02, 0.82)), Vector(( 0.6,  0.5, 0.5)), 0.080, 0.028),
    ]
    for c_orig, c_dir, c_len, c_rad in nodal_nugs:
        add_bud_cola(bm, c_orig, c_dir, length=c_len, radius=c_rad, density_tiers=4)

    # 5. Gran Cola Apical Principal (La gran corona resinosa)
    add_bud_cola(
        bm=bm,
        origin=Vector((0.0, 0.0, 1.12)),
        direction=Vector((0.02, 0.02, 1.0)),
        length=0.22,
        radius=0.052,
        density_tiers=9
    )

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0010
    sol_mod.offset = 0.0

    return obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\plant_cannabis.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando construccion y guardado de las 5 etapas de Cannabis (HEMP.blend)...\n")

        scene = setup_plant_scene()
        mats = create_plant_materials()

        # Construir las 5 etapas
        obj_stage1 = build_stage1_germination(mats)
        obj_stage2 = build_stage2_vegetative_early(mats)
        obj_stage3 = build_stage3_structure(mats)
        obj_stage4 = build_stage4_flowering(mats)
        obj_stage5 = build_stage5_master_plant(mats)

        stages_map = {
            "stage1": obj_stage1,
            "stage2": obj_stage2,
            "stage3": obj_stage3,
            "stage4": obj_stage4,
            "stage5": obj_stage5,
        }

        # Organizar en colecciones stage1..stage5
        for col_name, obj in stages_map.items():
            col = bpy.data.collections.get(col_name)
            if not col:
                col = bpy.data.collections.new(col_name)
                bpy.context.scene.collection.children.link(col)
            # Asegurar que el objeto este en su coleccion
            if obj.name not in col.objects:
                col.objects.link(obj)
            # Desvincular de la coleccion principal si esta duplicado
            if obj.name in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.unlink(obj)

        # Para el render de vista previa isometrica de Stage 5, ocultar stage 1..4 del viewport/render
        for col_name in ["stage1", "stage2", "stage3", "stage4"]:
            col = bpy.data.collections.get(col_name)
            if col:
                col.hide_render = True
                col.hide_viewport = True

        col5 = bpy.data.collections.get("stage5")
        if col5:
            col5.hide_render = False
            col5.hide_viewport = False

        blend_file = os.path.abspath(r"assets-src/crops/HEMP.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        # Renderizar vistas previas raw de las 5 etapas completas
        stage_names = ["stage1", "stage2", "stage3", "stage4", "stage5"]
        out_raw_files = []

        for stage_idx, col_key in enumerate(stage_names, start=1):
            for c_name in stage_names:
                c_obj = bpy.data.collections.get(c_name)
                if c_obj:
                    is_active = (c_name == col_key)
                    c_obj.hide_render = not is_active
                    c_obj.hide_viewport = not is_active

            raw_path = os.path.abspath(os.path.join(r"scripts/out", f"cartoon_cannabis_stage{stage_idx}_raw.png"))
            os.makedirs(os.path.dirname(raw_path), exist_ok=True)
            scene.render.filepath = raw_path
            bpy.ops.render.render(write_still=True)
            out_raw_files.append(raw_path)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Cultivo HEMP.blend y Renders Raw de las 5 Etapas completados con exito.\n")
            f.write(f"Blend: {blend_file}\n")
            for r in out_raw_files:
                f.write(f"  Raw: {r}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
