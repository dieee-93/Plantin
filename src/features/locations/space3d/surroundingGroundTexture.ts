import * as THREE from 'three';

/**
 * Creates a procedural radial texture that smoothly fades from the calm ground color (#e5eae0)
 * out into the warm horizon background (#f7f3e8) with zero alpha.
 * This completely avoids sharp polygons, diamonds, or cut edges at any zoom level or angle.
 */
export function createSurroundingGroundTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const cx = 256;
    const cy = 256;
    const r = 256;

    ctx.clearRect(0, 0, 512, 512);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    // Center core: warm sage/meadow ground #dce3c8
    grad.addColorStop(0, '#dce3c8');
    grad.addColorStop(0.35, '#dce3c8');
    // Gentle radial fade
    grad.addColorStop(0.65, 'rgba(228, 233, 212, 0.7)');
    grad.addColorStop(0.85, 'rgba(242, 239, 226, 0.3)');
    // Seamless blend into warm background #f7f4ea with zero alpha
    grad.addColorStop(1.0, 'rgba(247, 244, 234, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  } catch {
    return null;
  }
}
