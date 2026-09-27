import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const OLD_DB_NAME = 'test';
const NEW_DB_NAME = 'umm-faisal-commerce';
const NEW_STORE_ID = new ObjectId('6aa8040be06353375437389e');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is missing from .env');
}

const client = new MongoClient(MONGODB_URI);

async function inspect() {
  try {
    await client.connect();

    const oldDb = client.db(OLD_DB_NAME);
    const newDb = client.db(NEW_DB_NAME);

    const oldStore = await oldDb.collection('stores').findOne({});

    if (!oldStore) {
      throw new Error('No store found in old database.');
    }

    const OLD_STORE_ID = oldStore._id;

    console.log('\n========================================');
    console.log('MIGRATION REFERENCE AUDIT');
    console.log('========================================\n');

    console.log(`OLD STORE: ${OLD_STORE_ID}`);
    console.log(`NEW STORE: ${NEW_STORE_ID}`);

    // ----------------------------------------
    // 1. OLD CATEGORIES
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('OLD CATEGORIES');
    console.log('----------------------------------------');

    const oldCategories = await oldDb
      .collection('categories')
      .find({ storeId: OLD_STORE_ID })
      .sort({ name: 1, _id: 1 })
      .toArray();

    for (const category of oldCategories) {
      console.log('\nCATEGORY');
      console.log(`  ID:       ${category._id}`);
      console.log(`  Name:     ${category.name}`);
      console.log(`  Slug:     ${category.slug || '(none)'}`);
      console.log(`  Parent:   ${category.parentId || '(none)'}`);
      console.log(`  Active:   ${category.isActive}`);
    }

    // ----------------------------------------
    // 2. PRODUCT COUNTS PER CATEGORY
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('PRODUCTS PER OLD CATEGORY');
    console.log('----------------------------------------');

    for (const category of oldCategories) {
      const count = await oldDb.collection('products').countDocuments({
        storeId: OLD_STORE_ID,
        categoryId: category._id,
      });

      console.log(
        `${category.name.padEnd(15)} ${String(category._id).padEnd(26)} products: ${count}`
      );
    }

    // ----------------------------------------
    // 3. PRODUCT SAMPLES FOR BOTH BAGS IDS
    // ----------------------------------------

    const bagsCategories = oldCategories.filter(
      (category) =>
        category.name?.toLowerCase() === 'bags'
    );

    console.log('\n----------------------------------------');
    console.log('BAGS CATEGORY PRODUCT REFERENCES');
    console.log('----------------------------------------');

    for (const category of bagsCategories) {
      const products = await oldDb
        .collection('products')
        .find({
          storeId: OLD_STORE_ID,
          categoryId: category._id,
        })
        .project({
          _id: 1,
          name: 1,
          slug: 1,
          categoryId: 1,
        })
        .toArray();

      console.log(`\nBAGS CATEGORY: ${category._id}`);
      console.log(`PRODUCT COUNT: ${products.length}`);

      products.slice(0, 15).forEach((product) => {
        console.log(
          `  ${product._id} | ${product.name}`
        );
      });
    }

    // ----------------------------------------
    // 4. USERS
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('OLD USERS');
    console.log('----------------------------------------');

    const users = await oldDb
      .collection('users')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        whatsappNumber: 1,
        storeId: 1,
      })
      .toArray();

    for (const user of users) {
      console.log(
        `  ${user._id} | ${user.email} | role: ${user.role} | ${user.name || ''}`
      );
    }

    // ----------------------------------------
    // 5. CUSTOMER REFERENCES
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('CUSTOMER REFERENCES');
    console.log('----------------------------------------');

    const customers = await oldDb
      .collection('customers')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        name: 1,
        phone: 1,
        email: 1,
      })
      .toArray();

    for (const customer of customers) {
      const orderCount = await oldDb.collection('orders').countDocuments({
        storeId: OLD_STORE_ID,
        customerId: customer._id,
      });

      const cartCount = await oldDb.collection('carts').countDocuments({
        storeId: OLD_STORE_ID,
        customerId: customer._id,
      });

      const eventCount = await oldDb
        .collection('customerevents')
        .countDocuments({
          storeId: OLD_STORE_ID,
          customerId: customer._id,
        });

      console.log(
        `  ${customer._id} | ${customer.name} | orders: ${orderCount} | carts: ${cartCount} | events: ${eventCount}`
      );
    }

    // ----------------------------------------
    // 6. ORDER REFERENCES
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('ORDER REFERENCES');
    console.log('----------------------------------------');

    const orders = await oldDb
      .collection('orders')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        orderNumber: 1,
        customerId: 1,
        userId: 1,
      })
      .toArray();

    for (const order of orders) {
      const paymentCount = await oldDb
        .collection('payments')
        .countDocuments({
          storeId: OLD_STORE_ID,
          orderId: order._id,
        });

      console.log(
        `  ${order.orderNumber} | orderId: ${order._id} | customerId: ${order.customerId} | payments: ${paymentCount}`
      );
    }

    // ----------------------------------------
    // 7. PAYMENT REFERENCES
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('PAYMENT REFERENCES');
    console.log('----------------------------------------');

    const payments = await oldDb
      .collection('payments')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        orderId: 1,
        customerId: 1,
        amount: 1,
        status: 1,
      })
      .toArray();

    for (const payment of payments) {
      console.log(
        `  ${payment._id} | orderId: ${payment.orderId} | customerId: ${payment.customerId} | amount: ${payment.amount} | status: ${payment.status}`
      );
    }

    // ----------------------------------------
    // 8. CART REFERENCES
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('CART REFERENCES');
    console.log('----------------------------------------');

    const carts = await oldDb
      .collection('carts')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        customerId: 1,
        userId: 1,
        status: 1,
      })
      .toArray();

    for (const cart of carts) {
      console.log(
        `  ${cart._id} | customerId: ${cart.customerId || '(none)'} | userId: ${cart.userId || '(none)'} | status: ${cart.status || '(none)'}`
      );
    }

    // ----------------------------------------
    // 9. CAMPAIGN REFERENCES
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('CAMPAIGN REFERENCES');
    console.log('----------------------------------------');

    const campaigns = await oldDb
      .collection('campaigns')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        name: 1,
        status: 1,
        createdBy: 1,
      })
      .toArray();

    for (const campaign of campaigns) {
      console.log(
        `  ${campaign._id} | ${campaign.name || '(no name)'} | status: ${campaign.status || '(none)'} | createdBy: ${campaign.createdBy || '(none)'}`
      );
    }

    // ----------------------------------------
    // 10. AUTOMATION REFERENCES
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('AUTOMATION REFERENCES');
    console.log('----------------------------------------');

    const automations = await oldDb
      .collection('automations')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        type: 1,
        status: 1,
        customerId: 1,
        orderId: 1,
        cartId: 1,
        campaignId: 1,
      })
      .toArray();

    const automationTypes = {};

    for (const automation of automations) {
      const type = automation.type || 'unknown';

      automationTypes[type] =
        (automationTypes[type] || 0) + 1;
    }

    console.log('\nAutomation type summary:');

    for (const [type, count] of Object.entries(automationTypes)) {
      console.log(`  ${type}: ${count}`);
    }

    // ----------------------------------------
    // 11. CUSTOMER EVENTS
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('CUSTOMER EVENT SUMMARY');
    console.log('----------------------------------------');

    const events = await oldDb
      .collection('customerevents')
      .find({ storeId: OLD_STORE_ID })
      .project({
        _id: 1,
        customerId: 1,
        type: 1,
        eventType: 1,
        productId: 1,
        orderId: 1,
      })
      .toArray();

    const eventTypes = {};

    for (const event of events) {
      const type =
        event.type ||
        event.eventType ||
        'unknown';

      eventTypes[type] =
        (eventTypes[type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(eventTypes)) {
      console.log(`  ${type}: ${count}`);
    }

    // ----------------------------------------
    // 12. TARGET CATEGORY CHECK
    // ----------------------------------------

    console.log('\n----------------------------------------');
    console.log('TARGET CATEGORIES');
    console.log('----------------------------------------');

    const newCategories = await newDb
      .collection('categories')
      .find({ storeId: NEW_STORE_ID })
      .sort({ name: 1 })
      .toArray();

    for (const category of newCategories) {
      console.log(
        `  ${category._id} | ${category.name} | ${category.slug || '(no slug)'}`
      );
    }

    // ----------------------------------------
    // COMPLETE
    // ----------------------------------------

    console.log('\n========================================');
    console.log('REFERENCE AUDIT COMPLETE');
    console.log('NO DATA WAS CHANGED.');
    console.log('========================================\n');
  } finally {
    await client.close();
  }
}

inspect().catch((error) => {
  console.error('\nAUDIT FAILED:');
  console.error(error);
  process.exit(1);
});