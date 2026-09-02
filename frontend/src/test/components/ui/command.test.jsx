import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

describe('Command', () => {
  it('renders input and items', () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem>Dashboard</CommandItem>
            <CommandItem>Orders</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });
});