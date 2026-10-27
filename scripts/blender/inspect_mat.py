import bpy
import os

with open("assets-src/out/tomato_info.txt", "w", encoding="utf-8") as out:
    for blend_name in ["Tomato_3.blend", "Tomato_4.blend", "Tomato_Crop.blend"]:
        filepath = os.path.join("assets-src/vendor/quaternius-crops/Blends", blend_name)
        out.write(f"\n=================== {blend_name} ===================\n")
        bpy.ops.wm.open_mainfile(filepath=filepath)
        for obj in bpy.data.objects:
            if obj.type == 'MESH':
                out.write(f"Mesh: {obj.name}, verts: {len(obj.data.vertices)}, polygons: {len(obj.data.polygons)}\n")
                dims = obj.dimensions
                out.write(f"  Dims: X={dims.x:.3f}, Y={dims.y:.3f}, Z={dims.z:.3f}\n")
                for i, slot in enumerate(obj.material_slots):
                    mat = slot.material
                    out.write(f"  Slot {i}: {mat.name if mat else 'None'}\n")
                    if mat and mat.use_nodes:
                        for n in mat.node_tree.nodes:
                            if n.type == 'BSDF_PRINCIPLED':
                                for inp in n.inputs:
                                    if inp.name in ['Base Color', 'Roughness']:
                                        val = inp.default_value
                                        val_str = f"RGBA({val[0]:.3f}, {val[1]:.3f}, {val[2]:.3f}, {val[3]:.3f})" if hasattr(val, '__iter__') else f"{val:.3f}"
                                        out.write(f"    {inp.name}: {val_str}\n")
                            elif n.type == 'TEX_IMAGE':
                                out.write(f"    TEX_IMAGE: {n.image.name if n.image else 'None'}\n")
