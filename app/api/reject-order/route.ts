// // app/api/reject-order/route.ts

// import { sharedDataStore } from '@/store/supply-chain';
// import { NextResponse } from 'next/server';

// export async function POST(request: Request) {
//   try {
//     const { batchId } = await request.json();

//     if (!batchId) {
//       return NextResponse.json({ message: 'Missing batchId' }, { status: 400 });
//     }

//     const batch = sharedDataStore.getBatch(batchId);

//     if (!batch) {
//       return NextResponse.json({ message: 'Batch not found.' }, { status: 404 });
//     }

//     const updates = {
//       status: "Rejected", // New status for rejected orders
//       updatedAt: new Date().toISOString(),
//     };

//     sharedDataStore.updateBatch(
//       batchId,
//       updates,
//       "Farmer",
//       "Order rejected by farmer."
//     );

//     const updatedBatch = sharedDataStore.getBatch(batchId);
//     return NextResponse.json({
//       message: 'Order rejected successfully.',
//       batch: updatedBatch,
//     });
//   } catch (error) {
//     console.error('API Error:', error);
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }