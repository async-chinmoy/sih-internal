"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    QrCode,
    Scan,
    MapPin,
    Calendar,
    Thermometer,
    Droplets,
    Sun,
    CheckCircle,
    Leaf,
    Truck,
    Store,
    Users,
    ArrowLeft,
    Shield,
    Award,
    Search,
    Eye,
    Loader2,
    Copy,
    Download
} from "lucide-react"
import axios from "axios"
import Pusher from "pusher-js"
import { ClientSideTime } from "@/components/ClientSideTime";

// Assuming these types are correctly defined
interface IotData {
    soilMoisture: number;
    humidity: number;
    temperature: number;
    lastUpdate: string;
    gpsCoordinates: string;
}

interface TrackingEvent {
    timestamp: string;
    status: string;
    note: string;
    updatedBy: string;
    location?: string;
}

interface BatchData {
    _id: string;
    lotNumber: string;
    crop: string;
    weight: string;
    farmer: string;
    farmLocation: string;
    harvestDate: string;
    status:
        | "Processing"
        | "Pending Verification"
        | "In Transit"
        | "Delivered"
        | "Ready for Sale"
        | "Sold"
        | "Awaiting Farmer Confirmation"
        | "Rejected";
    price: string;
    quality: string;
    hash: string;
    qrCode?: string;
    createdAt: string;
    updatedAt: string;
    trackingHistory: TrackingEvent[];
    iotData?: IotData;
    notes?: string;
    retailer?: string;
    retailerPhone?: string;
}

