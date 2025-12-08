/**
 * Prisma Database Seed Script
 *
 * Initializes the database with:
 * - Superuser from environment variables
 * - Test users with various roles (Regular, Cashier, Manager)
 * - Users with different properties (verified, suspicious, with points, etc.)
 * - Sample promotions and events
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  try {
    await prisma.eventGuest.deleteMany();
    await prisma.eventOrganizer.deleteMany();
    await prisma.event.deleteMany();
    await prisma.userPromotion.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.log('⚠️  Some tables may not exist yet - continuing with seed...');
  }

  // Hash password for all users
  const defaultPassword = await bcrypt.hash('password123', 10);

  // ========== CREATE SUPERUSER FROM ENV ==========
  console.log('👑 Creating superuser from environment variables...');

  const superuserPassword = await bcrypt.hash(
    process.env.SUPERUSER_PASSWORD || 'superuser123',
    10
  );

  const superuser = await prisma.user.create({
    data: {
      utorid: process.env.SUPERUSER_UTORID || 'superuser',
      name: process.env.SUPERUSER_NAME || 'Super User',
      email: process.env.SUPERUSER_EMAIL || 'superuser@example.com',
      password: superuserPassword,
      role: 'superuser',
      verified: true,
      suspicious: false,
      points: 1000,
      birthday: new Date('1990-01-01'),
      createdAt: new Date(),
    },
  });

  console.log(`✅ Superuser created: ${superuser.utorid} (${superuser.email})`);

  // ========== CREATE MANAGERS ==========
  console.log('\n👔 Creating managers...');

  const manager1 = await prisma.user.create({
    data: {
      utorid: 'manager1',
      name: 'Alice Manager',
      email: 'alice.manager@example.com',
      password: defaultPassword,
      role: 'manager',
      verified: true,
      suspicious: false,
      points: 500,
      birthday: new Date('1988-05-15'),
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      utorid: 'manager2',
      name: 'Bob Manager',
      email: 'bob.manager@example.com',
      password: defaultPassword,
      role: 'manager',
      verified: true,
      suspicious: false,
      points: 750,
      birthday: new Date('1985-08-22'),
    },
  });

  console.log(`✅ Created ${manager1.name} and ${manager2.name}`);

  // ========== CREATE CASHIERS ==========
  console.log('\n💰 Creating cashiers...');

  const cashier1 = await prisma.user.create({
    data: {
      utorid: 'cashier1',
      name: 'Charlie Cashier',
      email: 'charlie.cashier@example.com',
      password: defaultPassword,
      role: 'cashier',
      verified: true,
      suspicious: false,
      points: 200,
      birthday: new Date('1995-03-10'),
    },
  });

  const cashier2 = await prisma.user.create({
    data: {
      utorid: 'cashier2',
      name: 'Diana Cashier',
      email: 'diana.cashier@example.com',
      password: defaultPassword,
      role: 'cashier',
      verified: true,
      suspicious: false,
      points: 150,
      birthday: new Date('1997-11-30'),
    },
  });

  const cashier3Suspicious = await prisma.user.create({
    data: {
      utorid: 'cashier3',
      name: 'Eve Suspicious Cashier',
      email: 'eve.cashier@example.com',
      password: defaultPassword,
      role: 'cashier',
      verified: true,
      suspicious: true, // Flagged as suspicious
      points: 50,
      birthday: new Date('1998-07-07'),
    },
  });

  console.log(`✅ Created ${cashier1.name}, ${cashier2.name}, and ${cashier3Suspicious.name}`);

  // ========== CREATE REGULAR USERS ==========
  console.log('\n👤 Creating regular users...');

  // Regular user - verified, good standing, has points
  const regular1 = await prisma.user.create({
    data: {
      utorid: 'regular1',
      name: 'Frank Regular',
      email: 'frank.regular@example.com',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      suspicious: false,
      points: 350,
      birthday: new Date('2000-01-15'),
    },
  });

  // Regular user - verified, high points
  const regular2 = await prisma.user.create({
    data: {
      utorid: 'regular2',
      name: 'Grace High-Points',
      email: 'grace.regular@example.com',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      suspicious: false,
      points: 2500,
      birthday: new Date('1999-06-20'),
    },
  });

  // Regular user - verified, no points
  const regular3 = await prisma.user.create({
    data: {
      utorid: 'regular3',
      name: 'Henry New-User',
      email: 'henry.regular@example.com',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      suspicious: false,
      points: 0,
      birthday: new Date('2001-09-05'),
    },
  });

  // Regular user - NOT verified
  const regular4Unverified = await prisma.user.create({
    data: {
      utorid: 'regular4',
      name: 'Ivy Unverified',
      email: 'ivy.regular@example.com',
      password: defaultPassword,
      role: 'regular',
      verified: false, // Not verified
      suspicious: false,
      points: 100,
      birthday: new Date('2002-02-14'),
    },
  });

  // Regular user - suspicious flag
  const regular5Suspicious = await prisma.user.create({
    data: {
      utorid: 'regular5',
      name: 'Jack Suspicious',
      email: 'jack.regular@example.com',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      suspicious: true, // Flagged as suspicious
      points: 50,
      birthday: new Date('2000-12-25'),
    },
  });

  // Regular user - suspended (no password)
  const regular6Suspended = await prisma.user.create({
    data: {
      utorid: 'regular6',
      name: 'Karen Suspended',
      email: 'karen.regular@example.com',
      password: null, // No password means suspended/disabled
      role: 'regular',
      verified: true,
      suspicious: true,
      points: 0,
      birthday: new Date('1998-04-18'),
    },
  });

  // Regular user - with birthday today (for testing birthday promotions)
  const today = new Date();
  const regular7Birthday = await prisma.user.create({
    data: {
      utorid: 'regular7',
      name: 'Leo Birthday',
      email: 'leo.regular@example.com',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      suspicious: false,
      points: 150,
      birthday: new Date(today.getFullYear() - 20, today.getMonth(), today.getDate()),
    },
  });

  // Regular user - OAuth linked (no password)
  const regular8OAuth = await prisma.user.create({
    data: {
      utorid: 'regular8',
      name: 'Mia OAuth',
      email: 'mia.regular@example.com',
      password: null,
      role: 'regular',
      verified: true,
      suspicious: false,
      points: 200,
      birthday: new Date('2001-03-10'),
      auth0UserId: 'auth0|123456789',
      oauthProvider: 'google',
      oauthLinkedAt: new Date(),
    },
  });

  console.log(`✅ Created 8 regular users with various properties`);

  // ========== CREATE PROMOTIONS ==========
  console.log('\n🎉 Creating promotions...');

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Active automatic promotion
  const promotion1 = await prisma.promotion.create({
    data: {
      name: 'Holiday Bonus',
      description: 'Earn 2x points on all purchases during the holiday season!',
      type: 'automatic',
      startTime: oneWeekAgo,
      endTime: oneMonthFromNow,
      minSpending: 10.0,
      rate: 2.0, // 2x multiplier
      points: null,
    },
  });

  // Active one-time promotion
  const promotion2 = await prisma.promotion.create({
    data: {
      name: 'First Purchase Bonus',
      description: 'Get 50 bonus points on your first purchase!',
      type: 'one_time',
      startTime: oneWeekAgo,
      endTime: oneMonthFromNow,
      minSpending: 5.0,
      rate: null,
      points: 50,
    },
  });

  // Future promotion
  const promotion3 = await prisma.promotion.create({
    data: {
      name: 'Summer Sale',
      description: 'Earn 3x points on all purchases this summer!',
      type: 'automatic',
      startTime: oneMonthFromNow,
      endTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      minSpending: 20.0,
      rate: 3.0,
      points: null,
    },
  });

  console.log(`✅ Created 3 promotions`);

  // ========== CREATE EVENTS ==========
  console.log('\n🎪 Creating events...');

  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);

  // Published event with capacity
  const event1 = await prisma.event.create({
    data: {
      name: 'Welcome Week Social',
      description: 'Join us for pizza and games! All new members welcome.',
      location: 'BA2165',
      startTime: nextWeek,
      endTime: nextWeekEnd,
      capacity: 50,
      points: 1000,
      pointsRemain: 1000,
      pointsAwarded: 0,
      published: true,
      organizers: {
        create: [
          { userId: manager1.id },
          { userId: cashier1.id },
        ],
      },
    },
  });

  // Published event without capacity
  const event2 = await prisma.event.create({
    data: {
      name: 'Annual Hackathon',
      description: 'Code for 24 hours straight! Food and prizes provided.',
      location: 'Bahen Centre',
      startTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      capacity: null,
      points: 5000,
      pointsRemain: 5000,
      pointsAwarded: 0,
      published: true,
      organizers: {
        create: [
          { userId: manager2.id },
        ],
      },
    },
  });

  // Unpublished (draft) event
  const event3 = await prisma.event.create({
    data: {
      name: 'Study Session',
      description: 'Group study session for midterms.',
      location: 'Robarts Library',
      startTime: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      capacity: 20,
      points: 500,
      pointsRemain: 500,
      pointsAwarded: 0,
      published: false,
    },
  });

  // Register some guests for event1
  await prisma.eventGuest.createMany({
    data: [
      { eventId: event1.id, userId: regular1.id },
      { eventId: event1.id, userId: regular2.id },
      { eventId: event1.id, userId: regular3.id },
    ],
  });

  console.log(`✅ Created 3 events with organizers and guests`);

  // ========== CREATE SAMPLE TRANSACTIONS ==========
  console.log('\n💳 Creating sample transactions...');

  // Purchase transaction
  await prisma.transaction.create({
    data: {
      userId: regular1.id,
      utorid: regular1.utorid,
      type: 'purchase',
      amount: 50,
      spent: 25.0,
      createdBy: cashier1.utorid,
      remark: 'Coffee and snacks',
    },
  });

  // Redemption transaction
  await prisma.transaction.create({
    data: {
      userId: regular2.id,
      utorid: regular2.utorid,
      type: 'redemption',
      amount: -100,
      redeemed: 100,
      createdBy: cashier2.utorid,
      remark: 'Free t-shirt',
    },
  });

  // Adjustment transaction
  await prisma.transaction.create({
    data: {
      userId: regular3.id,
      utorid: regular3.utorid,
      type: 'adjustment',
      amount: 200,
      createdBy: manager1.utorid,
      remark: 'Bonus points for volunteering',
    },
  });

  // Suspicious transaction
  await prisma.transaction.create({
    data: {
      userId: regular5Suspicious.id,
      utorid: regular5Suspicious.utorid,
      type: 'purchase',
      amount: 500,
      spent: 1000.0,
      suspicious: true,
      createdBy: cashier3Suspicious.utorid,
      remark: 'Unusually large purchase',
    },
  });

  console.log(`✅ Created 4 sample transactions`);

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Database seeded successfully!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`  - 1 Superuser: ${superuser.utorid} (${superuser.email})`);
  console.log(`  - 2 Managers`);
  console.log(`  - 3 Cashiers (1 suspicious)`);
  console.log(`  - 8 Regular users (various properties)`);
  console.log(`  - 3 Promotions`);
  console.log(`  - 3 Events`);
  console.log(`  - 4 Sample transactions`);

  console.log('\n🔑 Login Credentials:');
  console.log(`  Superuser: ${superuser.utorid} / ${process.env.SUPERUSER_PASSWORD || 'superuser123'}`);
  console.log(`  All others: [utorid] / password123`);
  console.log('\n💡 Examples:');
  console.log(`  - Manager: manager1 / password123`);
  console.log(`  - Cashier: cashier1 / password123`);
  console.log(`  - Regular: regular1 / password123`);
  console.log('\n✨ Test users with special properties:');
  console.log(`  - regular2: High points (2500)`);
  console.log(`  - regular4: Unverified`);
  console.log(`  - regular5: Suspicious flag`);
  console.log(`  - regular6: Suspended (no password)`);
  console.log(`  - regular7: Birthday today`);
  console.log(`  - regular8: OAuth linked`);
  console.log(`  - cashier3: Suspicious cashier`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
