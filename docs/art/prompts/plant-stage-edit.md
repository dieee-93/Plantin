# Plant Stage Edit Prompt Template (Younger Stages)

{{BASE_STYLE}}

### Subject Specification:
- **Crop**: {{LABEL}} ({{CROP_CODE}})
- **Target Stage**: {{TARGET_STAGE_NAME}} (BBCH {{BBCH_RANGE}})
- **Identity & Consistency**: This is the EXACT SAME individual plant as shown in the approved adult image reference, but at an earlier physiological growth stage. Maintain identical stem structure style, leaf shape curvature, color tones, lighting angle, and 3D clay aesthetic.
- **Botanical Stage Details**:
  {{STAGE_DESCRIPTION}}
- **Relative Scale**: Approximately {{STAGE_HEIGHT_PERCENT}}% of the adult plant height.
- **Root Collar & Grounding**: Natural organic root collar / stem base (not severed or sliced like a cylinder cross-section) grounded firmly at the bottom center.
- **Key Color for Background**: Solid `{{KEY_COLOR}}` background (completely flat and uniform, matching the adult reference).

### Reference Images Attached:
1. `approved/{{CROP_CODE}}-fruiting.png`: The approved adult plant reference. Use this to maintain 100% visual and stylistic identity.
2. `guides/{{ASSET_ID}}-{{STAGE}}.png`: Perspective and target height guide. Follow the boundary height and 30° dimetric angle without drawing the guide lines.
{{REFERENCES_BLOCK}}
