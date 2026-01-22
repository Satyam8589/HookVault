import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (optional - remove in production)
  await prisma.delivery.deleteMany();
  await prisma.event.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe',
      phone: '+1234567890',
      username: 'johndoe',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      phone: '+0987654321',
      username: 'janesmith',
    },
  });

  console.log('✅ Created test users');

  // Create webhooks for user1
  const webhook1 = await prisma.webhook.create({
    data: {
      url: 'https://webhook.site/order-webhook',
      events: ['order.created', 'order.updated'],
      isActive: true,
      userId: user1.id,
    },
  });

  const webhook2 = await prisma.webhook.create({
    data: {
      url: 'https://webhook.site/payment-webhook',
      events: ['payment.success', 'payment.failed'],
      isActive: true,
      userId: user1.id,
    },
  });

  // Create webhook for user2
  const webhook3 = await prisma.webhook.create({
    data: {
      url: 'https://webhook.site/user2-webhook',
      events: ['order.created', 'payment.success'],
      isActive: true,
      userId: user2.id,
    },
  });

  console.log('✅ Created test webhooks');

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      type: 'order.created',
      payload: {
        orderId: 'ORD-001',
        customerId: 'CUST-123',
        amount: 99.99,
        items: [
          { productId: 'PROD-1', quantity: 2, price: 49.99 },
        ],
      },
      status: 'PENDING',
    },
  });

  const event2 = await prisma.event.create({
    data: {
      type: 'payment.success',
      payload: {
        paymentId: 'PAY-001',
        orderId: 'ORD-001',
        amount: 99.99,
        method: 'credit_card',
      },
      status: 'PENDING',
    },
  });

  console.log('✅ Created sample events');

  // Create delivery records
  await prisma.delivery.create({
    data: {
      eventId: event1.id,
      webhookId: webhook1.id,
      status: 'RETRYING',
      retryCount: 0,
      maxRetries: 3,
    },
  });

  await prisma.delivery.create({
    data: {
      eventId: event2.id,
      webhookId: webhook2.id,
      status: 'SUCCESS',
      retryCount: 0,
      maxRetries: 3,
      responseCode: 200,
      responseBody: '{"status":"received"}',
      deliveredAt: new Date(),
    },
  });

  console.log('✅ Created delivery records');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 2`);
  console.log(`   - Webhooks: 3`);
  console.log(`   - Events: 2`);
  console.log(`   - Deliveries: 2`);
  console.log('\n🔑 Test Credentials:');
  console.log(`   Email: john@example.com`);
  console.log(`   Password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
