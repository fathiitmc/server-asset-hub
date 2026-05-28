import bcrypt from "bcryptjs";

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new () => any;
};
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
