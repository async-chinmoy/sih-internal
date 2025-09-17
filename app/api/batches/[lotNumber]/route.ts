// app/api/batches/by-lot/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Batch from '@/models/Batch';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lotNumber = searchParams.get('lotNumber');

    if (!lotNumber) {
      return NextResponse.json({ message: 'Lot number is required' }, { status: 400 });
    }

    const batch = await Batch.findOne({ lotNumber: lotNumber });

    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch batch:', error);
    return NextResponse.json({ message: 'Failed to fetch batch' }, { status: 500 });
  }
}