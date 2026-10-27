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
    sun_data.energy = 2.2
    sun_data.color = (1.0, 0.97, 0.92)
    sun = bpy.data.objects.new(name="SunMain", object_data=sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(18), math.radians(42))

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 0.75
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
    cam.location = rot_mat @ Vector((0, 0, 5.0)) + Vector((0.0, 0.0, 0.05))

    return scene

def create_stem_material():
    mat_stem = bpy.data.materials.new(name="Mat_Squash_Stem")
    mat_stem.use_nodes = True
    ns = mat_stem.node_tree.nodes
    ns.clear()
    out_s = ns.new(type='ShaderNodeOutputMaterial')
    bsdf_s = ns.new(type='ShaderNodeBsdfPrincipled')
    bsdf_s.inputs['Base Color'].default_value = (0.07, 0.22, 0.06, 1.0)
    bsdf_s.inputs['Roughness'].default_value = 0.38
    if 'Specular IOR Level' in bsdf_s.inputs:
        bsdf_s.inputs['Specular IOR Level'].default_value = 0.25
    mat_stem.node_tree.links.new(bsdf_s.outputs['BSDF'], out_s.inputs['Surface'])
    return mat_stem

def add_squash_tendril(bm, origin, direction, length=0.14, coil_turns=3.5, coil_radius=0.016, mat_stem_idx=0):
    """
    Construye un zarcillo espiralado tridimensional botánico de Cucurbitácea:
    - Base recta flexible saliendo del nudo.
    - Espiral helicoidal tipo resorte de radio decreciente.
    - Punta fina curvada libre.
    """
    dir_fwd = direction.normalized()
    up_v = Vector((0, 0, 1))
    side_v = dir_fwd.cross(up_v).normalized()
    up_ortho = side_v.cross(dir_fwd).normalized()

    num_steps = 42
    pts = []
    radii = []

    r_base_tendril = 0.0035
    straight_frac = 0.28 # Primer 28% es el tallo recto

    for i in range(num_steps + 1):
        u = i / float(num_steps)
        if u < straight_frac:
            # Tramo basal recto saliendo de la guía
            p_curr = origin + dir_fwd * (length * u)
            r_curr = r_base_tendril * (1.0 - u * 0.2)
        else:
            # Tramo espiralado helicoidal
            u_coil = (u - straight_frac) / (1.0 - straight_frac)
            angle = u_coil * coil_turns * 2.0 * math.pi
            r_coil = coil_radius * (1.0 - u_coil * 0.35)

            # Eje de avance
            p_axis = origin + dir_fwd * (length * straight_frac + (length * (1.0 - straight_frac)) * u_coil)
            # Offset helicoidal
            p_curr = p_axis + (side_v * math.cos(angle) + up_ortho * math.sin(angle)) * r_coil
            r_curr = r_base_tendril * (0.80 - u_coil * 0.55)

        pts.append(p_curr)
        radii.append(r_curr)

    # Construir cilindro a lo largo de la curva
    prev_ring = None
    for idx, (p, r) in enumerate(zip(pts, radii)):
        # Anillo perpendicular al avance
        if idx < len(pts) - 1:
            tangent = (pts[idx + 1] - p).normalized()
        else:
            tangent = (p - pts[idx - 1]).normalized()

        rot_ring = Vector((0, 0, 1)).rotation_difference(tangent).to_euler()
        ring = bmesh.ops.create_circle(
            bm,
            cap_ends=(idx == 0 or idx == len(pts) - 1),
            segments=6,
            radius=r,
            matrix=Matrix.Translation(p) @ rot_ring.to_matrix().to_4x4()
        )['verts']

        if prev_ring:
            for k in range(len(ring)):
                f = bm.faces.new([prev_ring[k], prev_ring[(k + 1) % len(ring)], ring[(k + 1) % len(ring)], ring[k]])
                f.material_index = mat_stem_idx
                f.smooth = True
        prev_ring = ring

def main():
    scene = setup_preview_scene()
    mat_stem = create_stem_material()

    bm = bmesh.new()

    # Zarcillo maestro
    add_squash_tendril(
        bm,
        origin=Vector((0.0, -0.04, 0.0)),
        direction=Vector((0.6, 0.7, 0.3)),
        length=0.15,
        coil_turns=4.0,
        coil_radius=0.018,
        mat_stem_idx=0
    )

    mesh = bpy.data.meshes.new("Squash_Tendril_Mesh")
    obj = bpy.data.objects.new("Squash_Tendril", mesh)
    obj.data.materials.append(mat_stem)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    sub = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub.levels = 1
    sub.render_levels = 1

    scene.collection.objects.link(obj)

    out_dir = os.path.abspath(r"scripts/out")
    raw_path = os.path.join(out_dir, "cartoon_squash_tendril_raw.png")
    scene.render.filepath = raw_path
    bpy.ops.render.render(write_still=True)

    blend_path = os.path.abspath(r"assets-src/crops/SQUASH_TENDRIL_MASTER.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Zarcillo de zapallo guardado con exito.")

if __name__ == "__main__":
    main()
