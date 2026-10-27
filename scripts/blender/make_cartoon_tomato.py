import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math
import os

def create_cartoon_materials():
    """Crea materiales vibrantes estilo cartoon con brillo y contorno."""
    materials = {}

    # 1. Rojo Tomate Maduro
    mat_red = bpy.data.materials.get("Cartoon_Tomato_Red") or bpy.data.materials.new("Cartoon_Tomato_Red")
    mat_red.use_nodes = True
    bsdf_red = mat_red.node_tree.nodes.get("Principled BSDF")
    if bsdf_red:
        bsdf_red.inputs['Base Color'].default_value = (0.96, 0.05, 0.08, 1.0)
        bsdf_red.inputs['Roughness'].default_value = 0.20
        if 'Specular IOR Level' in bsdf_red.inputs:
            bsdf_red.inputs['Specular IOR Level'].default_value = 0.85
        elif 'Specular' in bsdf_red.inputs:
            bsdf_red.inputs['Specular'].default_value = 0.85
    materials['red'] = mat_red

    # 2. Tomate Semicerecido / Naranja
    mat_orange = bpy.data.materials.get("Cartoon_Tomato_Orange") or bpy.data.materials.new("Cartoon_Tomato_Orange")
    mat_orange.use_nodes = True
    bsdf_orange = mat_orange.node_tree.nodes.get("Principled BSDF")
    if bsdf_orange:
        bsdf_orange.inputs['Base Color'].default_value = (0.98, 0.48, 0.05, 1.0)
        bsdf_orange.inputs['Roughness'].default_value = 0.22
        if 'Specular IOR Level' in bsdf_orange.inputs:
            bsdf_orange.inputs['Specular IOR Level'].default_value = 0.85
        elif 'Specular' in bsdf_orange.inputs:
            bsdf_orange.inputs['Specular'].default_value = 0.85
    materials['orange'] = mat_orange

    # 3. Tomate Verde Tierno
    mat_lightgreen = bpy.data.materials.get("Cartoon_Tomato_LightGreen") or bpy.data.materials.new("Cartoon_Tomato_LightGreen")
    mat_lightgreen.use_nodes = True
    bsdf_lg = mat_lightgreen.node_tree.nodes.get("Principled BSDF")
    if bsdf_lg:
        bsdf_lg.inputs['Base Color'].default_value = (0.48, 0.82, 0.18, 1.0)
        bsdf_lg.inputs['Roughness'].default_value = 0.30
    materials['light_green'] = mat_lightgreen

    # 4. Verde Hoja Fresco
    mat_leaf = bpy.data.materials.get("Cartoon_Leaf_Green") or bpy.data.materials.new("Cartoon_Leaf_Green")
    mat_leaf.use_nodes = True
    bsdf_leaf = mat_leaf.node_tree.nodes.get("Principled BSDF")
    if bsdf_leaf:
        bsdf_leaf.inputs['Base Color'].default_value = (0.16, 0.68, 0.18, 1.0)
        bsdf_leaf.inputs['Roughness'].default_value = 0.42
    materials['leaf'] = mat_leaf

    # 5. Verde Tallo / Cáliz
    mat_stem = bpy.data.materials.get("Cartoon_Stem_Green") or bpy.data.materials.new("Cartoon_Stem_Green")
    mat_stem.use_nodes = True
    bsdf_stem = mat_stem.node_tree.nodes.get("Principled BSDF")
    if bsdf_stem:
        bsdf_stem.inputs['Base Color'].default_value = (0.10, 0.48, 0.13, 1.0)
        bsdf_stem.inputs['Roughness'].default_value = 0.45
    materials['stem'] = mat_stem

    # 6. Amarillo Flor
    mat_yellow = bpy.data.materials.get("Cartoon_Flower_Yellow") or bpy.data.materials.new("Cartoon_Flower_Yellow")
    mat_yellow.use_nodes = True
    bsdf_yellow = mat_yellow.node_tree.nodes.get("Principled BSDF")
    if bsdf_yellow:
        bsdf_yellow.inputs['Base Color'].default_value = (1.0, 0.88, 0.08, 1.0)
        bsdf_yellow.inputs['Roughness'].default_value = 0.30
    materials['yellow'] = mat_yellow

    # 7. Contorno Negro (Inverted Hull / Cel Outline)
    mat_outline = bpy.data.materials.get("Cartoon_Outline_Black") or bpy.data.materials.new("Cartoon_Outline_Black")
    mat_outline.use_nodes = True
    nt = mat_outline.node_tree
    nt.nodes.clear()
    out_node = nt.nodes.new("ShaderNodeOutputMaterial")
    emission = nt.nodes.new("ShaderNodeEmission")
    emission.inputs['Color'].default_value = (0.01, 0.01, 0.01, 1.0)
    emission.inputs['Strength'].default_value = 1.0
    nt.links.new(emission.outputs['Emission'], out_node.inputs['Surface'])
    
    mat_outline.use_backface_culling = True
    if hasattr(mat_outline, 'shadow_method'):
        mat_outline.shadow_method = 'NONE'
    materials['outline'] = mat_outline

    return materials

