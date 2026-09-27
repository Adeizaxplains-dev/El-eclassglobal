import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const OLD_DB_NAME = 'test';
const NEW_DB_NAME = 'umm-faisal-commerce';

const OLD_STORE_ID = new ObjectId('6a83d31e73cc47912f6dd0e9');
const NEW_STORE_ID = new ObjectId('6aa8040be06353375437389e');

const OLD_ADMIN_ID = new ObjectId('6a83d31f73cc47912f6dd0ec');
const NEW_ADMIN_ID = new ObjectId('6aa804e3699bffd3872f6580');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is missing from .env');
}

const client = new MongoClient(MONGODB_URI);

const COLLECTIONS = [
  'users',
  'categories',
  'customers',
  'products',
  'carts',
  'orders',
  'payments',
  'conversations',
  'campaigns',
  'automations',
  'customerevents',
];

function id(value) {
  if (!value) return value;

  if (value instanceof ObjectId) {
    return value;
  }

  if (typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)) {
    return new ObjectId(value);
  }

  return value;
}

function remapStoreId(value) {
  if (!value) return value;

  const valueString = value.toString();

  if (valueString === OLD_STORE_ID.toString()) {
    return NEW_STORE_ID;
  }

  return value;
}

function remapUserId(value) {
  if (!value) return value;

  const valueString = value.toString();

  if (valueString === OLD_ADMIN_ID.toString()) {
    return NEW_ADMIN_ID;
  }

  return value;
}

function remapCustomerId(value) {
  return id(value);
}

function clone(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof ObjectId) {
    return new ObjectId(value.toString());
  }

  if (Array.isArray(value)) {
    return value.map(clone);
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'object') {
    const output = {};

    for (const [key, childValue] of Object.entries(value)) {
      output[key] = clone(childValue);
    }

    return output;
  }

  return value;
}

async function getCategoryMap(oldDb, newDb) {
  const oldCategories = await oldDb
    .collection('categories')
    .find({ storeId: OLD_STORE_ID })
    .toArray();

  const newCategories = await newDb
    .collection('categories')
    .find({ storeId: NEW_STORE_ID })
    .toArray();

  const map = new Map();

  for (const oldCategory of oldCategories) {
    const match = newCategories.find(
      (newCategory) =>
        newCategory.name?.trim().toLowerCase() ===
        oldCategory.name?.trim().toLowerCase()
    );

    if (!match) {
      throw new Error(
        `No target category found for old category "${oldCategory.name}" (${oldCategory._id})`
      );
    }

    map.set(oldCategory._id.toString(), match._id);

    console.log(
      `CATEGORY MAP: ${oldCategory.name} ${oldCategory._id} -> ${match.name} ${match._id}`
    );
  }

  return map;
}

function transformUser(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  // Old admin is intentionally NOT inserted.
  // Historical references are remapped to NEW_ADMIN_ID.
  if (result._id.toString() === OLD_ADMIN_ID.toString()) {
    return null;
  }

  return result;
}

function transformCategory() {
  // Old categories are not inserted because the target already
  // contains the canonical four categories.
  return null;
}

function transformCustomer(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  return result;
}

function transformProduct(doc, categoryMap) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.categoryId) {
    const mappedCategory = categoryMap.get(result.categoryId.toString());

    if (!mappedCategory) {
      throw new Error(
        `Product ${result._id} references unknown category ${result.categoryId}`
      );
    }

    result.categoryId = mappedCategory;
  }

  return result;
}

function transformCart(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.customerId) {
    result.customerId = remapCustomerId(result.customerId);
  }

  return result;
}

function transformOrder(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.customerId) {
    result.customerId = remapCustomerId(result.customerId);
  }

  if (Array.isArray(result.statusHistory)) {
    result.statusHistory = result.statusHistory.map((entry) => {
      const updated = clone(entry);

      if (updated.changedBy) {
        updated.changedBy = remapUserId(updated.changedBy);
      }

      return updated;
    });
  }

  if (Array.isArray(result.internalNotes)) {
    result.internalNotes = result.internalNotes.map((note) => {
      const updated = clone(note);

      if (updated.authorId) {
        updated.authorId = remapUserId(updated.authorId);
      }

      return updated;
    });
  }

  return result;
}

function transformPayment(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.orderId) {
    result.orderId = id(result.orderId);
  }

  return result;
}

function transformConversation(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.customerId) {
    result.customerId = remapCustomerId(result.customerId);
  }

  if (result.assignedTo) {
    result.assignedTo = remapUserId(result.assignedTo);
  }

  return result;
}

function transformCampaign(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.createdBy) {
    result.createdBy = remapUserId(result.createdBy);
  }

  return result;
}

function transformAutomation(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.customerId) {
    result.customerId = remapCustomerId(result.customerId);
  }

  if (result.campaignId) {
    result.campaignId = id(result.campaignId);
  }

  if (result.cartId) {
    result.cartId = id(result.cartId);
  }

  if (result.orderId) {
    result.orderId = id(result.orderId);
  }

  return result;
}

