/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example:
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
"use strict";
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const [utorid, email, password] = args;

  if (!utorid || !email || !password) {
    console.error("Usage: node prisma/createsu.js <utorid> <email> <password>");
    process.exit(1);
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error("Error: A user with this email already exists.");
    process.exit(1);
  }

  const superuser = await prisma.user.create({
    data: {
      utorid,
      name: "Test Superuser",
      email,
      password: hashedPassword,
      role: "superuser",
      verified: true,
    },
  });

  console.log("Superuser created successfully:");
  console.log(superuser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
