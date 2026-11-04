import React, { useEffect, useMemo } from 'react';
import { createSurroundingGroundTexture } from './surroundingGroundTexture';

export interface SurroundingGroundProps {
  sizeM?: number;
}

/**
 * Surrounding landscape ground plane blending seamlessly into the horizon fog and sky.
 * Uses a soft radial fade-out procedural canvas texture so borders never exhibit
 * sharp edges, rhombuses, or harsh cutoffs when zooming out.
 */
export const SurroundingGround: React.FC<SurroundingGroundProps> = ({ sizeM = 350 }) => {
  const texture = useMemo(() => createSurroundingGroundTexture(), []);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return (
    <mesh
      name="surrounding-ground-plane"
      position={[0, -0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => null}
    >
      <planeGeometry args={[sizeM, sizeM]} />
      <meshBasicMaterial
        map={texture ?? undefined}
        color={texture ? '#ffffff' : '#dce3c8'}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
