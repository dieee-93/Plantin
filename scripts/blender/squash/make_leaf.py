import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

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

    # Iluminación de tres puntos suave y cálida
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.2
    sun_data.color = (1.0, 0.97, 0.92)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(18), math.radians(42))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.75
    fill_data.color = (0.85, 0.92, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    scene.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-140))

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 0.95
    rim_data.color = (0.95, 1.0, 0.90)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    scene.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-60), math.radians(20), math.radians(110))

    # Cámara isométrica
    cam_data = bpy.data.cameras.new(name="IsoCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 0.55
    cam = bpy.data.objects.new(name="IsoCamera", object_data=cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    rot_mat = cam.rotation_euler.to_matrix()
    target_pos = Vector((0.0, 0.0, 0.12))
    cam.location = rot_mat @ Vector((0, 0, 5.0)) + target_pos

    return scene

def create_squash_materials():
    mats = []
    this_dir = os.path.dirname(os.path.abspath(__file__))
    color_tex = os.path.join(this_dir, "textures", "squash_leaf_color.png")
    bump_tex = os.path.join(this_dir, "textures", "squash_leaf_bump.png")

    # Slot 0: Mat_Squash_Leaf
    mat_leaf = bpy.data.materials.new(name="Mat_Squash_Leaf")
    mat_leaf.use_nodes = True
    nodes = mat_leaf.node_tree.nodes
    links = mat_leaf.node_tree.links
    nodes.clear()

    out_n = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.42
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.22
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = 0.22
    if 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = 0.0

    links.new(bsdf.outputs['BSDF'], out_n.inputs['Surface'])

    if os.path.exists(color_tex):
        tex_col = nodes.new(type='ShaderNodeTexImage')
        tex_col.image = bpy.data.images.load(color_tex)
        links.new(tex_col.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.03, 0.09, 0.035, 1.0)

    if os.path.exists(bump_tex):
        tex_bmp = nodes.new(type='ShaderNodeTexImage')
        tex_bmp.image = bpy.data.images.load(bump_tex)
        try:
            tex_bmp.image.colorspace_settings.name = 'Non-Color'
        except:
            pass
        bmp_node = nodes.new(type='ShaderNodeBump')
        bmp_node.inputs['Strength'].default_value = 0.28
        bmp_node.inputs['Distance'].default_value = 0.006
        links.new(tex_bmp.outputs['Color'], bmp_node.inputs['Height'])
        links.new(bmp_node.outputs['Normal'], bsdf.inputs['Normal'])

    mats.append(mat_leaf) # Slot 0

    # Slot 1: Mat_Squash_Stem (tallo carnoso estriado verde pálido con cerdas)
    mat_stem = bpy.data.materials.new(name="Mat_Squash_Stem")
    mat_stem.use_nodes = True
    ns = mat_stem.node_tree.nodes
    ns.clear()
    out_s = ns.new(type='ShaderNodeOutputMaterial')
    bsdf_s = ns.new(type='ShaderNodeBsdfPrincipled')
    bsdf_s.inputs['Base Color'].default_value = (0.07, 0.20, 0.06, 1.0)
    bsdf_s.inputs['Roughness'].default_value = 0.38
    if 'Specular IOR Level' in bsdf_s.inputs:
        bsdf_s.inputs['Specular IOR Level'].default_value = 0.25
    mat_stem.node_tree.links.new(bsdf_s.outputs['BSDF'], out_s.inputs['Surface'])
    mats.append(mat_stem) # Slot 1

    return mats

def get_cucurbita_leaf_radius(theta):
    """
    Función botánica de contorno para la lámina de Cucurbita:
    Hoja cordiforme-reniforme pentalobulada con seno peciolar profundo en la base.
    """
    # 5 lóbulos suaves
    # theta = 0 apunta hacia arriba (ápice de la hoja)
    # Lóbulo central en 0
    # Lóbulos laterales en +/- 0.85 rad (~48°)
    # Lóbulos basales (orejuelas) en +/- 1.80 rad (~103°)
    # Hendidura peciolar en +/- pi (base)
    cos_t = math.cos(theta)
    cos_5t = math.cos(5.0 * theta)

    # Base cordada: se hunde hacia la base (theta -> +/- pi)
    base_mask = (1.0 + math.cos(theta)) * 0.5 # 1 en el ápice, 0 en la base
    cordate_shape = 0.35 + 0.65 * (base_mask ** 0.8)

    # Ondulación de los 5 lóbulos
    lobe_wave = 1.0 + 0.16 * cos_5t * base_mask

    # Denticulado perimetral sutil
    teeth = 1.0 + 0.025 * math.cos(25.0 * theta)

    return cordate_shape * lobe_wave * teeth

def build_master_squash_leaf(bm, origin, petiole_len, blade_size, roll_deg, uv_layer, mat_leaf_idx, mat_stem_idx):
    """
    Construye una hoja maestra de zapallo:
    - Pecíolo estriado arqueado vigoroso tipo sombrilla.
    - Lámina acorazonada 5-lobulada con cúpula tridimensional y seno peciolar.
    """
    # 1. Pecíolo angular arqueado (de base a inserción)
    # Sube en arco y cae levemente en el punto de inserción de la lámina
    num_p_steps = 10
    pet_pts = []
    for s in range(num_p_steps + 1):
        u = s / float(num_p_steps)
        # Curva de pecíolo: sube primero, avanza hacia el frente y se arquea suavemente
        z_p = petiole_len * (math.sin(u * math.pi * 0.65) * 0.95)
        y_p = petiole_len * (u ** 1.25) * 0.60
        x_p = petiole_len * math.sin(u * math.pi) * 0.08
        pet_pts.append(origin + Vector((x_p, y_p, z_p)))

    # Malla del pecíolo con sección pentagonal/estriada
    prev_ring = None
    r_base = 0.009 * (petiole_len / 0.25)
    for idx, pt in enumerate(pet_pts):
        frac = idx / float(num_p_steps)
        r_curr = r_base * (1.0 - frac * 0.28)
        # Sección pentagonal (5 aristas típicas de cucurbitácea)
        ring = bmesh.ops.create_circle(
            bm,
            cap_ends=(idx == 0),
            segments=6,
            radius=r_curr,
            matrix=Matrix.Translation(pt)
        )['verts']
        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

    # 2. Lámina foliar acorazonada 3D
    blade_insertion = pet_pts[-1]
    # Inclinación y orientación de la sombrilla foliar hacia la cámara isométrica
    roll_rad = math.radians(roll_deg)
    leaf_norm = Vector((0.35, -0.45, 0.82)).normalized()
    blade_y = Vector((0.45, 0.75, 0.40)).normalized()
    blade_x = blade_y.cross(leaf_norm).normalized()
    blade_y = leaf_norm.cross(blade_x).normalized()

    # Rejilla radial de la lámina (anillos concéntricos y radios angulares)
    rings_count = 6
    rays_count = 32

    grid_verts = [] # [ring_idx][ray_idx]

    # Vértice central en el punto peciolar (deprimido)
    v_center = bm.verts.new(blade_insertion)
    v_center_row = [v_center] * rays_count
    grid_verts.append(v_center_row)

    for r_i in range(1, rings_count + 1):
        u_r = r_i / float(rings_count)
        row = []
        for a_i in range(rays_count):
            # theta: 0 = ápice (hacia adelante), +/- pi = seno basal
            theta = -math.pi + (a_i / float(rays_count)) * 2.0 * math.pi
            r_scale = get_cucurbita_leaf_radius(theta)
            dist = blade_size * u_r * r_scale

            # Curvatura 3D tipo sombrilla:
            # - Cúpula cóncava cerca del centro (u_r < 0.3)
            # - Cresta arqueada y caída de los lóbulos en el borde
            dome_z = (math.sin(u_r * math.pi * 0.85) * 0.12 - (u_r ** 1.8) * 0.16) * blade_size

            # Ondulación vertical entre lóbulos
            lobe_undulation = 0.035 * math.cos(5.0 * theta) * (u_r ** 1.5) * blade_size

            pos_2d_x = math.sin(theta) * dist
            pos_2d_y = math.cos(theta) * dist

            p_pos = (blade_insertion +
                     blade_x * pos_2d_x +
                     blade_y * pos_2d_y +
                     leaf_norm * (dome_z + lobe_undulation))

            v = bm.verts.new(p_pos)
            row.append(v)
        grid_verts.append(row)

    # Construir caras y asignar UVs
    for r_i in range(rings_count):
        for a_i in range(rays_count):
            a_next = (a_i + 1) % rays_count

            if r_i == 0:
                v0 = grid_verts[0][a_i] # centro
                v1 = grid_verts[1][a_i]
                v2 = grid_verts[1][a_next]
                if v0 != v1 and v1 != v2:
                    try:
                        f = bm.faces.new([v0, v1, v2])
                        f.material_index = mat_leaf_idx
                        f.smooth = True
                        for loop in f.loops:
                            theta_l = -math.pi + ((a_i if loop.vert == v1 else a_next) / float(rays_count)) * 2.0 * math.pi
                            u_map = 0.5 + 0.45 * math.sin(theta_l) * (1.0 / float(rings_count) if loop.vert != v0 else 0.0)
                            v_map = 0.10 + 0.80 * (math.cos(theta_l) * 0.5 + 0.5) * (1.0 / float(rings_count) if loop.vert != v0 else 0.0)
                            loop[uv_layer].uv = (u_map, v_map)
                    except ValueError:
                        pass
            else:
                v0 = grid_verts[r_i][a_i]
                v1 = grid_verts[r_i + 1][a_i]
                v2 = grid_verts[r_i + 1][a_next]
                v3 = grid_verts[r_i][a_next]
                try:
                    f = bm.faces.new([v0, v1, v2, v3])
                    f.material_index = mat_leaf_idx
                    f.smooth = True
                    for loop in f.loops:
                        # Mapeo UV radial simétrico sobre la textura palmeada
                        curr_r = (r_i + 1) if loop.vert in (v1, v2) else r_i
                        curr_a = a_next if loop.vert in (v2, v3) else a_i
                        theta_l = -math.pi + (curr_a / float(rays_count)) * 2.0 * math.pi
                        rad_frac = curr_r / float(rings_count)
                        u_map = 0.5 + 0.48 * math.sin(theta_l) * rad_frac
                        v_map = 0.10 + 0.85 * (math.cos(theta_l) * 0.5 + 0.5) * rad_frac
                        loop[uv_layer].uv = (u_map, v_map)
                except ValueError:
                    pass

def main():
    log_file = os.path.abspath(r"scripts/out/leaf_squash.log")
    import traceback
    try:
        with open(log_file, "w", encoding="utf-8") as f:
            f.write("Iniciando generación de hoja maestra de zapallo...\n")

        scene = setup_preview_scene()
        mats = create_squash_materials()

        bm = bmesh.new()
        uv_layer = bm.loops.layers.uv.new("UVMap")

        # Hoja maestra de zapallo en primer plano
        build_master_squash_leaf(
            bm,
            origin=Vector((0.0, -0.05, 0.0)),
            petiole_len=0.22,
            blade_size=0.18,
            roll_deg=18.0,
            uv_layer=uv_layer,
            mat_leaf_idx=0,
            mat_stem_idx=1
        )

        mesh = bpy.data.meshes.new("Squash_Leaf_Master_Mesh")
        obj = bpy.data.objects.new("Squash_Leaf_Master", mesh)
        for m in mats:
            obj.data.materials.append(m)

        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()

        sol = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
        sol.thickness = 0.0018
        sol.offset = 0.0

        sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
        sub.levels = 1
        sub.render_levels = 1

        scene.collection.objects.link(obj)

        # Renderizar
        out_dir = os.path.abspath(r"scripts/out")
        os.makedirs(out_dir, exist_ok=True)
        raw_path = os.path.join(out_dir, "cartoon_squash_leaf_raw.png")
        scene.render.filepath = raw_path
        bpy.ops.render.render(write_still=True)

        blend_path = os.path.abspath(r"assets-src/crops/SQUASH_LEAF_MASTER.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_path)

        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"Hoja de zapallo guardada en: {blend_path}\n")
            f.write(f"Render crudo guardado en: {raw_path}\n")

    except Exception as e:
        err = traceback.format_exc()
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
