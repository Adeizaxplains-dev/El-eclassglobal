import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

const USER_IDS = [
  '6a83d31f73cc47912f6dd0ec',
  '6aa04455839326033145d0d6',
  '6aa3087aae6a09424a05ab58',
];

async function inspect() {
  try {
    await client.connect();

    const db = client.db('test');
    const userIds = USER_IDS.map((id) => new ObjectId(id));

    console.log('USER IDS BEING CHECKED:');
    console.log(USER_IDS.join('\n'));

    const collections = ['orders', 'conversations', 'campaigns'];

    for (const collectionName of collections) {
      console.log(`\n========== ${collectionName.toUpperCase()} ==========`);

      const collection = db.collection(collectionName);

      const docs = await collection
        .find({
          $or: [
            { createdBy: { $in: userIds } },
            { assignedTo: { $in: userIds } },
            { 'internalNotes.authorId': { $in: userIds } },
            { 'statusHistory.changedBy': { $in: userIds } },
          ],
        })
        .project({
          _id: 1,
          orderNumber: 1,
          createdBy: 1,
          assignedTo: 1,
          internalNotes: 1,
          statusHistory: 1,
        })
        .toArray();

      console.log(`REFERENCING DOCUMENTS: ${docs.length}`);

      if (docs.length > 0) {
        console.log(JSON.stringify(docs, null, 2));
      }
    }

    console.log('\nInspection complete. No data was changed.');
  } finally {
    await client.close();
  }
}

inspect().catch((error) => {
  console.error('Inspection failed:', error);
  process.exit(1);
});