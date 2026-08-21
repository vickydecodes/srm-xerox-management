import { describe, it, expect } from 'vitest';
import { createEntityStore } from '../core/factory/entity.store';

describe('Entity Store Factory', () => {
  it('creates a store with default values', () => {
    const useStore = createEntityStore('test');
    const store = useStore.getState();

    expect(store.list).toEqual([]);
    expect(store.current).toBeNull();
    expect(store.loading.global).toBe(false);
    expect(store.query.page).toBe(1);
    expect(store.query.limit).toBe(10);
  });

  it('manages loading states correctly', () => {
    const useStore = createEntityStore('test');
    
    // Start loading
    useStore.getState().startLoading('getAll');
    expect(useStore.getState().loading.getAll).toBe(true);
    expect(useStore.getState().loading.global).toBe(true);

    // Stop loading
    useStore.getState().stopLoading('getAll');
    expect(useStore.getState().loading.getAll).toBe(false);
    expect(useStore.getState().loading.global).toBe(false);
  });

  it('supports list mutations: set, add, update, remove', () => {
    const useStore = createEntityStore('test');

    // Add item
    useStore.getState().add({ _id: '1', name: 'Item 1' });
    expect(useStore.getState().list).toEqual([{ _id: '1', name: 'Item 1' }]);

    // Update item
    useStore.getState().update('1', { name: 'Updated Item' });
    expect(useStore.getState().list).toEqual([{ _id: '1', name: 'Updated Item' }]);

    // Remove item
    useStore.getState().remove('1');
    expect(useStore.getState().list).toEqual([]);
  });

  it('supports query modifications', () => {
    const useStore = createEntityStore('test');

    useStore.getState().setQuery({ page: 2, sortBy: 'name' });
    expect(useStore.getState().query.page).toBe(2);
    expect(useStore.getState().query.sortBy).toBe('name');

    useStore.getState().resetQuery();
    expect(useStore.getState().query.page).toBe(1);
    expect(useStore.getState().query.sortBy).toBeNull();
  });
});
