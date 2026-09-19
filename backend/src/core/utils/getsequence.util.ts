import prisma from '@config/prisma.config.js';

export async function getNextSequence(key: string) {
  const seq = await prisma.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1 }
  });
  return seq.value;
}
