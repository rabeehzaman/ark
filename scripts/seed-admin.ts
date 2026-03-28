import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@ark.com";
  const password = "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Super admin already exists:", email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password: bcrypt.hashSync(password, 10),
      role: "SUPER_ADMIN",
      orgId: null,
    },
  });

  console.log("Created super admin:");
  console.log("  Email:", email);
  console.log("  Password:", password);
  console.log("  ID:", user.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
