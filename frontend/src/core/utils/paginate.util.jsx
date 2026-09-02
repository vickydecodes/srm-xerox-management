export default function paginator(module, params) {
  if (!module) return;

  if (params.__replace) {
    const currentQuery = module.getQuery ? module.getQuery() : {};
    module?.fetch({
      ...currentQuery,
      page: params.page,
      limit: params.limit,
      search: params.search !== undefined ? params.search : currentQuery.search,
    });
    return;
  }

  module?.fetch({
    ...params,
  });
}
