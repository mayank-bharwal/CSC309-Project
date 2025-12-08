#!/usr/bin/env node
/**
 * Deployment script for Railway
 * 1. Runs database migrations
 * 2. Creates superuser if one doesn't exist
 * 3. Starts the backend server
 */
"use strict";
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { execSync } = require("child_process");

const prisma = new PrismaClient();

// Default superuser credentials (can be overridden by environment variables)
const SUPERUSER_UTORID = process.env.SUPERUSER_UTORID || "bharwalm";
const SUPERUSER_EMAIL = process.env.SUPERUSER_EMAIL || "mayank@mail.utoronto.ca";
const SUPERUSER_PASSWORD = process.env.SUPERUSER_PASSWORD || "mayank123";
const SUPERUSER_NAME = process.env.SUPERUSER_NAME || "Admin User";

async function runMigrations() {
  console.log("🔄 Running database migrations...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

async function createSuperuserIfNotExists() {
  console.log("\n👤 Checking for superuser...");

  try {
    // Check if a superuser already exists
    const existingSuperuser = await prisma.user.findFirst({
      where: { role: "superuser" },
    });

    if (existingSuperuser) {
      console.log(`✅ Superuser already exists: ${existingSuperuser.email}`);
      return;
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERUSER_EMAIL },
    });

    if (existingUser) {
      console.log(`⚠️  User with email ${SUPERUSER_EMAIL} exists but is not a superuser`);
      console.log("   Upgrading to superuser role...");

      await prisma.user.update({
        where: { email: SUPERUSER_EMAIL },
        data: {
          role: "superuser",
          verified: true
        },
      });

      console.log("✅ User upgraded to superuser");
      return;
    }

    // Create new superuser
    console.log(`📝 Creating superuser: ${SUPERUSER_EMAIL}`);
    const hashedPassword = await bcrypt.hash(SUPERUSER_PASSWORD, 10);

    const superuser = await prisma.user.create({
      data: {
        utorid: SUPERUSER_UTORID,
        name: SUPERUSER_NAME,
        email: SUPERUSER_EMAIL,
        password: hashedPassword,
        role: "superuser",
        verified: true,
      },
    });

    console.log("✅ Superuser created successfully:");
    console.log(`   Email: ${superuser.email}`);
    console.log(`   UTORid: ${superuser.utorid}`);
    console.log(`   Role: ${superuser.role}`);
  } catch (error) {
    console.error("❌ Error managing superuser:", error.message);
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 Starting deployment process...\n");

  // Step 1: Run migrations
  await runMigrations();

  // Step 2: Create superuser if needed
  await createSuperuserIfNotExists();

  console.log("\n✨ Deployment setup completed successfully!");
  console.log("🚀 Starting server...\n");
}

main()
  .catch((e) => {
    console.error("❌ Deployment failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
