import mongoose from 'mongoose';

const TrackingEventSchema = new mongoose.Schema({
    timestamp: { type: String, required: true },
    status: { type: String, required: true },
    note: { type: String, required: true },
    updatedBy: { type: String, required: true },
    location: { type: String, required: false },
}, { _id: false });

const IotDataSchema = new mongoose.Schema({
    soilMoisture: { type: Number, required: true },
    humidity: { type: Number, required: true },
    temperature: { type: Number, required: true },
    lastUpdate: { type: String, required: true },
    gpsCoordinates: { type: String, required: true },
}, { _id: false });

const BatchSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    lotNumber: { type: String, required: false, default: null },
    hash: { type: String, required: false, default: null },
    crop: { type: String, required: true },
    weight: { type: String, required: true },
    farmer: { type: String, required: false, default: null },
    retailer: { type: String, required: false },
    retailerPhone: { type: String, required: false },
    harvestDate: { type: String, required: true },
    status: {
        type: String,
        enum: [
            "Processing",
            "Pending Verification",
            "In Transit",
            "Delivered",
            "Ready for Sale",
            "Sold",
            "Awaiting Farmer Confirmation",
            "Rejected",
            "Awaiting Retailer Confirmation"
        ],
        required: true,
    },
    earnings: { type: String, required: false, default: null },
    farmLocation: { type: String, required: false, default: null },
    price: { type: String, required: false, default: null },
    quality: { type: String, required: true },
    qrCode: { type: String, required: false },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    trackingHistory: [TrackingEventSchema],
    iotData: { type: IotDataSchema, required: false },
    notes: { type: String, required: false },
});

const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);

export default Batch;