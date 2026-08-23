/**
 * tests/factory/entity.crud.test.jsx
 *
 * Deep test of the createCrud factory in isolation, using a fake `urls`
 * config and a fake store (vi.fn() spies) — NOT a real module. Every
 * module's crud (branch, order, bill, ...) is just createCrud() called
 * with a different `urls`/`entity` config; this file is what guarantees
 * that underlying behavior is correct for all of them.
 *
 * Wiring correctness per-module (does branch pass the right apiurls key,
 * does it forward getRole, etc.) is covered separately in
 * tests/contract/modules.contract.test.jsx.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createCrud } from '@/core/factory/entity.crud';
import { apiRequest } from '@/core/api/api.request';
import { toast } from 'sonner';
import handleApiError from '@/core/errors/error.handler';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/core/errors/error.handler', () => ({
  default: vi.fn(),
}));

vi.mock('@/core/api/api.request', () => ({
  apiRequest: vi.fn(),
}));

// camelToTitle's own correctness is covered in tests/utils/helper.test.js —
// mocked here as a pass-through so crud tests aren't coupled to its formatting.
vi.mock('@/core/utils/helper.utils', () => ({
  camelToTitle: (s) => s,
}));

const makeStore = () => ({
  startLoading: vi.fn(),
  stopLoading: vi.fn(),
  set: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  setPagination: vi.fn(),
  setCurrent: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCrud — method generation', () => {
  test('generates one async method per key in urls, plus entity/__urls', () => {
    const store = makeStore();
    const crud = createCrud({
      entity: 'Thing',
      urls: {
        getAll: { method: 'get', url: '/things' },
        create: { method: 'post', url: '/things' },
      },
      store,
      getRole: () => 'admin',
    });

    expect(crud.entity).toBe('Thing');
    expect(crud.__urls).toEqual({
      getAll: { method: 'get', url: '/things' },
      create: { method: 'post', url: '/things' },
    });
    expect(typeof crud.getAll).toBe('function');
    expect(typeof crud.create).toBe('function');
  });
});

describe('createCrud — getAll (list) behavior', () => {
  test('starts/stops the "getAll" loading key and populates the store', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: [{ _id: '1' }], pagination: { total: 1 } });

    const crud = createCrud({
      entity: 'Thing',
      urls: { getAll: { method: 'get', url: '/things' } },
      store,
      getRole: () => 'admin',
    });

    await crud.getAll({ page: 1 });

    expect(store.startLoading).toHaveBeenCalledWith('getAll');
    expect(apiRequest).toHaveBeenCalledWith('get', '/things', { params: { page: 1 } });
    expect(store.set).toHaveBeenCalledWith([{ _id: '1' }]);
    expect(store.setPagination).toHaveBeenCalledWith({ total: 1 });
    expect(store.stopLoading).toHaveBeenCalledWith('getAll');
  });

  test('falls back to an empty array when res.data is missing', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: undefined });

    const crud = createCrud({
      entity: 'Thing',
      urls: { getAll: { method: 'get', url: '/things' } },
      store,
      getRole: () => 'admin',
    });

    await crud.getAll();
    expect(store.set).toHaveBeenCalledWith([]);
  });

  test('does not toast on getAll (no default/custom message registered)', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: [] });
    const crud = createCrud({
      entity: 'Thing', urls: { getAll: { method: 'get', url: '/things' } }, store, getRole: () => 'admin',
    });

    await crud.getAll();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('createCrud — create behavior', () => {
  test('adds the result to the store and toasts the default create message', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: { _id: '1', name: 'Foo' } });
    const crud = createCrud({
      entity: 'Thing', urls: { create: { method: 'post', url: '/things' } }, store, getRole: () => 'admin',
    });

    await crud.create({ name: 'Foo' });

    expect(store.startLoading).toHaveBeenCalledWith('create');
    expect(store.add).toHaveBeenCalledWith({ _id: '1', name: 'Foo' });
    expect(toast.success).toHaveBeenCalledWith('Thing created successfully');
  });

  test('strips empty-string fields from the request body', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: {} });
    const crud = createCrud({
      entity: 'Thing', urls: { create: { method: 'post', url: '/things' } }, store, getRole: () => 'admin',
    });

    await crud.create({ name: 'Foo', notes: '' });

    expect(apiRequest).toHaveBeenCalledWith('post', '/things', { data: { name: 'Foo' } });
  });

  test('passes FormData through untouched (no field filtering)', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: {} });
    const crud = createCrud({
      entity: 'Thing', urls: { create: { method: 'post', url: '/things' } }, store, getRole: () => 'admin',
    });

    const form = new FormData();
    form.append('name', 'Foo');
    await crud.create(form);

    expect(apiRequest).toHaveBeenCalledWith('post', '/things', { data: form });
  });

  test('passes an array body through untouched', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: {} });
    const crud = createCrud({
      entity: 'Thing', urls: { create: { method: 'post', url: '/things' } }, store, getRole: () => 'admin',
    });

    const body = [{ name: 'Foo' }, { name: 'Bar' }];
    await crud.create(body);

    expect(apiRequest).toHaveBeenCalledWith('post', '/things', { data: body });
  });
});

describe('createCrud — edit / update-family behavior', () => {
  test('edit uses the "edit" loading key and updates + sets current', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: { _id: '1', name: 'Updated' } });
    const crud = createCrud({
      entity: 'Thing',
      urls: { edit: { method: 'put', url: (id) => `/things/${id}` } },
      store,
      getRole: () => 'admin',
    });

    await crud.edit('1', { name: 'Updated' });

    expect(store.startLoading).toHaveBeenCalledWith('edit');
    expect(apiRequest).toHaveBeenCalledWith('put', '/things/1', { data: { name: 'Updated' } });
    expect(store.update).toHaveBeenCalledWith('1', { _id: '1', name: 'Updated' });
    expect(store.setCurrent).toHaveBeenCalledWith({ _id: '1', name: 'Updated' });
    expect(toast.success).toHaveBeenCalledWith('Thing updated successfully');
  });

  test('every UPDATE_KEYS-family action shares the "edit" loading key', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValue({ data: {} });
    const crud = createCrud({
      entity: 'Order',
      urls: {
        submit: { method: 'post', url: '/orders/submit' },
        branchApprove: { method: 'patch', url: '/orders/approve' },
      },
      store,
      getRole: () => 'admin',
    });

    await crud.submit({});
    await crud.branchApprove({});

    expect(store.startLoading).toHaveBeenNthCalledWith(1, 'edit');
    expect(store.startLoading).toHaveBeenNthCalledWith(2, 'edit');
  });

  test('submit always toasts the fixed custom message regardless of response body', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: { anything: true } });
    const crud = createCrud({
      entity: 'Order', urls: { submit: { method: 'post', url: '/orders/submit' } }, store, getRole: () => 'admin',
    });

    await crud.submit({});
    expect(toast.success).toHaveBeenCalledWith('Order submitted for approval');
  });

  test('setActiveStatus custom toast reflects res.active (true -> activated message)', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: { active: true } });
    const crud = createCrud({
      entity: 'Branch',
      urls: { setActiveStatus: { method: 'patch', url: (id) => `/branches/${id}/status` } },
      store,
      getRole: () => 'admin',
    });

    await crud.setActiveStatus('1', { active: true });
    expect(toast.success).toHaveBeenCalledWith('Branch is now active');
  });

  test('setActiveStatus custom toast reflects res.active (false -> deactivated message)', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: { active: false } });
    const crud = createCrud({
      entity: 'Branch',
      urls: { setActiveStatus: { method: 'patch', url: (id) => `/branches/${id}/status` } },
      store,
      getRole: () => 'admin',
    });

    await crud.setActiveStatus('1', { active: false });
    expect(toast.success).toHaveBeenCalledWith('Branch has been deactivated');
  });
});

describe('createCrud — delete behavior (role-aware)', () => {
  test('non-super_admin: hard-removes the item from the store', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: {} });
    const crud = createCrud({
      entity: 'Thing',
      urls: { delete: { method: 'delete', url: (id) => `/things/${id}` } },
      store,
      getRole: () => 'admin',
    });

    await crud.delete('1');

    expect(store.startLoading).toHaveBeenCalledWith('delete');
    expect(store.remove).toHaveBeenCalledWith('1');
    expect(store.update).not.toHaveBeenCalled();
  });

  test('super_admin: soft-deletes by flagging deleted/active instead of removing', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: {} });
    const crud = createCrud({
      entity: 'Thing',
      urls: { delete: { method: 'delete', url: (id) => `/things/${id}` } },
      store,
      getRole: () => 'super_admin',
    });

    await crud.delete('1');

    expect(store.update).toHaveBeenCalledWith('1', { deleted: true, active: false });
    expect(store.remove).not.toHaveBeenCalled();
  });
});

describe('createCrud — retrieve / erase behavior', () => {
  test('retrieve un-deletes the item and falls back to the "global" loading key', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: {} });
    const crud = createCrud({
      entity: 'Thing',
      urls: { retrieve: { method: 'patch', url: (id) => `/things/${id}/retrieve` } },
      store,
      getRole: () => 'admin',
    });

    await crud.retrieve('1');

    expect(store.startLoading).toHaveBeenCalledWith('global');
    expect(store.update).toHaveBeenCalledWith('1', { deleted: false, active: true });
    expect(toast.success).toHaveBeenCalledWith('Thing retrieved successfully');
  });

  test('erase permanently removes the item and toasts the erase message', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: {} });
    const crud = createCrud({
      entity: 'Thing',
      urls: { erase: { method: 'delete', url: (id) => `/things/${id}/erase` } },
      store,
      getRole: () => 'admin',
    });

    await crud.erase('1');

    expect(store.startLoading).toHaveBeenCalledWith('global');
    expect(store.remove).toHaveBeenCalledWith('1');
    expect(toast.success).toHaveBeenCalledWith('Thing deleted permanently');
  });
});

describe('createCrud — download / export behavior', () => {
  test('strips page/limit and non-primitive params, calls apiRequest with "download"', async () => {
    apiRequest.mockResolvedValueOnce('report.csv');
    const store = makeStore();
    const crud = createCrud({
      entity: 'Thing', urls: { exportCsv: { method: 'get', url: '/things/export' } }, store, getRole: () => 'admin',
    });

    await crud.exportCsv({ page: 1, limit: 10, search: 'foo', onDone: () => {}, nested: {} });

    expect(apiRequest).toHaveBeenCalledWith('download', '/things/export', {
      params: { search: 'foo' },
    });
    expect(toast.success).toHaveBeenCalledWith('Downloaded: report.csv');
  });

  test('does not touch the store on export (no list/pagination side effects)', async () => {
    apiRequest.mockResolvedValueOnce('report.csv');
    const store = makeStore();
    const crud = createCrud({
      entity: 'Thing', urls: { exportCsv: { method: 'get', url: '/things/export' } }, store, getRole: () => 'admin',
    });

    await crud.exportCsv({});
    expect(store.set).not.toHaveBeenCalled();
    expect(store.setPagination).not.toHaveBeenCalled();
  });
});

describe('createCrud — __options handling', () => {
  test('skipStore: true prevents store.set from being called on getAll', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: [{ _id: '1' }] });
    const crud = createCrud({
      entity: 'Thing', urls: { getAll: { method: 'get', url: '/things' } }, store, getRole: () => 'admin',
    });

    await crud.getAll({ page: 1 }, { __options: { skipStore: true } });

    expect(store.set).not.toHaveBeenCalled();
  });

  test('toast: false suppresses the success toast', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: { _id: '1' } });
    const crud = createCrud({
      entity: 'Thing', urls: { create: { method: 'post', url: '/things' } }, store, getRole: () => 'admin',
    });

    await crud.create({ name: 'Foo' }, { __options: { toast: false } });
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('the __options marker itself is never sent as part of the request args', async () => {
    const store = makeStore();
    apiRequest.mockResolvedValueOnce({ data: [] });
    const crud = createCrud({
      entity: 'Thing', urls: { getAll: { method: 'get', url: '/things' } }, store, getRole: () => 'admin',
    });

    await crud.getAll({ page: 1 }, { __options: { skipStore: true } });
    expect(apiRequest).toHaveBeenCalledWith('get', '/things', { params: { page: 1 } });
  });
});

describe('createCrud — error handling', () => {
  test('on rejection: calls handleApiError, rethrows, and still stops loading', async () => {
    const store = makeStore();
    const error = new Error('network down');
    apiRequest.mockRejectedValueOnce(error);
    const crud = createCrud({
      entity: 'Thing', urls: { getAll: { method: 'get', url: '/things' } }, store, getRole: () => 'admin',
    });

    await expect(crud.getAll()).rejects.toThrow('network down');

    expect(handleApiError).toHaveBeenCalledWith(error, 'Failed to getAll Thing', { toast: true });
    expect(store.stopLoading).toHaveBeenCalledWith('getAll');
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('error: false is forwarded to handleApiError to suppress its toast', async () => {
    const store = makeStore();
    apiRequest.mockRejectedValueOnce(new Error('boom'));
    const crud = createCrud({
      entity: 'Thing', urls: { create: { method: 'post', url: '/things' } }, store, getRole: () => 'admin',
    });

    await expect(
      crud.create({ name: 'Foo' }, { __options: { error: false } })
    ).rejects.toThrow('boom');

    expect(handleApiError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create Thing', { toast: false });
  });
});