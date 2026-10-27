import bpy

def enhance_selected_crops():
    """
    Script para Blender: Aplica mejoras a los objetos seleccionados actualmente.
    1. Copia independiente del material.
    2. Translucent BSDF mezclado con Principled BSDF al 30% (Mix Shader).
    3. Noise Texture para micro-variación sutil del color base.
    4. Modificador Subdivision Surface en nivel 1.
    5. Shade Smooth.
    """
    selected = [obj for obj in bpy.context.selected_objects if obj.type == 'MESH']
    if not selected:
        print("⚠️ No hay objetos tipo MESH seleccionados.")
        return

    print(f"🌿 Procesando {len(selected)} objetos seleccionados...")

    for obj in selected:
        # 5. Aplicar Shade Smooth
        bpy.context.view_layer.objects.active = obj
        try:
            bpy.ops.object.shade_smooth()
        except Exception:
            for poly in obj.data.polygons:
                poly.use_smooth = True

        # 4. Modificador Subdivision Surface en nivel 1
        subd = obj.modifiers.get("Subdivision")
        if not subd:
            subd = obj.modifiers.new(name="Subdivision", type='SUBSURF')
        subd.levels = 1
        subd.render_levels = 1

        # 1. Copia independiente y nodos para cada material
        for slot in obj.material_slots:
            old_mat = slot.material
            if not old_mat:
                continue

            # Copia independiente
            new_mat = old_mat.copy()
            new_mat.name = f"{old_mat.name}_Enhanced"
            slot.material = new_mat

            if not new_mat.use_nodes:
                new_mat.use_nodes = True
            nt = new_mat.node_tree

            out_node = None
            principled = None
            for n in nt.nodes:
                if n.type == 'OUTPUT_MATERIAL':
                    out_node = n
                elif n.type == 'BSDF_PRINCIPLED':
                    principled = n

            if not out_node:
                out_node = nt.nodes.new("ShaderNodeOutputMaterial")
            if not principled:
                principled = nt.nodes.new("ShaderNodeBsdfPrincipled")

            orig_color = (0.3, 0.6, 0.2, 1.0)
            if 'Base Color' in principled.inputs:
                orig_color = tuple(principled.inputs['Base Color'].default_value)

            # 3. Noise Texture conectada para variación sutil
            noise_node = nt.nodes.new("ShaderNodeTexNoise")
            noise_node.inputs['Scale'].default_value = 25.0
            noise_node.inputs['Detail'].default_value = 2.0

            mix_color = nt.nodes.new("ShaderNodeMix")
            mix_color.data_type = 'RGBA'
            mix_color.blend_type = 'OVERLAY'
            mix_color.inputs['Factor'].default_value = 0.20
            mix_color.inputs[6].default_value = orig_color
            nt.links.new(noise_node.outputs['Color'], mix_color.inputs[7])
            nt.links.new(mix_color.outputs[2], principled.inputs['Base Color'])

            # 2. Translucent BSDF mezclado con Principled BSDF al 30%
            translucent = nt.nodes.new("ShaderNodeBsdfTranslucent")
            translucent.inputs['Color'].default_value = orig_color

            mix_shader = nt.nodes.new("ShaderNodeMixShader")
            mix_shader.inputs['Fac'].default_value = 0.30

            nt.links.new(principled.outputs['BSDF'], mix_shader.inputs[1])
            nt.links.new(translucent.outputs['BSDF'], mix_shader.inputs[2])
            nt.links.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])

    print("✅ ¡Procesamiento completado con éxito!")

if __name__ == "__main__":
    enhance_selected_crops()
