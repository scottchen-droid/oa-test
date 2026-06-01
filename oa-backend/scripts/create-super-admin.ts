import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  const count = await prisma.user.count({ where: { isSuperAdmin: true } });
  if (count > 0) {
    console.log('Super admin already exists. Aborting.');
    process.exit(0);
  }

  const email = process.argv[2] || await ask('Email: ');
  const displayName = process.argv[3] || await ask('Display Name: ');
  const password = process.argv[4] || await ask('Password: ');

  if (!email || !displayName || !password) {
    console.error('All fields are required.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      displayName,
      passwordHash,
      isSuperAdmin: true,
      status: 'active',
      passwordChangedAt: new Date(),
    },
    select: { id: true, email: true, displayName: true },
  });

  console.log(`\nSuper admin created: ${user.displayName} <${user.email}> (id: ${user.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
