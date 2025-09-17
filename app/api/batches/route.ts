import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // Make sure this path is correct
import Batch from '@/models/Batch'; // Make sure this path is correct

export async function GET() {
  try {
    // Connect to the MongoDB database
    await dbConnect();

    // Fetch all batches from the database
    const batches = await Batch.find({});
    
    return NextResponse.json(batches, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

// You can also add other methods if needed, for example:
/*
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectMongo();
    const newBatch = await Batch.create(body);
    return NextResponse.json(newBatch, { status: 201 });
  } catch (error) {
    console.error('Failed to create batch:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}
*/