import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '@/components/ui/calendar';

describe('Calendar', () => {
  it('renders without crashing', () => {
    render(
      <Calendar mode="single" onSelect={vi.fn()} />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /previous month/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /next month/i })
    ).toBeInTheDocument();
  });
});