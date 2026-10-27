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

    # Sol principal noroeste (luz dorada cálida)
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.8
    sun_data.color = (1.0, 0.98, 0.93)
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), math.radians(15), math.radians(45))

    # Luz de relleno suave opuesta
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.9
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

def enhance_corn_iter1(obj):
    """
    Iteración 1 basada en el análisis visual de referencias:
    1. Solidify (0.008m): para dar espesor real a hojas y panoja (eliminar efecto papel 2D).
    2. Subsurf nivel 1 + Shade Smooth: para curvaturas elegantes de tallo y hojas.
    3. Shaders botánicos:
       - Green (hojas/tallo): Z-Gradient botánico + 25% Translucent BSDF.
       - Yellow (granos de choclo/panoja): Amarillo dorado dulce con specular jugoso.
       - DarkGreen2 (chalas): Verde pajizo envolvente con contraste.
    """
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # 1. Modificador Solidify
    solid = obj.modifiers.new(name="Leaf_Thickness", type='SOLIDIFY')
    solid.thickness = 0.007
    solid.use_rim = True

    # 2. Modificador Subdivision Surface nivel 1
    subd = obj.modifiers.new(name="Organic_Curves", type='SUBSURF')
    subd.levels = 1
    subd.render_levels = 1

    try:
        bpy.ops.object.shade_smooth()
    except:
        for poly in obj.data.polygons:
            poly.use_smooth = True

    # 3. Materiales mejorados
    for slot in obj.material_slots:
        old_mat = slot.material
        if not old_mat:
            continue
        new_mat = old_mat.copy()
        new_mat.name = f"{old_mat.name}_Iter1"
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
            # Tallo y hojas: Z-gradient + translucidez
            tex_coord = nt.nodes.new("ShaderNodeTexCoord")
            sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
            color_ramp = nt.nodes.new("ShaderNodeValToRGB")
            color_ramp.color_ramp.interpolation = 'LINEAR'
            # Base verde tallo profundo -> Hojas superiores verde lima iluminado
            color_ramp.color_ramp.elements[0].position = 0.15
            color_ramp.color_ramp.elements[0].color = (0.08, 0.26, 0.07, 1.0)
            color_ramp.color_ramp.elements[1].position = 0.88
            color_ramp.color_ramp.elements[1].color = (0.32, 0.68, 0.16, 1.0)

            nt.links.new(tex_coord.outputs['Generated'], sep_xyz.inputs['Vector'])
            nt.links.new(sep_xyz.outputs['Z'], color_ramp.inputs['Fac'])
            nt.links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
            nt.links.new(color_ramp.outputs['Color'], translucent.inputs['Color'])

            bsdf.inputs['Roughness'].default_value = 0.38
            mix_shader.inputs['Fac'].default_value = 0.25 # 25% luz solar atraviesa la hoja

            nt.links.new(bsdf.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

        elif mname == "Yellow":
            # Granos de choclo y espiga apical: Amarillo dorado con brillo
            # Grano de maíz dulce: reflectivo y vibrante
            bsdf.inputs['Base Color'].default_value = (0.98, 0.80, 0.12, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.24 # Brillo de grano jugoso
            translucent.inputs['Color'].default_value = (0.95, 0.70, 0.10, 1.0)
            mix_shader.inputs['Fac'].default_value = 0.20

            nt.links.new(bsdf.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

        elif mname == "DarkGreen2":
            # Chalas protectoras de la mazorca (Husk)
            # Verde oliva más seco y fibroso
            bsdf.inputs['Base Color'].default_value = (0.20, 0.42, 0.12, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.50
            translucent.inputs['Color'].default_value = (0.25, 0.48, 0.15, 1.0)
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

# Ejecutar Iteración 1
render_3_views("iter1_enhanced", enhance_fn=enhance_corn_iter1)
