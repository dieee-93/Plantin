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

    # Sol principal noroeste (luz dorada suave)
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 2.9
    sun_data.color = (1.0, 0.98, 0.94)
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), math.radians(15), math.radians(45))

    # Luz de relleno opuesta
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

def enhance_corn_iter4(obj):
    """
    Iteración 4:
    1. Geometría:
       - Panoja apical con ramificación radial completa.
       - Hojas curvadas naturalmente con caída por gravedad.
       - Solidify 0.006m + Subsurf nivel 1 + Shade Smooth.
    2. Separación de Materiales:
       - La Panoja apical (flores) se separa del choclo en su propio material 'Tassel_Gold' (pajizo/polen seco, roughness 0.65).
       - Choclo 'Yellow_Kernels' con cuadrícula Voronoi en relieve, granos individuales y sedas cobrizas en la punta.
       - Chalas 'DarkGreen2' con fibras longitudinales.
       - Hojas y tallo 'Green' con Oclusión Ambiental (sombras en axilas de las hojas) + Rim light sutil de contorno.
    """
    mesh = obj.data

    # A) Dispersión 3D de la panoja y curvatura de hojas
    for v in mesh.vertices:
        if v.co.z > 1.74:
            dist_x = abs(v.co.x)
            if dist_x > 0.02:
                angle = (v.index % 7) * (math.pi / 3.5)
                v.co.y += math.sin(angle) * (dist_x * 0.60)
        elif 0.35 < v.co.z < 1.65:
            dist_from_stalk = math.sqrt(v.co.x**2 + v.co.y**2)
            if dist_from_stalk > 0.18:
                droop = (dist_from_stalk - 0.18) ** 1.6 * 0.19
                v.co.z -= droop

    mesh.update()

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Modificadores
    solid = obj.modifiers.new(name="Leaf_Thickness", type='SOLIDIFY')
    solid.thickness = 0.006
    solid.use_rim = True

    subd = obj.modifiers.new(name="Organic_Curves", type='SUBSURF')
    subd.levels = 1
    subd.render_levels = 1

    try:
        bpy.ops.object.shade_smooth()
    except:
        for poly in obj.data.polygons:
            poly.use_smooth = True

    # Asignar material propio a la panoja superior (polígonos con z > 1.74m)
    tassel_mat = bpy.data.materials.new(name="Tassel_Pollen")
    tassel_mat.use_nodes = True
    t_nt = tassel_mat.node_tree
    t_nt.nodes.clear()
    t_out = t_nt.nodes.new("ShaderNodeOutputMaterial")
    t_bsdf = t_nt.nodes.new("ShaderNodeBsdfPrincipled")
    t_bsdf.inputs['Base Color'].default_value = (0.86, 0.72, 0.32, 1.0) # Amarillo pajizo de espiga seca
    t_bsdf.inputs['Roughness'].default_value = 0.65
    t_nt.links.new(t_bsdf.outputs['BSDF'], t_out.inputs['Surface'])
    
    tassel_slot_idx = len(obj.material_slots)
    obj.data.materials.append(tassel_mat)

    for poly in mesh.polygons:
        # Si el centroide del polígono está arriba en la panoja y tiene material Yellow
        if poly.center.z > 1.74 and poly.material_index < len(obj.material_slots):
            poly.material_index = tassel_slot_idx

    # Shaders para los otros slots
    for slot_idx in range(tassel_slot_idx):
        slot = obj.material_slots[slot_idx]
        old_mat = slot.material
        if not old_mat:
            continue
        new_mat = old_mat.copy()
        new_mat.name = f"{old_mat.name}_Iter4"
        slot.material = new_mat

        new_mat.use_nodes = True
        nt = new_mat.node_tree
        nt.nodes.clear()

        out_node = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        mix_shader = nt.nodes.new("ShaderNodeMixShader")
        translucent = nt.nodes.new("ShaderNodeBsdfTranslucent")

        mname = old_mat.name

        if "Green" in mname and "Dark" not in mname:
            # HOJAS Y TALLO: Z-gradient + nervadura central + Ambient Occlusion en hendiduras
            tex_coord = nt.nodes.new("ShaderNodeTexCoord")
            sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")

            z_ramp = nt.nodes.new("ShaderNodeValToRGB")
            z_ramp.color_ramp.interpolation = 'LINEAR'
            z_ramp.color_ramp.elements[0].position = 0.12
            z_ramp.color_ramp.elements[0].color = (0.07, 0.22, 0.06, 1.0) # Base profunda
            z_ramp.color_ramp.elements[1].position = 0.85
            z_ramp.color_ramp.elements[1].color = (0.24, 0.54, 0.15, 1.0) # Hoja sana

            nt.links.new(tex_coord.outputs['Generated'], sep_xyz.inputs['Vector'])
            nt.links.new(sep_xyz.outputs['Z'], z_ramp.inputs['Fac'])

            # Nervadura central sutil (Midrib)
            noise_rib = nt.nodes.new("ShaderNodeTexNoise")
            noise_rib.inputs['Scale'].default_value = 40.0
            noise_rib.inputs['Detail'].default_value = 2.0

            mix_rib = nt.nodes.new("ShaderNodeMix")
            mix_rib.data_type = 'RGBA'
            mix_rib.blend_type = 'SCREEN'
            mix_rib.inputs['Factor'].default_value = 0.12
            nt.links.new(z_ramp.outputs['Color'], mix_rib.inputs[6])
            nt.links.new(noise_rib.outputs['Color'], mix_rib.inputs[7])

            # Rim highlight en los bordes de la hoja (Fresnel)
            fresnel = nt.nodes.new("ShaderNodeFresnel")
            fresnel.inputs['IOR'].default_value = 1.35
            mix_rim = nt.nodes.new("ShaderNodeMix")
            mix_rim.data_type = 'RGBA'
            mix_rim.blend_type = 'SCREEN'
            mix_rim.inputs['Factor'].default_value = 0.10
            nt.links.new(mix_rib.outputs[2], mix_rim.inputs[6])
            nt.links.new(fresnel.outputs['Fac'], mix_rim.inputs[7])

            nt.links.new(mix_rim.outputs[2], bsdf.inputs['Base Color'])
            nt.links.new(mix_rim.outputs[2], translucent.inputs['Color'])

            bsdf.inputs['Roughness'].default_value = 0.38
            mix_shader.inputs['Fac'].default_value = 0.22

            nt.links.new(bsdf.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

        elif "Yellow" in mname:
            # MAZORCA (Kernels con relieve Voronoi y sedas cobrizas en la punta)
            tex_coord = nt.nodes.new("ShaderNodeTexCoord")
            voronoi = nt.nodes.new("ShaderNodeTexVoronoi")
            voronoi.feature = 'F1'
            voronoi.distance = 'MANHATTAN'
            voronoi.inputs['Scale'].default_value = 75.0

            bump = nt.nodes.new("ShaderNodeBump")
            bump.inputs['Strength'].default_value = 0.38
            bump.inputs['Distance'].default_value = 0.045
            nt.links.new(voronoi.outputs['Distance'], bump.inputs['Height'])
            nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

            grain_ramp = nt.nodes.new("ShaderNodeValToRGB")
            grain_ramp.color_ramp.interpolation = 'LINEAR'
            grain_ramp.color_ramp.elements[0].position = 0.15
            grain_ramp.color_ramp.elements[0].color = (0.95, 0.72, 0.06, 1.0)
            grain_ramp.color_ramp.elements[1].position = 0.85
            grain_ramp.color_ramp.elements[1].color = (1.0, 0.86, 0.24, 1.0)

            nt.links.new(tex_coord.outputs['Object'], voronoi.inputs['Vector'])
            nt.links.new(voronoi.outputs['Distance'], grain_ramp.inputs['Fac'])

            # Sedas en punta
            sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
            nt.links.new(tex_coord.outputs['Generated'], sep_xyz.inputs['Vector'])
            silk_ramp = nt.nodes.new("ShaderNodeValToRGB")
            silk_ramp.color_ramp.interpolation = 'LINEAR'
            silk_ramp.color_ramp.elements[0].position = 0.75
            silk_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
            silk_ramp.color_ramp.elements[1].position = 0.98
            silk_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
            nt.links.new(sep_xyz.outputs['Z'], silk_ramp.inputs['Fac'])

            mix_silk = nt.nodes.new("ShaderNodeMix")
            mix_silk.data_type = 'RGBA'
            mix_silk.blend_type = 'MIX'
            mix_silk.inputs[7].default_value = (0.75, 0.42, 0.12, 1.0)
            nt.links.new(silk_ramp.outputs['Color'], mix_silk.inputs['Factor'])
            nt.links.new(grain_ramp.outputs['Color'], mix_silk.inputs[6])

            nt.links.new(mix_silk.outputs[2], bsdf.inputs['Base Color'])
            nt.links.new(mix_silk.outputs[2], translucent.inputs['Color'])

            bsdf.inputs['Roughness'].default_value = 0.25
            mix_shader.inputs['Fac'].default_value = 0.18

            nt.links.new(bsdf.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

        elif "DarkGreen2" in mname:
            # CHALAS
            tex_coord = nt.nodes.new("ShaderNodeTexCoord")
            noise_husk = nt.nodes.new("ShaderNodeTexNoise")
            noise_husk.inputs['Scale'].default_value = 32.0
            noise_husk.inputs['Detail'].default_value = 2.0

            husk_ramp = nt.nodes.new("ShaderNodeValToRGB")
            husk_ramp.color_ramp.interpolation = 'LINEAR'
            husk_ramp.color_ramp.elements[0].color = (0.16, 0.38, 0.10, 1.0)
            husk_ramp.color_ramp.elements[1].color = (0.28, 0.48, 0.16, 1.0)

            nt.links.new(tex_coord.outputs['Object'], noise_husk.inputs['Vector'])
            nt.links.new(noise_husk.outputs['Color'], husk_ramp.inputs['Fac'])

            nt.links.new(husk_ramp.outputs['Color'], bsdf.inputs['Base Color'])
            nt.links.new(husk_ramp.outputs['Color'], translucent.inputs['Color'])

            bsdf.inputs['Roughness'].default_value = 0.52
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

# Ejecutar Iteración 4
render_3_views("iter4_refined", enhance_fn=enhance_corn_iter4)
