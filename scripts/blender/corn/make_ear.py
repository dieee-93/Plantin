import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os
import sys

def setup_ear_scene():
    """Configura la escena con iluminacion toon limpia para la Mazorca Maestra de Maiz."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    world = bpy.data.worlds.new("ToonEarWorld")
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

    # Relleno fresco
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

    # Camara ortografica en primer plano
    cam_data = bpy.data.cameras.new(name="CloseUpCam")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = 0.38
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

def create_ear_materials():
    """Crea los materiales toon botánicos con colores ricos estilo Nintendo/Ghibli."""
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
                if 'Subsurface Radius' in bsdf.inputs:
                    bsdf.inputs['Subsurface Radius'].default_value = (1.0, 0.6, 0.2)
        return mat

    # 1. Granos dorados de maíz maduros: amarillo dorado cálido y apetitoso con brillo
    mats['kernel'] = make_mat("Mat_Corn_Kernel", (0.96, 0.76, 0.14, 1.0), 0.24, spec=0.55, sss=0.22)
    # 2. Granos de acento (ligeramente más claros / manteca para variedad)
    mats['kernel_alt'] = make_mat("Mat_Corn_KernelAlt", (0.98, 0.85, 0.24, 1.0), 0.26, spec=0.50, sss=0.20)
    # 3. Marlo interior (fondo entre granos)
    mats['cob_core'] = make_mat("Mat_Corn_Core", (0.75, 0.55, 0.12, 1.0), 0.50)
    # 4. Chalas envolventes exteriores: verde lima pálido con matices crema
    mats['husk'] = make_mat("Mat_Corn_Husk", (0.38, 0.60, 0.24, 1.0), 0.38, spec=0.24)
    # 5. Chalas interiores secas / puntas de paja
    mats['husk_tip'] = make_mat("Mat_Corn_HuskTip", (0.68, 0.72, 0.38, 1.0), 0.45)
    # 6. Barbas / Sedas de choclo (estigmas cobrizos / ámbar intenso)
    mats['silk'] = make_mat("Mat_Corn_Silk", (0.82, 0.38, 0.10, 1.0), 0.40, spec=0.30)
    # 7. Pedúnculo basal
    mats['shank'] = make_mat("Mat_Corn_Shank", (0.26, 0.48, 0.20, 1.0), 0.38)

    return mats

def append_corn_ear(bm, origin, direction, length=0.18, radius=0.034, mat_kernel=0, mat_husk=1, mat_silk=2, mat_shank=3, mats_dict=None):
    """
    Construye una MAZORCA BOTÁNICA DE MAÍZ PROFESIONAL:
    - 3D Real Kernels: Hileras ordenadas de granos redondeados individuales en relieve (volumétricos, no cilindro plano).
    - Chalas abiertas voluptuosas: 6 brácteas anchas con curvatura orgánica que se abren mostrando la mazorca.
    - Cabellera de sedas de choclo (estigmas) copiosa y ondulada cayendo en cascada.
    """
    mat_alt = mat_kernel

    dir_fwd = direction.normalized()
    up_ref = Vector((0, 0, 1)) if abs(dir_fwd.z) < 0.9 else Vector((1, 0, 0))
    side_u = dir_fwd.cross(up_ref).normalized()
    side_v = side_u.cross(dir_fwd).normalized()

    # =========================================================================
    # 1. PEDÚNCULO / CABO BASAL ROBUSTO CON NUDOS
    # =========================================================================
    shank_len = 0.040
    p_steps = 5
    p_rings = []
    for s in range(p_steps + 1):
        frac = s / float(p_steps)
        p_center = origin - dir_fwd * (shank_len * (1.0 - frac))
        r = 0.007 * (0.85 + 0.35 * frac)
        ring = []
        for a_idx in range(6):
            ang = a_idx * (2.0 * math.pi / 6.0)
            pt = p_center + (side_u * math.cos(ang) + side_v * math.sin(ang)) * r
            ring.append(bm.verts.new(pt))
        p_rings.append(ring)

    for s in range(p_steps):
        for a_idx in range(6):
            na = (a_idx + 1) % 6
            f = bm.faces.new([p_rings[s][a_idx], p_rings[s + 1][a_idx], p_rings[s + 1][na], p_rings[s][na]])
            f.material_index = mat_shank
            f.smooth = True

    # =========================================================================
    # 2. CUERPO DE LA MAZORCA CON GRANOS DORADOS INDIVIDUALES (3D KERNEL PILLOWS)
    # =========================================================================
    # Generamos granos prominentes en 12 hileras longitudinales y 16 niveles de altura
    num_cols = 12
    num_rows = 16

    # Radio base del marlo a lo largo de la mazorca (cilindro con punta cónica roma)
    def cob_radius_at(frac):
        # Base gruesa (0.0), ligera panza en 0.35, punta cónica redondeada en 1.0
        return radius * math.sin(frac * math.pi * 0.78 + 0.22) * (1.08 - 0.38 * (frac ** 1.8))

    # Para cada cuadrante (col, row), creamos un grano 3D abultado
    for row in range(num_rows):
        frac_0 = row / float(num_rows)
        frac_1 = (row + 1) / float(num_rows)
        frac_m = (frac_0 + frac_1) * 0.5

        r_base0 = cob_radius_at(frac_0)
        r_base1 = cob_radius_at(frac_1)
        r_mid = cob_radius_at(frac_m)

        z0 = origin + dir_fwd * (length * frac_0)
        z1 = origin + dir_fwd * (length * frac_1)
        zm = origin + dir_fwd * (length * frac_m)

        for col in range(num_cols):
            ang_0 = col * (2.0 * math.pi / num_cols)
            ang_1 = (col + 1) * (2.0 * math.pi / num_cols)
            ang_m = (ang_0 + ang_1) * 0.5

            # Cuatro esquinas de la base del grano (en las ranuras inter-grano)
            p00 = z0 + (side_u * math.cos(ang_0) + side_v * math.sin(ang_0)) * (r_base0 * 0.94)
            p10 = z0 + (side_u * math.cos(ang_1) + side_v * math.sin(ang_1)) * (r_base0 * 0.94)
            p11 = z1 + (side_u * math.cos(ang_1) + side_v * math.sin(ang_1)) * (r_base1 * 0.94)
            p01 = z1 + (side_u * math.cos(ang_0) + side_v * math.sin(ang_0)) * (r_base1 * 0.94)

            # Vértice central del grano proyectado fuertemente hacia afuera (relieve 3D)
            kernel_bump = 0.0055 * (1.0 - frac_m * 0.30)
            pm = zm + (side_u * math.cos(ang_m) + side_v * math.sin(ang_m)) * (r_mid + kernel_bump)

            v00 = bm.verts.new(p00)
            v10 = bm.verts.new(p10)
            v11 = bm.verts.new(p11)
            v01 = bm.verts.new(p01)
            vm  = bm.verts.new(pm)

            # Construir las 4 facetas triangulares del grano en pirámide redondeada
            cur_mat = mat_kernel if (col + row) % 3 != 0 else mat_alt

            for tri in [[v00, v10, vm], [v10, v11, vm], [v11, v01, vm], [v01, v00, vm]]:
                try:
                    f = bm.faces.new(tri)
                    f.material_index = cur_mat
                    f.smooth = True
                except ValueError:
                    pass

    # Tapa roma superior del marlo
    top_center = origin + dir_fwd * length
    top_r = cob_radius_at(1.0)
    top_v_cen = bm.verts.new(top_center + dir_fwd * 0.006)
    for col in range(num_cols):
        a1 = col * (2.0 * math.pi / num_cols)
        a2 = (col + 1) * (2.0 * math.pi / num_cols)
        p1 = top_center + (side_u * math.cos(a1) + side_v * math.sin(a1)) * top_r
        p2 = top_center + (side_u * math.cos(a2) + side_v * math.sin(a2)) * top_r
        try:
            f = bm.faces.new([top_v_cen, bm.verts.new(p1), bm.verts.new(p2)])
            f.material_index = mat_kernel
            f.smooth = True
        except ValueError:
            pass

    # =========================================================================
    # 3. CHALAS VOLUPTUOSAS ENTREABIERTAS (HUSKS / ESPATAS ORGÁNICAS)
    # =========================================================================
    # 6 chalas anchas bien definidas:
    # - 3 chalas traseras/laterales que envuelven y sostienen la mazorca
    # - 3 chalas delanteras que se abren, se doblan y se rizan hacia abajo con elegancia
    husk_specs = [
        # (angulo_base, longitud_relativa, ancho_max, factor_apertura, curva_punta)
        (math.radians( 20), 0.88, 0.046,  0.038,  0.025), # Delantera derecha (abierta y curvada hacia afuera)
        (math.radians( 80), 0.94, 0.048,  0.042,  0.030), # Delantera centro (muy abierta, revela granos)
        (math.radians(140), 0.88, 0.046,  0.036,  0.022), # Delantera izquierda (abierta)
        (math.radians(205), 1.05, 0.052, -0.005, -0.005), # Trasera izquierda (envuelve y abraza)
        (math.radians(270), 1.08, 0.054, -0.006, -0.005), # Trasera centro (soporte posterior)
        (math.radians(335), 1.05, 0.052, -0.005, -0.005), # Trasera derecha (abraza)
    ]

    for base_ang, h_len_factor, h_width, flare_out, curl_tip in husk_specs:
        h_dir_rad = (side_u * math.cos(base_ang) + side_v * math.sin(base_ang)).normalized()
        h_tan = h_dir_rad.cross(dir_fwd).normalized()

        steps = 10
        h_pts_r = []
        h_pts_l = []

        h_total_len = length * h_len_factor

        for s in range(steps + 1):
            t = s / float(steps)
            h_pos = origin + dir_fwd * (h_total_len * t)

            # Radio basal ajustado
            r_cob_local = cob_radius_at(min(1.0, t * h_len_factor))
            r_husk = (r_cob_local * 1.08) + (flare_out * (t ** 2.2)) + (curl_tip * (t ** 3.0))

            center_husk = h_pos + h_dir_rad * r_husk

            # Anchura de la chala con perfil en huso botánico
            w = h_width * math.sin(t * math.pi * 0.92) * (1.15 - 0.35 * t)
            if t < 0.12:
                w = h_width * (0.4 + 0.6 * (t / 0.12))

            # Sección transversal abarquillada en U para abrazar el contorno
            u_cup = 0.004 * (1.0 - t * 0.5)

            p_right = center_husk + h_tan * (w * 0.5) - h_dir_rad * u_cup
            p_left  = center_husk - h_tan * (w * 0.5) - h_dir_rad * u_cup

            h_pts_r.append(bm.verts.new(p_right))
            h_pts_l.append(bm.verts.new(p_left))

        for s in range(steps):
            f_verts = [h_pts_r[s], h_pts_r[s + 1], h_pts_l[s + 1], h_pts_l[s]]
            try:
                f = bm.faces.new(f_verts)
                f.material_index = mat_husk
                f.smooth = True
            except ValueError:
                pass

    # =========================================================================
    # 4. BARBAS / SEDAS DE CHOCLO COPIOSAS Y ONDULADAS EN CASCADA
    # =========================================================================
    # 28 hebras orgánicas con rizos y caída fluida
    num_silks = 28
    for si in range(num_silks):
        ang = si * (2.0 * math.pi / num_silks)
        s_rad_dir = (side_u * math.cos(ang) + side_v * math.sin(ang)).normalized()

        # Las barbas emergen del ápice y se derraman preferentemente hacia adelante / abajo
        s_dir = (dir_fwd * 0.65 + Vector((0.2, 0.2, -0.65)) + s_rad_dir * 0.35).normalized()
        silk_len = 0.075 + 0.035 * math.sin(si * 2.1)

        s_steps = 6
        prev_p = top_center + s_rad_dir * (radius * 0.45)
        for sp in range(s_steps):
            t = (sp + 1) / float(s_steps)
            # Doble ondulacion armonica para rizo sedoso
            wave = (0.006 * math.sin(t * math.pi * 2.5 + si)) * s_rad_dir
            curr_p = top_center + s_dir * (silk_len * t) + wave

            thick = 0.0014 * (1.0 - t * 0.45)
            ortho = s_dir.cross(s_rad_dir).normalized() * (thick * 0.5)

            v1 = bm.verts.new(prev_p - ortho)
            v2 = bm.verts.new(prev_p + ortho)
            v3 = bm.verts.new(curr_p + ortho)
            v4 = bm.verts.new(curr_p - ortho)
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = mat_silk
                f.smooth = True
            except ValueError:
                pass
            prev_p = curr_p

def build_master_ear():
    """Construye la MAZORCA MAESTRA de maiz."""
    scene = setup_ear_scene()
    mats = create_ear_materials()

    mesh = bpy.data.meshes.new("Corn_Ear_Master_Mesh")
    obj = bpy.data.objects.new("Corn_Ear_Master", mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(mats['kernel'])    # 0
    obj.data.materials.append(mats['husk'])      # 1
    obj.data.materials.append(mats['silk'])      # 2
    obj.data.materials.append(mats['shank'])     # 3
    obj.data.materials.append(mats['kernel_alt'])# 4

    bm = bmesh.new()

    append_corn_ear(
        bm=bm,
        origin=Vector((0, 0, 0)),
        direction=Vector((0.45, 0.45, 0.76)).normalized(),
        length=0.20,
        radius=0.036,
        mats_dict=None
    )

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sol_mod = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    sol_mod.thickness = 0.0008
    sol_mod.offset = 0.0

    return scene, obj

def main():
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\ear_corn.log"
    import traceback
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando generacion de Mazorca Maestra de Maiz con Granos 3D y Chalas Voluptuosas...\n")

        scene, obj = build_master_ear()

        blend_file = os.path.abspath(r"assets-src/crops/CORN_EAR_MASTER.blend")
        os.makedirs(os.path.dirname(blend_file), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)

        out_raw = os.path.abspath(r"scripts/out/master_corn_ear_raw.png")
        os.makedirs(os.path.dirname(out_raw), exist_ok=True)
        scene.render.filepath = out_raw
        bpy.ops.render.render(write_still=True)

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Mazorca Maestra completada con exito.\nBlend: {blend_file}\nRender Raw: {out_raw}\n")
    except Exception as e:
        err = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err}\n")

if __name__ == "__main__":
    main()
