/**
 * tests/factory/entity.store.test.js
 *
 * Deep test of the entity.store factory in isolation.
 * Every module's store (useBranchStore, useOrderStore, ...) is just
 * `createEntityStore()` called with no real per-entity config — all the
 * actual logic lives here. Test this once, thoroughly, and every module
 * inherits correctness for free (see tests/contract/modules.contract.test.jsx
 * for the per-module wiring check).
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createEntityStore } from '@/core/factory/entity.store';

describe('createEntityStore', () => {
  let useStore;

  beforeEach(() => {
    // Fresh store instance per test — zustand stores are singletons once
    // created, so re-creating avoids state leaking across tests.
    useStore = createEntityStore();
  });

  describe('initial state', () => {
    test('starts with an empty list and no current item', () => {
      const state = useStore.getState();
      expect(state.list).toEqual([]);
      expect(state.current).toBeNull();
    });

    test('starts with all loading flags false', () => {
      const { loading } = useStore.getState();
      expect(loading).toEqual({
        global: false,
        getAll: false,
        create: false,
        edit: false,
        delete: false,
        retrieve: false,
        exportCsv: false,
        exportXlsx: false,
        exportPdf: false,
      });
    });

    test('starts with default pagination', () => {
      expect(useStore.getState().pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    test('starts with default query', () => {
      expect(useStore.getState().query).toEqual({
        page: 1,
        limit: 10,
        sortBy: null,
        order: null,
      });
    });
  });

  describe('loading state machine', () => {
    test('startLoading sets the given key and global to true', () => {
      useStore.getState().startLoading('create');
      const { loading } = useStore.getState();
      expect(loading.create).toBe(true);
      expect(loading.global).toBe(true);
      // unrelated keys untouched
      expect(loading.edit).toBe(false);
    });

    test('stopLoading clears the key; global goes false when nothing else is loading', () => {
      useStore.getState().startLoading('create');
      useStore.getState().stopLoading('create');
      const { loading } = useStore.getState();
      expect(loading.create).toBe(false);
      expect(loading.global).toBe(false);
    });

    test('global stays true if another key is still loading', () => {
      useStore.getState().startLoading('create');
      useStore.getState().startLoading('edit');
      useStore.getState().stopLoading('create');

      const { loading } = useStore.getState();
      expect(loading.create).toBe(false);
      expect(loading.edit).toBe(true);
      expect(loading.global).toBe(true); // edit still in flight
    });

    test('overlapping loads: stopping one key never affects a sibling key', () => {
      useStore.getState().startLoading('getAll');
      useStore.getState().startLoading('delete');
      useStore.getState().stopLoading('getAll');

      const { loading } = useStore.getState();
      expect(loading.getAll).toBe(false);
      expect(loading.delete).toBe(true);
    });
  });

  describe('query management', () => {
    test('setQuery merges into existing query', () => {
      useStore.getState().setQuery({ search: 'abc' });
      expect(useStore.getState().query).toEqual({
        page: 1,
        limit: 10,
        sortBy: null,
        order: null,
        search: 'abc',
      });
    });

    test('replaceQuery replaces the query wholesale, dropping prior keys', () => {
      useStore.getState().setQuery({ search: 'abc' });
      useStore.getState().replaceQuery({ page: 2 });
      expect(useStore.getState().query).toEqual({ page: 2 });
    });

    test('resetQuery restores the default query shape', () => {
      useStore.getState().setQuery({ search: 'abc', page: 5 });
      useStore.getState().resetQuery();
      expect(useStore.getState().query).toEqual({
        page: 1,
        limit: 10,
        sortBy: null,
        order: null,
      });
    });
  });

  describe('list mutations', () => {
    test('set replaces the entire list', () => {
      useStore.getState().set([{ _id: '1' }, { _id: '2' }]);
      expect(useStore.getState().list).toHaveLength(2);
    });

    test('add appends a single item without touching existing ones', () => {
      useStore.getState().set([{ _id: '1', name: 'a' }]);
      useStore.getState().add({ _id: '2', name: 'b' });
      expect(useStore.getState().list).toEqual([
        { _id: '1', name: 'a' },
        { _id: '2', name: 'b' },
      ]);
    });

    test('update merges fields into the item matching _id, leaves others untouched', () => {
      useStore.getState().set([
        { _id: '1', name: 'a', active: true },
        { _id: '2', name: 'b', active: true },
      ]);
      useStore.getState().update('1', { active: false });

      expect(useStore.getState().list).toEqual([
        { _id: '1', name: 'a', active: false },
        { _id: '2', name: 'b', active: true },
      ]);
    });

    test('update on a non-existent _id leaves the list unchanged', () => {
      useStore.getState().set([{ _id: '1', name: 'a' }]);
      useStore.getState().update('does-not-exist', { name: 'x' });
      expect(useStore.getState().list).toEqual([{ _id: '1', name: 'a' }]);
    });

    test('remove filters out the item matching _id', () => {
      useStore.getState().set([{ _id: '1' }, { _id: '2' }]);
      useStore.getState().remove('1');
      expect(useStore.getState().list).toEqual([{ _id: '2' }]);
    });
  });

  describe('pagination', () => {
    test('setPagination stores provided values', () => {
      useStore.getState().setPagination({
        page: 3, limit: 20, total: 100, pages: 5, hasNext: true, hasPrev: true,
      });
      expect(useStore.getState().pagination).toEqual({
        page: 3, limit: 20, total: 100, pages: 5, hasNext: true, hasPrev: true,
      });
    });

    test('setPagination falls back to defaults for any omitted field', () => {
      useStore.getState().setPagination({ total: 50 });
      expect(useStore.getState().pagination).toEqual({
        page: 1, limit: 10, total: 50, pages: 1, hasNext: false, hasPrev: false,
      });
    });
  });

  describe('current item', () => {
    test('setCurrent stores the given entity', () => {
      useStore.getState().setCurrent({ _id: '1', name: 'a' });
      expect(useStore.getState().current).toEqual({ _id: '1', name: 'a' });
    });

    test('clearCurrent resets current to null', () => {
      useStore.getState().setCurrent({ _id: '1' });
      useStore.getState().clearCurrent();
      expect(useStore.getState().current).toBeNull();
    });
  });
});