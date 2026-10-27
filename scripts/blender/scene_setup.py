"""
Configuración determinística de escena Blender para el pipeline de sprites de Plantin v2.
Define cámara ortográfica 2:1, iluminación solar NW, render Eevee y gestión de color Standard.
"""

import bpy
import math
from mathutils import Vector

def setup_camera(scene, ortho_scale=2.2, target_bottom_px=198):
    """
    Crea o reconfigura la cámara ortográfica isométrica dimétrica 2:1:
    - Rotación: X = 60°, Y = 0°, Z = 45°
    - Anclaje horizontal: x = 80 px (centro exacto)
    - Anclaje vertical: borde inferior en target_bottom_px (~198 px en 160×200)
    """
    cam_data = bpy.data.cameras.get("IsoCamera")
    if not cam_data:
        cam_data = bpy.data.cameras.new(name="IsoCamera")
    
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = ortho_scale

    cam_obj = bpy.data.objects.get("IsoCamera")
    if not cam_obj:
        cam_obj = bpy.data.objects.new(name="IsoCamera", object_data=cam_data)
        bpy.context.collection.objects.link(cam_obj)
    else:
        cam_obj.data = cam_data

    scene.camera = cam_obj

    cam_obj.rotation_mode = 'XYZ'
    cam_obj.rotation_euler = (math.radians(60), 0, math.radians(45))
    
    rot_mat = cam_obj.rotation_euler.to_matrix()
    dist = 50.0
    cam_obj.location = rot_mat @ Vector((0, 0, dist))

    # Cálculo exacto de shift_y para que (0, 0, 0) caiga en target_bottom_px
    # En Blender, con sensor_fit = 'VERTICAL' y shift_y = 0, el origen cae en (0.5, 0.5).
    # Como uv.y = (resolution_y - target_bottom_px) / resolution_y:
    res_y = scene.render.resolution_y
    target_uv_y = (res_y - target_bottom_px) / res_y
    # Con delta = -1.0 por unidad de shift_y:
    cam_data.shift_x = 0.0
    cam_data.shift_y = 0.5 - target_uv_y

    return cam_obj

def setup_lighting(scene):
    """
    Configura iluminación coherente con visual/palette.ts:
    - Sol principal desde el cuadrante Noroeste respecto de la cámara.
    - Luz ambiental de baja intensidad para sombras suaves (sin piso negro).
    """
    # Eliminar luces previas
    for obj in list(bpy.data.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)

    # Mundo / Luz ambiente
    world = scene.world
    if not world:
        world = bpy.data.worlds.new("IsoWorld")
        scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.90, 0.92, 0.96, 1.0)
        bg.inputs['Strength'].default_value = 0.55

    # Sol principal NW
    sun_data = bpy.data.lights.new(name="SunMain", type='SUN')
    sun_data.energy = 3.0
    sun_data.color = (1.0, 0.99, 0.95)
    sun_obj = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(45), math.radians(15), math.radians(120))

    # Luz de relleno opuesta suave
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.9
    fill_data.color = (0.92, 0.95, 1.0)
    fill_obj = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.rotation_euler = (math.radians(35), math.radians(-20), math.radians(-60))

def setup_render_settings(scene, resolution=(160, 200), outline=False):
    """
    Configura resolución, transparencia, motor y gestión de color estándar.
    """
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'

    # Motor de render
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        try:
            scene.render.engine = 'BLENDER_EEVEE'
        except Exception:
            scene.render.engine = 'CYCLES'
            scene.cycles.samples = 16

    # Gestión de color Standard (sin AgX/Filmic para preservar paleta sRGB exacta)
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0

    # Contorno Freestyle opcional
    if outline:
        scene.render.use_freestyle = True
        scene.render.line_thickness = 1.0
    else:
        scene.render.use_freestyle = False

def setup_scene(scene=None, ortho_scale=2.2, target_bottom_px=198, outline=False):
    """
    Configuración completa de escena para render.
    """
    if scene is None:
        scene = bpy.context.scene
    setup_render_settings(scene, outline=outline)
    setup_lighting(scene)
    setup_camera(scene, ortho_scale=ortho_scale, target_bottom_px=target_bottom_px)
    return scene
