import mongoose from 'mongoose';
import Batch from '../models/Batch';
import { sharedDataStore } from '../store/supply-chain'; // Import your old data store

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
}

async function migrateData() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected!');

    const batches = sharedDataStore.getAllBatches();

    console.log(`Migrating ${batches.length} batches...`);

    try {
        // Convert to a format Mongoose expects and add a hash property
        const newBatches = batches.map(batch => ({
            ...batch,
            _id: batch.id, // Mongoose uses _id, so we'll map the id field
            // If the correct property is 'batch.hash', use:
                        hash: batch.hash, // Map the old hash property to the new hash
            
            // Or, if you do not have a hash property, remove this line entirely.
            lotNumber: batch.lotNumber,
        }));

        // Clear the old collection and insert the new data
        await Batch.deleteMany({});
        await Batch.insertMany(newBatches);

        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

migrateData();