def build_cartoon_tomato_fruit(bm, center, radius, mat_idx, calyx_mat_idx, rotation=(0,0,0)):
    """Crea un tomate regordete cartoon con su cáliz verde en forma de estrella que abraza el fruto."""
    # 1. Fruto (Esfera achatada)
    T = Matrix.Translation(center) @ Euler(rotation).to_matrix().to_4x4()
    sphere_geom = bmesh.ops.create_uvsphere(
        bm,
        u_segments=12,
        v_segments=8,
        radius=radius,
        matrix=T
    )
    # Achatamiento en Z para aspecto jugoso
    for v in sphere_geom['verts']:
        local_v = v.co - center
        local_v.z *= 0.82
        v.co = center + local_v
        
    sphere_faces = {f for v in sphere_geom['verts'] for f in v.link_faces}
    for f in sphere_faces:
        f.material_index = mat_idx
        f.smooth = True

    # 2. Cáliz verde (Estrella de 5 sépalos adherida a la curvatura superior)
    rot_m = Euler(rotation).to_matrix()
    up_v = rot_m @ Vector((0, 0, 1))
    top_pos = center + up_v * (radius * 0.80)
    
    # Centro del cáliz
    calyx_center_v = bm.verts.new(top_pos)
    
    # 5 sépalos curvados sobre el fruto
    num_petals = 5
    for i in range(num_petals):
        angle = (i * 2 * math.pi / num_petals)
        # Vector radial en el plano perpendicular al polo superior
        x_dir = rot_m @ Vector((math.cos(angle), math.sin(angle), 0))
        y_dir = rot_m @ Vector((-math.sin(angle), math.cos(angle), 0))
        
        # Base del sépalo
        w = radius * 0.22
        b1 = top_pos + y_dir * (w * 0.5)
        b2 = top_pos - y_dir * (w * 0.5)
        
        # Punta del sépalo curvada hacia abajo abrazando la esfera
        tip_pos = center + x_dir * (radius * 0.88) + up_v * (radius * 0.45)
        
        v_b1 = bm.verts.new(b1)
        v_b2 = bm.verts.new(b2)
        v_tip = bm.verts.new(tip_pos)
        
        face = bm.faces.new([calyx_center_v, v_b1, v_tip, v_b2])
        face.material_index = calyx_mat_idx
        face.smooth = True

    # 3. Pedúnculo (cabito verde curvo)
    stem_len = radius * 0.5
    stem_geom = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=True,
        segments=6,
        radius1=radius * 0.12,
        radius2=radius * 0.08,
        depth=stem_len,
        matrix=Matrix.Translation(top_pos + up_v * (stem_len * 0.5)) @ rot_m.to_4x4()
    )
    for f in {f for v in stem_geom['verts'] for f in v.link_faces}:
        f.material_index = calyx_mat_idx
        f.smooth = True

