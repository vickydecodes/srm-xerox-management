/**
 * tests/api/api.request.test.jsx
 *
 * apiRequest is a thin dispatcher: it normalizes two calling styles
 * (positional args vs a single config object) and routes to the right
 * function in api.service.jsx based on HTTP method.
 *
 * api.service's own functions (getRequest, postRequest, ...) are mocked
 * here — their real axios behavior is covered in api.service.test.jsx.
 * This file only proves the ROUTING logic is correct.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '@/core/api/api.request';
import {
  getRequest, postRequest, putRequest, deleteRequest, patchRequest, downloadFile,
} from '@/core/api/api.service';

vi.mock('@/core/api/api.service', () => ({
  getRequest: vi.fn().mockResolvedValue('get-result'),
  postRequest: vi.fn().mockResolvedValue('post-result'),
  putRequest: vi.fn().mockResolvedValue('put-result'),
  patchRequest: vi.fn().mockResolvedValue('patch-result'),
  deleteRequest: vi.fn().mockResolvedValue('delete-result'),
  downloadFile: vi.fn().mockResolvedValue('download-result'),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('apiRequest — positional-args calling style', () => {
  test('get: forwards url, params, headers to getRequest', async () => {
    const result = await apiRequest('get', '/things', { params: { page: 1 }, headers: { a: 1 } });
    expect(getRequest).toHaveBeenCalledWith('/things', { page: 1 }, { a: 1 });
    expect(result).toBe('get-result');
  });

  test('post: forwards url, data, headers to postRequest', async () => {
    await apiRequest('post', '/things', { data: { name: 'Foo' }, headers: { a: 1 } });
    expect(postRequest).toHaveBeenCalledWith('/things', { name: 'Foo' }, { a: 1 });
  });

  test('put: forwards url, data, headers to putRequest', async () => {
    await apiRequest('put', '/things/1', { data: { name: 'Foo' } });
    expect(putRequest).toHaveBeenCalledWith('/things/1', { name: 'Foo' }, undefined);
  });

  test('patch: forwards url, data, headers to patchRequest', async () => {
    await apiRequest('patch', '/things/1', { data: { active: true } });
    expect(patchRequest).toHaveBeenCalledWith('/things/1', { active: true }, undefined);
  });

  test('delete: forwards url, params, headers to deleteRequest', async () => {
    await apiRequest('delete', '/things/1', { params: { force: true } });
    expect(deleteRequest).toHaveBeenCalledWith('/things/1', { force: true }, undefined);
  });

  test('download: forwards url, params, headers to downloadFile', async () => {
    await apiRequest('download', '/things/export', { params: { search: 'x' } });
    expect(downloadFile).toHaveBeenCalledWith('/things/export', { search: 'x' }, undefined);
  });

  test('method is case-insensitive', async () => {
    await apiRequest('GET', '/things', {});
    expect(getRequest).toHaveBeenCalled();
  });

  test('options default to {} when omitted entirely', async () => {
    await apiRequest('get', '/things');
    expect(getRequest).toHaveBeenCalledWith('/things', undefined, undefined);
  });
});

describe('apiRequest — config-object calling style', () => {
  test('extracts method/url/data from a single config object (no second url arg)', async () => {
    await apiRequest({ method: 'post', url: '/things', data: { name: 'Foo' } });
    expect(postRequest).toHaveBeenCalledWith('/things', { name: 'Foo' }, undefined);
  });

  test('extracts method/url/params from a single config object for get', async () => {
    await apiRequest({ method: 'get', url: '/things', params: { page: 2 } });
    expect(getRequest).toHaveBeenCalledWith('/things', { page: 2 }, undefined);
  });
});

describe('apiRequest — error handling', () => {
  test('throws for an unsupported method', async () => {
    await expect(apiRequest('options', '/things')).rejects.toThrow('Unsupported method: options');
  });

  test('throws when method is missing', async () => {
    await expect(apiRequest(undefined, '/things')).rejects.toThrow('Invalid method provided to apiRequest');
  });

  test('throws when method is not a string', async () => {
    await expect(apiRequest(123, '/things')).rejects.toThrow('Invalid method provided to apiRequest');
  });
});