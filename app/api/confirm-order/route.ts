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

        const { batchId, farmerName, quantityToSell } = await request.json();

        if (!batchId || !farmerName) {
            return NextResponse.json({ 
                message: 'Batch ID and farmer name are required.' 
            }, { status: 400 });
        }

        const batchToConfirm = await Batch.findById(batchId);

        if (!batchToConfirm) {
            return NextResponse.json({ 
                message: 'Batch not found.' 
            }, { status: 404 });
        }

        // Verify the batch is in the correct status for confirmation
        if (batchToConfirm.status !== "Awaiting Farmer Confirmation") {
            return NextResponse.json({ 
                message: 'Batch is not awaiting farmer confirmation.' 
            }, { status: 400 });
        }

        // Validate quantity to sell
        const originalWeightKg = parseFloat(batchToConfirm.weight.replace(/[^\d.]/g, ''));
        const finalQuantity = quantityToSell || originalWeightKg;

        if (finalQuantity > originalWeightKg) {
            return NextResponse.json({ 
                message: 'Cannot sell more than available quantity.' 
            }, { status: 400 });
        }

        if (finalQuantity <= 0) {
            return NextResponse.json({ 
                message: 'Quantity to sell must be greater than 0.' 
            }, { status: 400 });
        }

        // Update the batch with farmer confirmation
        const updatedBatch = await Batch.findByIdAndUpdate(
            batchId,
            {
                $set: { 
                    status: "Processing",
                    weight: `${finalQuantity} kg`,
                    farmer: farmerName,
                    updatedAt: new Date().toISOString()
                },
                $push: {
                    trackingHistory: {
                        timestamp: new Date().toISOString(),
                        status: "Farmer Confirmed Order",
                        note: `Farmer ${farmerName} confirmed the order for ${finalQuantity}kg of ${batchToConfirm.crop}. ${
                            finalQuantity < originalWeightKg ? 
                            `Quantity adjusted from ${originalWeightKg}kg to ${finalQuantity}kg.` : 
                            ''
                        }`,
                        updatedBy: farmerName,
                        location: batchToConfirm.farmLocation || "Farm Location"
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

        // Log the confirmation event
        console.log(`Order confirmed: Batch ${updatedBatch.lotNumber} - ${finalQuantity}kg by ${farmerName}`);

        // Broadcast confirmation to relevant channels
        try {
            // Notify the system channel for general updates
            await pusher.trigger('system-channel', 'batch-confirmed', { 
                batch: updatedBatch,
                farmerName: farmerName,
                quantityConfirmed: finalQuantity,
                originalQuantity: originalWeightKg
            });

            // Notify retailer channel if retailer info exists
            if (updatedBatch.retailer) {
                await pusher.trigger('retailer-channel', 'order-confirmed-by-farmer', { 
                    batch: updatedBatch,
                    message: `Your order for ${finalQuantity}kg of ${updatedBatch.crop} has been confirmed by the farmer.`
                });
            }

        } catch (pusherError) {
            console.error("Pusher notification error:", pusherError);
            // Continue execution even if Pusher fails
        }

        return NextResponse.json({ 
            message: 'Order confirmed successfully.',
            batch: updatedBatch,
            quantityConfirmed: finalQuantity,
            originalQuantity: originalWeightKg
        }, { status: 200 });

    } catch (error) {
        console.error("Confirm Order API Error:", error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        }, { status: 500 });
    }
}