def add_cartoon_leaf_cluster(bm, branch_origin, direction, size, mat_idx, stem_mat_idx):
    """Crea una hoja compuesta estilizada de tomate (hoja central + 2 foliolos laterales con suave curvatura)."""
    dir_norm = direction.normalized()
    up = Vector((0, 0, 1))
    side = dir_norm.cross(up).normalized()

    # Foliolo Central (Terminal)
    p_center_base = branch_origin + dir_norm * (size * 0.4)
    p_center_mid = branch_origin + dir_norm * (size * 0.75) + Vector((0, 0, size * 0.08))
    p_center_tip = branch_origin + dir_norm * (size * 1.15) - Vector((0, 0, size * 0.12))
    
    c_w = size * 0.35
    v_c_base = bm.verts.new(p_center_base)
    v_c_mid_l = bm.verts.new(p_center_mid - side * (c_w * 0.5))
    v_c_mid_r = bm.verts.new(p_center_mid + side * (c_w * 0.5))
    v_c_tip = bm.verts.new(p_center_tip)
    
    f1 = bm.faces.new([v_c_base, v_c_mid_l, v_c_tip, v_c_mid_r])
    f1.material_index = mat_idx
    f1.smooth = True

    # Foliolo Lateral Izquierdo
    side_dir_l = (dir_norm * 0.6 - side * 0.8).normalized()
    p_l_base = branch_origin + dir_norm * (size * 0.25)
    p_l_tip = p_l_base + side_dir_l * (size * 0.65) - Vector((0, 0, size * 0.08))
    p_l_mid = p_l_base + side_dir_l * (size * 0.35)
    
    l_w = size * 0.25
    v_l_base = bm.verts.new(p_l_base)
    v_l_mid_l = bm.verts.new(p_l_mid + dir_norm * (l_w * 0.5))
    v_l_mid_r = bm.verts.new(p_l_mid - dir_norm * (l_w * 0.5))
    v_l_tip = bm.verts.new(p_l_tip)
    
    f2 = bm.faces.new([v_l_base, v_l_mid_l, v_l_tip, v_l_mid_r])
    f2.material_index = mat_idx
    f2.smooth = True

    # Foliolo Lateral Derecho
    side_dir_r = (dir_norm * 0.6 + side * 0.8).normalized()
    p_r_base = branch_origin + dir_norm * (size * 0.25)
    p_r_tip = p_r_base + side_dir_r * (size * 0.65) - Vector((0, 0, size * 0.08))
    p_r_mid = p_r_base + side_dir_r * (size * 0.35)
    
    v_r_base = bm.verts.new(p_r_base)
    v_r_mid_l = bm.verts.new(p_r_mid - dir_norm * (l_w * 0.5))
    v_r_mid_r = bm.verts.new(p_r_mid + dir_norm * (l_w * 0.5))
    v_r_tip = bm.verts.new(p_r_tip)
    
    f3 = bm.faces.new([v_r_base, v_r_mid_l, v_r_tip, v_r_mid_r])
    f3.material_index = mat_idx
    f3.smooth = True

def add_cartoon_flower(bm, center, size, yellow_mat_idx, stem_mat_idx):
    """Crea una pequeña flor amarilla de tomate de 5 pétalos."""
    c_v = bm.verts.new(center)
    num_petals = 5
    p_tips = []
    for i in range(num_petals):
        ang = i * 2 * math.pi / num_petals
        tip = center + Vector((math.cos(ang) * size, math.sin(ang) * size, size * 0.1))
        p_tips.append(bm.verts.new(tip))
    for i in range(num_petals):
        f = bm.faces.new([c_v, p_tips[i], p_tips[(i + 1) % num_petals]])
        f.material_index = yellow_mat_idx
        f.smooth = True

