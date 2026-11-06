import bpy
import os
import traceback

try:
    artifact_dir = r"C:/Users/Diego/.gemini/antigravity/brain/7ac6818b-4999-47f8-b87a-0efeb58dd6f9"
    models_dir = os.path.abspath("public/models/plants")

    stages = [
        ("plant_tomato_clay_a01.glb", "preview_fruiting.png"),
        ("plant_tomato_clay_flowering.glb", "preview_flowering.png"),
        ("plant_tomato_clay_vegetative.glb", "preview_vegetative.png"),
        ("plant_tomato_clay_seedling.glb", "preview_seedling.png"),
    ]

    for glb_name, img_name in stages:
        glb_path = os.path.join(models_dir, glb_name)
        out_img = os.path.join(artifact_dir, img_name)
        
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Import GLB
        bpy.ops.import_scene.gltf(filepath=glb_path)
        
        # Add Sun light
        light_data = bpy.data.lights.new(name="Sun", type='SUN')
        light_data.energy = 4.0
        light_obj = bpy.data.objects.new(name="Sun", object_data=light_data)
        bpy.context.collection.objects.link(light_obj)
        light_obj.rotation_euler = (0.785, 0.35, 0.785)

        # Add Camera
        cam_data = bpy.data.cameras.new("Camera")
        cam_data.lens = 45
        cam_obj = bpy.data.objects.new("Camera", cam_data)
        bpy.context.collection.objects.link(cam_obj)
        bpy.context.scene.camera = cam_obj
        
        if "seedling" in glb_name:
            cam_obj.location = (0.0, -0.6, 0.15)
            cam_obj.rotation_euler = (1.4, 0, 0)
        else:
            cam_obj.location = (0.0, -1.8, 0.5)
            cam_obj.rotation_euler = (1.45, 0, 0)

        scene = bpy.context.scene
        scene.render.resolution_x = 400
        scene.render.resolution_y = 400
        scene.render.filepath = out_img
        scene.render.image_settings.file_format = 'PNG'

        bpy.ops.render.render(write_still=True)

    with open("scratch_renders_done.txt", "w", encoding="utf-8") as f:
        f.write("RENDERS_COMPLETED")

except Exception as e:
    with open("scratch_renders_done.txt", "w", encoding="utf-8") as f:
        f.write("ERROR: " + traceback.format_exc())
