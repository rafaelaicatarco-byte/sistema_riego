const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();

  const username = 'admin';
  const email = 'admin@sistema-riego.local';
  const password = 'Admin123!';

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  });

  if (existing) {
    console.log('Usuario demo ya existe:', existing.username);
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hash,
      nombre: 'Administrador Demo',
    },
  });

  console.log('Usuario demo creado:');
  console.log({
    id: user.id,
    username: user.username,
    email: user.email,
    password,
  });
}

main()
  .catch((error) => {
    console.error('Error creando usuario demo:', error);
    process.exit(1);
  })
  .finally(async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });
