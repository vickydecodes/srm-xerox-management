import mongoose from 'mongoose';
import { multiModelDynamicFilter } from '@core/constants/multimodelfilter.constant.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Service from '@db/models/service.model.ts';

// Strict configs for search to match ONLY by name and avoid description/code matches
const strictInventoryProductFilterConfig = {
  searchable: [] as string[],
  searchableRefs: [
    { field: 'product', ref: 'Product', matchOn: 'name' }
  ],
  filterable: ['active'],
  sortable: ['createdAt'],
  defaultSort: 'createdAt',
};

const strictServiceFilterConfig = {
  searchable: ['name'],
  filterable: ['active', 'deleted'],
  sortable: ['name'],
  defaultSort: 'name',
};

export const searchProducts = async (
  query: string,
  extraParams: Record<string, any> = {}
) => {
  const cleanQuery = query.trim().toLowerCase();

  const isServiceKeyword = ['service', 'services'].includes(cleanQuery);
  const isProductKeyword = ['product', 'products'].includes(cleanQuery);

  const queryProducts = !isServiceKeyword;
  const queryServices = !isProductKeyword;

  const configs = [];

  if (queryProducts) {
    configs.push({
      model: InventoryProduct,
      config: strictInventoryProductFilterConfig,
      type: 'InventoryProduct',
      options: {
        extras: {
          select: 'variants',
        },
      },
      mapFn: (ip: any) => {
        let resolvedVariant = null;
        if (ip.variant) {
          if (mongoose.Types.ObjectId.isValid(ip.variant)) {
            const variantObj = ip.product?.variants
              ? ip.product.variants.find((v: any) => String(v._id) === String(ip.variant))
              : null;
            resolvedVariant = variantObj ? variantObj.attributes : null;
          } else {
            // Legacy inline variant Map/Object
            resolvedVariant = ip.variant;
          }
        }

        return {
          _id: ip._id,
          type: 'InventoryProduct',
          name: ip.product?.name || 'Unknown Product',
          price: ip.price,
          variant: resolvedVariant,
          quantity: ip.quantity,
          inventory: ip.inventory,
          code: ip.product?.code || '',
          details: ip,
        };
      },
    });
  }

  if (queryServices) {
    configs.push({
      model: Service,
      config: strictServiceFilterConfig,
      type: 'Service',
      mapFn: (s: any) => ({
        _id: s._id,
        type: 'Service',
        name: s.name,
        price: s.price,
        variant: null,
        quantity: null,
        inventory: null,
        code: s.code || '',
        details: s,
      }),
    });
  }

  const isTypeQuery = isServiceKeyword || isProductKeyword;
  const filterParams = {
    ...extraParams,
    ...(isTypeQuery ? {} : { search: query }),
  };

  return multiModelDynamicFilter(
    configs,
    filterParams,
    { visibility: 'active-only' }
  );
};
