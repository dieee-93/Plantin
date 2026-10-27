import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os

def setup_preview_scene():
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

    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.4
    sun_data.color = (1.0, 0.98, 0.94)
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(18), math.radians(42))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.80
    fill_data.color = (0.85, 0.92, 1.0)
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    scene.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-140))

    cam_data = bpy.data.cameras.new(name="IsoCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 0.35
    cam = bpy.data.objects.new(name="IsoCamera", object_data=cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    rot_mat = cam.rotation_euler.to_matrix()
    cam.location = rot_mat @ Vector((0, 0, 5.0)) + Vector((0.0, 0.0, 0.08))

    return scene

def create_flower_materials():
    mats = []

    # Slot 0: Mat_Squash_Flower (Amarillo anaranjado brillante cálido)
    mat_flower = bpy.data.materials.new(name="Mat_Squash_Flower")
    mat_flower.use_nodes = True
    ns = mat_flower.node_tree.nodes
    ns.clear()
    out_f = ns.new(type='ShaderNodeOutputMaterial')
    bsdf_f = ns.new(type='ShaderNodeBsdfPrincipled')
    bsdf_f.inputs['Base Color'].default_value = (0.98, 0.68, 0.05, 1.0)
    bsdf_f.inputs['Roughness'].default_value = 0.30
    if 'Specular IOR Level' in bsdf_f.inputs:
        bsdf_f.inputs['Specular IOR Level'].default_value = 0.40
    mat_flower.node_tree.links.new(bsdf_f.outputs['BSDF'], out_f.inputs['Surface'])
    mats.append(mat_flower) # 0

    # Slot 1: Mat_Squash_Stem (Verde cáliz y pedúnculo)
    mat_stem = bpy.data.materials.new(name="Mat_Squash_Stem")
    mat_stem.use_nodes = True
    ns = mat_stem.node_tree.nodes
    ns.clear()
    out_s = ns.new(type='ShaderNodeOutputMaterial')
    bsdf_s = ns.new(type='ShaderNodeBsdfPrincipled')
    bsdf_s.inputs['Base Color'].default_value = (0.07, 0.22, 0.06, 1.0)
    bsdf_s.inputs['Roughness'].default_value = 0.38
    mat_stem.node_tree.links.new(bsdf_s.outputs['BSDF'], out_s.inputs['Surface'])
    mats.append(mat_stem) # 1

    # Slot 2: Mat_Baby_Squash (Ovario verde limón tierno para flor femenina)
    mat_baby = bpy.data.materials.new(name="Mat_Baby_Squash")
    mat_baby.use_nodes = True
    ns = mat_baby.node_tree.nodes
    ns.clear()
    out_b = ns.new(type='ShaderNodeOutputMaterial')
    bsdf_b = ns.new(type='ShaderNodeBsdfPrincipled')
    bsdf_b.inputs['Base Color'].default_value = (0.42, 0.65, 0.12, 1.0)
    bsdf_b.inputs['Roughness'].default_value = 0.26
    mat_baby.node_tree.links.new(bsdf_b.outputs['BSDF'], out_b.inputs['Surface'])
    mats.append(mat_baby) # 2

    return mats

def add_squash_flower(bm, center_pos, direction, scale=1.0, is_female=True, mat_flower_idx=0, mat_stem_idx=1, mat_baby_idx=2):
    """
    Construye una flor campanulada de zapallo:
    - Ovario basal esférico (si es flor femenina) o cáliz estrecho (si es masculina).
    - 5 sépalos estrechos en estrella.
    - Corola acampanada con 5 pétalos fusionados en la base y abiertos en la punta.
    - Columna estigmática central.
    """
    dir_fwd = direction.normalized()
    up_ref = Vector((0, 0, 1))
    if abs(dir_fwd.dot(up_ref)) > 0.95:
        up_ref = Vector((0, 1, 0))
    side_x = dir_fwd.cross(up_ref).normalized()
    side_y = side_x.cross(dir_fwd).normalized()

    # Matriz base local
    rot_mat = Matrix((side_x, side_y, dir_fwd)).transposed().to_4x4()
    T_flower = Matrix.Translation(center_pos) @ rot_mat

    # 1. Ovario ínfero (zapallito bebé si es flor femenina)
    if is_female:
        r_ovary = 0.024 * scale
        ovary_geom = bmesh.ops.create_uvsphere(
            bm,
            u_segments=16,
            v_segments=10,
            radius=r_ovary,
            matrix=T_flower @ Matrix.Translation(Vector((0, 0, -r_ovary * 0.85)))
        )
        for f in {f for v in ovary_geom['verts'] for f in v.link_faces}:
            f.material_index = mat_baby_idx
            f.smooth = True

    # 2. Cáliz y 5 sépalos
    calyx_r = 0.014 * scale
    calyx_h = 0.016 * scale
    calyx_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=10,
        radius1=calyx_r * 0.85,
        radius2=calyx_r * 1.15,
        depth=calyx_h,
        matrix=T_flower @ Matrix.Translation(Vector((0, 0, calyx_h * 0.5)))
    )
    for f in {f for v in calyx_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_stem_idx
        f.smooth = True

    # 5 sépalos lineares alargados
    sepal_len = 0.028 * scale
    for s_i in range(5):
        ang = (s_i / 5.0) * 2.0 * math.pi
        v_dir = Vector((math.cos(ang), math.sin(ang), 0))
        p_base = Vector((math.cos(ang) * calyx_r, math.sin(ang) * calyx_r, calyx_h))
        p_tip = p_base + v_dir * sepal_len + Vector((0, 0, sepal_len * 0.4))
        p_base_w = T_flower @ p_base
        p_tip_w = T_flower @ p_tip

        # Línea de sépalo con grosor
        v_b1 = bm.verts.new(p_base_w + T_flower.to_3x3() @ (side_x.cross(v_dir) * 0.002))
        v_b2 = bm.verts.new(p_base_w - T_flower.to_3x3() @ (side_x.cross(v_dir) * 0.002))
        v_t = bm.verts.new(p_tip_w)
        f_sep = bm.faces.new([v_b1, v_b2, v_t])
        f_sep.material_index = mat_stem_idx
        f_sep.smooth = True

    # 3. Corola campanulada (tubo acampanado ensanchado con 5 lóbulos)
    # Rejilla radial de la campana
    tube_steps = 7
    pet_rays = 30
    corolla_h = 0.075 * scale
    corolla_r_top = 0.062 * scale

    corolla_grid = []

    for s in range(tube_steps + 1):
        u = s / float(tube_steps)
        # Radio de la campana: se ensancha cuadráticamente
        # u=0 base (calyx_r), u=0.6 garganta, u=1.0 apertura de lóbulos
        z_curr = calyx_h + corolla_h * u
        r_base_tube = calyx_r * 1.1 + (corolla_r_top - calyx_r * 1.1) * (u ** 1.35)

        ring = []
        for r_i in range(pet_rays):
            ang = (r_i / float(pet_rays)) * 2.0 * math.pi
            # Ondulación de los 5 pétalos acampanados en la parte superior
            lobe_wave = 1.0
            if u > 0.40:
                frac_top = (u - 0.40) / 0.60
                lobe_wave = 1.0 + 0.32 * math.cos(5.0 * ang) * frac_top

            r_act = r_base_tube * lobe_wave
            p_local = Vector((math.cos(ang) * r_act, math.sin(ang) * r_act, z_curr))
            # Curvatura hacia afuera de los pétalos
            if u > 0.75:
                flare = (u - 0.75) * 0.012 * scale * math.cos(5.0 * ang)
                p_local.z -= flare

            v = bm.verts.new(T_flower @ p_local)
            ring.append(v)
        corolla_grid.append(ring)

    # Conectar corola con caras
    for s in range(tube_steps):
        r1 = corolla_grid[s]
        r2 = corolla_grid[s + 1]
        for r_i in range(pet_rays):
            r_next = (r_i + 1) % pet_rays
            f = bm.faces.new([r1[r_i], r1[r_next], r2[r_next], r2[r_i]])
            f.material_index = mat_flower_idx
            f.smooth = True

    # 4. Columna reproductiva interna (estigma / estambres)
    col_h = corolla_h * 0.45
    col_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=8,
        radius1=0.007 * scale,
        radius2=0.004 * scale,
        depth=col_h,
        matrix=T_flower @ Matrix.Translation(Vector((0, 0, calyx_h + col_h * 0.5)))
    )
    for f in {f for v in col_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_flower_idx
        f.smooth = True

def main():
    scene = setup_preview_scene()
    mats = create_flower_materials()

    bm = bmesh.new()

    # Flor femenina de zapallo con zapallito bebé
    add_squash_flower(
        bm,
        center_pos=Vector((0.0, -0.02, 0.04)),
        direction=Vector((0.25, -0.55, 0.80)),
        scale=1.1,
        is_female=True,
        mat_flower_idx=0,
        mat_stem_idx=1,
        mat_baby_idx=2
    )

    mesh = bpy.data.meshes.new("Squash_Flower_Mesh")
    obj = bpy.data.objects.new("Squash_Flower", mesh)
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

    scene.collection.objects.link(obj)

    out_dir = os.path.abspath(r"scripts/out")
    raw_path = os.path.join(out_dir, "cartoon_squash_flower_raw.png")
    scene.render.filepath = raw_path
    bpy.ops.render.render(write_still=True)

    blend_path = os.path.abspath(r"assets-src/crops/SQUASH_FLOWER_MASTER.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Flor de zapallo guardada con exito.")

if __name__ == "__main__":
    main()
