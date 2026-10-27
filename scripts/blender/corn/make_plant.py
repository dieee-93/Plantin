import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

# Asegurar que el directorio local este en sys.path para importar componentes
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

def setup_plant_scene():
    """Configura la escena con iluminacion toon botanica e isometrica dimetrica estandar (Plantin 2:1)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonCornPlantWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 0.22

    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.4
    sun_data.color = (1.0, 0.98, 0.93)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(48), math.radians(16), math.radians(40))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.85
    fill_data.color = (0.84, 0.90, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-22), math.radians(-140))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.1
    rim_data.color = (0.95, 1.0, 0.90)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-38), math.radians(22), math.radians(150))

    cam_data = bpy.data.cameras.new(name="IsoPlantCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 1.92
    cam_obj = bpy.data.objects.new(name="IsoPlantCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.rotation_euler = (math.radians(58), 0, math.radians(45))
    rot_mat = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = rot_mat @ Vector((0, 0, 10.0)) + Vector((0, 0, 0.70))

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

def create_corn_plant_materials():
    """Crea los materiales PBR toon para la planta de maiz completa."""
    from make_leaf import create_corn_leaf_material
    from make_ear import create_ear_materials
    from make_tassel import create_tassel_materials

    mats = {}
    mats['leaf'] = create_corn_leaf_material()

    def make_mat(name, color, roughness, spec=0.3):
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
        return mat

    # Cana/tallo de maiz (verde cana fresco con nudos marcados)
    mats['stalk'] = make_mat("Mat_Corn_Stalk", (0.24, 0.48, 0.18, 1.0), 0.36)
    # Raices fulcreas / adventicias (purpura-rojizo amarronado tipico de la base del maiz)
    mats['brace_root'] = make_mat("Mat_Corn_BraceRoot", (0.42, 0.22, 0.16, 1.0), 0.45)

    ear_mats = create_ear_materials()
    mats['kernel'] = ear_mats['kernel']
    mats['husk'] = ear_mats['husk']
    mats['silk'] = ear_mats['silk']
    mats['shank'] = ear_mats['shank']

    tassel_mats = create_tassel_materials()
    mats['tassel_rachis'] = tassel_mats['rachis']
    mats['tassel_anther'] = tassel_mats['anther']

    return mats

def assign_corn_material_slots(obj, mats):
    obj.data.materials.append(mats['leaf'])           # 0
    obj.data.materials.append(mats['stalk'])          # 1
    obj.data.materials.append(mats['brace_root'])     # 2
    obj.data.materials.append(mats['kernel'])         # 3
    obj.data.materials.append(mats['husk'])           # 4
    obj.data.materials.append(mats['silk'])           # 5
    obj.data.materials.append(mats['shank'])          # 6
    obj.data.materials.append(mats['tassel_rachis'])  # 7
    obj.data.materials.append(mats['tassel_anther'])  # 8

def build_corn_stalk(bm, points, rad_base, rad_tip, mat_idx=1):
    """Construye la caña de maiz con engrosamiento en los nudos."""
    steps = len(points) - 1
    rings = []
    up_v = Vector((0, 0, 1))

    for s in range(len(points)):
        frac = s / float(steps)
        r = rad_base * (1.0 - frac) + rad_tip * frac
        # Nudos ligeramente engrosados
        if 0 < s < steps:
            r *= 1.10
        pos = points[s]

        if s < steps:
            seg_dir = (points[s + 1] - pos).normalized()
        else:
            seg_dir = (pos - points[s - 1]).normalized()

        seg_side = seg_dir.cross(up_v).normalized() if abs(seg_dir.z) < 0.9 else seg_dir.cross(Vector((1, 0, 0))).normalized()
        seg_up = seg_side.cross(seg_dir).normalized()

        ring = []
        for a in range(8):
            ang = a * (2.0 * math.pi / 8.0)
            offset = seg_side * (r * math.cos(ang)) + seg_up * (r * math.sin(ang))
            ring.append(bm.verts.new(pos + offset))
        rings.append(ring)

    for s in range(steps):
        for a in range(8):
            na = (a + 1) % 8
            try:
                f = bm.faces.new([rings[s][a], rings[s + 1][a], rings[s + 1][na], rings[s][na]])
                f.material_index = mat_idx
                f.smooth = True
            except ValueError:
                pass

def add_brace_roots(bm, origin_z, num_roots=8, radius=0.07, mat_idx=2):
    """Agrega las raices fulcreas o de anclaje tipicas de la base del tallo de maiz."""
    for i in range(num_roots):
        ang = i * (2.0 * math.pi / num_roots) + 0.15
        dir_h = Vector((math.cos(ang), math.sin(ang), 0)).normalized()
        start = Vector((dir_h.x * 0.016, dir_h.y * 0.016, origin_z))
        end = Vector((dir_h.x * radius, dir_h.y * radius, 0.002))

        # Arco hacia el suelo
        steps = 4
        prev_p = start
        r_thick = 0.0035
        for s in range(1, steps + 1):
            t = s / float(steps)
            curr_p = start * (1.0 - t) + end * t + Vector((0, 0, 0.008 * math.sin(t * math.pi)))
            seg_d = (curr_p - prev_p).normalized()
            seg_side = seg_d.cross(Vector((0, 0, 1))).normalized()

            v1 = bm.verts.new(prev_p - seg_side * r_thick)
            v2 = bm.verts.new(prev_p + seg_side * r_thick)
            v3 = bm.verts.new(curr_p + seg_side * r_thick)
            v4 = bm.verts.new(curr_p - seg_side * r_thick)
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = mat_idx
                f.smooth = True
            except ValueError:
                pass
            prev_p = curr_p

# ==========================================
# GENERADORES DE ETAPAS (Corn_1 a Corn_5)
# ==========================================

def build_stage1_germination(mats):
    """Etapa 1: Germinacion (Plantula de maiz con coleoptilo y primeras hojitas lanceoladas)."""
    from make_leaf import append_corn_leaf

    mesh = bpy.data.meshes.new("Corn_1_Mesh")
    obj = bpy.data.objects.new("Corn_1", mesh)
    assign_corn_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    stem_pts = [Vector((0, 0, 0.0)), Vector((0, 0, 0.05)), Vector((0.002, 0, 0.10))]
    build_corn_stalk(bm, stem_pts, rad_base=0.004, rad_tip=0.0025, mat_idx=1)

    # 2 hojitas iniciales erectas
    append_corn_leaf(bm, Vector((0, 0, 0.05)), Vector((-0.7, -0.2, 0.6)), length=0.14, width=0.026, arch_factor=0.6, uv_layer=uv_layer, mat_idx=0)
    append_corn_leaf(bm, Vector((0, 0, 0.07)), Vector(( 0.7,  0.2, 0.6)), length=0.18, width=0.028, arch_factor=0.7, uv_layer=uv_layer, mat_idx=0)
    append_corn_leaf(bm, Vector((0, 0, 0.09)), Vector(( 0.1, -0.4, 0.9)), length=0.12, width=0.022, arch_factor=0.5, uv_layer=uv_layer, mat_idx=0)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage2_vegetative_early(mats):
    """Etapa 2: Vegetativo temprano (Caña corta con 4-5 hojas dísticas alternadas)."""
    from make_leaf import append_corn_leaf

    mesh = bpy.data.meshes.new("Corn_2_Mesh")
    obj = bpy.data.objects.new("Corn_2", mesh)
    assign_corn_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    stalk_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.005, 0.00, 0.12)),
        Vector((-0.005, 0.00, 0.24)),
        Vector(( 0.00,  0.00, 0.38)),
    ]
    build_corn_stalk(bm, stalk_pts, rad_base=0.008, rad_tip=0.004, mat_idx=1)

    # Hojas disticas opuestas alternadas (longitudes calibradas y proporcionadas)
    leaf_configs = [
        (Vector(( 0.00,  0.00, 0.10)), Vector((-0.85, -0.25, 0.3)), 0.26, 0.046, 0.85),
        (Vector(( 0.00,  0.00, 0.18)), Vector(( 0.85,  0.25, 0.3)), 0.30, 0.050, 0.90),
        (Vector((-0.00,  0.00, 0.26)), Vector((-0.75, -0.35, 0.4)), 0.34, 0.054, 0.95),
        (Vector(( 0.00,  0.00, 0.32)), Vector(( 0.75,  0.35, 0.4)), 0.33, 0.052, 0.90),
        (Vector(( 0.00,  0.00, 0.37)), Vector((-0.20,  0.40, 0.8)), 0.24, 0.038, 0.65),
    ]

    for orig, d_fwd, l_len, l_w, a_fac in leaf_configs:
        append_corn_leaf(bm, orig, d_fwd, length=l_len, width=l_w, arch_factor=a_fac, uv_layer=uv_layer, mat_idx=0)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage3_structure(mats):
    """Etapa 3: Estructura vegetativa completa (Caña alta segmentada, raices fulcreas y amplio follaje)."""
    from make_leaf import append_corn_leaf

    mesh = bpy.data.meshes.new("Corn_3_Mesh")
    obj = bpy.data.objects.new("Corn_3", mesh)
    assign_corn_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    stalk_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.005, 0.20)),
        Vector((-0.01,  0.005, 0.42)),
        Vector(( 0.01, -0.005, 0.64)),
        Vector(( 0.00,  0.00,  0.86)),
    ]
    build_corn_stalk(bm, stalk_pts, rad_base=0.013, rad_tip=0.005, mat_idx=1)

    # Raices fulcreas en la base
    add_brace_roots(bm, origin_z=0.04, num_roots=8, radius=0.065, mat_idx=2)

    # Hojas disticas frondosas en dos planos opuestos (mas compactas y proporcionadas)
    leaves = [
        (Vector(( 0.00,  0.00, 0.16)), Vector((-0.88, -0.22, 0.20)), 0.38, 0.068, 1.05),
        (Vector(( 0.00,  0.00, 0.28)), Vector(( 0.88,  0.22, 0.20)), 0.43, 0.074, 1.10),
        (Vector((-0.00,  0.00, 0.40)), Vector((-0.85, -0.28, 0.25)), 0.48, 0.078, 1.10),
        (Vector(( 0.00,  0.00, 0.52)), Vector(( 0.85,  0.28, 0.25)), 0.49, 0.080, 1.05),
        (Vector((-0.00,  0.00, 0.64)), Vector((-0.75, -0.32, 0.35)), 0.46, 0.074, 1.00),
        (Vector(( 0.00,  0.00, 0.74)), Vector(( 0.75,  0.32, 0.35)), 0.41, 0.068, 0.90),
        (Vector(( 0.00,  0.00, 0.84)), Vector((-0.20,  0.40, 0.75)), 0.30, 0.050, 0.70),
    ]

    for orig, d_fwd, l_len, l_w, a_fac in leaves:
        append_corn_leaf(bm, orig, d_fwd, length=l_len, width=l_w, arch_factor=a_fac, uv_layer=uv_layer, mat_idx=0)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage4_flowering(mats):
    """Etapa 4: Floracion (Panoja apical masculina abierta y mazorcas jovenes con barbas emergiendo)."""
    from make_leaf import append_corn_leaf
    from make_ear import append_corn_ear
    from make_tassel import append_corn_tassel

    mesh = bpy.data.meshes.new("Corn_4_Mesh")
    obj = bpy.data.objects.new("Corn_4", mesh)
    assign_corn_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    stalk_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.005, 0.25)),
        Vector((-0.01,  0.005, 0.52)),
        Vector(( 0.01, -0.005, 0.80)),
        Vector((-0.005, 0.005, 1.05)),
        Vector(( 0.00,  0.00,  1.26)),
    ]
    build_corn_stalk(bm, stalk_pts, rad_base=0.015, rad_tip=0.005, mat_idx=1)

    # Raices fulcreas
    add_brace_roots(bm, origin_z=0.05, num_roots=10, radius=0.075, mat_idx=2)

    # Hojas completas (longitudes mas compactas y equilibradas)
    leaves = [
        (Vector(( 0.00,  0.00, 0.20)), Vector((-0.88, -0.22, 0.15)), 0.43, 0.075, 1.10),
        (Vector(( 0.00,  0.00, 0.36)), Vector(( 0.88,  0.22, 0.15)), 0.49, 0.080, 1.15),
        (Vector((-0.00,  0.00, 0.52)), Vector((-0.85, -0.28, 0.20)), 0.52, 0.084, 1.10),
        (Vector(( 0.00,  0.00, 0.68)), Vector(( 0.85,  0.28, 0.20)), 0.54, 0.086, 1.10),
        (Vector((-0.00,  0.00, 0.84)), Vector((-0.78, -0.32, 0.28)), 0.49, 0.078, 1.00),
        (Vector(( 0.00,  0.00, 0.98)), Vector(( 0.78,  0.32, 0.28)), 0.44, 0.070, 0.90),
        (Vector((-0.00,  0.00, 1.12)), Vector((-0.65, -0.25, 0.40)), 0.36, 0.058, 0.80),
    ]
    for orig, d_fwd, l_len, l_w, a_fac in leaves:
        append_corn_leaf(bm, orig, d_fwd, length=l_len, width=l_w, arch_factor=a_fac, uv_layer=uv_layer, mat_idx=0)

    # 3 Mazorcas jovenes en desarrollo con sedas frescas en distintos nudos
    # Mazorca 1 (delantera derecha)
    append_corn_ear(
        bm=bm,
        origin=Vector((0.022, 0.015, 0.58)),
        direction=Vector((0.68, 0.28, 0.62)).normalized(),
        length=0.14,
        radius=0.028,
        mat_kernel=3, mat_husk=4, mat_silk=5, mat_shank=6
    )

    # Mazorca 2 (delantera izquierda / lateral)
    append_corn_ear(
        bm=bm,
        origin=Vector((-0.018, 0.020, 0.72)),
        direction=Vector((-0.50, 0.62, 0.60)).normalized(),
        length=0.13,
        radius=0.026,
        mat_kernel=3, mat_husk=4, mat_silk=5, mat_shank=6
    )

    # Mazorca 3 (trasera derecha)
    append_corn_ear(
        bm=bm,
        origin=Vector((0.018, -0.018, 0.86)),
        direction=Vector((0.60, -0.48, 0.64)).normalized(),
        length=0.12,
        radius=0.024,
        mat_kernel=3, mat_husk=4, mat_silk=5, mat_shank=6
    )

    # Panoja apical masculina en la punta de la cana
    append_corn_tassel(bm, Vector((0, 0, 1.26)), scale=0.92, mat_rachis=7, mat_anther=8)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj

def build_stage5_master_plant(mats):
    """
    Etapa 5: Fructificacion Plena / Cosecha Madura (Corn_5 / Corn_4):
    - Caña robusta de ~1.40m con entrenudos marcados y raices fulcreas en la base.
    - 2 Mazorcas doradas maduras prominentes con chalas entreabiertas y barbas ambar cobrizas.
    - Panoja apical dorada masculina coronando la planta.
    - 8 grandes hojas arqueadas en cascada dística con ondulaciones botánicas.
    """
    from make_leaf import append_corn_leaf
    from make_ear import append_corn_ear
    from make_tassel import append_corn_tassel

    mesh = bpy.data.meshes.new("Corn_5_Mesh")
    obj = bpy.data.objects.new("Corn_5", mesh)
    assign_corn_material_slots(obj, mats)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    stalk_pts = [
        Vector(( 0.00,  0.00, 0.00)),
        Vector(( 0.01, -0.005, 0.28)),
        Vector((-0.01,  0.005, 0.58)),
        Vector(( 0.01, -0.005, 0.88)),
        Vector((-0.005, 0.005, 1.15)),
        Vector(( 0.00,  0.00,  1.38)),
    ]
    build_corn_stalk(bm, stalk_pts, rad_base=0.016, rad_tip=0.006, mat_idx=1)

    # Raices fulcreas dobles en dos nudos basales
    add_brace_roots(bm, origin_z=0.04, num_roots=10, radius=0.082, mat_idx=2)
    add_brace_roots(bm, origin_z=0.09, num_roots=8, radius=0.065, mat_idx=2)

    # Follaje maduro suntuoso (hojas laterales mas cortas y equilibradas)
    leaves = [
        (Vector(( 0.00,  0.00, 0.22)), Vector((-0.88, -0.25, 0.12)), 0.48, 0.082, 1.15),
        (Vector(( 0.00,  0.00, 0.38)), Vector(( 0.88,  0.25, 0.12)), 0.53, 0.086, 1.15),
        (Vector((-0.00,  0.00, 0.54)), Vector((-0.85, -0.30, 0.18)), 0.56, 0.088, 1.12),
        (Vector(( 0.00,  0.00, 0.70)), Vector(( 0.85,  0.30, 0.18)), 0.58, 0.090, 1.10),
        (Vector((-0.00,  0.00, 0.88)), Vector((-0.78, -0.34, 0.24)), 0.52, 0.082, 1.05),
        (Vector(( 0.00,  0.00, 1.04)), Vector(( 0.78,  0.34, 0.24)), 0.46, 0.076, 0.95),
        (Vector((-0.00,  0.00, 1.18)), Vector((-0.68, -0.28, 0.35)), 0.38, 0.065, 0.85),
        (Vector(( 0.00,  0.00, 1.28)), Vector(( 0.55,  0.30, 0.45)), 0.32, 0.055, 0.75),
    ]
    for orig, d_fwd, l_len, l_w, a_fac in leaves:
        append_corn_leaf(bm, orig, d_fwd, length=l_len, width=l_w, arch_factor=a_fac, uv_layer=uv_layer, mat_idx=0)

    # 4 Grandes Mazorcas Maduras en los nudos medios-altos
    # 1. Mazorca principal (delantera derecha a z ~ 0.62)
    append_corn_ear(
        bm=bm,
        origin=Vector((0.024, 0.015, 0.62)),
        direction=Vector((0.72, 0.26, 0.60)).normalized(),
        length=0.185,
        radius=0.035,
        mat_kernel=3, mat_husk=4, mat_silk=5, mat_shank=6
    )

    # 2. Mazorca secundaria (delantera izquierda a z ~ 0.76)
    append_corn_ear(
        bm=bm,
        origin=Vector((-0.018, 0.024, 0.76)),
        direction=Vector((-0.55, 0.65, 0.52)).normalized(),
        length=0.175,
        radius=0.033,
        mat_kernel=3, mat_husk=4, mat_silk=5, mat_shank=6
    )

    # 3. Mazorca terciaria (trasera derecha a z ~ 0.90)
    append_corn_ear(
        bm=bm,
        origin=Vector((0.022, -0.018, 0.90)),
        direction=Vector((0.62, -0.45, 0.62)).normalized(),
        length=0.165,
        radius=0.031,
        mat_kernel=3, mat_husk=4, mat_silk=5, mat_shank=6
    )

    # 4. Mazorca cuaternaria (trasera/lateral izquierda a z ~ 0.68)
    append_corn_ear(
        bm=bm,
        origin=Vector((-0.022, -0.016, 0.68)),
        direction=Vector((-0.68, -0.32, 0.58)).normalized(),
        length=0.160,
        radius=0.030,
        mat_kernel=3, mat_husk=4, mat_silk=5, mat_shank=6
    )

    # Panoja apical dorada masculina
    append_corn_tassel(bm, Vector((0, 0, 1.38)), scale=1.05, mat_rachis=7, mat_anther=8)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0012
    sol_mod.offset = 0.0

    return obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\plant_corn.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando construccion y guardado de las 5 etapas de Maiz (MAI.blend)...\n")

        scene = setup_plant_scene()
        mats = create_corn_plant_materials()

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
            if obj.name not in col.objects:
                col.objects.link(obj)
            if obj.name in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.unlink(obj)

        blend_file = os.path.abspath(r"assets-src/crops/MAI.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        # Renderizar vistas previas raw de cada etapa
        stage_names = ["stage1", "stage2", "stage3", "stage4", "stage5"]
        out_raw_files = []

        for stage_idx, col_key in enumerate(stage_names, start=1):
            for c_name in stage_names:
                c_obj = bpy.data.collections.get(c_name)
                if c_obj:
                    is_active = (c_name == col_key)
                    c_obj.hide_render = not is_active
                    c_obj.hide_viewport = not is_active

            raw_path = os.path.abspath(os.path.join(r"scripts/out", f"cartoon_corn_stage{stage_idx}_raw.png"))
            os.makedirs(os.path.dirname(raw_path), exist_ok=True)
            scene.render.filepath = raw_path
            bpy.ops.render.render(write_still=True)
            out_raw_files.append(raw_path)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Cultivo MAI.blend y Renders Raw de las 5 Etapas completados con exito.\n")
            f.write(f"Blend: {blend_file}\n")
            for r in out_raw_files:
                f.write(f"  Raw: {r}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