def generate_stage5_cartoon(target_obj, materials):
    """Genera la geometría completa de Tomato Stage 5: arbusto frondoso cartoon con tomates grandes, follaje rico y contorno."""
    bm = bmesh.new()

    target_obj.data.materials.clear()
    target_obj.data.materials.append(materials['stem'])        # 0: Stem
    target_obj.data.materials.append(materials['leaf'])        # 1: Leaf
    target_obj.data.materials.append(materials['red'])         # 2: Red Fruit
    target_obj.data.materials.append(materials['orange'])      # 3: Orange Fruit
    target_obj.data.materials.append(materials['light_green']) # 4: Light Green Fruit
    target_obj.data.materials.append(materials['yellow'])      # 5: Yellow Flower
    target_obj.data.materials.append(materials['outline'])     # 6: Outline

    MAT_STEM = 0
    MAT_LEAF = 1
    MAT_RED = 2
    MAT_ORANGE = 3
    MAT_LIGHT_GREEN = 4
    MAT_YELLOW = 5
    MAT_OUTLINE = 6

    # 1. TALLO PRINCIPAL (robusto, con suave curvatura natural)
    stem_segments = [
        (Vector((0.0, 0.0, 0.0)), 0.065),
        (Vector((0.02, 0.01, 0.30)), 0.055),
        (Vector((-0.03, 0.02, 0.60)), 0.045),
        (Vector((0.01, -0.01, 0.90)), 0.035),
        (Vector((0.0, 0.0, 1.15)), 0.022),
    ]
    
    prev_ring = None
    for idx, (pos, radius) in enumerate(stem_segments):
        ring_geom = bmesh.ops.create_circle(
            bm,
            cap_ends=(idx == 0 or idx == len(stem_segments)-1),
            segments=8,
            radius=radius,
            matrix=Matrix.Translation(pos)
        )
        curr_ring = ring_geom['verts']
        if prev_ring:
            for i in range(len(curr_ring)):
                v1 = prev_ring[i]
                v2 = prev_ring[(i + 1) % len(curr_ring)]
                v3 = curr_ring[(i + 1) % len(curr_ring)]
                v4 = curr_ring[i]
                face = bm.faces.new([v1, v2, v3, v4])
                face.material_index = MAT_STEM
                face.smooth = True
        prev_ring = curr_ring

    # 2. RAMAS PRINCIPALES (arqueadas en abanico)
    branches = [
        # (inicio, dirección, longitud)
        (Vector((0.02, 0.01, 0.30)), Vector((-0.75, -0.40, 0.25)), 0.55),
        (Vector((0.02, 0.01, 0.30)), Vector((0.80, 0.25, 0.22)), 0.58),
        (Vector((-0.03, 0.02, 0.60)), Vector((-0.65, 0.70, 0.30)), 0.52),
        (Vector((-0.03, 0.02, 0.60)), Vector((0.70, -0.55, 0.32)), 0.50),
        (Vector((0.01, -0.01, 0.90)), Vector((-0.45, -0.45, 0.38)), 0.42),
        (Vector((0.01, -0.01, 0.90)), Vector((0.50, 0.40, 0.38)), 0.42),
        (Vector((0.0, 0.0, 1.12)), Vector((0.0, 0.0, 0.45)), 0.32), # Corona superior
    ]

    for b_origin, b_dir, b_len in branches:
        dir_n = b_dir.normalized()
        # Tronco de la rama
        branch_geom = bmesh.ops.create_cone(
            bm,
            cap_ends=False,
            segments=6,
            radius1=0.028,
            radius2=0.014,
            depth=b_len,
            matrix=Matrix.Translation(b_origin + dir_n * (b_len * 0.5)) @ dir_n.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        )
        for f in {f for v in branch_geom['verts'] for f in v.link_faces}:
            f.material_index = MAT_STEM
            f.smooth = True

        # Agregar 2 o 3 hojas compuestas a lo largo de cada rama
        num_leaves = 3 if b_len > 0.4 else 2
        for leaf_i in range(num_leaves):
            frac = (leaf_i + 1) / (num_leaves + 0.3)
            leaf_origin = b_origin + dir_n * (b_len * frac)
            side_mult = 1.0 if leaf_i % 2 == 0 else -1.0
            leaf_dir = dir_n.cross(Vector((0, 0, 1))).normalized() * (0.6 * side_mult) + dir_n * 0.8
            leaf_size = 0.38 * (1.1 - frac * 0.25)
            add_cartoon_leaf_cluster(bm, leaf_origin, leaf_dir, leaf_size, MAT_LEAF, MAT_STEM)

    # 3. TOMATES CARTOON GRANDES Y PROTAGONISTAS (Racimos visibles en isométrica)
    tomatoes = [
        # Racimo Frontal-Izquierdo (protagonista absoluto de la vista 2:1)
        (Vector((-0.24, -0.18, 0.52)), 0.20, MAT_RED, (0.1, 0.1, 0.3)),     # Tomate grande maduro
        (Vector((-0.12, -0.28, 0.38)), 0.16, MAT_RED, (-0.2, 0.1, 0.8)),    # Tomate compañero maduro
        (Vector((-0.30, -0.06, 0.34)), 0.13, MAT_ORANGE, (0.0, -0.2, 1.2)), # Tomate semicerecido
        
        # Racimo Frontal-Derecho (equilibrio visual y abundancia)
        (Vector((0.26, -0.14, 0.65)), 0.19, MAT_RED, (-0.1, -0.1, -0.4)),   # Tomate grande maduro
        (Vector((0.16, -0.25, 0.52)), 0.15, MAT_RED, (0.2, -0.1, -0.9)),    # Tomate secundario
        
        # Fruto superior en maduración
        (Vector((-0.08, 0.18, 0.82)), 0.12, MAT_LIGHT_GREEN, (0.1, 0.3, 2.1)),
    ]

    for t_pos, t_rad, t_mat, t_rot in tomatoes:
        build_cartoon_tomato_fruit(bm, t_pos, t_rad, t_mat, MAT_STEM, t_rot)

    # 4. FLORES AMARILLAS EN AXILAS
    add_cartoon_flower(bm, Vector((0.08, 0.08, 0.88)), 0.08, MAT_YELLOW, MAT_STEM)
    add_cartoon_flower(bm, Vector((-0.10, -0.06, 0.72)), 0.07, MAT_YELLOW, MAT_STEM)

    bm.to_mesh(target_obj.data)
    bm.free()
    target_obj.data.update()

    # 5. APLICAR MODIFICADOR DE CONTORNO NEGRO (INVERTED HULL)
    outline_mod = target_obj.modifiers.get("Cartoon_Outline")
    if not outline_mod:
        outline_mod = target_obj.modifiers.new(name="Cartoon_Outline", type='SOLIDIFY')
    
    outline_mod.thickness = -0.016  # Trazo visible cartoon
    outline_mod.use_flip_normals = True
    outline_mod.material_offset = MAT_OUTLINE
    outline_mod.material_offset_rim = MAT_OUTLINE
    outline_mod.use_rim = True

    print("✅ Tomato Stage 5 enriquecido con follaje botánico cartoon, racimos y contorno.")

