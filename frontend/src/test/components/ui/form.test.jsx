import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function TestForm() {
  const form = useForm({ defaultValues: { name: '' } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(vi.fn())}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
}

describe('Form', () => {
  it('renders label and input', () => {
    render(<TestForm />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});