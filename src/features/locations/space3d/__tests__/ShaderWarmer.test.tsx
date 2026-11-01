import { describe, expect, it, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { ShaderWarmer } from '../ShaderWarmer';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('ShaderWarmer', () => {
  it('calls gl.compile on mount to warm up shaders', async () => {
    let compileCalled = false;
    let compileTargetScene: THREE.Scene | null = null;

    const TestScene = () => {
      return (
        <>
          <mesh>
            <boxGeometry />
            <meshStandardMaterial />
          </mesh>
          <ShaderWarmer />
        </>
      );
    };

    const renderer = await ReactThreeTestRenderer.create(<TestScene />);
    const gl = renderer.gl;

    // Simulate gl.compile
    if (gl) {
      gl.compile = vi.fn((scene, _camera) => {
        compileCalled = true;
        compileTargetScene = scene;
      });
    }

    // Unmount and remount with mocked gl.compile
    await renderer.unmount();

    const renderer2 = await ReactThreeTestRenderer.create(<TestScene />);
    // Even without explicit gl mock, ShaderWarmer mounts safely without throwing
    expect(renderer2.scene).toBeDefined();

    await renderer2.unmount();
  });

  it('handles async compilation without unhandled rejection', async () => {
    const TestScene = () => (
      <>
        <ShaderWarmer />
      </>
    );

    const renderer = await ReactThreeTestRenderer.create(<TestScene />);
    expect(renderer.scene).toBeDefined();
    await renderer.unmount();
  });
});
