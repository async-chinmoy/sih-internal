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

        const { batchId, hash } = await request.json();

        if (!batchId || !hash) {
            return NextResponse.json({ message: 'Batch ID and hash are required.' }, { status: 400 });
        }

        const batchToConfirm = await Batch.findById(batchId);

        if (!batchToConfirm) {
            return NextResponse.json({ message: 'Batch not found.' }, { status: 404 });
        }

        // Verify the hash matches the one stored in the database
        if (batchToConfirm.hash !== hash) {
            return NextResponse.json({ message: 'Invalid confirmation hash.' }, { status: 400 });
        }

        // Update the batch status to "Awaiting Farmer Confirmation"
        const updatedBatch = await Batch.findByIdAndUpdate(
            batchId,
            {
                $set: { status: "Awaiting Farmer Confirmation" },
                $push: {
                    trackingHistory: {
                        timestamp: new Date().toISOString(),
                        status: "Order Confirmed by Retailer",
                        note: `Retailer confirmed the order for lot ${batchToConfirm.lotNumber}.`,
                        updatedBy: batchToConfirm.retailer,
                    },
                },
            },
            { new: true }
        );

        if (!updatedBatch) {
            // This should not happen, but is a good safeguard
            return NextResponse.json({ message: 'Failed to update batch status.' }, { status: 500 });
        }

        // Log the data that is about to be sent to Pusher
        console.log("Sending Pusher event 'new-order-request' with data:", { batch: updatedBatch });

        // Broadcast a Pusher event to the farmer's channel for syncing
        await pusher.trigger('farmer-channel', 'new-order-request', { batch: updatedBatch });

        return NextResponse.json({ message: 'Order confirmed successfully.', batch: updatedBatch }, { status: 200 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