export default function ConsumerInterface() {
    const [searchQuery, setSearchQuery] = useState("");
    const [batch, setBatch] = useState<BatchData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [detailViewBatch, setDetailViewBatch] = useState<BatchData | null>(null);
    const [sampleBatches, setSampleBatches] = useState<BatchData[]>([]);

    const fetchBatches = async () => {
        try {
            const response = await axios.get('/api/batches');
            const availableBatches = response.data.filter(
                (b: BatchData) => ["Ready for Sale", "Sold"].includes(b.status)
            );
            setSampleBatches(availableBatches);
        } catch (error) {
            console.error("Failed to fetch sample batches:", error);
        }
    };
    
    // UPDATED: handleSearch to use the new API route
    const handleSearch = async (lotNumber?: string) => {
        const query = lotNumber || searchQuery.trim();
        if (!query) return;

        setLoading(true);
        setError("");
        setBatch(null);

        try {
            const response = await axios.get(`/api/batches/by-lot?lotNumber=${query}`);
            const foundBatch = response.data;
            if (foundBatch) {
                setBatch(foundBatch);
                setDetailViewBatch(foundBatch); // Set details batch for the dialog
            } else {
                setError("Product not found. Please check the QR code or lot number.");
            }
        } catch (err) {
            console.error("Error fetching batch:", err);
            setError("Error fetching product data. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    // UPDATED: handleQRScan to trigger the correct search logic
    const handleQRScan = async () => {
        if (sampleBatches.length > 0) {
            const randomBatch = sampleBatches[Math.floor(Math.random() * sampleBatches.length)];
            setSearchQuery(randomBatch.lotNumber);
            await handleSearch(randomBatch.lotNumber);
        }
    };

    // UPDATED: useEffect to fetch data and handle Pusher updates
    useEffect(() => {
        fetchBatches();

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const channel = pusher.subscribe('consumer-channel');
        channel.bind('batch-updated', (data: { batch: BatchData }) => {
            if (data?.batch?.lotNumber === batch?.lotNumber) {
                setBatch(data.batch);
                setDetailViewBatch(data.batch);
            }
        });

        return () => {
            channel.unbind();
            pusher.unsubscribe('consumer-channel');
        };
    }, [batch]);

    const getProgressValue = (status: string) => {
        switch (status) {
            case "Processing": return 15;
            case "Pending Verification": return 25;
            case "In Transit": return 50;
            case "Delivered": return 75;
            case "Ready for Sale": return 90;
            case "Sold": return 100;
            default: return 15;
        }
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case "Ready for Sale": return "Available in store now!";
            case "Sold": return "This product has been sold";
            case "In Transit": return "Currently being delivered to store";
            case "Delivered": return "Arrived at store, being prepared for sale";
            default: return "Being processed";
        }
    };
    
    const downloadQR = () => {
        if (!detailViewBatch?.qrCode || !detailViewBatch?.lotNumber) return;
        const link = document.createElement("a");
        link.download = `${detailViewBatch.lotNumber}-qr-code.svg`;
        link.href = detailViewBatch.qrCode;
        link.click();
    };

    const copyHashToClipboard = () => {
        if (!detailViewBatch?.hash) return;
        navigator.clipboard.writeText(detailViewBatch.hash);
    };

    // Renders the content of the View Full Details dialog
    const renderDetailsContent = () => {
        if (!detailViewBatch) return null;
        return (
            <div className="space-y-6">
                <div className="text-center bg-gray-50 p-6 rounded-xl mb-4">
                    <img
                        src={detailViewBatch.qrCode || "/placeholder.svg"}
                        alt={`QR Code for ${detailViewBatch.lotNumber}`}
                        className="mx-auto border-2 border-gray-200 rounded-xl shadow-lg"
                        width={200}
                        height={200}
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button size="sm" onClick={downloadQR} className="flex-1">
                        <Download className="w-4 h-4 mr-2" /> Download QR Code
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={copyHashToClipboard}
                        className="flex-1"
                    >
                        <Copy className="w-4 h-4 mr-2" /> Copy Hash
                    </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-700">Product Information</h4>
                        <div className="text-sm space-y-1">
                            <p><span className="font-medium">Crop:</span> {detailViewBatch.crop}</p>
                            <p><span className="font-medium">Weight:</span> {detailViewBatch.weight}</p>
                            <p><span className="font-medium">Quality:</span> {detailViewBatch.quality}</p>
                            <p><span className="font-medium">Price:</span> {detailViewBatch.price}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-700">Farm Information</h4>
                        <div className="text-sm space-y-1">
                            <p><span className="font-medium">Farmer:</span> {detailViewBatch.farmer}</p>
                            <p><span className="font-medium">Location:</span> {detailViewBatch.farmLocation}</p>
                            <p><span className="font-medium">Harvest Date:</span> {new Date(detailViewBatch.harvestDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold text-green-700">Supply Chain History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {detailViewBatch.trackingHistory.map((entry, idx) => (
                            <div key={idx} className="p-3 bg-green-50 rounded-lg text-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{entry.updatedBy}</p>
                                        <p className="text-gray-600">{entry.note}</p>
                                        <Badge className="mt-1 text-xs">{entry.status}</Badge>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {detailViewBatch.iotData && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-green-700 flex items-center gap-2">
                            <Thermometer className="w-4 h-4" />
                            Growing Conditions & IoT Data
                        </h4>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-cyan-50 rounded-lg text-sm">
                            <div className="space-y-1">
                                <p><span className="font-medium">Temperature:</span> {detailViewBatch.iotData.temperature}°C</p>
                                <p><span className="font-medium">Humidity:</span> {detailViewBatch.iotData.humidity}%</p>
                            </div>
                            <div className="space-y-1">
                                <p><span className="font-medium">Soil Moisture:</span> {detailViewBatch.iotData.soilMoisture}%</p>
                                <p><span className="font-medium">GPS Location:</span> {detailViewBatch.iotData.gpsCoordinates}</p>
                            </div>
                            <div className="col-span-2">
                                <p><span className="font-medium">Last Update:</span> {new Date(detailViewBatch.iotData.lastUpdate).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-orange-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="text-lg hover:bg-orange-50 transition-colors duration-300 group"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                            Home
                        </Button>
                        <div className="text-center">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                                Verify Your Food
                            </h1>
                            <p className="text-orange-600 text-sm md:text-base">
                                Scan QR code or enter lot number to see the complete journey
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-4 py-2 text-lg bg-orange-100 text-orange-700">
                                Consumer
                            </Badge>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Search Section */}
                <Card className="mb-8 shadow-xl bg-gradient-to-br from-white to-orange-50/50 border-0">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl flex items-center justify-center gap-3">
                            <QrCode className="w-8 h-8 text-orange-600" />
                            Track Your Food's Journey
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Discover where your food came from and how it was grown
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Scan QR code or enter lot number (e.g., LOT-2024-001)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-14 text-lg border-2 hover:border-orange-300 transition-colors pl-12"
                                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleQRScan}
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-6 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 bg-transparent"
                                >
                                    <QrCode className="w-5 h-5 mr-2" />
                                    Scan QR
                                </Button>
                                <Button
                                    onClick={() => handleSearch()}
                                    disabled={loading || !searchQuery.trim()}
                                    size="lg"
                                    className="h-14 px-8 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                    ) : (
                                        <>
                                            <Scan className="w-5 h-5 mr-2" />
                                            Verify
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                <p className="text-red-600">{error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Product Details */}
                {batch && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Product Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Product Overview */}
                            <Card className="shadow-xl bg-gradient-to-br from-white to-green-50/50 border-0">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-6xl bg-white rounded-2xl p-4 shadow-lg">{batch.crop.split(" ")[0]}</div>
                                            <div>
                                                <CardTitle className="text-3xl text-green-700">{batch.crop.split(" ")[1]}</CardTitle>
                                                <CardDescription className="text-lg">
                                                    {batch.weight} • {batch.quality}
                                                </CardDescription>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Blockchain Verified
                                                    </Badge>
                                                    <Badge className="bg-blue-100 text-blue-700">
                                                        <Award className="w-3 h-3 mr-1" />
                                                        Certified Organic
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-green-700">{batch.price}</p>
                                            <p className="text-sm text-gray-500">{getStatusMessage(batch.status)}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 bg-white hover:bg-green-50 border-green-200"
                                                onClick={() => setDetailViewBatch(batch)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Full Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Journey Progress */}
                                    <div className="mb-6">
                                        <h4 className="font-semibold mb-3 text-gray-700">Farm to Table Journey</h4>
                                        <div className="flex justify-between text-xs text-gray-600 mb-3 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Leaf className="w-3 h-3 text-green-500" />
                                                Farm
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Truck className="w-3 h-3 text-blue-500" />
                                                Transport
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Store className="w-3 h-3 text-purple-500" />
                                                Store
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3 text-orange-500" />
                                                You
                                            </span>
                                        </div>
                                        <Progress value={getProgressValue(batch.status)} className="h-4" />
                                    </div>

                                    {/* Farm Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                                <Leaf className="w-4 h-4 text-green-500" />
                                                Farm Details
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Farmer:</span>
                                                    <span>{batch.farmer}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">Location:</span>
                                                    <span>{batch.farmLocation}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">Harvested:</span>
                                                    <span>{new Date(batch.harvestDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                Quality Assurance
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span>Pesticide-free</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span>Quality grade: {batch.quality}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span>Blockchain verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {batch.iotData && (
                                        <div className="space-y-3 mt-6">
                                            <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                                <Thermometer className="w-4 h-4" />
                                                Growing Conditions & IoT Data
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 p-4 bg-cyan-50 rounded-lg text-sm">
                                                <div className="space-y-1">
                                                    <p><span className="font-medium">Temperature:</span> {batch.iotData.temperature}°C</p>
                                                    <p><span className="font-medium">Humidity:</span> {batch.iotData.humidity}%</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p><span className="font-medium">Soil Moisture:</span> {batch.iotData.soilMoisture}%</p>
                                                    <p><span className="font-medium">GPS Location:</span> {batch.iotData.gpsCoordinates}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p><span className="font-medium">Last Update:</span> {new Date(batch.iotData.lastUpdate).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
                
                {/* Sample Products for Demo */}
                {!batch && !loading && !error && (
                    <Card className="shadow-xl bg-white border-0">
                        <CardHeader>
                            <CardTitle>Try These Sample Products</CardTitle>
                            <CardDescription>Click on any product to see its complete journey</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sampleBatches.map((sampleBatch) => (
                                    <div
                                        key={sampleBatch._id}
                                        className="p-6 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300"
                                        onClick={() => {
                                            setSearchQuery(sampleBatch.lotNumber);
                                            setBatch(sampleBatch);
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-4xl bg-white rounded-xl p-3 shadow-md">
                                                {sampleBatch.crop.split(" ")[0]}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-800">{sampleBatch.crop.split(" ")[1]}</h3>
                                                <p className="text-orange-600 font-semibold">
                                                    {sampleBatch.weight} • {sampleBatch.price}
                                                </p>
                                                <p className="text-sm text-gray-500">From {sampleBatch.farmLocation}</p>
                                                <Badge className="mt-2 bg-green-100 text-green-700">{sampleBatch.status}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* CORRECTED: Centralized Dialog component for View Full Details */}
            <Dialog open={detailViewBatch !== null} onOpenChange={(isOpen) => !isOpen && setDetailViewBatch(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Complete Product Details</DialogTitle>
                        <DialogDescription>Full supply chain transparency and verification</DialogDescription>
                    </DialogHeader>
                    {detailViewBatch && (
                         <div className="space-y-6">
                            <div className="text-center bg-gray-50 p-6 rounded-xl mb-4">
                                <img
                                    src={detailViewBatch.qrCode || "/placeholder.svg"}
                                    alt={`QR Code for ${detailViewBatch.lotNumber}`}
                                    className="mx-auto border-2 border-gray-200 rounded-xl shadow-lg"
                                    width={200}
                                    height={200}
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button size="sm" onClick={() => {
                                    if (!detailViewBatch?.qrCode || !detailViewBatch?.lotNumber) return;
                                    const link = document.createElement("a");
                                    link.download = `${detailViewBatch.lotNumber}-qr-code.svg`;
                                    link.href = detailViewBatch.qrCode;
                                    link.click();
                                }} className="flex-1">
                                    <Download className="w-4 h-4 mr-2" /> Download QR Code
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => detailViewBatch?.hash && navigator.clipboard.writeText(detailViewBatch.hash)}
                                    className="flex-1"
                                >
                                    <Copy className="w-4 h-4 mr-2" /> Copy Hash
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-green-700">Product Information</h4>
                                    <div className="text-sm space-y-1">
                                        <p><span className="font-medium">Crop:</span> {detailViewBatch.crop}</p>
                                        <p><span className="font-medium">Weight:</span> {detailViewBatch.weight}</p>
                                        <p><span className="font-medium">Quality:</span> {detailViewBatch.quality}</p>
                                        <p><span className="font-medium">Price:</span> {detailViewBatch.price}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-green-700">Farm Information</h4>
                                    <div className="text-sm space-y-1">
                                        <p><span className="font-medium">Farmer:</span> {detailViewBatch.farmer}</p>
                                        <p><span className="font-medium">Location:</span> {detailViewBatch.farmLocation}</p>
                                        <p><span className="font-medium">Harvest Date:</span> {new Date(detailViewBatch.harvestDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-green-700">Supply Chain History</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {detailViewBatch.trackingHistory.map((entry, idx) => (
                                        <div key={idx} className="p-3 bg-green-50 rounded-lg text-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{entry.updatedBy}</p>
                                                    <p className="text-gray-600">{entry.note}</p>
                                                    <Badge className="mt-1 text-xs">{entry.status}</Badge>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {detailViewBatch.iotData && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                        <Thermometer className="w-4 h-4" />
                                        Growing Conditions & IoT Data
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-cyan-50 rounded-lg text-sm">
                                        <div className="space-y-1">
                                            <p><span className="font-medium">Temperature:</span> {detailViewBatch.iotData.temperature}°C</p>
                                            <p><span className="font-medium">Humidity:</span> {detailViewBatch.iotData.humidity}%</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p><span className="font-medium">Soil Moisture:</span> {detailViewBatch.iotData.soilMoisture}%</p>
                                            <p><span className="font-medium">GPS Location:</span> {detailViewBatch.iotData.gpsCoordinates}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p><span className="font-medium">Last Update:</span> {new Date(detailViewBatch.iotData.lastUpdate).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}