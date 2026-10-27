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
        bg.inputs['Strength'].default_value = 0.28

    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.4
    sun_data.color = (1.0, 0.98, 0.94)
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(18), math.radians(42))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.85
    fill_data.color = (0.85, 0.92, 1.0)
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    scene.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-140))

    cam_data = bpy.data.cameras.new(name="IsoCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 0.42
    cam = bpy.data.objects.new(name="IsoCamera", object_data=cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    rot_mat = cam.rotation_euler.to_matrix()
    cam.location = rot_mat @ Vector((0, 0, 5.0)) + Vector((0.0, 0.0, 0.06))

    return scene

def create_squash_fruit_materials():
    mats = []

    # Slot 0: Mat_Squash_Orange (Naranja cálido vivo de zapallo criollo)
    mat_orange = bpy.data.materials.new(name="Mat_Squash_Orange")
    mat_orange.use_nodes = True
    ns = mat_orange.node_tree.nodes
    ns.clear()
    out_o = ns.new(type='ShaderNodeOutputMaterial')
    bsdf_o = ns.new(type='ShaderNodeBsdfPrincipled')
    bsdf_o.inputs['Base Color'].default_value = (0.92, 0.38, 0.03, 1.0)
    bsdf_o.inputs['Roughness'].default_value = 0.24
    if 'Specular IOR Level' in bsdf_o.inputs:
        bsdf_o.inputs['Specular IOR Level'].default_value = 0.45
    mat_orange.node_tree.links.new(bsdf_o.outputs['BSDF'], out_o.inputs['Surface'])
    mats.append(mat_orange) # 0

    # Slot 1: Mat_Squash_Peduncle (Pedúnculo leñoso pentagonal pardo-oliváceo)
    mat_ped = bpy.data.materials.new(name="Mat_Squash_Peduncle")
    mat_ped.use_nodes = True
    ns_p = mat_ped.node_tree.nodes
    ns_p.clear()
    out_p = ns_p.new(type='ShaderNodeOutputMaterial')
    bsdf_p = ns_p.new(type='ShaderNodeBsdfPrincipled')
    bsdf_p.inputs['Base Color'].default_value = (0.28, 0.25, 0.12, 1.0)
    bsdf_p.inputs['Roughness'].default_value = 0.55
    if 'Specular IOR Level' in bsdf_p.inputs:
        bsdf_p.inputs['Specular IOR Level'].default_value = 0.18
    mat_ped.node_tree.links.new(bsdf_p.outputs['BSDF'], out_p.inputs['Surface'])
    mats.append(mat_ped) # 1

    # Slot 2: Mat_Squash_Baby (Verde pálido para zapallito en desarrollo)
    mat_baby = bpy.data.materials.new(name="Mat_Squash_BabyGreen")
    mat_baby.use_nodes = True
    ns_b = mat_baby.node_tree.nodes
    ns_b.clear()
    out_b = ns_b.new(type='ShaderNodeOutputMaterial')
    bsdf_b = ns_b.new(type='ShaderNodeBsdfPrincipled')
    bsdf_b.inputs['Base Color'].default_value = (0.35, 0.58, 0.12, 1.0)
    bsdf_b.inputs['Roughness'].default_value = 0.30
    mat_baby.node_tree.links.new(bsdf_b.outputs['BSDF'], out_b.inputs['Surface'])
    mats.append(mat_baby) # 2

    return mats

def add_master_squash_fruit(bm, center_pos, radius_xy, height_ratio=0.72, num_ribs=8,
                            mat_fruit_idx=0, mat_peduncle_idx=1, rotation_euler=(0,0,0)):
    """
    Construye un zapallo criollo acanalado maestro:
    - Esfera oblata achatada en los polos.
    - 8 a 10 gajos/costillas marcadas con surcos profundos continuos.
    - Depresión peduncular en la parte superior y estigmática en la inferior.
    - Pedúnculo leñoso pentagonal con ensanchamiento en estrella de 5 puntas.
    """
    r_xy = radius_xy
    r_z = radius_xy * height_ratio

    rot_mat = Euler(rotation_euler, 'XYZ').to_matrix().to_4x4()
    T_final = Matrix.Translation(center_pos) @ rot_mat

    u_seg = 40
    v_seg = 22
    sphere_geom = bmesh.ops.create_uvsphere(
        bm,
        u_segments=u_seg,
        v_segments=v_seg,
        radius=1.0,
        matrix=T_final
    )

    for v in sphere_geom['verts']:
        v_local = T_final.inverted() @ v.co
        z_norm = max(-1.0, min(1.0, v_local.z)) # entre -1 y 1
        theta = math.atan2(v_local.y, v_local.x)

        # 1. Achatamiento polar (oblatum)
        v_local.z = z_norm * r_z

        # 2. Perfil ecuatorial redondeado
        equator_w = math.sqrt(max(0.001, 1.0 - z_norm**2))

        # 3. Costillas pronunciadas longitudinales (gajos de calabaza)
        # Modulación de costilla que desaparece suavemente en el poro exacto
        rib_envelope = (1.0 - abs(z_norm) ** 3.0)
        # Amplitud de costilla: 12% del radio
        rib_wave = 0.125 * math.cos(num_ribs * theta) * rib_envelope
        # Surcos secundarios sutiles
        sub_rib = 0.020 * math.cos(num_ribs * 2 * theta) * rib_envelope

        r_actual = r_xy * equator_w * (1.0 + rib_wave + sub_rib)

        v_local.x = math.cos(theta) * r_actual
        v_local.y = math.sin(theta) * r_actual

        # 4. Depresión peduncular superior (ombligo donde sale el cabo)
        dist_xy = math.sqrt(v_local.x**2 + v_local.y**2)
        ped_dip_radius = r_xy * 0.40
        if z_norm > 0.15 and dist_xy < ped_dip_radius:
            dip_frac = 1.0 - (dist_xy / ped_dip_radius)
            v_local.z -= (dip_frac ** 2.0) * (r_z * 0.32)

        # 5. Depresión basal inferior (cicatriz de flor)
        base_dip_radius = r_xy * 0.28
        if z_norm < -0.40 and dist_xy < base_dip_radius:
            dip_frac = 1.0 - (dist_xy / base_dip_radius)
            v_local.z += (dip_frac ** 2.0) * (r_z * 0.14)

        v.co = T_final @ v_local

    for f in {f for v in sphere_geom['verts'] for f in v.link_faces}:
        f.material_index = mat_fruit_idx
        f.smooth = True

    # 6. Pedúnculo pentagonal leñoso acanalado (sección estrellada de 5 aristas)
    ped_len = r_xy * 0.48
    r_ped_top = r_xy * 0.12
    r_ped_base = r_xy * 0.22 # Ensanchamiento en la base (flare estrellado)

    num_ped_steps = 7
    ped_grid = []

    # Curvatura suave del cabo
    lean_vec = Vector((0.02, 0.015, 0.0))

    for s in range(num_ped_steps + 1):
        u = s / float(num_ped_steps)
        # z desde la depresión peduncular hacia arriba
        z_p = r_z * 0.68 + ped_len * u
        # Radio con ensanchamiento estrellado en la base
        r_p = r_ped_base * (1.0 - u * 0.45)
        # Centro desplazado con curva
        cen_p = lean_vec * (u ** 1.5)

        ring = []
        for k in range(15): # 15 vértices = 5 aristas pentagonales con 3 vértices por arista
            ang = (k / 15.0) * 2.0 * math.pi
            # Modulación pentagonal (5 costillas de la caña del zapallo)
            star_factor = 1.0 + (0.24 if u < 0.3 else 0.14) * math.cos(5.0 * ang)
            r_k = r_p * star_factor
            pt_local = cen_p + Vector((math.cos(ang) * r_k, math.sin(ang) * r_k, z_p))
            v = bm.verts.new(T_final @ pt_local)
            ring.append(v)
        ped_grid.append(ring)

    # Conectar caras del pedúnculo
    for s in range(num_ped_steps):
        r1 = ped_grid[s]
        r2 = ped_grid[s + 1]
        for k in range(15):
            k_next = (k + 1) % 15
            f = bm.faces.new([r1[k], r1[k_next], r2[k_next], r2[k]])
            f.material_index = mat_peduncle_idx
            f.smooth = True

    # Tapa del cabo cortado
    f_top = bm.faces.new(ped_grid[-1])
    f_top.material_index = mat_peduncle_idx
    f_top.smooth = True

def main():
    scene = setup_preview_scene()
    mats = create_squash_fruit_materials()

    bm = bmesh.new()

    # Zapallo criollo maduro maestro
    add_master_squash_fruit(
        bm,
        center_pos=Vector((0.0, 0.0, 0.05)),
        radius_xy=0.15,
        height_ratio=0.70,
        num_ribs=8,
        mat_fruit_idx=0,
        mat_peduncle_idx=1,
        rotation_euler=(math.radians(12), math.radians(-10), math.radians(25))
    )

    mesh = bpy.data.meshes.new("Squash_Fruit_Mesh")
    obj = bpy.data.objects.new("Squash_Fruit", mesh)
    for m in mats:
        obj.data.materials.append(m)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    scene.collection.objects.link(obj)

    out_dir = os.path.abspath(r"scripts/out")
    raw_path = os.path.join(out_dir, "cartoon_squash_fruit_raw.png")
    scene.render.filepath = raw_path
    bpy.ops.render.render(write_still=True)

    blend_path = os.path.abspath(r"assets-src/crops/SQUASH_FRUIT_MASTER.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Zapallo criollo guardado con exito.")

if __name__ == "__main__":
    main()
