# Fixed-Size Catalog Object Prompt Template

{{BASE_STYLE}}

### Subject Specification:
- **Object**: {{LABEL}} (`{{TYPE_ID}}`)
- **Category**: {{CATEGORY}}
- **Real Footprint**: {{FOOTPRINT_W}} cm wide × {{FOOTPRINT_D}} cm deep × {{FOOTPRINT_H}} cm high.
- **Physical Structure**: {{STRUCTURE}}
- **Orientation & View**:
  - Orient the object according to View A: facing towards the front-left (along the 30° dimetric grid).
  - {{MIRROR_NOTE}}
- **Container Details** (if applicable):
  - Top opening must show level dark nutrient-rich potting soil / substrate cleanly filled up to ~1–2 cm below the rim.
- **Key Color for Background**: Solid `{{KEY_COLOR}}` background (completely flat and uniform, no cast floor shadow).

### Reference Images Attached:
1. `guides/{{ASSET_ID}}.png`: Exact 3D projected wireframe box (w × d × h) and upper rim/surface in dimetric 2:1 projection. Match the perspective, proportions, and angles precisely. Do NOT draw the wireframe lines.
{{REFERENCES_BLOCK}}
