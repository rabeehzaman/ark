import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const org = await prisma.organization.findFirst({ where: { slug: "default-organization" } });
  if (!org) {
    console.error("Default Organization not found!");
    return;
  }

  const email = "user@ark.com";
  const password = "user123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists:", email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "ARK User",
      email,
      password: bcrypt.hashSync(password, 10),
      role: "USER",
      orgId: org.id,
    },
  });

  console.log("Created org user:");
  console.log("  Org:", org.name);
  console.log("  Email:", email);
  console.log("  Password:", password);
  console.log("  ID:", user.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
