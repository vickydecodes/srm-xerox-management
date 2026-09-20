import prisma from '@config/prisma.config.js';

export async function enhanceDoc(model: any, doc: any, refs: string[], options?: any) {
  if (!doc) return doc;

  let baseSelect = ['_id', 'name', 'loginId'];
  if (options?.extras?.select) {
    const extras = options.extras.select.split(/[\s,]+/).filter(Boolean);
    baseSelect.push(...extras);
  }
  const finalSelect = baseSelect.join(' ');

  let q = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  if (typeof doc.select === 'function') {
    // Mongoose specific, but we keep it safe
  }

  // Manual Prisma Population
  for (const ref of refs) {
    if (ref === 'product' && typeof q.product === 'string') {
      const p = await prisma.product.findUnique({ where: { id: q.product } });
      if (p) q.product = { ...p, _id: p.id };
    } else if (ref === 'branch' && typeof q.branch === 'string') {
      const b = await prisma.branch.findUnique({ where: { id: q.branch } });
      if (b) q.branch = { ...b, _id: b.id };
    } else if (ref === 'department' && typeof q.department === 'string') {
      const d = await prisma.department.findUnique({ where: { id: q.department } });
      if (d) q.department = { ...d, _id: d.id };
    } else if (ref === 'shop' && typeof q.shop === 'string') {
      const s = await prisma.shop.findUnique({ where: { id: q.shop } });
      if (s) q.shop = { ...s, _id: s.id };
    } else if (ref === 'createdBy' && typeof q.createdBy === 'string') {
      const u = await prisma.user.findUnique({ where: { id: q.createdBy } });
      if (u) q.createdBy = { ...u, _id: u.id };
    } else if (ref === 'materials.product' && Array.isArray(q.materials)) {
      for (const mat of q.materials) {
        if (typeof mat.product === 'string') {
          const p = await prisma.inventoryProduct.findUnique({ where: { id: mat.product } });
          if (p) {
            mat.product = { ...p, _id: p.id };
            if (typeof mat.product.product === 'string') {
              const prod = await prisma.product.findUnique({ where: { id: mat.product.product } });
              if (prod) mat.product.product = { ...prod, _id: prod.id };
            }
          }
        }
      }
    } else if (ref === 'items.item' && Array.isArray(q.items)) {
      for (const item of q.items) {
        if (typeof item.item === 'string') {
           if (item.type === 'InventoryProduct') {
              const ip = await prisma.inventoryProduct.findUnique({ where: { id: item.item } });
              if (ip) {
                 item.item = { ...ip, _id: ip.id };
                 if (typeof item.item.product === 'string') {
                    const prod = await prisma.product.findUnique({ where: { id: item.item.product } });
                    if (prod) item.item.product = { ...prod, _id: prod.id };
                 }
              }
           } else if (item.type === 'Service') {
              const s = await prisma.service.findUnique({ where: { id: item.item } });
              if (s) item.item = { ...s, _id: s.id };
           }
        }
      }
    }
  }

  return q;
}
