import prisma from '../config/prisma.config.ts';
import { REPROGRAPHICS_PRICE_LIST } from './utils/pricelist.ts';

function generateServiceCode(sNo: number, name: string, usedCodes: Set<string>): string {
  const slug = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase();

  let code = `S-${String(sNo).padStart(3, '0')}-${slug}`;
  let counter = 1;
  while (usedCodes.has(code)) {
    code = `S-${String(sNo).padStart(3, '0')}-${slug}-${counter++}`;
  }
  usedCodes.add(code);
  return code;
}

export async function seedServices() {
  console.log('\n🖨️  Seeding Services from Reprographics Price List...');

  const serviceItems = REPROGRAPHICS_PRICE_LIST.filter(item => item.category === 'SERVICE');
  console.log(`📋 Found ${serviceItems.length} service items to seed.\n`);

  const seededServices = [];
  const usedCodes = new Set<string>();

  for (const item of serviceItems) {
    const code = generateServiceCode(item.sNo, item.description, usedCodes);

    const isWorkOrder = [
      'BINDING',
      'BANNER',
      'FLEX',
      'BOARD',
      'STICKER',
      'CERTIFICATE',
      'BROUCHER',
      'INVITATION'
    ].some(keyword => item.description.toUpperCase().includes(keyword));

    const isCustomSize = Boolean(item.size && (item.size.includes('/') || item.size.includes('inch')));

    const description = [
      item.description,
      item.specification ? `Spec: ${item.specification}` : '',
      item.size ? `Size: ${item.size}` : '',
      item.creditNewPrice !== null ? `Credit Price: ₹${item.creditNewPrice}` : '',
      item.discountCashPrice ? `Cash Discount Price: ₹${item.discountCashPrice} (${item.discountLimitation || ''})` : ''
    ].filter(Boolean).join(' | ');

    const service = await prisma.service.upsert({
      where: { code },
      update: {
        name: item.description,
        description,
        unit: item.unit,
        price: item.cashNewPrice,
        isWorkOrder,
        isCustomSize,
        active: true,
        deleted: false,
        deletedAt: null
      },
      create: {
        code,
        name: item.description,
        description,
        unit: item.unit,
        price: item.cashNewPrice,
        materials: [],
        isWorkOrder,
        isCustomSize,
        sizes: item.size ? [item.size] : [],
        active: true,
        deleted: false
      }
    });

    console.log(`   ✅ [${service.code}] "${service.name}" -> ₹${service.price} / ${service.unit}`);
    seededServices.push(service);
  }

  console.log(`\n🎉 Successfully seeded ${seededServices.length} Services into PostgreSQL.`);
  return seededServices;
}

// Auto-run when executed directly
const isDirectExecution = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isDirectExecution || process.argv[1]?.includes('seed_services')) {
  seedServices()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding services:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
