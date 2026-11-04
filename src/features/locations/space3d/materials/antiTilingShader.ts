import * as THREE from 'three';

const ANTI_TILE_GLSL_PARS = /* glsl */ `
#include <map_pars_fragment>

float antiTileNoise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  float res = mix(
    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
    u.y
  );
  return res * res;
}

vec4 sampleNoTile(sampler2D tex, vec2 uv) {
  float k = antiTileNoise(uv * 0.25);
  float index = k * 8.0;
  float f = fract(index);
  float ia = floor(index + 0.5);
  float ib = floor(index);
  f = min(f, 1.0 - f) * 2.0;
  vec2 offa = sin(vec2(3.0, 7.0) * ia);
  vec2 offb = sin(vec2(3.0, 7.0) * ib);
  vec2 dx = dFdx(uv);
  vec2 dy = dFdy(uv);
  vec4 cola = textureGrad(tex, uv + offa, dx, dy);
  vec4 colb = textureGrad(tex, uv + offb, dx, dy);
  float diff = (cola.r - colb.r) + (cola.g - colb.g) + (cola.b - colb.b);
  return mix(cola, colb, smoothstep(0.2, 0.8, f - 0.1 * diff));
}
`;

const ANTI_TILE_MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = sampleNoTile( map, vMapUv );
  float macroVar = mix( 0.92, 1.08, antiTileNoise( vMapUv * 0.08 ) );
  sampledDiffuseColor.rgb *= macroVar;
  diffuseColor *= sampledDiffuseColor;
#endif
`;

export function injectAntiTilingShader(shader: { fragmentShader: string }): void {
  const normalChunk = THREE.ShaderChunk.normal_fragment_maps.replaceAll(
    'texture2D( normalMap, vNormalMapUv )',
    'sampleNoTile( normalMap, vNormalMapUv )',
  );
  const roughnessChunk = `${THREE.ShaderChunk.roughnessmap_fragment.replace(
    'texture2D( roughnessMap, vRoughnessMapUv )',
    'sampleNoTile( roughnessMap, vRoughnessMapUv )',
  )}\nroughnessFactor = max( roughnessFactor, roughness * 0.9 );`;
  const metalnessChunk = THREE.ShaderChunk.metalnessmap_fragment.replace(
    'texture2D( metalnessMap, vMetalnessMapUv )',
    'sampleNoTile( metalnessMap, vMetalnessMapUv )',
  );
  const aoChunk = THREE.ShaderChunk.aomap_fragment.replace(
    'texture2D( aoMap, vAoMapUv )',
    'sampleNoTile( aoMap, vAoMapUv )',
  );

  shader.fragmentShader = shader.fragmentShader
    .replace('#include <map_pars_fragment>', ANTI_TILE_GLSL_PARS)
    .replace('#include <map_fragment>', ANTI_TILE_MAP_FRAGMENT)
    .replace('#include <normal_fragment_maps>', normalChunk)
    .replace('#include <roughnessmap_fragment>', roughnessChunk)
    .replace('#include <metalnessmap_fragment>', metalnessChunk)
    .replace('#include <aomap_fragment>', aoChunk);
}

export function injectOrthographicRoughnessFloor(shader: { fragmentShader: string }): void {
  const clampedRoughnessChunk = `${THREE.ShaderChunk.roughnessmap_fragment}\nroughnessFactor = max( roughnessFactor, roughness * 0.9 );`;
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <roughnessmap_fragment>',
    clampedRoughnessChunk,
  );
}

export function getSpaceMaterialProgramCacheKey(antiTile?: boolean): string {
  return antiTile ? 'space-std-antitile-v1' : 'space-std-regular-v1';
}
