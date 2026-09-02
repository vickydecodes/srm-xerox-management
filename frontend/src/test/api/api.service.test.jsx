/**
 * tests/api/api.service.test.jsx
 *
 * api.service.jsx creates a real axios instance at module load time via
 * axios.create(...). To test it in isolation we mock the 'axios' module
 * itself so every api.get/post/put/patch/delete call resolves against a
 * fake instance instead of hitting the network.
 *
 * vi.hoisted() is required here because vi.mock() factories run before
 * top-level imports — without it, `mockApi` wouldn't exist yet when the
 * mock factory references it.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { response: { use: vi.fn() } },
  },
}));

vi.mock('axios', () => ({
  default: { create: vi.fn(() => mockApi) },
}));

import {
  getRequest, postRequest, putRequest, patchRequest, deleteRequest,
  downloadFile, printPdf, setupInterceptors,
} from '@/core/api/api.service';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('request wrappers — happy paths', () => {
  test('getRequest calls api.get with params/headers, returns response.data', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ _id: '1' }] });
    const result = await getRequest('/things', { page: 1 }, { Authorization: 'x' });

    expect(mockApi.get).toHaveBeenCalledWith('/things', {
      params: { page: 1 },
      headers: { Authorization: 'x' },
    });
    expect(result).toEqual([{ _id: '1' }]);
  });

  test('getRequest defaults params/headers to {} when omitted', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    await getRequest('/things');
    expect(mockApi.get).toHaveBeenCalledWith('/things', { params: {}, headers: {} });
  });

  test('postRequest calls api.post with data/headers, returns response.data', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { _id: '1' } });
    const result = await postRequest('/things', { name: 'Foo' }, { a: 1 });

    expect(mockApi.post).toHaveBeenCalledWith('/things', { name: 'Foo' }, { headers: { a: 1 } });
    expect(result).toEqual({ _id: '1' });
  });

  test('putRequest calls api.put with data/headers, returns response.data', async () => {
    mockApi.put.mockResolvedValueOnce({ data: { _id: '1', name: 'Updated' } });
    const result = await putRequest('/things/1', { name: 'Updated' });

    expect(mockApi.put).toHaveBeenCalledWith('/things/1', { name: 'Updated' }, { headers: {} });
    expect(result).toEqual({ _id: '1', name: 'Updated' });
  });

  test('patchRequest calls api.patch with data/headers, returns response.data', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: { active: false } });
    const result = await patchRequest('/things/1', { active: false });

    expect(mockApi.patch).toHaveBeenCalledWith('/things/1', { active: false }, { headers: {} });
    expect(result).toEqual({ active: false });
  });

  test('deleteRequest calls api.delete with params/headers, returns response.data', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: { success: true } });
    const result = await deleteRequest('/things/1', { force: true });

    expect(mockApi.delete).toHaveBeenCalledWith('/things/1', { params: { force: true }, headers: {} });
    expect(result).toEqual({ success: true });
  });
});

describe('downloadFile', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  test('triggers a browser download and returns the filename from content-disposition', async () => {
    mockApi.get.mockResolvedValueOnce({
      status: 200,
      data: new Blob(['csv,data']),
      headers: { 'content-disposition': 'attachment; filename="report.csv"' },
    });

    const filename = await downloadFile('/things/export', { search: 'foo' });

    expect(mockApi.get).toHaveBeenCalledWith('/things/export', expect.objectContaining({
      responseType: 'blob',
      params: expect.objectContaining({ search: 'foo' }),
      validateStatus: null,
    }));
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    expect(filename).toBe('report.csv');
  });

  test('falls back to "download" as filename when content-disposition is missing', async () => {
    mockApi.get.mockResolvedValueOnce({
      status: 200,
      data: new Blob(['csv,data']),
      headers: {},
    });

    const filename = await downloadFile('/things/export', {});
    expect(filename).toBe('download');
  });

  test('adds a cache-busting _t param to every request', async () => {
    mockApi.get.mockResolvedValueOnce({ status: 200, data: new Blob([]), headers: {} });
    await downloadFile('/things/export', { search: 'foo' });

    const callArgs = mockApi.get.mock.calls[0][1];
    expect(callArgs.params).toHaveProperty('_t');
    expect(typeof callArgs.params._t).toBe('number');
  });

  test('throws a normalized error when the server responds with an error status', async () => {
    const errorBlob = { text: () => Promise.resolve(JSON.stringify({ message: 'No data to export' })) };
    mockApi.get.mockResolvedValueOnce({ status: 400, data: errorBlob, headers: {} });

    await expect(downloadFile('/things/export', {})).rejects.toThrow('No data to export');
  });

  test('falls back to a generic message when the error body is not valid JSON', async () => {
    const errorBlob = { text: () => Promise.resolve('not json') };
    mockApi.get.mockResolvedValueOnce({ status: 500, data: errorBlob, headers: {} });

    await expect(downloadFile('/things/export', {})).rejects.toThrow('Export failed');
  });
});

describe('printPdf', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:fake-pdf-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  test('appends a hidden iframe pointing at the generated blob URL', async () => {
    mockApi.get.mockResolvedValueOnce({ status: 200, data: new Blob(['%PDF-1.4']), headers: {} });

    await printPdf('/bills/1/pdf', {});

    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.src).toContain('blob:fake-pdf-url');
    iframe.remove(); // cleanup — this fn doesn't remove on success path itself until print fires
  });

  test('throws a normalized error when the server responds with an error status', async () => {
    const errorBlob = { text: () => Promise.resolve(JSON.stringify({ error: 'PDF not found' })) };
    mockApi.get.mockResolvedValueOnce({ status: 404, data: errorBlob, headers: {} });

    await expect(printPdf('/bills/1/pdf', {})).rejects.toThrow('PDF not found');
  });
});

describe('setupInterceptors — 401 handling', () => {
  // api.service.jsx keeps `isLoggingOut` as module-level state that, once
  // flipped to true, persists for the module's lifetime (by design — it's
  // meant to prevent duplicate "session expired" toasts across the app).
  // That means tests share it too unless we force a fresh module per test.
  let apiService;

  beforeEach(async () => {
    vi.resetModules();
    apiService = await import('@/core/api/api.service');
  });

  test('registers a response interceptor', () => {
    apiService.setupInterceptors(vi.fn());
    expect(mockApi.interceptors.response.use).toHaveBeenCalled();
  });

  test('calls onUnauthorized with the server message on a 401', () => {
    const onUnauthorized = vi.fn();
    apiService.setupInterceptors(onUnauthorized);
    const errorHandler = mockApi.interceptors.response.use.mock.calls[0][1];

    const error401 = { response: { status: 401, data: { message: 'Token expired' } } };
    errorHandler(error401).catch(() => {});

    expect(onUnauthorized).toHaveBeenCalledWith('Token expired');
  });

  test('falls back to a generic message when the server sends none', () => {
    const onUnauthorized = vi.fn();
    apiService.setupInterceptors(onUnauthorized);
    const errorHandler = mockApi.interceptors.response.use.mock.calls[0][1];

    errorHandler({ response: { status: 401, data: {} } }).catch(() => {});
    expect(onUnauthorized).toHaveBeenCalledWith('Session expired. Please login again.');
  });

  test('non-401 errors are rejected without calling onUnauthorized', () => {
    const onUnauthorized = vi.fn();
    apiService.setupInterceptors(onUnauthorized);
    const errorHandler = mockApi.interceptors.response.use.mock.calls[0][1];

    errorHandler({ response: { status: 500, data: {} } }).catch(() => {});
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  test('guards against firing onUnauthorized more than once for repeated 401s', () => {
    const onUnauthorized = vi.fn();
    apiService.setupInterceptors(onUnauthorized);
    const errorHandler = mockApi.interceptors.response.use.mock.calls[0][1];

    const error401 = { response: { status: 401, data: { message: 'Token expired' } } };
    errorHandler(error401).catch(() => {});
    errorHandler(error401).catch(() => {});

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('the success handler passes the response through unchanged', () => {
    apiService.setupInterceptors(vi.fn());
    const successHandler = mockApi.interceptors.response.use.mock.calls[0][0];
    const res = { data: 'ok' };
    expect(successHandler(res)).toBe(res);
  });
});