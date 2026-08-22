// Spec da feature diagnostico-ia (T-007).
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getGeminiApiKey, hasGeminiApiKey } from '@/features/insights/config';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getGeminiApiKey', () => {
  it('devolve a chave configurada', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');

    expect(getGeminiApiKey()).toBe('chave-de-teste');
    expect(hasGeminiApiKey()).toBe(true);
  });

  it('trata chave vazia como chave ausente', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '   ');

    expect(getGeminiApiKey()).toBeNull();
    expect(hasGeminiApiKey()).toBe(false);
  });

  it('não explode quando a variável não existe', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', undefined);

    expect(getGeminiApiKey()).toBeNull();
  });
});
