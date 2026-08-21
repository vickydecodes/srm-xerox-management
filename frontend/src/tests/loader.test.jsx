import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppLoader from '../components/global/loader';

describe('AppLoader Component', () => {
  it('renders the loading image with default size', () => {
    render(<AppLoader />);
    
    const img = screen.getByAltText('Loading');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/logo.png');
    expect(img.style.width).toBe('150px');
  });

  it('renders the loading image with custom size', () => {
    render(<AppLoader size={200} />);
    
    const img = screen.getByAltText('Loading');
    expect(img.style.width).toBe('200px');
  });
});
