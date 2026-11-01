import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { ShaderWarmer } from '../ShaderWarmer';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('ShaderWarmer', () => {
  it('mounts inside a Three.js fiber tree and executes shader pre-compilation safely', async () => {
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
    expect(renderer.scene).toBeDefined();
    await renderer.unmount();
  });

  it('handles compilation safely when scene has multiple objects', async () => {
    const TestScene = () => (
      <>
        <mesh position={[1, 0, 1]}>
          <sphereGeometry />
          <meshBasicMaterial color="green" />
        </mesh>
        <ShaderWarmer />
      </>
    );

    const renderer = await ReactThreeTestRenderer.create(<TestScene />);
    expect(renderer.scene).toBeDefined();
    await renderer.unmount();
  });
});
