# Prompts para Texturas 3D Estilizadas (Plantin)

> Estos prompts están optimizados para generar texturas repetibles (*seamless tileable*) con **Gemini / Nano Banana / Imagen** en la app web de Gemini o Google AI Studio.
> Se alinean con la guía de arte del proyecto (`docs/art/style-guide.md`): acabado mate/satinado tipo diorama de plastilina (*clay*), colores limpios, sin ruido fotográfico ni suciedad microscópica.

---

## 1. Tierra Fértil de Cultivo (`soil`)
**Ubicación de destino:** `public/textures/floors/soil/albedo.webp`  
**Vista:** Cenital perpendicular (*top-down 90°*).

```text
A seamless tileable top-down texture of rich fertile garden soil, in a cute stylized 3D diorama clay aesthetic.
- Style: Soft, smooth, chunky rounded organic loam clumps and fine dark earth particles. Clean stylized cartoon aesthetic, zero photographic grit or noise.
- Lighting: Soft, diffused top ambient lighting with subtle, delicate contact shadows (ambient occlusion) in the tiny crevices between soil clumps.
- Color: Deep warm garden brown (#452a1d and #3d2317 base tones) with gentle, soft highlights (#5a3826).
- Pattern: Perfectly tileable and seamless horizontally and vertically (zero borders or frame).
- Strictly Forbidden: NO plants, NO seeds, NO worms or bugs, NO stones, NO tools, NO text, NO vignette, NO borders, NO depth-of-field blur.
```

---

## 2. Pared de Ladrillo Visto (`brick`)
**Ubicación de destino:** `public/textures/walls/brick/albedo.webp`  
**Vista:** Frontal ortogonal perpendicular (*flat front elevation*).

```text
A seamless tileable front-view texture of a rustic terracotta brick wall, in a clean stylized 3D casual game / clay render style.
- Style: Chunky, slightly rounded terracotta bricks arranged in a classic staggered running bond pattern, separated by clean, smooth warm-grey mortar joints.
- Finish: Smooth satin clay material with gentle bevel highlights on top edges and soft contact shadows underneath each brick.
- Color: Warm terracotta clay tones (#c2410c, #b45309, #9a3412) with subtle brick-to-brick color variation. Mortar is warm stone grey (#78716c).
- Pattern: Perfectly seamless and tileable on all four edges (horizontal and vertical wrapping).
- Strictly Forbidden: NO cracks, NO moss, NO graffiti, NO peeling paint, NO perspective skew, NO vignette, NO text, completely flat front view.
```

---

## 3. Tablones de Madera Neutra (`wood`)
**Ubicación de destino:** `public/textures/floors/wood/albedo.webp`  
**Vista:** Cenital perpendicular (*top-down 90°*).

```text
A seamless tileable top-down texture of smooth wooden planks, in a minimalist stylized 3D diorama aesthetic.
- Style: Parallel horizontal wooden planks of uniform width with clean, delicate bevel gaps between planks. Very subtle, gentle stylized wood grain lines.
- Color & Tone: Bright, clean, neutral desaturated beige-blonde wood (#e7dec8 / #ded3bb), designed to be easily color-tinted in a 3D engine.
- Finish: Smooth, satin matte finish, soft bevel edge highlights and subtle ambient occlusion in the grooves.
- Pattern: Perfectly seamless and tileable horizontally and vertically across all edges.
- Strictly Forbidden: NO dark knots, NO splinters, NO nails, NO dirt, NO perspective tilt, NO vignette, NO text.
```

---

## 4. Baldosas de Exterior / Invernadero (`tile`)
**Ubicación de destino:** `public/textures/floors/tile/albedo.webp`  
**Vista:** Cenital perpendicular (*top-down 90°*).

```text
A seamless tileable top-down texture of clean square ceramic tiles for a greenhouse patio floor, in a stylized 3D diorama aesthetic.
- Style: Grid of clean square tiles with gently chamfered/rounded edges and smooth, neat grout joints.
- Finish: Smooth semi-matte satin finish with very soft edge highlights.
- Color: Pale slate light grey-blue (#cbd5e1 / #e2e8f0) with darker stone grout (#94a3b8).
- Pattern: Perfectly tileable grid, 100% seamless on all edges.
- Strictly Forbidden: NO broken tiles, NO stains, NO dirt, NO perspective skew, NO text.
```
