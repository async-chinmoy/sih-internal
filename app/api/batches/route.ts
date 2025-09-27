import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Batch from '@/models/Batch'; 

export async function GET() {
  try {
    // Connect to the MongoDB database
    await dbConnect();

    // Fetch all batches and explicitly sort them by 'updatedAt' in descending order (-1).
    // This ensures that the most recently created OR updated batches (like confirmed retailer orders)
    // appear first on the farmer's dashboard.
    const batches = await Batch.find({}).sort({ updatedAt: -1 }); 
    
    return NextResponse.json(batches, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}
