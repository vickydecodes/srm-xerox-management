import { describe, it, expect, vi } from 'vitest';
import { useSubmit } from '@/core/hooks/useSubmit';

describe('useSubmit', () => {
  it('runs with transformed values, resets form, calls onSuccess', async () => {
    const run = vi.fn().mockResolvedValue({ ok: true });
    const form = { reset: vi.fn() };
    const transform = vi.fn((v) => ({ ...v, extra: 1 }));
    const onSuccess = vi.fn();

    const submit = useSubmit({ run, form, transform, onSuccess });
    const res = await submit({ name: 'test' });

    expect(transform).toHaveBeenCalledWith({ name: 'test' });
    expect(run).toHaveBeenCalledWith({ name: 'test', extra: 1 });
    expect(form.reset).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ ok: true });
    expect(res).toEqual({ ok: true });
  });

  it('works without transform / form / onSuccess', async () => {
    const run = vi.fn().mockResolvedValue(42);
    const submit = useSubmit({ run });
    const res = await submit({ a: 1 });
    expect(run).toHaveBeenCalledWith({ a: 1 });
    expect(res).toBe(42);
  });
});