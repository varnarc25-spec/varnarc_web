import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { SUPER_ADMIN_EMAIL } from '@varnarc/auth';

const db = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  if (!password) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD is not set');
  }

  const email = SUPER_ADMIN_EMAIL;
  const passwordHash = await bcrypt.hash(password, 12);
  const role = await db.role.findUnique({ where: { slug: 'super_admin' } });
  if (!role || role.deletedAt) {
    throw new Error('super_admin role is missing. Run database seed first.');
  }

  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    const id = randomUUID();
    user = await db.user.create({
      data: {
        id,
        auth0UserId: `local:${id}`,
        email,
        displayName: 'Super Admin',
        passwordHash,
        emailVerified: true,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      },
    });
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        deletedAt: null,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });
  }

  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  console.log(`Super admin ready: ${email} (password hash stored, not printed)`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
