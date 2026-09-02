import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('opens content when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Hello Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByText('Hello Dialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open'));
    expect(await screen.findByText('Hello Dialog')).toBeInTheDocument();
  });
});