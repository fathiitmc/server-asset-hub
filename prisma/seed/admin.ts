import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@serverassethub.local",
    },
    update: {
      password,
      role: "SUPER_ADMIN",
    },
    create: {
      email: "admin@serverassethub.local",
      password,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Admin created");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