function transformCustomerEvent(doc) {
  const result = clone(doc);

  result.storeId = NEW_STORE_ID;

  if (result.customerId) {
    result.customerId = remapCustomerId(result.customerId);
  }

  return result;
}

async function migrate() {
  try {
    await client.connect();

    const oldDb = client.db(OLD_DB_NAME);
    const newDb = client.db(NEW_DB_NAME);

    console.log('');
    console.log('========================================');
    console.log('UMM-FAISAL DATA MIGRATION');
    console.log('========================================');
    console.log(`SOURCE: ${OLD_DB_NAME}`);
    console.log(`TARGET: ${NEW_DB_NAME}`);
    console.log(`OLD STORE: ${OLD_STORE_ID}`);
    console.log(`NEW STORE: ${NEW_STORE_ID}`);
    console.log('');

    // ---------------------------------------------------------
    // 1. Verify stores
    // ---------------------------------------------------------

    const oldStore = await oldDb
      .collection('stores')
      .findOne({ _id: OLD_STORE_ID });

    const newStore = await newDb
      .collection('stores')
      .findOne({ _id: NEW_STORE_ID });

    if (!oldStore) {
      throw new Error('Old store was not found.');
    }

    if (!newStore) {
      throw new Error('New target store was not found.');
    }

    console.log('STORE CHECK: PASS');

    // ---------------------------------------------------------
    // 2. Build category mapping
    // ---------------------------------------------------------

    console.log('');
    console.log('BUILDING CATEGORY MAP...');

    const categoryMap = await getCategoryMap(oldDb, newDb);

    // ---------------------------------------------------------
    // 3. Migrate users
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING USERS...');

    const oldUsers = await oldDb
      .collection('users')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let usersInserted = 0;
    let usersSkipped = 0;

    for (const oldUser of oldUsers) {
      const transformed = transformUser(oldUser);

      // Old admin is represented by the new seeded admin.
      if (!transformed) {
        console.log(
          `USER MAP: old admin ${oldUser._id} -> new admin ${NEW_ADMIN_ID}`
        );
        usersSkipped++;
        continue;
      }

      const existing = await newDb
        .collection('users')
        .findOne({ _id: transformed._id });

      if (existing) {
        console.log(`USER EXISTS: ${transformed._id}`);
        usersSkipped++;
        continue;
      }

      await newDb.collection('users').insertOne(transformed);

      console.log(
        `USER INSERTED: ${transformed.name || transformed.email || transformed._id}`
      );

      usersInserted++;
    }

    // ---------------------------------------------------------
    // 4. Migrate customers
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING CUSTOMERS...');

    const oldCustomers = await oldDb
      .collection('customers')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let customersInserted = 0;

    for (const oldCustomer of oldCustomers) {
      const transformed = transformCustomer(oldCustomer);

      const existing = await newDb
        .collection('customers')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('customers').insertOne(transformed);
      customersInserted++;
    }

    console.log(`CUSTOMERS INSERTED: ${customersInserted}`);

    // ---------------------------------------------------------
    // 5. Migrate products
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING PRODUCTS...');

    const oldProducts = await oldDb
      .collection('products')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let productsInserted = 0;

    for (const oldProduct of oldProducts) {
      const transformed = transformProduct(oldProduct, categoryMap);

      const existing = await newDb
        .collection('products')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('products').insertOne(transformed);
      productsInserted++;
    }

    console.log(`PRODUCTS INSERTED: ${productsInserted}`);

    // ---------------------------------------------------------
    // 6. Migrate carts
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING CARTS...');

    const oldCarts = await oldDb
      .collection('carts')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let cartsInserted = 0;

    for (const oldCart of oldCarts) {
      const transformed = transformCart(oldCart);

      const existing = await newDb
        .collection('carts')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('carts').insertOne(transformed);
      cartsInserted++;
    }

    console.log(`CARTS INSERTED: ${cartsInserted}`);

    // ---------------------------------------------------------
    // 7. Migrate orders
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING ORDERS...');

    const oldOrders = await oldDb
      .collection('orders')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let ordersInserted = 0;
    let orderUserRefsRemapped = 0;

    for (const oldOrder of oldOrders) {
      const transformed = transformOrder(oldOrder);

      if (
        JSON.stringify(oldOrder.statusHistory) !==
        JSON.stringify(transformed.statusHistory)
      ) {
        orderUserRefsRemapped++;
      }

      const existing = await newDb
        .collection('orders')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('orders').insertOne(transformed);
      ordersInserted++;
    }

    console.log(`ORDERS INSERTED: ${ordersInserted}`);
    console.log(`ORDER USER REFERENCES REMAPPED: ${orderUserRefsRemapped}`);

    // ---------------------------------------------------------
    // 8. Migrate payments
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING PAYMENTS...');

    const oldPayments = await oldDb
      .collection('payments')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let paymentsInserted = 0;

    for (const oldPayment of oldPayments) {
      const transformed = transformPayment(oldPayment);

      const existing = await newDb
        .collection('payments')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('payments').insertOne(transformed);
      paymentsInserted++;
    }

    console.log(`PAYMENTS INSERTED: ${paymentsInserted}`);

    // ---------------------------------------------------------
    // 9. Migrate conversations
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING CONVERSATIONS...');

    const oldConversations = await oldDb
      .collection('conversations')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let conversationsInserted = 0;

    for (const oldConversation of oldConversations) {
      const transformed = transformConversation(oldConversation);

      const existing = await newDb
        .collection('conversations')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('conversations').insertOne(transformed);
      conversationsInserted++;
    }

    console.log(`CONVERSATIONS INSERTED: ${conversationsInserted}`);

    // ---------------------------------------------------------
    // 10. Migrate campaigns
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING CAMPAIGNS...');

    const oldCampaigns = await oldDb
      .collection('campaigns')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let campaignsInserted = 0;

    for (const oldCampaign of oldCampaigns) {
      const transformed = transformCampaign(oldCampaign);

      const existing = await newDb
        .collection('campaigns')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('campaigns').insertOne(transformed);
      campaignsInserted++;
    }

    console.log(`CAMPAIGNS INSERTED: ${campaignsInserted}`);

    // ---------------------------------------------------------
    // 11. Migrate automations
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING AUTOMATIONS...');

    const oldAutomations = await oldDb
      .collection('automations')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let automationsInserted = 0;

    for (const oldAutomation of oldAutomations) {
      const transformed = transformAutomation(oldAutomation);

      const existing = await newDb
        .collection('automations')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('automations').insertOne(transformed);
      automationsInserted++;
    }

    console.log(`AUTOMATIONS INSERTED: ${automationsInserted}`);

    // ---------------------------------------------------------
    // 12. Migrate customer events
    // ---------------------------------------------------------

    console.log('');
    console.log('MIGRATING CUSTOMER EVENTS...');

    const oldEvents = await oldDb
      .collection('customerevents')
      .find({ storeId: OLD_STORE_ID })
      .toArray();

    let eventsInserted = 0;

    for (const oldEvent of oldEvents) {
      const transformed = transformCustomerEvent(oldEvent);

      const existing = await newDb
        .collection('customerevents')
        .findOne({ _id: transformed._id });

      if (existing) {
        continue;
      }

      await newDb.collection('customerevents').insertOne(transformed);
      eventsInserted++;
    }

    console.log(`CUSTOMER EVENTS INSERTED: ${eventsInserted}`);

    // ---------------------------------------------------------
    // 13. Merge old store configuration into new store
    // ---------------------------------------------------------

    console.log('');
    console.log('MERGING STORE CONFIGURATION...');

    const storeFieldsToCopy = [
      'logoUrl',
      'whatsappNumber',
      'currency',
      'settings',
      'contact',
      'deliverySettings',
      'hours',
      'orderSettings',
      'paymentSettings',
      'social',
      'whatsapp',
      'automationSettings',
    ];

    const storeUpdate = {};

    for (const field of storeFieldsToCopy) {
      if (oldStore[field] !== undefined) {
        storeUpdate[field] = clone(oldStore[field]);
      }
    }

    storeUpdate.updatedAt = new Date();

    await newDb.collection('stores').updateOne(
      { _id: NEW_STORE_ID },
      { $set: storeUpdate }
    );

    console.log('STORE CONFIGURATION: MERGED');

    // ---------------------------------------------------------
    // 14. Final counts
    // ---------------------------------------------------------

    console.log('');
    console.log('========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================');

    console.log(`Users inserted:           ${usersInserted}`);
    console.log(`Users skipped:            ${usersSkipped}`);
    console.log(`Customers inserted:       ${customersInserted}`);
    console.log(`Products inserted:        ${productsInserted}`);
    console.log(`Carts inserted:           ${cartsInserted}`);
    console.log(`Orders inserted:          ${ordersInserted}`);
    console.log(`Payments inserted:        ${paymentsInserted}`);
    console.log(`Conversations inserted:   ${conversationsInserted}`);
    console.log(`Campaigns inserted:       ${campaignsInserted}`);
    console.log(`Automations inserted:     ${automationsInserted}`);
    console.log(`Customer events inserted: ${eventsInserted}`);

    console.log('');
    console.log('SOURCE DATABASE WAS NOT MODIFIED.');
  } finally {
    await client.close();
  }
}

migrate().catch((error) => {
  console.error('');
  console.error('========================================');
  console.error('MIGRATION FAILED');
  console.error('========================================');
  console.error(error);
  process.exit(1);
});