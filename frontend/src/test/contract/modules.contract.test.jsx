/**
 * tests/contract/modules.contract.test.jsx
 *
 * PURPOSE
 * -------
 * Every module (branch, department, bill, order, ...) is a thin config
 * wrapper around three shared factories:
 *
 *   - createEntityStore()          -> core/factory/entity.store.jsx
 *   - createCrud({...})            -> core/factory/entity.crud.jsx
 *   - createEntityQueryActions({}) -> core/utils/entity.util.jsx
 *
 * The DEEP logic of those factories is tested once, in isolation, in:
 *   - tests/factory/entity.store.test.js
 *   - tests/factory/entity.crud.test.jsx
 *
 * This file does NOT re-test that logic. It only asserts that each
 * module correctly WIRES itself to the factories — i.e. the shape is
 * consistent. If a module forgets to pass `store` into createCrud, or
 * a new module skips wiring `getRole`, this file catches it without
 * needing a dedicated test file per module.
 *
 * HOW TO ADD A NEW MODULE
 * ------------------------
 * 1. Import its module hook and store hook below.
 * 2. Add one entry to the MODULES array with:
 *      - name        : display name, shows in test output
 *      - useModule   : the exported `use<Name>Module` hook
 *      - useStore    : the exported `use<Name>Store` hook
 *      - apiUrlsKey  : the key in apiurls this module is wired to
 *   That's it — every test below runs automatically for the new entry.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { apiurls } from '@/core/api/api.urls';

// ---------------------------------------------------------------------------
// Shared mocks — every module hook touches these at call time.
// Mocked once here so the contract test never makes real network/toast calls.
// ---------------------------------------------------------------------------
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/core/errors/error.handler', () => ({
  default: vi.fn(),
}));

vi.mock('@/core/api/api.request', () => ({
  apiRequest: vi.fn().mockResolvedValue({ data: [], pagination: null }),
}));

vi.mock('@/core/contexts/ui.context', () => ({
  useUI: () => ({ openModal: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Module registry — add one line per module here.
// Only `branch` is wired below as the reference implementation;
// duplicate the import + entry pattern for the rest.
// ---------------------------------------------------------------------------
import { useBranchModule } from '@/modules/branch/branch.module';
import { useBranchStore } from '@/modules/branch/branch.store';

const MODULES = [
  { name: 'branch', useModule: useBranchModule, useStore: useBranchStore, apiUrlsKey: 'branches' },
  // { name: 'department', useModule: useDepartmentModule, useStore: useDepartmentStore, apiUrlsKey: 'departments' },
  // { name: 'bill', useModule: useBillModule, useStore: useBillStore, apiUrlsKey: 'bills' },
  // ...add remaining modules here
];

// Preset names returned by createEntityQueryActions — fixed across every
// module since the factory doesn't branch on entity type.
const EXPECTED_PRESET_KEYS = [
  'latest', 'oldest', 'ascending', 'descending', 'search',
  'filterByBranch', 'filterByBatch', 'filterByBatches', 'filterByBoard',
  'filterByType', 'filterByStandard', 'filterByStatus', 'filterByUpdated',
  'filterByPaymentMethodId', 'filterByInventory', 'filterByProduct',
  'filterByRequestingInventory', 'filterByInitiator', 'filterByLegStatus',
  'filterByLegType', 'filterByLegSource', 'filterByDirection', 'filterByEvent',
  'filterByReferenceModel', 'filterByStudent', 'filterByAllocatedBy',
  'filterByCollected', 'filterByField', 'where',
];

describe.each(MODULES)('module contract: $name', ({ useModule, useStore, apiUrlsKey }) => {
  beforeEach(() => {
    // Reset store to a clean slate between tests so assertions don't leak
    // state from a previous test in the same module block.
    useStore.setState({ list: [], current: null }, false);
  });

  // -------------------- STORE CONTRACT --------------------
  test('store exposes the expected state shape', () => {
    const state = useStore.getState();

    expect(Array.isArray(state.list)).toBe(true);
    expect(state).toHaveProperty('current');
    expect(state).toHaveProperty('pagination');
    expect(state).toHaveProperty('query');
    expect(state.loading).toMatchObject({
      global: expect.any(Boolean),
      getAll: expect.any(Boolean),
      create: expect.any(Boolean),
      edit: expect.any(Boolean),
      delete: expect.any(Boolean),
    });
  });

  test('store exposes the expected actions', () => {
    const state = useStore.getState();
    const requiredActions = [
      'startLoading', 'stopLoading',
      'setQuery', 'replaceQuery', 'resetQuery',
      'set', 'add', 'update', 'remove',
      'setPagination', 'setCurrent', 'clearCurrent',
    ];

    requiredActions.forEach((action) => {
      expect(typeof state[action]).toBe('function');
    });
  });

  // -------------------- MODULE WIRING CONTRACT --------------------
  test('module hook exposes state/loading/pagination getters', () => {
    const { result } = renderHook(() => useModule());

    expect(Array.isArray(result.current.state)).toBe(true);
    expect(result.current.loading).toBeDefined();
    expect(result.current.pagination).toBeDefined();
  });

  test('module hook exposes store passthrough methods', () => {
    const { result } = renderHook(() => useModule());

    ['set', 'add', 'update', 'remove', 'setCurrent'].forEach((m) => {
      expect(typeof result.current[m]).toBe('function');
    });
  });

  test('module hook exposes query actions wired from createEntityQueryActions', () => {
    const { result } = renderHook(() => useModule());

    ['fetch', 'reset', 'sortByColumn', 'getQuery'].forEach((m) => {
      expect(typeof result.current[m]).toBe('function');
    });
    expect(typeof result.current.filters).toBe('object');

    EXPECTED_PRESET_KEYS.forEach((key) => {
      expect(typeof result.current.filters[key]).toBe('function');
    });
  });

  // -------------------- CRUD CONTRACT --------------------
  test('crud is wired with a non-empty entity name', () => {
    const { result } = renderHook(() => useModule());
    expect(typeof result.current.crud.entity).toBe('string');
    expect(result.current.crud.entity.length).toBeGreaterThan(0);
  });

  test('crud generates one method per registered API url for this module', () => {
    const { result } = renderHook(() => useModule());
    const registeredKeys = Object.keys(apiurls[apiUrlsKey]);

    expect(registeredKeys.length).toBeGreaterThan(0);
    registeredKeys.forEach((key) => {
      expect(typeof result.current.crud[key]).toBe('function');
    });
  });
});