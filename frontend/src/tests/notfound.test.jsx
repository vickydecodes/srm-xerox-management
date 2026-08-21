import { describe, it, expect } from 'vitest';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicNotFound from '../components/global/notfound';

describe('PublicNotFound Component', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <PublicNotFound />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
  });
});
