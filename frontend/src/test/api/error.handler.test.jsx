/**
 * tests/errors/error.handler.test.jsx
 *
 * handleApiError is a pure-ish function: given an error object and
 * options, it decides what message to show/log/return. No network calls,
 * no store — the only side effects are console logging and toast.error,
 * both mocked here.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import handleApiError from '@/core/errors/error.handler';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// camelToTitle's own formatting is covered in tests/utils/helper.test.js —
// mocked here as a pass-through so this file only tests message SELECTION,
// not text formatting.
vi.mock('@/core/utils/helper.utils', () => ({
  camelToTitle: (s) => s,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'group').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
});

describe('handleApiError — message selection priority', () => {
  test('prefers err.response.data.message over everything else', () => {
    const err = { response: { status: 400, data: { message: 'Custom message' } } };
    const result = handleApiError(err);
    expect(result).toBe('Custom message');
  });

  test('falls back to err.response.data.error when .message is absent', () => {
    const err = { response: { status: 400, data: { error: 'Custom error field' } } };
    const result = handleApiError(err);
    expect(result).toBe('Custom error field');
  });

  test('falls back to the STATUS_DEFAULTS message for a known status code', () => {
    const err = { response: { status: 404, data: {} } };
    const result = handleApiError(err);
    expect(result).toBe('Requested resource not found.');
  });

  test.each([
    [400, 'Bad request.'],
    [401, 'Unauthorized. Please log in again.'],
    [403, 'You do not have permission for this action.'],
    [404, 'Requested resource not found.'],
    [422, 'Validation failed. Check your input.'],
    [429, 'Too many requests. Please slow down.'],
    [500, 'Server error. Please try again later.'],
    [503, 'Service unavailable. Try again later.'],
  ])('maps status %i to its default message', (status, expected) => {
    const result = handleApiError({ response: { status, data: {} } });
    expect(result).toBe(expected);
  });

  test('falls back to the provided fallbackMessage for an unmapped status', () => {
    const err = { response: { status: 418, data: {} } };
    const result = handleApiError(err, 'Failed to make tea');
    expect(result).toBe('Failed to make tea');
  });

  test('falls back to the default "Something went wrong!" when no fallback is given', () => {
    const err = { response: { status: 418, data: {} } };
    const result = handleApiError(err);
    expect(result).toBe('Something went wrong!');
  });

  test('falls back to fallbackMessage when there is no response object at all', () => {
    const result = handleApiError({}, 'Failed to load things');
    expect(result).toBe('Failed to load things');
  });
});

describe('handleApiError — network/timeout short-circuits', () => {
  test('ERR_NETWORK ignores status/server message and returns the network message', () => {
    const err = {
      code: 'ERR_NETWORK',
      response: { status: 500, data: { message: 'This should be ignored' } },
    };
    const result = handleApiError(err);
    expect(result).toBe('Network error — check your internet connection.');
  });

  test('ECONNABORTED returns the timeout message', () => {
    const err = { code: 'ECONNABORTED' };
    const result = handleApiError(err);
    expect(result).toBe('Request timed out. Try again.');
  });
});

describe('handleApiError — toast behavior', () => {
  test('toasts the resolved message by default', () => {
    handleApiError({ response: { status: 404, data: {} } });
    expect(toast.error).toHaveBeenCalledWith('Requested resource not found.');
  });

  test('does not toast when options.toast is false', () => {
    handleApiError({ response: { status: 404, data: {} } }, undefined, { toast: false });
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('still returns the message even when toast is suppressed', () => {
    const result = handleApiError({ response: { status: 404, data: {} } }, undefined, { toast: false });
    expect(result).toBe('Requested resource not found.');
  });
});

describe('handleApiError — console logging / silent option', () => {
  test('logs the error to the console by default', () => {
    const err = { response: { status: 500, data: {} } };
    handleApiError(err);
    expect(console.group).toHaveBeenCalledWith('🚨 API Error');
    expect(console.error).toHaveBeenCalledWith(err);
    expect(console.groupEnd).toHaveBeenCalled();
  });

  test('suppresses console logging when options.silent is true', () => {
    handleApiError({ response: { status: 500, data: {} } }, undefined, { silent: true });
    expect(console.group).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.groupEnd).not.toHaveBeenCalled();
  });

  test('silent does not affect the toast — only logging is suppressed', () => {
    handleApiError({ response: { status: 500, data: {} } }, undefined, { silent: true });
    expect(toast.error).toHaveBeenCalled();
  });
});