def run_in_blender():
    """Ejecuta la transformación sobre el objeto activo o Tomato_stage5."""
    materials = create_cartoon_materials()
    
    obj = None
    for name in ["Tomato_stage5", "Tomato_5", "Tomato_4", "Tomato_Crop"]:
        if name in bpy.data.objects:
            obj = bpy.data.objects[name]
            break

    if not obj:
        col5 = bpy.data.collections.get("stage5")
        if col5 and len(col5.objects) > 0:
            obj = col5.objects[0]

    if not obj and bpy.context.active_object and bpy.context.active_object.type == 'MESH':
        obj = bpy.context.active_object

    if not obj or obj.type != 'MESH':
        print("❌ No se encontró objeto MESH para modificar.")
        return

    print(f"🌿 Modificando objeto: {obj.name}")
    generate_stage5_cartoon(obj, materials)

    # Si se ejecuta desde CLI (background), guardar cambios y generar render de prueba
    if bpy.app.background:
        blend_file = os.path.abspath("assets-src/crops/TOM.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_file)
        print(f"💾 Archivo guardado en: {blend_file}")

        # Render de vista previa con cámara cercana (ortho_scale=1.40) y contorno Freestyle
        try:
            import scene_setup
            scene = bpy.context.scene
            scene_setup.setup_scene(scene, ortho_scale=1.40, target_bottom_px=197.5, outline=True)
            
            # Ajustar grosor de línea Freestyle
            if scene.render.use_freestyle:
                scene.render.line_thickness = 1.6
            
            for col in bpy.data.collections:
                col.hide_render = (col.name != "stage5")
            
            out_preview = os.path.abspath("scripts/out/cartoon_tomato_stage5.png")
            os.makedirs(os.path.dirname(out_preview), exist_ok=True)
            scene.render.filepath = out_preview
            bpy.ops.render.render(write_still=True)
            print(f"📸 Render de vista previa generado en: {out_preview}")
        except Exception as e:
            print(f"⚠️ Error generando render: {e}")

if __name__ == "__main__":
    import sys
    import traceback
    
    log_path = r"i:\Programacion\Proyectos\plantin\scripts\out\cartoon_exec.log"
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("Iniciando make_cartoon_tomato.py en Blender...\n")
        
        s_dir = r"i:\Programacion\Proyectos\plantin\scripts\blender"
        if s_dir not in sys.path:
            sys.path.insert(0, s_dir)

        run_in_blender()

        with open(log_path, "a", encoding="utf-8") as f:
            f.write("Ejecución finalizada con éxito.\n")
    except Exception as e:
        err_msg = traceback.format_exc()
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"ERROR: {err_msg}\n")
