import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_bud_scene():
    """Configura la escena con iluminacion toon limpia para el Cogollo / Cola Maestra de Cannabis."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonBudWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.96, 0.97, 0.99, 1.0)
        bg.inputs['Strength'].default_value = 0.50

    # Sol principal calido
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 3.2
    sun_data.color = (1.0, 0.98, 0.92)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(48), math.radians(18), math.radians(40))

    # Relleno
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.3
    fill_data.color = (0.86, 0.92, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-140))

    # Rim light
    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.6
    rim_data.color = (1.0, 0.95, 0.88)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-38), math.radians(22), math.radians(150))

    # Camara ortografica en primer plano
    cam_data = bpy.data.cameras.new(name="CloseUpCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 0.42
    cam_obj = bpy.data.objects.new(name="CloseUpCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.rotation_euler = (math.radians(56), 0, math.radians(45))
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

    return scene

def create_bud_materials():
    """Crea la paleta toon de materiales para flores de cannabis resinosas."""
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

    # 1. Calices resinosos / carnosos (verde lima escarchado por tricomas)
    mats['calyx'] = make_mat("Mat_Cannabis_Calyx", (0.28, 0.54, 0.22, 1.0), 0.36, spec=0.45, sss=0.15)
    # 2. Pistilos maduros (naranja ambar vivo y calido)
    mats['pistil'] = make_mat("Mat_Cannabis_Pistil", (0.92, 0.44, 0.12, 1.0), 0.42, spec=0.25)
    # 3. Hojas de azucar (verde profundo con glándulas resinosas)
    mats['sugar_leaf'] = make_mat("Mat_Cannabis_SugarLeaf", (0.16, 0.42, 0.18, 1.0), 0.32, spec=0.38)
    # 4. Tallo interno de la flor
    mats['stem'] = make_mat("Mat_Cannabis_Stem", (0.22, 0.38, 0.15, 1.0), 0.40)

    return mats

def add_calyx_bract(bm, origin, direction, radius=0.016, length=0.038, mat_idx=0):
    """
    Crea un caliz/bráctea floral piriforme/obovado (gordito en la base, afinado en la punta).
    """
    dir_fwd = direction.normalized()
    up_ref = Vector((0, 0, 1)) if abs(dir_fwd.z) < 0.9 else Vector((1, 0, 0))
    side_u = dir_fwd.cross(up_ref).normalized()
    side_v = side_u.cross(dir_fwd).normalized()

    steps = 6
    segments = 8
    rings = []

    for s in range(steps + 1):
        frac = s / float(steps)
        # Perfil de caliz: abultado en el tercio basal, punta afinada
        r = radius * math.sin(frac * math.pi * 0.88) * (1.1 - 0.5 * frac)
        h = length * frac
        center = origin + dir_fwd * h

        ring = []
        for seg in range(segments):
            ang = seg * (2.0 * math.pi / segments)
            p = center + (side_u * math.cos(ang) + side_v * math.sin(ang)) * r
            ring.append(bm.verts.new(p))
        rings.append(ring)

    # Conectar caras
    for s in range(steps):
        for seg in range(segments):
            n_seg = (seg + 1) % segments
            v1 = rings[s][seg]
            v2 = rings[s + 1][seg]
            v3 = rings[s + 1][n_seg]
            v4 = rings[s][n_seg]
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = mat_idx
                f.smooth = True
            except ValueError:
                pass

    tip_pos = origin + dir_fwd * length
    return tip_pos, dir_fwd

def add_curling_pistils(bm, origin, base_dir, length=0.030, mat_idx=1):
    """
    Agrega un par de pistilos / estigmas ambarinos ondulados emergiendo del caliz.
    """
    for sign in (-1, 1):
        # Angulo de dispersion lateral
        p_dir = (base_dir + Vector((sign * 0.45, (sign * 0.2), 0.5))).normalized()
        p_side = p_dir.cross(Vector((0, 0, 1))).normalized()

        steps = 5
        prev_v = None
        curl_pts = []
        for s in range(steps + 1):
            t = s / float(steps)
            dist = length * t
            # Ondulacion en espiral organica del estigma
            curl = (0.008 * math.sin(t * math.pi * 1.5)) * sign
            pos = origin + p_dir * dist + p_side * curl + Vector((0, 0, 0.005 * math.cos(t * math.pi)))
            curl_pts.append(pos)

        # Generar tira tubular o poligonal de 4 vertices para el pelo del estigma
        thick = 0.0016
        for s in range(steps):
            frac = s / float(steps)
            w = thick * (1.0 - frac * 0.6)
            p1 = curl_pts[s]
            p2 = curl_pts[s + 1]
            normal = (p2 - p1).cross(p_side).normalized() * (w * 0.5)

            v1 = bm.verts.new(p1 - normal)
            v2 = bm.verts.new(p1 + normal)
            v3 = bm.verts.new(p2 + normal)
            v4 = bm.verts.new(p2 - normal)
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = mat_idx
                f.smooth = True
            except ValueError:
                pass

def add_sugar_leaf(bm, origin, direction, length=0.065, width=0.018, mat_idx=2):
    """
    Agrega una hojita de azucar resinosa emergiendo del cogollo.
    """
    dir_fwd = direction.normalized()
    side_u = dir_fwd.cross(Vector((0, 0, 1))).normalized()
    side_v = side_u.cross(dir_fwd).normalized()

    pts = 6
    spine = []
    for s in range(pts):
        t = s / float(pts - 1)
        # Curva hacia afuera y abajo
        drop = -0.015 * (t ** 1.8) * length
        pos = origin + dir_fwd * (length * t) + side_v * drop
        spine.append((pos, t))

    r_verts = []
    l_verts = []
    c_verts = []

    for pos, t in spine:
        w = width * math.sin(t * math.pi * 0.95) * (1.0 - t * 0.3)
        c_v = bm.verts.new(pos)
        r_v = bm.verts.new(pos + side_u * w + side_v * 0.002)
        l_v = bm.verts.new(pos - side_u * w + side_v * 0.002)
        c_verts.append(c_v)
        r_verts.append(r_v)
        l_verts.append(l_v)

    for s in range(pts - 1):
        f1_verts = [c_verts[s], r_verts[s], r_verts[s + 1], c_verts[s + 1]]
        f2_verts = [c_verts[s], c_verts[s + 1], l_verts[s + 1], l_verts[s]]
        try:
            f1 = bm.faces.new(f1_verts)
            f1.material_index = mat_idx
            f1.smooth = True
            f2 = bm.faces.new(f2_verts)
            f2.material_index = mat_idx
            f2.smooth = True
        except ValueError:
            pass

def build_master_bud_cluster():
    """
    Construye la COLA FLORAL MAESTRA:
    - Espiga central densa de calices amontonados.
    - Pelos de pistilo ambar emergiendo de cada caliz.
    - Hojitas de azucar resinosas asomando entre los racimos florales.
    """
    scene = setup_bud_scene()
    mats = create_bud_materials()

    mesh = bpy.data.meshes.new("Cannabis_Bud_Master_Mesh")
    obj = bpy.data.objects.new("Cannabis_Bud_Master", mesh)
    bpy.context.collection.objects.link(obj)

    # Asignar slots
    obj.data.materials.append(mats['calyx'])       # Slot 0
    obj.data.materials.append(mats['pistil'])      # Slot 1
    obj.data.materials.append(mats['sugar_leaf'])  # Slot 2
    obj.data.materials.append(mats['stem'])        # Slot 3

    bm = bmesh.new()

    # Tallo raquis interno
    stem_len = 0.16
    stem_steps = 8
    stem_rad = 0.006
    stem_rings = []
    for s in range(stem_steps + 1):
        z = stem_len * (s / float(stem_steps))
        r = stem_rad * (1.0 - (s / float(stem_steps)) * 0.4)
        ring = []
        for a_idx in range(6):
            ang = a_idx * (2.0 * math.pi / 6.0)
            ring.append(bm.verts.new(Vector((r * math.cos(ang), r * math.sin(ang), z))))
        stem_rings.append(ring)

    for s in range(stem_steps):
        for a_idx in range(6):
            n_idx = (a_idx + 1) % 6
            try:
                f = bm.faces.new([stem_rings[s][a_idx], stem_rings[s + 1][a_idx], stem_rings[s + 1][n_idx], stem_rings[s][n_idx]])
                f.material_index = 3
                f.smooth = True
            except ValueError:
                pass

    # Espiral de calices rodeando el raquis en varios pisos (filotaxia densa)
    num_calyx_tiers = 7
    calyx_per_tier = 5
    for tier in range(num_calyx_tiers):
        t_frac = tier / float(num_calyx_tiers)
        z_tier = 0.02 + t_frac * 0.13
        # Radio de la cola (forma conica-ovalada: ancha abajo, afinada arriba)
        tier_rad = 0.038 * (1.0 - t_frac * 0.5) * (0.8 + 0.4 * math.sin(t_frac * math.pi))
        tier_scale = 1.0 - t_frac * 0.35

        tier_angle_offset = tier * 1.25 # Angulo aureo aproximado

        for c_idx in range(calyx_per_tier):
            ang = tier_angle_offset + c_idx * (2.0 * math.pi / calyx_per_tier)
            dir_calyx = Vector((math.cos(ang), math.sin(ang), 0.35 + 0.3 * (1.0 - t_frac))).normalized()
            c_pos = Vector((dir_calyx.x * 0.008, dir_calyx.y * 0.008, z_tier))

            tip, fwd = add_calyx_bract(
                bm=bm,
                origin=c_pos,
                direction=dir_calyx,
                radius=0.014 * tier_scale,
                length=0.034 * tier_scale,
                mat_idx=0
            )

            # Agregar pistilos ambar al caliz
            add_curling_pistils(bm, tip, fwd, length=0.026 * tier_scale, mat_idx=1)

            # En algunos calices de los pisos medios, agregar hojitas de azucar proyectadas hacia afuera
            if (c_idx % 2 == 0) and tier in [1, 2, 3, 4]:
                sugar_dir = (dir_calyx + Vector((0, 0, -0.25))).normalized()
                add_sugar_leaf(
                    bm=bm,
                    origin=c_pos + dir_calyx * 0.015,
                    direction=sugar_dir,
                    length=0.055 * tier_scale,
                    width=0.014 * tier_scale,
                    mat_idx=2
                )

    # Copa apical (punta superior del cogollo)
    top_tip, top_fwd = add_calyx_bract(
        bm=bm,
        origin=Vector((0, 0, stem_len * 0.95)),
        direction=Vector((0, 0, 1)),
        radius=0.012,
        length=0.030,
        mat_idx=0
    )
    add_curling_pistils(bm, top_tip, top_fwd, length=0.024, mat_idx=1)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0006
    sol_mod.offset = 0.0

    return scene, obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\bud_cannabis.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando generacion de Cogollo Maestro de Cannabis...\n")

        scene, obj = build_master_bud_cluster()

        blend_file = os.path.abspath(r"assets-src/crops/CANNABIS_BUD_MASTER.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_cannabis_bud_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Cogollo Maestro completado con exito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
