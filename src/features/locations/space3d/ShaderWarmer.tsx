import React, { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * ShaderWarmer: Pre-compiles WebGL shader programs and materials upon scene mount.
 * Prevents initial render jank / frame drop when entering complex 3D spaces
 * with thousands of instanced plant sprites and custom materials.
 */
export const ShaderWarmer: React.FC = () => {
  const { gl, scene, camera } = useThree();

  useLayoutEffect(() => {
    if (!gl || !scene || !camera) return;

    try {
      if (typeof gl.compileAsync === 'function') {
        gl.compileAsync(scene, camera).catch(() => {
          if (typeof gl.compile === 'function') {
            gl.compile(scene, camera);
          }
        });
      } else if (typeof gl.compile === 'function') {
        gl.compile(scene, camera);
      }
    } catch {
      // Graceful fallback for mock or unsupported WebGL test environments
    }
  }, [gl, scene, camera]);

  return null;
};
