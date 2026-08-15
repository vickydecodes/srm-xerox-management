import { createOrderSchema } from './modules/order/order.validator.ts';

const testData = {
  branch: '6a7fff91511298995ff58941',
  purpose: 'aaaa',
  managementAmount: 0,
  sponsors: [ { name: 'cookie inc', amount: 11111 } ],
  items: [
    {
      type: 'Service',
      item: '6a7fff97511298995ff58b4b',
      name: 'Passport Photo Print',
      quantity: 113,
      price: 40
    }
  ]
};

console.log('Testing createOrderSchema:', createOrderSchema.safeParse(testData));
