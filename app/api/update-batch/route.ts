// app/api/update-batch/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Batch from '@/models/Batch';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { batchId, updates, updatedBy, note } = await request.json();

    if (!batchId || !updates) {
      return NextResponse.json({ message: 'Missing batchId or updates' }, { status: 400 });
    }

    const newTrackingEvent = {
      timestamp: new Date().toISOString(),
      status: updates.status,
      note,
      updatedBy,
    };

    const updatedBatch = await Batch.findByIdAndUpdate(
      batchId,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
        $push: { trackingHistory: newTrackingEvent },
      },
      { new: true }
    );

    if (!updatedBatch) {
      return NextResponse.json({ message: 'Batch not found.' }, { status: 404 });
    }

    // Trigger a real-time event for the update
    await pusher.trigger('distributor-channel', 'batch-updated', { batch: updatedBatch });

    return NextResponse.json({
      message: 'Batch updated successfully.',
      batch: updatedBatch,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}