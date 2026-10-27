import bpy
import math
import os

out_dir = r"i:\Programacion\Proyectos\plantin\scripts\out\corn_feedback"
os.makedirs(out_dir, exist_ok=True)
blend_path = r"i:\Programacion\Proyectos\plantin\src\assets\vendor\quaternius-crops\Blends\Corn_4.blend"

def setup_scene():
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    for obj in list(bpy.data.objects):
        if obj.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(obj, do_unlink=True)

    world = bpy.data.worlds.get("World")
    if not world:
        world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.92, 0.94, 0.97, 1.0)
        bg.inputs['Strength'].default_value = 0.75

    # Sol principal noroeste (dorado cálido)
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.85
    sun_data.color = (1.0, 0.98, 0.93)
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), math.radians(15), math.radians(45))

    # Relleno frío suave
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.85
    fill_data.color = (0.85, 0.92, 1.0)
    fill = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.rotation_euler = (math.radians(45), math.radians(-30), math.radians(-135))

    scene = bpy.context.scene
    scene.render.resolution_x = 360
    scene.render.resolution_y = 480
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

def enhance_corn_iter2(obj):
    """
    Iteración 2:
    1. Geometría: Dispersión 3D de la panoja apical para que tenga volumen en 360°.
    2. Modificadores: Solidify (0.007m) + Subsurf nivel 1 + Shade Smooth.
    3. Shaders botánicos refinados:
       - Green: Z-gradient + Nervadura central más clara (midrib) + Translucent BSDF 25%.
       - Yellow: Choclos con degradé de sedas cobrizas en la punta (corn silk) + brillo especular.
       - DarkGreen2: Chalas con textura fibrosa longitudinal.
    """
    # 1. DISPERSIÓN 3D DE LA PANOJA (Z > 1.70 m)
    mesh = obj.data
    for v in mesh.vertices:
        if v.co.z > 1.74:
            # Si no es el eje central del tallo (abs(x) > 0.015)
            dist_x = abs(v.co.x)
            if dist_x > 0.02:
                # Dispersar en Y alternando según el índice del vértice y distancia
                angle = (v.index % 7) * (math.pi / 3.5)
                fan_offset = math.sin(angle) * (dist_x * 0.55)
                v.co.y += fan_offset

    mesh.update()

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # 2. Modificadores
    solid = obj.modifiers.new(name="Leaf_Thickness", type='SOLIDIFY')
    solid.thickness = 0.007
    solid.use_rim = True

    subd = obj.modifiers.new(name="Organic_Curves", type='SUBSURF')
    subd.levels = 1
    subd.render_levels = 1

    try:
        bpy.ops.object.shade_smooth()
    except:
        for poly in obj.data.polygons:
            poly.use_smooth = True

    # 3. Materiales refinados
    for slot in obj.material_slots:
        old_mat = slot.material
        if not old_mat:
            continue
        new_mat = old_mat.copy()
        new_mat.name = f"{old_mat.name}_Iter2"
        slot.material = new_mat

        new_mat.use_nodes = True
        nt = new_mat.node_tree
        nt.nodes.clear()

        out_node = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        mix_shader = nt.nodes.new("ShaderNodeMixShader")
        translucent = nt.nodes.new("ShaderNodeBsdfTranslucent")

        mname = old_mat.name

        if mname == "Green":
            # HOJAS Y TALLO: Z-gradient + nervadura central (midrib)
            tex_coord = nt.nodes.new("ShaderNodeTexCoord")
            sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")

            # 1. Gradiente Z por altura
            z_ramp = nt.nodes.new("ShaderNodeValToRGB")
            z_ramp.color_ramp.interpolation = 'LINEAR'
            z_ramp.color_ramp.elements[0].position = 0.15
            z_ramp.color_ramp.elements[0].color = (0.08, 0.25, 0.07, 1.0) # Base profunda
            z_ramp.color_ramp.elements[1].position = 0.88
            z_ramp.color_ramp.elements[1].color = (0.30, 0.65, 0.15, 1.0) # Follaje superior

            nt.links.new(tex_coord.outputs['Generated'], sep_xyz.inputs['Vector'])
            nt.links.new(sep_xyz.outputs['Z'], z_ramp.inputs['Fac'])

            # 2. Nervadura central (Midrib): franja verde lima más clara a lo largo de las hojas
            noise_rib = nt.nodes.new("ShaderNodeTexNoise")
            noise_rib.inputs['Scale'].default_value = 35.0
            noise_rib.inputs['Detail'].default_value = 1.5

            mix_rib = nt.nodes.new("ShaderNodeMix")
            mix_rib.data_type = 'RGBA'
            mix_rib.blend_type = 'SCREEN'
            mix_rib.inputs['Factor'].default_value = 0.16 # Brillo sutil de nervadura
            nt.links.new(z_ramp.outputs['Color'], mix_rib.inputs[6])
            nt.links.new(noise_rib.outputs['Color'], mix_rib.inputs[7])

            # Conectar a BSDF y Translucent
            nt.links.new(mix_rib.outputs[2], bsdf.inputs['Base Color'])
            nt.links.new(mix_rib.outputs[2], translucent.inputs['Color'])

            bsdf.inputs['Roughness'].default_value = 0.36
            mix_shader.inputs['Fac'].default_value = 0.25

            nt.links.new(bsdf.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

        elif mname == "Yellow":
            # CHOCLO Y PANOJA: Granos dorados con ápice de sedas cobrizas (Corn silk)
            tex_coord = nt.nodes.new("ShaderNodeTexCoord")
            sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")

            silk_ramp = nt.nodes.new("ShaderNodeValToRGB")
            silk_ramp.color_ramp.interpolation = 'LINEAR'
            # Base y centro: Amarillo dorado jugoso
            silk_ramp.color_ramp.elements[0].position = 0.30
            silk_ramp.color_ramp.elements[0].color = (0.98, 0.80, 0.12, 1.0)
            # Ápice superior: Tono ámbar/cobrizo de las sedas
            silk_ramp.color_ramp.elements[1].position = 0.95
            silk_ramp.color_ramp.elements[1].color = (0.78, 0.48, 0.14, 1.0)

            nt.links.new(tex_coord.outputs['Generated'], sep_xyz.inputs['Vector'])
            nt.links.new(sep_xyz.outputs['Z'], silk_ramp.inputs['Fac'])

            nt.links.new(silk_ramp.outputs['Color'], bsdf.inputs['Base Color'])
            nt.links.new(silk_ramp.outputs['Color'], translucent.inputs['Color'])

            bsdf.inputs['Roughness'].default_value = 0.22 # Brillo de grano
            mix_shader.inputs['Fac'].default_value = 0.20

            nt.links.new(bsdf.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

        elif mname == "DarkGreen2":
            # CHALAS DE LA MAZORCA (Husk): Verde pajizo fibroso
            tex_coord = nt.nodes.new("ShaderNodeTexCoord")
            wave = nt.nodes.new("ShaderNodeTexWave")
            wave.wave_type = 'BANDS'
            wave.bands_direction = 'Z'
            wave.inputs['Scale'].default_value = 40.0
            wave.inputs['Distortion'].default_value = 1.2

            husk_ramp = nt.nodes.new("ShaderNodeValToRGB")
            husk_ramp.color_ramp.interpolation = 'LINEAR'
            husk_ramp.color_ramp.elements[0].color = (0.18, 0.40, 0.11, 1.0) # Verde envoltura
            husk_ramp.color_ramp.elements[1].color = (0.32, 0.52, 0.18, 1.0) # Veta pajiza clara

            nt.links.new(tex_coord.outputs['Generated'], wave.inputs['Vector'])
            nt.links.new(wave.outputs['Color'], husk_ramp.inputs['Fac'])

            nt.links.new(husk_ramp.outputs['Color'], bsdf.inputs['Base Color'])
            nt.links.new(husk_ramp.outputs['Color'], translucent.inputs['Color'])

            bsdf.inputs['Roughness'].default_value = 0.48
            mix_shader.inputs['Fac'].default_value = 0.15

            nt.links.new(bsdf.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

def render_3_views(prefix, enhance_fn=None):
    setup_scene()
    corn_obj = bpy.data.objects.get("Corn_4")
    if enhance_fn and corn_obj:
        enhance_fn(corn_obj)

    scene = bpy.context.scene
    ortho_scale = 2.4
    dist = 10.0
    center_z = 0.98

    # 1. Frontal
    cam_front = bpy.data.objects.new("CamFront", bpy.data.cameras.new("CamFront"))
    cam_front.data.type = 'ORTHO'
    cam_front.data.ortho_scale = ortho_scale
    bpy.context.collection.objects.link(cam_front)
    cam_front.location = (0, -dist, center_z)
    cam_front.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam_front
    scene.render.filepath = os.path.join(out_dir, f"{prefix}_front.png")
    bpy.ops.render.render(write_still=True)

    # 2. Lateral
    cam_side = bpy.data.objects.new("CamSide", bpy.data.cameras.new("CamSide"))
    cam_side.data.type = 'ORTHO'
    cam_side.data.ortho_scale = ortho_scale
    bpy.context.collection.objects.link(cam_side)
    cam_side.location = (dist, 0, center_z)
    cam_side.rotation_euler = (math.radians(90), 0, math.radians(90))
    scene.camera = cam_side
    scene.render.filepath = os.path.join(out_dir, f"{prefix}_side.png")
    bpy.ops.render.render(write_still=True)

    # 3. Isométrica
    cam_iso = bpy.data.objects.new("CamIso", bpy.data.cameras.new("CamIso"))
    cam_iso.data.type = 'ORTHO'
    cam_iso.data.ortho_scale = ortho_scale
    bpy.context.collection.objects.link(cam_iso)
    cam_iso.rotation_euler = (math.radians(60), 0, math.radians(45))
    cam_iso.location = (
        dist * math.sin(math.radians(45)) * math.sin(math.radians(60)),
        -dist * math.cos(math.radians(45)) * math.sin(math.radians(60)),
        center_z + dist * math.cos(math.radians(60))
    )
    scene.camera = cam_iso
    scene.render.filepath = os.path.join(out_dir, f"{prefix}_iso.png")
    bpy.ops.render.render(write_still=True)
    print(f"Renders terminados para {prefix}")

# Ejecutar Iteración 2
render_3_views("iter2_refined", enhance_fn=enhance_corn_iter2)
