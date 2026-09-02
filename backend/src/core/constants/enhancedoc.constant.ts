export async function enhanceDoc(model: any, doc: any, refs: string[], options?: any) {
  if (!doc) return doc;

  let baseSelect = ['_id', 'name', 'loginId'];
  if (options?.extras?.select) {
    const extras = options.extras.select.split(/[\s,]+/).filter(Boolean);
    baseSelect.push(...extras);
  }
  const finalSelect = baseSelect.join(' ');

  const populateList = refs.map((ref) => {
    if (ref === 'materials.product') {
      return {
        path: 'materials.product',
        select: '_id product variant price quantity active',
        populate: [
          { path: 'product', select: '_id name code' }
        ]
      };
    }

    let select = '_id name';

    const extra = options?.extras?.populate?.[ref];
    if (extra) {
      select += ' ' + extra;
    }

    return { path: ref, select };
  });

  let q = doc;

  if (typeof q.select === 'function') {
    q = q.select(finalSelect);
  }

  q = await model.populate(q, populateList);

  return q;
}
