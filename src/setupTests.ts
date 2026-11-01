import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@react-three/drei', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-three/drei')>();
  return {
    ...actual,
    useTexture: vi.fn((input: unknown) => {
      if (Array.isArray(input)) {
        return input.map(() => ({
          isTexture: true,
          wrapS: 1000,
          wrapT: 1000,
          repeat: { set: vi.fn() },
        }));
      }
      if (typeof input === 'object' && input !== null) {
        return Object.keys(input).reduce((acc, key) => {
          acc[key] = {
            isTexture: true,
            wrapS: 1000,
            wrapT: 1000,
            repeat: { set: vi.fn() },
          };
          return acc;
        }, {} as Record<string, unknown>);
      }
      return {
        isTexture: true,
        wrapS: 1000,
        wrapT: 1000,
        repeat: { set: vi.fn() },
      };
    }),
  };
});
