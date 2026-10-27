import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_tassel_scene():
    """Configura la escena con iluminacion toon para la Panoja Apical Maestra de Maiz."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonTasselWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.95, 0.96, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 0.40

    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 3.0
    sun_data.color = (1.0, 0.98, 0.92)
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

    cam_data = bpy.data.cameras.new(name="TasselCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 0.45
    cam_obj = bpy.data.objects.new(name="TasselCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.rotation_euler = (math.radians(52), 0, math.radians(38))
    rot_mat = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = rot_mat @ Vector((0, 0, 5.0)) + Vector((0, 0, 0.10))

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

def create_tassel_materials():
    """Crea los materiales toon para la panoja de maiz (eje pajizo/dorado y anteras amarillas)."""
    mats = {}

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

    mats['rachis'] = make_mat("Mat_Tassel_Rachis", (0.58, 0.68, 0.32, 1.0), 0.38)
    mats['anther'] = make_mat("Mat_Tassel_Anther", (0.92, 0.80, 0.22, 1.0), 0.32, spec=0.45)

    return mats

def append_corn_tassel(bm, origin, scale=1.0, mat_rachis=0, mat_anther=1):
    """
    Construye la panoja apical ramificada masculina del maiz con espiguillas y anteras.
    """
    dir_up = Vector((0, 0, 1))

    # 1. Espiga central erecta
    central_len = 0.24 * scale
    c_steps = 8
    c_pts = [origin + dir_up * (central_len * (s / float(c_steps))) for s in range(c_steps + 1)]

    for s in range(c_steps):
        r1 = 0.0035 * scale * (1.0 - (s / float(c_steps)) * 0.5)
        r2 = 0.0035 * scale * (1.0 - ((s + 1) / float(c_steps)) * 0.5)
        p1 = c_pts[s]
        p2 = c_pts[s + 1]
        for a in range(4):
            ang1 = a * (math.pi * 0.5)
            ang2 = (a + 1) * (math.pi * 0.5)
            v1 = bm.verts.new(p1 + Vector((r1 * math.cos(ang1), r1 * math.sin(ang1), 0)))
            v2 = bm.verts.new(p1 + Vector((r1 * math.cos(ang2), r1 * math.sin(ang2), 0)))
            v3 = bm.verts.new(p2 + Vector((r2 * math.cos(ang2), r2 * math.sin(ang2), 0)))
            v4 = bm.verts.new(p2 + Vector((r2 * math.cos(ang1), r2 * math.sin(ang1), 0)))
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = mat_rachis
                f.smooth = True
            except ValueError:
                pass

    # Anteras en la espiga central
    for s in range(2, c_steps):
        p = c_pts[s]
        for side in (-1, 1):
            anther_pos = p + Vector((side * 0.006 * scale, (side * 0.004) * scale, 0))
            # Pequeña cuenta / antera dorada
            av1 = bm.verts.new(anther_pos + Vector((-0.003, -0.002, -0.004)) * scale)
            av2 = bm.verts.new(anther_pos + Vector(( 0.003, -0.002, -0.004)) * scale)
            av3 = bm.verts.new(anther_pos + Vector(( 0.003,  0.002,  0.004)) * scale)
            av4 = bm.verts.new(anther_pos + Vector((-0.003,  0.002,  0.004)) * scale)
            try:
                f = bm.faces.new([av1, av2, av3, av4])
                f.material_index = mat_anther
                f.smooth = True
            except ValueError:
                pass

    # 2. Ramificaciones laterales de la panoja (abiertas en plumero)
    num_branches = 8
    for b_idx in range(num_branches):
        ang = b_idx * (2.0 * math.pi / num_branches)
        b_dir_h = Vector((math.cos(ang), math.sin(ang), 0)).normalized()
        b_start_z = 0.02 * scale + (b_idx % 3) * 0.025 * scale
        b_orig = origin + dir_up * b_start_z

        b_len = (0.14 + 0.04 * math.sin(b_idx * 1.5)) * scale
        b_steps = 6
        b_pts = []
        for bs in range(b_steps + 1):
            t = bs / float(b_steps)
            reach_xy = (t ** 0.88) * b_len
            # Arco: sale a 50° hacia afuera y cae suavemente en la punta
            arch_z = (0.35 * t - 0.45 * (t ** 1.8)) * b_len
            p = b_orig + b_dir_h * reach_xy + dir_up * arch_z
            b_pts.append(p)

        for bs in range(b_steps):
            r = 0.0022 * scale * (1.0 - bs / float(b_steps) * 0.5)
            p1 = b_pts[bs]
            p2 = b_pts[bs + 1]
            seg_dir = (p2 - p1).normalized()
            seg_side = seg_dir.cross(dir_up).normalized()
            seg_up = seg_side.cross(seg_dir).normalized()

            v1 = bm.verts.new(p1 - seg_side * r)
            v2 = bm.verts.new(p1 + seg_side * r)
            v3 = bm.verts.new(p2 + seg_side * r)
            v4 = bm.verts.new(p2 - seg_side * r)
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = mat_rachis
                f.smooth = True
            except ValueError:
                pass

            # Anteras colgantes en cada rama lateral
            if bs >= 1:
                an_p = p1 - seg_up * (0.006 * scale)
                an_w = 0.0035 * scale
                av1 = bm.verts.new(an_p - seg_side * an_w - seg_up * an_w)
                av2 = bm.verts.new(an_p + seg_side * an_w - seg_up * an_w)
                av3 = bm.verts.new(an_p + seg_side * an_w + seg_up * an_w)
                av4 = bm.verts.new(an_p - seg_side * an_w + seg_up * an_w)
                try:
                    af = bm.faces.new([av1, av2, av3, av4])
                    af.material_index = mat_anther
                    af.smooth = True
                except ValueError:
                    pass

def build_master_tassel():
    """Construye la PANOJA APICAL MAESTRA de maiz."""
    scene = setup_tassel_scene()
    mats = create_tassel_materials()

    mesh = bpy.data.meshes.new("Corn_Tassel_Master_Mesh")
    obj = bpy.data.objects.new("Corn_Tassel_Master", mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(mats['rachis']) # 0
    obj.data.materials.append(mats['anther']) # 1

    bm = bmesh.new()
    append_corn_tassel(bm, Vector((0, 0, 0)), scale=1.0, mat_rachis=0, mat_anther=1)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0006
    sol_mod.offset = 0.0

    return scene, obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\tassel_corn.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando generacion de Panoja Apical Maestra de Maiz...\n")

        scene, obj = build_master_tassel()

        blend_file = os.path.abspath(r"assets-src/crops/CORN_TASSEL_MASTER.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_corn_tassel_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Panoja Maestra completada con exito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
