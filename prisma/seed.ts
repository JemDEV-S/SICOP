import bcrypt from "bcryptjs";
import { PrismaClient, RolUsuario } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@munisanjeronimo.gob.pe";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.upsert({
    where: { username },
    update: {
      email,
      passwordHash,
      nombreCompleto: "Administrador del sistema",
      rol: RolUsuario.SUPER_ADMIN,
      activo: true,
    },
    create: {
      username,
      email,
      passwordHash,
      nombreCompleto: "Administrador del sistema",
      rol: RolUsuario.SUPER_ADMIN,
      activo: true,
    },
  });

  console.log(`Administrador listo: ${username} (${email})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
