import mongoose from 'mongoose';
import { Automation } from '../models/Automation.js';
import { env } from '../config/env.js';
import { getDefaultStoreId } from '../services/storeContext.js';

async function run() {
  try {
    await mongoose.connect(env.mongodbUri);

    console.log('MongoDB connected');

    const storeId = await getDefaultStoreId();

    console.log('Active store resolved:', storeId.toString());

    const automation = await Automation.create({
      storeId,
      type: 'campaign',
      channel: 'whatsapp',
      status: 'pending',
      scheduledFor: new Date(),
      recipient: '2348164644748',
      message:
        'Flerläss Global automation test — internal automation pipeline test.',
      metadata: {
        test: true,
        phase: 4,
      },
    });

    console.log('Test automation created:');
    console.log({
      id: automation._id.toString(),
      type: automation.type,
      status: automation.status,
      scheduledFor: automation.scheduledFor,
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Test automation failed:', error);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
}

run();