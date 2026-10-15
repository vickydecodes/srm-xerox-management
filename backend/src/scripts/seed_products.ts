import prisma from '../config/prisma.config.ts';
import { REPROGRAPHICS_PRICE_LIST } from './utils/pricelist.ts';

function generateProductCode(sNo: number, name: string): string {
  const slug = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  return `P-${String(sNo).padStart(3, '0')}-${slug}`;
}

export async function seedProducts() {
  console.log('\n📦 Seeding Products & Inventory from Reprographics Price List...');

  // 1. Ensure a Main Central Store Inventory exists
  let inventory = await prisma.inventory.findFirst({
    where: { name: 'Main Central Store', deleted: false }
  });

  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        name: 'Main Central Store',
        active: true,
        deleted: false
      }
    });
    console.log(`🏬 Created Inventory: "${inventory.name}" (ID: ${inventory.id})`);
  } else {
    console.log(`🏬 Using existing Inventory: "${inventory.name}" (ID: ${inventory.id})`);
  }

  // 2. Filter product items
  const productItems = REPROGRAPHICS_PRICE_LIST.filter(item => item.category === 'PRODUCT');
  console.log(`📋 Found ${productItems.length} product items to seed.\n`);

  const seededProducts = [];

  for (const item of productItems) {
    const code = generateProductCode(item.sNo, item.description);

    // Upsert Product
    const product = await prisma.product.upsert({
      where: { code },
      update: {
        name: item.description,
        description: `${item.description} - ${item.specification || ''} (${item.size || ''})`.trim(),
        attributes: {
          size: item.size || null,
          specification: item.specification || null,
          cashOldPrice: item.cashOldPrice,
          cashNewPrice: item.cashNewPrice,
          creditOldPrice: item.creditOldPrice,
          creditNewPrice: item.creditNewPrice,
          unit: item.unit
        },
        active: true,
        deleted: false,
        deletedAt: null
      },
      create: {
        code,
        name: item.description,
        description: `${item.description} - ${item.specification || ''} (${item.size || ''})`.trim(),
        attributes: {
          size: item.size || null,
          specification: item.specification || null,
          cashOldPrice: item.cashOldPrice,
          cashNewPrice: item.cashNewPrice,
          creditOldPrice: item.creditOldPrice,
          creditNewPrice: item.creditNewPrice,
          unit: item.unit
        },
        variants: [],
        active: true,
        deleted: false
      }
    });

    // Upsert InventoryProduct
    const existingInvProduct = await prisma.inventoryProduct.findFirst({
      where: {
        inventory: inventory.id,
        product: product.id,
        deleted: false
      }
    });

    let invProduct;
    if (existingInvProduct) {
      invProduct = await prisma.inventoryProduct.update({
        where: { id: existingInvProduct.id },
        data: {
          price: item.cashNewPrice,
          active: true,
          deleted: false,
          deletedAt: null
        }
      });
    } else {
      invProduct = await prisma.inventoryProduct.create({
        data: {
          inventory: inventory.id,
          product: product.id,
          price: item.cashNewPrice,
          quantity: 500, // Default starting stock
          active: true,
          deleted: false
        }
      });
    }

    console.log(`   ✅ [${product.code}] "${product.name}" -> Stock: ${invProduct.quantity} @ ₹${invProduct.price}/${item.unit}`);
    seededProducts.push({ product, invProduct });
  }

  console.log(`\n🎉 Successfully seeded ${seededProducts.length} Products and Inventory Products into PostgreSQL.`);
  return seededProducts;
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_products')) {
  seedProducts()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding products:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
