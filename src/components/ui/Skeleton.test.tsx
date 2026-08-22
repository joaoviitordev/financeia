import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('desenha uma linha por padrão e quantas forem pedidas', () => {
    const { container, rerender } = render(<Skeleton />);
    expect(container.querySelectorAll('.bg-fill-tertiary')).toHaveLength(1);

    rerender(<Skeleton lines={8} />);
    expect(container.querySelectorAll('.bg-fill-tertiary')).toHaveLength(8);
  });

  it('fica fora da árvore de acessibilidade', () => {
    const { container } = render(<Skeleton lines={3} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
