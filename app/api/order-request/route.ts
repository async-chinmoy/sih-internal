import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import Batch from '@/models/Batch';

// The Pusher instance is not needed here as the order isn't confirmed yet.

export async function POST(request: Request) {
  try {
    await dbConnect();

    const {
      cropName, 
      quantityKg,
      selectedGrade, 
      contactPerson,
      contactPhone,
      preferredDate,
      price,
      notes,
    } = await request.json();

    if (!cropName || !quantityKg || !contactPerson || !contactPhone || !selectedGrade || !price) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const orderId = uuidv4();
    const hash = crypto.createHash('sha256').update(orderId + new Date().toISOString()).digest('hex');

    const newBatch = await Batch.create({
      _id: orderId,
      hash: `0x${hash}`, // Storing the hash for later verification
      lotNumber: `LOT-${Math.floor(Math.random() * 100000)}`, // A new lot number is created
      crop: cropName,
      weight: `${quantityKg} kg`,
      farmer: null, // Farmer details are not yet known
      retailer: contactPerson,
      retailerPhone: contactPhone,
      harvestDate: preferredDate || new Date().toISOString().split('T')[0],
      status: "Awaiting Farmer Confirmation", // NEW status
      price: price,
      quality: `Grade ${selectedGrade}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes,
      trackingHistory: [
        {
          timestamp: new Date().toISOString(),
          status: "Order Request Placed",
          note: `Retailer ${contactPerson} placed an order request. Awaiting retailer confirmation.`,
          updatedBy: contactPerson,
        },
      ],
    });

    return NextResponse.json({
      message: 'Order request placed successfully. Please confirm with the hash.',
      batch: newBatch,
    }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}