import { PrismaClient } from '@prisma/client';
import { seedHomepage } from './seed-homepage';

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedHomepage(prisma);
    console.log('Classic homepage layout synced (default layout sections replaced).');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
