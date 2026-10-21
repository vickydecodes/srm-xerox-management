import prisma from '../config/prisma.config.ts';

export const BANNER_SIZES = [
  { size: '10x7', price: 1050 }, // 70 sq.ft @ ₹15
  { size: '10x8', price: 1200 }, // 80 sq.ft @ ₹15
  { size: '10x10', price: 1500 }, // 100 sq.ft @ ₹15
  { size: '20x5', price: 1500 }, // 100 sq.ft @ ₹15
  { size: '12x5', price: 900 }, // 60 sq.ft @ ₹15
  { size: '8x8', price: 960 }, // 64 sq.ft @ ₹15
  { size: '8x6', price: 720 }, // 48 sq.ft @ ₹15
  { size: '7x4', price: 420 }, // 28 sq.ft @ ₹15
  { size: '6x3', price: 270 }, // 18 sq.ft @ ₹15
  { size: '4x2', price: 120 }, // 8 sq.ft @ ₹15
];

export const EVENT_SERVICES_TO_SEED = [
  // 1. Banner (₹15 / sq.ft, Unit: ft, Custom Dimensions & Standard Sizes)
  {
    code: 'S-BANNER',
    name: 'Banner',
    description: 'Banner & Flex printing (₹15 per sq.ft). Standard sizes (10x7, 10x8, 10x10, etc.) and custom dimensions.',
    unit: 'ft',
    price: 15,
    isWorkOrder: true,
    isCustomSize: true,
    sizes: BANNER_SIZES,
  },
  // Also update legacy Banner & Flex service if present
  {
    code: 'S-015-BANNERFL',
    name: 'Banner & Flex (220 gsm)',
    description: 'Banner & Flex printing (₹15 per sq.ft). Standard sizes and custom dimensions supported.',
    unit: 'ft',
    price: 15,
    isWorkOrder: true,
    isCustomSize: true,
    sizes: BANNER_SIZES,
  },
  // 2. Invitation with Cover (A5 = ₹30.00)
  {
    code: 'S-INVITATION-COVER',
    name: 'Invitation with Cover',
    description: 'Invitation Card with Cover (A5 size) - ₹30.00',
    unit: 'piece',
    price: 30,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [{ size: 'A5', price: 30 }],
  },
  {
    code: 'S-012-INVITATI',
    name: 'Invitation with Cover (300 gsm)',
    description: 'Invitation Card with Cover (A5 size) - ₹30.00',
    unit: 'piece',
    price: 30,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [{ size: 'A5', price: 30 }],
  },
  // 3. Certificate (A4 = ₹22.00)
  {
    code: 'S-CERTIFICATE-A4',
    name: 'Certificate',
    description: 'Certificate printing (A4 size) - ₹22.00',
    unit: 'piece',
    price: 22,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [{ size: 'A4', price: 22 }],
  },
  // 4. Brochure F/B (Front & Back, A4 = ₹22.00)
  {
    code: 'S-BROCHURE-FB',
    name: 'Brochure (Front & Back)',
    description: 'Brochure Front & Back (A4 size) - ₹22.00',
    unit: 'piece',
    price: 22,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [{ size: 'A4', price: 22 }],
  },
  // 5. Brochure Single (Single Side, A4 = ₹17.00)
  {
    code: 'S-BROCHURE-SINGLE',
    name: 'Brochure (Single Side)',
    description: 'Brochure Single Side (A4 size) - ₹17.00',
    unit: 'piece',
    price: 17,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [{ size: 'A4', price: 17 }],
  },
  // 6. Poster (A4: ₹15.00, A3: ₹30.00)
  {
    code: 'S-POSTER',
    name: 'Poster',
    description: 'Poster printing (A4: ₹15.00, A3: ₹30.00)',
    unit: 'piece',
    price: 15,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [
      { size: 'A4', price: 15 },
      { size: 'A3', price: 30 },
    ],
  },
  // 7. Poster A3 (Direct Match)
  {
    code: 'S-POSTER-A3',
    name: 'Poster A3',
    description: 'Poster printing (A3 size) - ₹30.00',
    unit: 'piece',
    price: 30,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [{ size: 'A3', price: 30 }],
  },
  // 8. Poster A4 (Direct Match)
  {
    code: 'S-POSTER-A4',
    name: 'Poster A4',
    description: 'Poster printing (A4 size) - ₹15.00',
    unit: 'piece',
    price: 15,
    isWorkOrder: true,
    isCustomSize: false,
    sizes: [{ size: 'A4', price: 15 }],
  },
];

export async function seedEventServices() {
  console.log('\n🎨 Seeding Work Order & Event Services (Banner, Invitation, Certificate, Brochure, Poster)...');

  const seeded = [];

  for (const item of EVENT_SERVICES_TO_SEED) {
    const service = await prisma.service.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: item.description,
        unit: item.unit,
        price: item.price,
        isWorkOrder: item.isWorkOrder,
        isCustomSize: item.isCustomSize,
        sizes: item.sizes,
        active: true,
        deleted: false,
        deletedAt: null,
      },
      create: {
        code: item.code,
        name: item.name,
        description: item.description,
        unit: item.unit,
        price: item.price,
        materials: [],
        isWorkOrder: item.isWorkOrder,
        isCustomSize: item.isCustomSize,
        sizes: item.sizes,
        active: true,
        deleted: false,
      },
    });

    console.log(
      `   ✅ [${service.code}] "${service.name}" -> ₹${service.price} / ${service.unit} (${item.sizes.length} sizes, customSize=${item.isCustomSize})`
    );
    seeded.push(service);
  }

  console.log(`\n🎉 Successfully seeded ${seeded.length} Work Order & Event Services.`);
  return seeded;
}

// Auto-run when executed directly
const isDirectExecution =
  import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.includes('seed_event_services');

if (isDirectExecution) {
  seedEventServices()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Error seeding event services:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
