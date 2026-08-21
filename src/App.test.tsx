import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '@/App';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('App', () => {
  it('renderiza dentro do provedor de tema', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    expect(screen.getByText('FinanceIA')).toBeInTheDocument();
  });
});
