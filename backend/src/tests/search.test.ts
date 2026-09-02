import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { bootstrap } from '../app.ts';
import Inventory from '@db/models/inventory.model.ts';
import Product from '@db/models/product.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Service from '@db/models/service.model.ts';
import { tester } from '@core/constants/tester.constant.ts';

const baseRoute = '/api/v1/searches';

let token: string;
let cleanupAdmin: () => Promise<void>;

let testInventoryId: string;
let testProductId: string;
let testInventoryProductId: string;
let testServiceId: string;

let uniqueProductKeyword: string;
let uniqueServiceKeyword: string;

beforeAll(async () => {
  await bootstrap();
  const setup = await tester.setupAdmin();
  token = setup.token;
  cleanupAdmin = setup.cleanup;

  const timestamp = Date.now();
  uniqueProductKeyword = `SearchUniqueProd${timestamp}`;
  uniqueServiceKeyword = `SearchUniqueSvc${timestamp}`;

  const inventory = await Inventory.create({
    name: `Test Search Inventory ${timestamp}`,
    active: true,
  });
  testInventoryId = inventory._id.toString();

  const product = new Product({
    name: `Test Notebook ${uniqueProductKeyword}`,
    description: 'Test searchable product',
    active: true,
  });
  await product.save();
  testProductId = product._id.toString();

  const inventoryProduct = new InventoryProduct({
    inventory: inventory._id,
    product: product._id,
    quantity: 25,
    price: 45,
    active: true,
  });
  await inventoryProduct.save();
  testInventoryProductId = inventoryProduct._id.toString();

  const service = new Service({
    name: `Test Binding ${uniqueServiceKeyword}`,
    unit: 'per book',
    price: 60,
    active: true,
  });
  await service.save();
  testServiceId = service._id.toString();
});

afterAll(async () => {
  if (cleanupAdmin) {
    await cleanupAdmin();
  }

  if (testServiceId) {
    await Service.findByIdAndDelete(testServiceId);
  }
  if (testInventoryProductId) {
    await InventoryProduct.findByIdAndDelete(testInventoryProductId);
  }
  if (testProductId) {
    await Product.findByIdAndDelete(testProductId);
  }
  if (testInventoryId) {
    await Inventory.findByIdAndDelete(testInventoryId);
  }
});

describe('Search API Endpoint Suite', () => {
  it('should reject requests without authorization header', async () => {
    const res = await tester.get(`${baseRoute}/products`);

    tester.assertUnauthorized(res, 'Unauthenticated');
  });

  it('should successfully fetch search results with empty query', async () => {
    const res = await tester.get(`${baseRoute}/products`, token);

    tester.assertFetched(res, 'products');
    expect(Array.isArray(res.body.data)).to.be.true;
  });

  it('should find matching product by query', async () => {
    const res = await tester.get(`${baseRoute}/products?q=${uniqueProductKeyword}`, token);

    tester.assertFetched(res, 'products');
    expect(res.body.data.some((item: any) => item.name.includes(uniqueProductKeyword))).to.be.true;
  });

  it('should find matching service by query', async () => {
    const res = await tester.get(`${baseRoute}/products?q=${uniqueServiceKeyword}`, token);

    tester.assertFetched(res, 'products');
    expect(res.body.data.some((item: any) => item.name.includes(uniqueServiceKeyword))).to.be.true;
  });

  it('should filter only services when query is "services"', async () => {
    const res = await tester.get(`${baseRoute}/products?q=services`, token);

    tester.assertFetched(res, 'products');
    expect(res.body.data.every((item: any) => item.type === 'Service')).to.be.true;
  });

  it('should filter only products when query is "products"', async () => {
    const res = await tester.get(`${baseRoute}/products?q=products`, token);

    tester.assertFetched(res, 'products');
    expect(res.body.data.every((item: any) => item.type === 'InventoryProduct')).to.be.true;
  });
});
