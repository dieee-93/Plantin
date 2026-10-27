import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_master_scene():
    """Configura la escena con iluminación limpia y sombras suaves para estilo cartoon/toon botánico."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.96, 0.97, 0.99, 1.0)
        bg.inputs['Strength'].default_value = 0.55

    # Sol principal Noroeste (luz cálida directa)
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 3.0
    sun_data.color = (1.0, 0.98, 0.93)
    sun_data.use_shadow = True
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(48), math.radians(18), math.radians(40))

    # Luz de relleno opuesta (suave y fresca para resaltar el volumen redondeado)
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.3
    fill_data.color = (0.86, 0.92, 1.0)
    fill_data.use_shadow = False
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-140))

    # Rim light sutil
    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.6
    rim_data.color = (1.0, 0.95, 0.88)
    rim_data.use_shadow = False
    rim = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.rotation_euler = (math.radians(-38), math.radians(22), math.radians(150))

    # Cámara ortográfica en primer plano con encuadre óptimo
    cam_data = bpy.data.cameras.new(name="CloseUpCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 0.56
    cam_obj = bpy.data.objects.new(name="CloseUpCam", object_data=cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Ángulo isométrico clásico (56° inclinación, 45° rotación)
    cam_obj.rotation_euler = (math.radians(56), 0, math.radians(45))
    rot_mat = cam_obj.rotation_euler.to_matrix()
    cam_obj.location = rot_mat @ Vector((0, 0, 10.0)) + Vector((0, 0, 0.08))

    # Render 512x512 de alta definición
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

def create_cartoon_materials():
    """Crea materiales toon botánicos jugosos, vivos y cálidos estilo Nintendo/Zelda."""
    # 1. Rojo Tomate Maduro Jugoso con sutil gradiente cálido en hombros
    mat_red = bpy.data.materials.new("Cartoon_Beefsteak_Red")
    mat_red.use_nodes = True
    nodes = mat_red.node_tree.nodes
    links = mat_red.node_tree.links
    nodes.clear()

    out_node = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf_r = nodes.new(type='ShaderNodeBsdfPrincipled')
    links.new(bsdf_r.outputs['BSDF'], out_node.inputs['Surface'])

    # Color rojo bermellón brillante y jugoso
    bsdf_r.inputs['Base Color'].default_value = (0.88, 0.03, 0.04, 1.0)
    bsdf_r.inputs['Roughness'].default_value = 0.18
    if 'Specular IOR Level' in bsdf_r.inputs:
        bsdf_r.inputs['Specular IOR Level'].default_value = 0.75
    elif 'Specular' in bsdf_r.inputs:
        bsdf_r.inputs['Specular'].default_value = 0.75

    # Subsurface scattering rico para pulpa jugosa traslúcida
    if 'Subsurface Weight' in bsdf_r.inputs:
        bsdf_r.inputs['Subsurface Weight'].default_value = 0.26
        if 'Subsurface Radius' in bsdf_r.inputs:
            bsdf_r.inputs['Subsurface Radius'].default_value = (1.0, 0.28, 0.08)
    elif 'Subsurface' in bsdf_r.inputs:
        bsdf_r.inputs['Subsurface'].default_value = 0.26

    # Capa de brillo ceroso natural (Coat en Blender 4+)
    if 'Coat Weight' in bsdf_r.inputs:
        bsdf_r.inputs['Coat Weight'].default_value = 0.40
        if 'Coat Roughness' in bsdf_r.inputs:
            bsdf_r.inputs['Coat Roughness'].default_value = 0.12

    # 2. Verde Hoja Botánico Profundo (Cáliz y Cabo de tomate)
    mat_green = bpy.data.materials.new("Cartoon_Stem_Green")
    mat_green.use_nodes = True
    bsdf_g = mat_green.node_tree.nodes.get("Principled BSDF")
    if bsdf_g:
        bsdf_g.inputs['Base Color'].default_value = (0.16, 0.52, 0.12, 1.0)
        bsdf_g.inputs['Roughness'].default_value = 0.32
        if 'Specular IOR Level' in bsdf_g.inputs:
            bsdf_g.inputs['Specular IOR Level'].default_value = 0.35
        elif 'Specular' in bsdf_g.inputs:
            bsdf_g.inputs['Specular'].default_value = 0.35
        if 'Subsurface Weight' in bsdf_g.inputs:
            bsdf_g.inputs['Subsurface Weight'].default_value = 0.15

    # 3. Médula fresca del corte del cabo (verde apio fresco natural)
    mat_pith = bpy.data.materials.new("Cartoon_Stem_Pith")
    mat_pith.use_nodes = True
    bsdf_p = mat_pith.node_tree.nodes.get("Principled BSDF")
    if bsdf_p:
        bsdf_p.inputs['Base Color'].default_value = (0.48, 0.74, 0.32, 1.0)
        bsdf_p.inputs['Roughness'].default_value = 0.40

    return mat_red, mat_green, mat_pith

def get_tomato_skin_z(r, theta, r_xy, r_z, center_z):
    """Calcula matemáticamente la cota Z exacta de la piel superior del tomate en cualquier punto (r, theta)."""
    u_r = min(0.999, r / r_xy)
    z_base = center_z + r_z * math.sqrt(1.0 - u_r**2)

    # Cuenco del ombligo superior (stem cavity)
    dip_radius = r_xy * 0.42
    if r < dip_radius:
        dip_frac = 1.0 - (r / dip_radius)
        z_base -= (dip_frac ** 2.0) * (r_z * 0.28)
    return z_base

def build_heirloom_beefsteak_tomato(r_xy=0.20, r_z=0.160):
    """
    Construye un auténtico Tomate Maestro (Solanum lycopersicum):
    - Fruto voluptuoso con 6-7 costillas/lóbulos pronunciados y naturales en los hombros.
    - Cuenco de inserción pedicelar profundo (cavidad del tallo).
    - Cáliz botánico con 6 sépalos esbeltos, lanceolados y canaliculados en 'V', que abrazan
      los hombros del fruto y terminan en puntas elegantemente rizadas hacia arriba.
    - Cabo verde con la articulación nodular ('codo') de cosecha.
    """
    mat_red, mat_green, mat_pith = create_cartoon_materials()

    mesh = bpy.data.meshes.new("Tomato_Beefsteak_Mesh")
    obj = bpy.data.objects.new("Tomato_Beefsteak", mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(mat_red)    # 0: Red Fruit
    obj.data.materials.append(mat_green)  # 1: Green Foliage
    obj.data.materials.append(mat_pith)   # 2: Cut Stem Pith

    MAT_RED = 0
    MAT_GREEN = 1
    MAT_PITH = 2

    bm = bmesh.new()

    # =========================================================
    # 1. CUERPO DEL TOMATE (Beefsteak con costillas voluptuosas)
    # =========================================================
    u_seg = 64
    v_seg = 36
    center_z = r_z * 0.90

    sphere_geom = bmesh.ops.create_uvsphere(
        bm,
        u_segments=u_seg,
        v_segments=v_seg,
        radius=1.0,
        matrix=Matrix.Translation(Vector((0, 0, center_z)))
    )

    num_lobes = 6  # 6 costillas clásicas de tomate reliquia

    for v in sphere_geom['verts']:
        orig_dz = v.co.z - center_z
        z_norm = max(-1.0, min(1.0, orig_dz))
        theta = math.atan2(v.co.y, v.co.x)

        # Perfil vertical oblate (ligeramente aplanado en polos)
        v.co.z = center_z + z_norm * r_z

        # Anchura ecuatorial
        equator_w = math.sqrt(max(0.001, 1.0 - z_norm**2))
        
        # Hombros amplios
        shoulder_profile = 1.0 + 0.10 * (1.0 - z_norm**2)

        # Costillas / Lóbulos en los hombros claramente visibles (amplitud ~8%)
        lobe_envelope = max(0.0, (z_norm + 0.3) / 1.3) * (1.0 - z_norm**4)
        rib_wave = (0.078 * math.cos(num_lobes * theta) + 0.018 * math.cos(num_lobes * 2 * theta)) * lobe_envelope

        r_actual = r_xy * equator_w * shoulder_profile * (1.0 + rib_wave)

        v.co.x = math.cos(theta) * r_actual
        v.co.y = math.sin(theta) * r_actual

        # Cuenco de inserción superior (ombligo / stem cavity)
        dist_xy = math.sqrt(v.co.x**2 + v.co.y**2)
        if z_norm > 0.20 and dist_xy < (r_xy * 0.42):
            dip_factor = 1.0 - (dist_xy / (r_xy * 0.42))
            v.co.z -= (dip_factor ** 2.0) * (r_z * 0.28)

        # Cicatriz apical inferior
        if z_norm < -0.55 and dist_xy < (r_xy * 0.28):
            bot_factor = 1.0 - (dist_xy / (r_xy * 0.28))
            v.co.z += (bot_factor ** 2.0) * (r_z * 0.08)

    for f in {f for v in sphere_geom['verts'] for f in v.link_faces}:
        f.material_index = MAT_RED
        f.smooth = True

    # =========================================================
    # 2. CÁLIZ BOTÁNICO (6 sépalos esbeltos, lanceolados y curvados)
    # =========================================================
    z_skin_center = get_tomato_skin_z(0.0, 0.0, r_xy, r_z, center_z)
    top_center = Vector((0, 0, z_skin_center))

    # Receptáculo central verde (cúpula cónica suave)
    receptacle_r = 0.020
    receptacle_h = 0.009
    rec_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=16,
        radius1=receptacle_r * 1.08,
        radius2=receptacle_r * 0.75,
        depth=receptacle_h,
        matrix=Matrix.Translation(top_center + Vector((0, 0, receptacle_h * 0.5 + 0.002)))
    )
    for f in {f for v in rec_geom['verts'] for f in v.link_faces}:
        f.material_index = MAT_GREEN
        f.smooth = True

    # 6 sépalos con asimetría y longitud botánica esbelta
    sepal_configs = [
        # (angulo_grados, mult_longitud, mult_rizado, desvio_lateral)
        (  0.0, 1.05, 1.12,  0.00),
        ( 62.0, 0.98, 0.95,  0.02),
        (120.0, 1.08, 1.20, -0.02),
        (178.0, 0.95, 0.90,  0.01),
        (238.0, 1.06, 1.15, -0.03),
        (300.0, 1.00, 1.02,  0.02),
    ]

    r_base = receptacle_r * 0.78
    r_tip_nominal = r_xy * 0.68  # Alcance elegante (~13.6 cm)

    for (deg, len_mult, curl_mult, side_drift) in sepal_configs:
        base_angle = math.radians(deg)
        r_tip = r_tip_nominal * len_mult

        num_steps = 11
        prev_verts = None

        for step in range(num_steps + 1):
            u = step / float(num_steps)

            r_u = r_base + (r_tip - r_base) * u
            cur_angle = base_angle + side_drift * math.sin(u * math.pi)
            dir_x = math.cos(cur_angle)
            dir_y = math.sin(cur_angle)
            lat_x = -dir_y
            lat_y = dir_x

            z_skin = get_tomato_skin_z(r_u, cur_angle, r_xy, r_z, center_z)

            # Curvatura:
            # - En u <= 0.60: abraza la curvatura 2.5 mm por encima
            # - En u > 0.60: la punta se riza graciosamente hacia arriba en el aire
            if u <= 0.60:
                clearance = 0.0025
            else:
                t = (u - 0.60) / 0.40
                clearance = 0.0025 + (0.028 * curl_mult) * (t ** 1.7)

            z_spine = z_skin + clearance + 0.0028 * (1.0 - u)
            z_edges = z_skin + clearance
            z_bottom = z_skin + clearance - 0.0018

            # Anchura botánica esbelta lanceolada (afinado elegante hacia la punta, no patas de pato)
            if u < 0.22:
                width = 0.010 + (0.022 - 0.010) * (u / 0.22)
            else:
                width = 0.022 * ((1.0 - u) ** 1.25) + 0.0010

            pos_spine = Vector((dir_x * r_u, dir_y * r_u, z_spine))
            pos_left = Vector((dir_x * r_u - lat_x * width * 0.5, dir_y * r_u - lat_y * width * 0.5, z_edges))
            pos_right = Vector((dir_x * r_u + lat_x * width * 0.5, dir_y * r_u + lat_y * width * 0.5, z_edges))
            pos_bottom = Vector((dir_x * r_u, dir_y * r_u, z_bottom))

            v_l = bm.verts.new(pos_left)
            v_s = bm.verts.new(pos_spine)
            v_r = bm.verts.new(pos_right)
            v_b = bm.verts.new(pos_bottom)

            curr_verts = (v_l, v_s, v_r, v_b)

            if prev_verts is not None:
                f_top_l = bm.faces.new([prev_verts[0], curr_verts[0], curr_verts[1], prev_verts[1]])
                f_top_r = bm.faces.new([prev_verts[1], curr_verts[1], curr_verts[2], prev_verts[2]])
                f_bot_l = bm.faces.new([prev_verts[3], curr_verts[3], curr_verts[0], prev_verts[0]])
                f_bot_r = bm.faces.new([prev_verts[2], curr_verts[2], curr_verts[3], prev_verts[3]])

                for f in (f_top_l, f_top_r, f_bot_l, f_bot_r):
                    f.material_index = MAT_GREEN
                    f.smooth = True

            prev_verts = curr_verts

    # =========================================================
    # 3. CABO VERDE (Pedicelo con codo nodular de cosecha y curvatura)
    # =========================================================
    stem_root_z = z_skin_center + receptacle_h + 0.002
    stem_root = Vector((0, 0, stem_root_z))

    stem_path = [
        # (offset_xyz, radio)
        (Vector((0.000, 0.000, 0.000)), 0.0105),
        (Vector((0.001, 0.001, 0.016)), 0.0100),
        (Vector((0.003, 0.003, 0.030)), 0.0095),
        # ARTICULACIÓN / NUDO DE COSECHA (abscission node)
        (Vector((0.006, 0.005, 0.038)), 0.0135), # Engrosamiento del nudo
        (Vector((0.009, 0.008, 0.044)), 0.0105), # Constricción tras el nudo
        # Codo curvado natural
        (Vector((0.015, 0.013, 0.058)), 0.0095),
        (Vector((0.024, 0.020, 0.072)), 0.0090),
        (Vector((0.035, 0.028, 0.082)), 0.0085), # Extremo cortado
    ]

    prev_ring = None
    for idx, (offset_pos, ring_r) in enumerate(stem_path):
        is_cap = (idx == len(stem_path) - 1)
        center_pos = stem_root + offset_pos

        ring_geom = bmesh.ops.create_circle(
            bm,
            cap_ends=is_cap,
            segments=10,
            radius=ring_r,
            matrix=Matrix.Translation(center_pos)
        )
        curr_ring = ring_geom['verts']

        if prev_ring is not None:
            for s in range(len(curr_ring)):
                v1 = prev_ring[s]
                v2 = prev_ring[(s + 1) % len(curr_ring)]
                v3 = curr_ring[(s + 1) % len(curr_ring)]
                v4 = curr_ring[s]
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = MAT_GREEN
                f.smooth = True

        if is_cap:
            for f in {f for v in curr_ring for f in v.link_faces}:
                f.material_index = MAT_PITH
                f.smooth = True

        prev_ring = curr_ring

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    return obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\master_tomato.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando creación de Tomate Beefsteak Maestro V5 con Costillas Marcadas, Cáliz Esbelto y Cabo Real...\n")

        scene = setup_master_scene()
        obj = build_heirloom_beefsteak_tomato(r_xy=0.20, r_z=0.160)

        # Inclinación orgánica sutil para exhibir el cáliz, lóbulos y codo
        obj.rotation_euler = (math.radians(16), math.radians(-10), math.radians(28))

        blend_file = os.path.abspath(r"assets-src/crops/TOMATO_MASTER.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_tomato_raw.png")
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
