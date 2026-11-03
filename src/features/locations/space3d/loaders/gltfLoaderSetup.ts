import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

let isMeshoptConfigured = false;

/**
 * Hook de extensión para loaders de GLTF (usado en useGLTF o GLTFLoader nativo).
 * Configura decodificadores modernos (Meshopt, etc.) de forma singleton para evitar
 * fugas de memoria o múltiples inicializaciones de Web Workers / WebAssembly.
 */
export function configureGltfLoader(loader: any): void {
  if (typeof window !== 'undefined' && MeshoptDecoder) {
    loader.setMeshoptDecoder(MeshoptDecoder);
    isMeshoptConfigured = true;
  }
}

export function isLoaderReady(): boolean {
  return isMeshoptConfigured;
}
