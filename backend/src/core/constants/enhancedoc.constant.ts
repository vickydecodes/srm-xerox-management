import prisma from '@config/prisma.config.js';

const REF_DELEGATE_MAP: Record<string, string> = {
  createdBy: 'user',
  approvedBy: 'user',
  approver: 'user',
  paidBy: 'user',
  product: 'product',
};

async function batchFetch(delegateName: string, ids: string[]) {
  const delegate = (prisma as any)[delegateName];
  const map = new Map<string, any>();
  if (!delegate) return map;

  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (!uniqueIds.length) return map;

  const rows = await delegate.findMany({ where: { id: { in: uniqueIds } } });
  for (const row of rows) map.set(row.id, { ...row, _id: row.id });
  return map;
}

export async function enhanceDoc(model: any, doc: any, refs: string[], options?: any) {
  if (!doc) return doc;

  const q = { ...doc };

  // --- simple top-level refs: branch, department, createdBy, ... ---
  const simpleRefs = refs.filter((ref) => !ref.includes('.') && typeof q[ref] === 'string');
  await Promise.all(
    simpleRefs.map(async (ref) => {
      const delegateName = REF_DELEGATE_MAP[ref] ?? ref;
      const map = await batchFetch(delegateName, [q[ref]]);
      const item = map.get(q[ref]);
      if (item) q[ref] = item;
    }),
  );

  // --- materials.product (two-level nested, unchanged from your original) ---
  if (refs.includes('materials.product') && Array.isArray(q.materials)) {
    const productIds = q.materials.filter((m: any) => typeof m.product === 'string').map((m: any) => m.product);
    const productMap = await batchFetch('inventoryProduct', productIds);

    const nestedIds = [...productMap.values()].filter((p) => typeof p.product === 'string').map((p) => p.product);
    const nestedMap = nestedIds.length ? await batchFetch('product', nestedIds) : new Map();

    for (const mat of q.materials) {
      if (typeof mat.product === 'string') {
        const p = productMap.get(mat.product);
        if (p) {
          mat.product = { ...p };
          if (typeof mat.product.product === 'string') {
            const nested = nestedMap.get(mat.product.product);
            if (nested) mat.product.product = nested;
          }
        }
      }
    }
  }

  // --- items.item (polymorphic, unchanged from your original) ---
  if (refs.includes('items.item') && Array.isArray(q.items)) {
    const invIds = q.items.filter((i: any) => i.type === 'InventoryProduct' && typeof i.item === 'string').map((i: any) => i.item);
    const svcIds = q.items.filter((i: any) => i.type === 'Service' && typeof i.item === 'string').map((i: any) => i.item);

    const [invMap, svcMap] = await Promise.all([batchFetch('inventoryProduct', invIds), batchFetch('service', svcIds)]);

    const nestedIds = [...invMap.values()].filter((p) => typeof p.product === 'string').map((p) => p.product);
    const nestedMap = nestedIds.length ? await batchFetch('product', nestedIds) : new Map();

    for (const item of q.items) {
      if (typeof item.item !== 'string') continue;
      if (item.type === 'InventoryProduct') {
        const ip = invMap.get(item.item);
        if (ip) {
          item.item = { ...ip };
          if (typeof item.item.product === 'string') {
            const nested = nestedMap.get(item.item.product);
            if (nested) item.item.product = nested;
          }
        }
      } else if (item.type === 'Service') {
        const s = svcMap.get(item.item);
        if (s) item.item = { ...s };
      }
    }
  }

  // --- NEW: generic leaf dot-path — `field.subfield`, where doc[field] is
  //     either a single object or an array of objects, and subfield is a
  //     flat string id (no further nesting). Covers branchAdminApproval.approver,
  //     superAdminApproval.approver, approvalHistory.approver, and any future
  //     ref of this shape without a new branch per case.
  const genericDotRefs = refs.filter(
    (ref) => ref.includes('.') && ref !== 'materials.product' && ref !== 'items.item',
  );

  for (const ref of genericDotRefs) {
    const [field, subfield] = ref.split('.');
    const container = q[field];
    if (!container) continue;

    const targets: any[] = Array.isArray(container) ? container : [container];
    const ids = targets.filter((t) => typeof t?.[subfield] === 'string').map((t) => t[subfield]);
    if (!ids.length) continue;

    const delegateName = REF_DELEGATE_MAP[subfield] ?? subfield;
    const map = await batchFetch(delegateName, ids);

    for (const t of targets) {
      if (typeof t?.[subfield] === 'string') {
        const resolved = map.get(t[subfield]);
        if (resolved) t[subfield] = resolved;
      }
    }
  }

  return q;
}