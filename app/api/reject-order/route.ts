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

        const { batchId, rejectionReason } = await request.json();

        if (!batchId) {
            return NextResponse.json({ 
                message: 'Batch ID is required.' 
            }, { status: 400 });
        }

        const batchToReject = await Batch.findById(batchId);

        if (!batchToReject) {
            return NextResponse.json({ 
                message: 'Batch not found.' 
            }, { status: 404 });
        }

        // Verify the batch is in the correct status for rejection
        if (batchToReject.status !== "Awaiting Farmer Confirmation") {
            return NextResponse.json({ 
                message: 'Batch is not awaiting farmer confirmation.' 
            }, { status: 400 });
        }

        const farmerName = batchToReject.farmer || 'John Smith'; // Default farmer name
        const defaultReason = rejectionReason || 'Order rejected by farmer';

        // Update the batch status to "Rejected"
        const updatedBatch = await Batch.findByIdAndUpdate(
            batchId,
            {
                $set: { 
                    status: "Rejected",
                    updatedAt: new Date().toISOString(),
                    notes: `${batchToReject.notes || ''}\nRejected: ${defaultReason}`.trim()
                },
                $push: {
                    trackingHistory: {
                        timestamp: new Date().toISOString(),
                        status: "Order Rejected by Farmer",
                        note: `Farmer ${farmerName} rejected the order for ${batchToReject.crop}. Reason: ${defaultReason}`,
                        updatedBy: farmerName,
                        location: batchToReject.farmLocation || "Farm Location"
                    },
                },
            },
            { new: true }
        );

        if (!updatedBatch) {
            return NextResponse.json({ 
                message: 'Failed to update batch status.' 
            }, { status: 500 });
        }

        // Log the rejection event
        console.log(`Order rejected: Batch ${updatedBatch.lotNumber} - ${updatedBatch.crop} by ${farmerName}. Reason: ${defaultReason}`);

        // Broadcast rejection notifications
        try {
            // Notify the system channel for general updates
            await pusher.trigger('system-channel', 'batch-rejected', { 
                batch: updatedBatch,
                farmerName: farmerName,
                rejectionReason: defaultReason,
                rejectedAt: new Date().toISOString()
            });

            // Notify retailer channel if retailer info exists
            if (updatedBatch.retailer) {
                await pusher.trigger('retailer-channel', 'order-rejected-by-farmer', { 
                    batch: updatedBatch,
                    retailer: updatedBatch.retailer,
                    message: `Your order for ${updatedBatch.weight} of ${updatedBatch.crop} has been rejected by the farmer.`,
                    rejectionReason: defaultReason,
                    contactInfo: updatedBatch.retailerPhone || 'No contact info available'
                });
            }

            // Notify distributor channel if needed for inventory management
            await pusher.trigger('distributor-channel', 'order-rejected', {
                batchId: updatedBatch._id,
                lotNumber: updatedBatch.lotNumber,
                crop: updatedBatch.crop,
                weight: updatedBatch.weight,
                rejectionReason: defaultReason
            });

        } catch (pusherError) {
            console.error("Pusher notification error:", pusherError);
            // Continue execution even if Pusher fails
        }

        return NextResponse.json({ 
            message: 'Order rejected successfully.',
            batch: updatedBatch,
            rejectionReason: defaultReason,
            rejectedBy: farmerName,
            rejectedAt: new Date().toISOString()
        }, { status: 200 });

    } catch (error) {
        console.error("Reject Order API Error:", error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        }, { status: 500 });
    }
}