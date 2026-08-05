export const createEntityQueryActions = ({ crud, getQuery, setQuery }) => {
  const fetch = (incoming = {}) => {
    const currentQuery = getQuery();

    const nextQuery = {
      ...currentQuery,
      ...incoming,
    };

    setQuery(nextQuery);
    return crud.getAll(nextQuery);
  };

  const reset = (extras) => {
    const defaultQuery = {
      page: 1,
      limit: 10,
      sortBy: null,
      order: null,
      search: undefined,

      
      branch: undefined,
      batch: undefined,
      batches: undefined,
      board: undefined,
      standard: undefined,
      status: undefined,
      type: undefined,
      updatedAt: undefined,
      'paymentHistory.paymentMethodId': undefined,

      
      product: undefined,
      inventory: undefined,
      'requestedBy.inventory': undefined,
      'requestedBy.initiator': undefined,
      'history.status': undefined,
      'history.type': undefined,
      'history.source': undefined,

      
      event: undefined,
      direction: undefined,
      'reference.model': undefined,
      'reference.id': undefined,

      
      student: undefined,
      allocatedBy: undefined,
      collected: undefined,

      ...extras
    };

    setQuery(defaultQuery);
    return crud.getAll(defaultQuery);
  };

  const sortByColumn = (sortBy, order, limit = 10) => {
    const nextQuery = {
      page: 1,
      limit,
      sortBy,
      order,
    };

    setQuery(nextQuery);
    return crud.getAll(nextQuery);
  };

  const csv = (extras = {}) => {
    const safeExtras = extras && extras.constructor === Object ? extras : {};
    crud.exportCsv({ ...getQuery(), ...safeExtras });
  };

  const xlsx = (extras = {}) => {
    const safeExtras = extras && extras.constructor === Object ? extras : {};
    return crud.exportXlsx({ ...getQuery(), ...safeExtras });
  };

  const marksheetCsv = (batchId) => {
    crud.exportMarksheetCsv({ batch: batchId });
  };

  const marksheetXlsx = (batchId) => {
    crud.exportMarksheetXlsx({ batch: batchId });
  };

  const marksheetPdf = (batchId) => {
    crud.exportMarksheetPdf({ batch: batchId });
  };

  const pdf = (extras = {}) => {
    const safeExtras = extras && extras.constructor === Object ? extras : {};
    crud.exportPdf({ ...getQuery(), ...safeExtras });
  };

  const presets = {
    
    latest: (f = {}) => fetch({ sortBy: 'createdAt', order: 'desc', page: 1, ...f }),
    oldest: (f = {}) => fetch({ sortBy: 'createdAt', order: 'asc', page: 1, ...f }),
    ascending: (field = 'name', f = {}) => fetch({ sortBy: field, order: 'asc', page: 1, ...f }),
    descending: (field = 'name', f = {}) => fetch({ sortBy: field, order: 'desc', page: 1, ...f }),
    search: (term, f = {}) => fetch({ search: term, page: 1, ...f }),

    
    filterByBranch: (branch, f = {}) => fetch({ branch, page: 1, ...f }),
    filterByBatch: (batch, f = {}) => fetch({ batch, page: 1, ...f }),
    filterByBatches: (batches, f = {}) => fetch({ batches, page: 1, ...f }),
    filterByBoard: (board, f = {}) => fetch({ board, page: 1, ...f }),
    filterByType: (type, f = {}) => fetch({ type, page: 1, ...f }),
    filterByStandard: (standard, f = {}) => fetch({ standard, page: 1, ...f }),
    filterByStatus: (status, f = {}) => fetch({ status, page: 1, ...f }),
    filterByUpdated: (f = {}) => fetch({ updatedAt: 'asc', ...f }),
    filterByPaymentMethodId: (payment, f = {}) =>
      fetch({ 'paymentHistory.paymentMethodId': payment, page: 1, ...f }),

    
    filterByInventory: (inventory, f = {}) => fetch({ inventory, page: 1, ...f }),
    filterByProduct: (product, f = {}) => fetch({ product, page: 1, ...f }),
    filterByRequestingInventory: (inventoryId, f = {}) =>
      fetch({ 'requestedBy.inventory': inventoryId, page: 1, ...f }),
    filterByInitiator: (userId, f = {}) =>
      fetch({ 'requestedBy.initiator': userId, page: 1, ...f }),
    filterByLegStatus: (legStatus, f = {}) =>
      fetch({ 'history.status': legStatus, page: 1, ...f }),
    filterByLegType: (legType, f = {}) =>
      fetch({ 'history.type': legType, page: 1, ...f }),
    filterByLegSource: (inventoryId, f = {}) =>
      fetch({ 'history.source': inventoryId, page: 1, ...f }),

    
    filterByDirection: (direction, f = {}) => fetch({ direction, page: 1, ...f }),
    filterByEvent: (event, f = {}) => fetch({ event, page: 1, ...f }),
    filterByReferenceModel: (model, f = {}) => fetch({ 'reference.model': model, page: 1, ...f }),

    
    filterByStudent: (student, f = {}) => fetch({ student, page: 1, ...f }),
    filterByAllocatedBy: (userId, f = {}) => fetch({ allocatedBy: userId, page: 1, ...f }),
    filterByCollected: (collected, f = {}) => fetch({ collected, page: 1, ...f }),

    
    filterByField: (field, value, f = {}) => fetch({ [field]: value, page: 1, ...f }),
  };

  return {
    fetch,
    reset,
    sortByColumn,
    presets,
    csv, xlsx, pdf, marksheetCsv, marksheetXlsx, marksheetPdf
  };
};