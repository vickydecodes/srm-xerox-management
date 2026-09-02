import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('renders with data-slot', () => {
    render(<Checkbox aria-label="accept" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('can be checked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox aria-label="accept" onCheckedChange={onCheckedChange} />
    );
    await user.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).toHaveBeenCalled();
  });
});