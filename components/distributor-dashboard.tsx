"use client"
import "@/i18n"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Truck,
    Package,
    CheckCircle,
    Clock,
    MapPin,
    ArrowLeft,
    Eye,
    BarChart3,
    Thermometer,
    Navigation,
    RefreshCw,
    Search,
    QrCode,
    Loader2
} from "lucide-react"
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Pusher from 'pusher-js';

// UPDATED: Interfaces now have all necessary fields
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
    lotNumber: string | null;
    crop: string;
    weight: string;
    farmer: string | null;
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
    earnings: string | null;
    farmLocation: string | null;
    price: string | null;
    quality: string;
    hash: string | null;
    qrCode?: string;
    createdAt: string;
    updatedAt: string;
    trackingHistory: TrackingEvent[];
    iotData?: IotData;
    notes?: string;
    retailer?: string;
    retailerPhone?: string;
}

export default function DistributorDashboard() {
    const { t } = useTranslation();
    const [batches, setBatches] = useState<BatchData[]>([])
    const [verificationNote, setVerificationNote] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([])
    const [isLoading, setIsLoading] = useState(true);

    const [verifyDialogBatch, setVerifyDialogBatch] = useState<BatchData | null>(null);
    const [detailsDialogBatch, setDetailsDialogBatch] = useState<BatchData | null>(null);

    const fetchBatches = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/batches');
            const allBatches = response.data;
            const relevantBatches = allBatches.filter(
                (b: BatchData) => b && b.status && ["Processing", "Pending Verification", "In Transit", "Delivered"].includes(b.status)
            );
            setBatches(relevantBatches);
        } catch (error) {
            console.error("Error fetching batches:", error);
            setBatches([]);
        } finally {
            setIsLoading(false);
        }
    };

    // UPDATED: useEffect to handle Pusher subscriptions
    useEffect(() => {
        fetchBatches();

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const channel = pusher.subscribe('distributor-channel');
        channel.bind('batch-updated', (data: { batch: BatchData }) => {
            if (data && data.batch) {
                setBatches(prevBatches => {
                    const existingIndex = prevBatches.findIndex(b => b._id === data.batch._id);
                    if (existingIndex !== -1) {
                        const updated = [...prevBatches];
                        updated[existingIndex] = data.batch;
                        return updated;
                    } else {
                        if (["Processing", "Pending Verification", "In Transit", "Delivered"].includes(data.batch.status)) {
                            return [data.batch, ...prevBatches];
                        }
                    }
                    return prevBatches;
                });
            }
        });

        return () => {
            channel.unbind();
            pusher.unsubscribe('distributor-channel');
        };
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredBatches(batches || [])
        } else {
            const filtered = Array.isArray(batches)
                ? batches.filter((batch) => {
                    if (!batch) return false
                    const lotNumber = batch.lotNumber || ""
                    const crop = batch.crop || ""
                    const farmer = batch.farmer || ""
                    const farmLocation = batch.farmLocation || ""
                    const retailer = batch.retailer || ""
                    const retailerPhone = batch.retailerPhone || ""

                    return (
                        lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        farmLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        retailer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        retailerPhone.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                })
                : []
            setFilteredBatches(filtered)
        }
    }, [searchQuery, batches])

    const handleQRScan = () => {
        const sampleLotNumbers = Array.isArray(batches)
            ? batches.filter((b) => b && b.lotNumber).map((b) => b.lotNumber)
            : []
        if (sampleLotNumbers.length > 0) {
            const randomLot = sampleLotNumbers[Math.floor(Math.random() * sampleLotNumbers.length)]
            setSearchQuery(randomLot!)
        }
    }

    const handleVerifyBatch = async (batchId: string) => {
        setIsUpdating(true);
        try {
            // UPDATED: Replaced dummy logic with API call
            await axios.post('/api/update-batch', {
                batchId: batchId,
                updates: { status: "In Transit" },
                updatedBy: "Green Valley Distributors",
                note: verificationNote || "Quality verified and approved for transport",
            });
            setVerificationNote("");
            setVerifyDialogBatch(null);
        } catch (error) {
            console.error("Error verifying batch:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkDelivered = async (batchId: string) => {
        setIsUpdating(true);
        try {
            // UPDATED: Replaced dummy logic with API call
            await axios.post('/api/update-batch', {
                batchId: batchId,
                updates: { status: "Delivered" },
                updatedBy: "Green Valley Distributors",
                note: "Successfully delivered to retail partner",
            });
        } catch (error) {
            console.error("Error marking delivered:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending Verification":
            case "Processing":
                return "bg-yellow-500"
            case "In Transit":
                return "bg-blue-500"
            case "Delivered":
                return "bg-green-500"
            default:
                return "bg-gray-500"
        }
    }

    const renderActionButton = (batch: BatchData) => {
        switch (batch.status) {
            case "Pending Verification":
            case "Processing":
                return (
                    <Button size="sm" onClick={() => setVerifyDialogBatch(batch)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify Quality
                    </Button>
                )
            case "In Transit":
                return (
                    <Button size="sm" onClick={() => handleMarkDelivered(batch._id)} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
                        Mark Delivered
                    </Button>
                )
            case "Delivered":
                return (
                    <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                )
            default:
                return null
        }
    }

    const getIotData = (batch: BatchData) => {
        if (!batch.iotData) return null;
        return (
            <div className="mb-6 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                <p className="font-bold mb-3 text-cyan-700 flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Live Transport Data
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                        <Thermometer className="w-6 h-6 text-red-500 mx-auto mb-1" />
                        <p className="font-medium">Temperature</p>
                        <p className="text-xl font-bold text-red-600">{batch.iotData.temperature}°C</p>
                    </div>
                    <div className="text-center">
                        <MapPin className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                        <p className="font-medium">Location</p>
                        <p className="text-sm font-bold text-purple-600">{batch.iotData.gpsCoordinates}</p>
                    </div>
                    <div className="text-center">
                        <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                        <p className="font-medium">Last Update</p>
                        <p className="text-sm font-bold text-blue-600">
                            {new Date(batch.iotData.lastUpdate).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <Package className="w-6 h-6 text-green-500 mx-auto mb-1" />
                        <p className="font-medium">Condition</p>
                        <p className="text-sm font-bold text-green-600">Optimal</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderDetailView = (batch: BatchData | null) => {
        if (!batch) return null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">Product Information</h4>
                        <div className="text-sm space-y-1">
                            <p><span className="font-medium">Crop:</span> {batch.crop}</p>
                            <p><span className="font-medium">Weight:</span> {batch.weight}</p>
                            <p><span className="font-medium">Quality:</span> {batch.quality}</p>
                            <p><span className="font-medium">Price:</span> {batch.price}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">Farm Information</h4>
                        <div className="text-sm space-y-1">
                            <p><span className="font-medium">Farmer:</span> {batch.farmer}</p>
                            <p><span className="font-medium">Location:</span> {batch.farmLocation}</p>
                            <p><span className="font-medium">Harvest Date:</span>{" "}{new Date(batch.harvestDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
                {(batch.retailer || batch.retailerPhone) && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">Retailer Information</h4>
                        <div className="text-sm space-y-1">
                            {batch.retailer && <p><span className="font-medium">Retailer:</span> {batch.retailer}</p>}
                            {batch.retailerPhone && <p><span className="font-medium">Phone:</span> {batch.retailerPhone}</p>}
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <h4 className="font-semibold text-blue-700">Supply Chain History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {batch.trackingHistory.map((entry, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 rounded-lg text-sm">
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
                {batch.iotData && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">IoT Sensor Data</h4>
                        <div className="grid grid-cols-2 gap-4 p-3 bg-cyan-50 rounded-lg text-sm">
                            <p><span className="font-medium">Temperature:</span> {batch.iotData.temperature}°C</p>
                            <p><span className="font-medium">Humidity:</span> {batch.iotData.humidity}%</p>
                            <p><span className="font-medium">GPS:</span> {batch.iotData.gpsCoordinates}</p>
                            <p><span className="font-medium">Last Update:</span> {new Date(batch.iotData.lastUpdate).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
            <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-blue-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="text-lg hover:bg-blue-50 transition-colors duration-300 group"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                            Home
                        </Button>
                        <div className="text-center">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Distributor Dashboard
                            </h1>
                            <p className="text-blue-600 text-sm md:text-base">Green Valley Distributors - Quality & Logistics</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-4 py-2 text-lg bg-blue-100 text-blue-700">
                                Dist #GVD-001
                            </Badge>
                        </div>
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="shadow-lg bg-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Pending Verification</CardTitle>
                            <Clock className="w-4 h-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(batches || []).filter((b) => b.status === "Pending Verification" || b.status === "Processing").length}
                            </div>
                            <p className="text-xs text-gray-500">Awaiting quality check</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg bg-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">In Transit</CardTitle>
                            <Truck className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(batches || []).filter((b) => b.status === "In Transit").length}
                            </div>
                            <p className="text-xs text-gray-500">Currently shipping</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg bg-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Delivered</CardTitle>
                            <Package className="w-4 h-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(batches || []).filter((b) => b.status === "Delivered").length}
                            </div>
                            <p className="text-xs text-gray-500">Successfully delivered</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg bg-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Volume</CardTitle>
                            <BarChart3 className="w-4 h-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Array.isArray(batches)
                                    ? batches.reduce((sum, batch) => {
                                        if (!batch || !batch.weight || typeof batch.weight !== "string") return sum
                                        try {
                                            const weight = batch.weight.replace(/[^\d.]/g, "")
                                            const numericWeight = Number.parseFloat(weight) || 0
                                            return sum + numericWeight
                                        } catch (error) {
                                            return sum
                                        }
                                    }, 0)
                                    : 0}
                                kg
                            </div>
                            <p className="text-xs text-gray-500">This week</p>
                        </CardContent>
                    </Card>
                </div>
                <Card className="shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-0">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl md:text-2xl text-blue-700 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                        <Truck className="w-5 h-5 text-white" />
                                    </div>
                                    Active Batches
                                </CardTitle>
                                <CardDescription className="text-base">Manage quality verification and logistics</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="bg-white" onClick={fetchBatches}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by lot number, crop, farmer, or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-white"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleQRScan}
                                className="bg-white hover:bg-blue-50 border-blue-200"
                            >
                                <QrCode className="w-4 h-4 mr-2" />
                                Scan QR
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700">Fetching batches...</h3>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {!Array.isArray(filteredBatches) || filteredBatches.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Truck className="w-12 h-12 text-blue-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                            {searchQuery ? "No matching batches found" : "No active batches"}
                                        </h3>
                                        <p className="text-gray-500">
                                            {searchQuery
                                                ? "Try adjusting your search terms"
                                                : "All batches are currently processed or awaiting farmer uploads"}
                                        </p>
                                    </div>
                                ) : (
                                    filteredBatches
                                        .filter((batch) => batch && batch._id)
                                        .map((batch) => (
                                            <div
                                                key={batch._id}
                                                className="p-6 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 rounded-2xl border-2 border-blue-100 hover:border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300"
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                                                    <div className="flex items-center gap-4 mb-4 lg:mb-0">
                                                        <div className="text-5xl bg-white rounded-2xl p-3 shadow-md">{batch.crop.split(" ")[0]}</div>
                                                        <div>
                                                            <h4 className="text-xl md:text-2xl font-bold text-gray-800">{batch.crop.split(" ")[1]}</h4>
                                                            <p className="text-blue-600 font-bold text-lg">{batch.weight}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <p className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                    Lot: {batch.lotNumber}
                                                                </p>
                                                                <p className="text-sm text-gray-500">• Farmer: {batch.farmer}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-left lg:text-right">
                                                        <Badge className={`${getStatusColor(batch.status)} text-white mb-2`}>
                                                            {batch.status === "In Transit" && <Truck className="w-3 h-3 mr-1" />}
                                                            {batch.status === "Pending Verification" && <Clock className="w-3 h-3 mr-1" />}
                                                            {batch.status === "Delivered" && <CheckCircle className="w-3 h-3 mr-1" />}
                                                            {batch.status}
                                                        </Badge>
                                                        <p className="text-sm text-gray-500">Quality: {batch.quality}</p>
                                                    </div>
                                                </div>
                                                {batch.status === "In Transit" && batch.iotData && getIotData(batch)}
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    {renderActionButton(batch)}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-300"
                                                        onClick={() => setDetailsDialogBatch(batch)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Dialog open={verifyDialogBatch !== null} onOpenChange={(isOpen) => !isOpen && setVerifyDialogBatch(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Batch Quality</DialogTitle>
                        <DialogDescription>Confirm the quality and approve for transport - {verifyDialogBatch?.lotNumber}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Crop:</span> {verifyDialogBatch?.crop}</div>
                            <div><span className="font-medium">Weight:</span> {verifyDialogBatch?.weight}</div>
                            <div><span className="font-medium">Quality:</span> {verifyDialogBatch?.quality}</div>
                            <div><span className="font-medium">Farmer:</span> {verifyDialogBatch?.farmer}</div>
                        </div>
                        <div>
                            <Label htmlFor="verification-note">Verification Notes</Label>
                            <Textarea
                                id="verification-note"
                                placeholder="Add any quality inspection notes..."
                                value={verificationNote}
                                onChange={(e) => setVerificationNote(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <Button
                            onClick={() => verifyDialogBatch && handleVerifyBatch(verifyDialogBatch._id)}
                            disabled={isUpdating}
                            className="w-full"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve & Start Transport
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog - now a top-level component */}
            <Dialog open={detailsDialogBatch !== null} onOpenChange={(isOpen) => !isOpen && setDetailsDialogBatch(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Batch Details - {detailsDialogBatch?.lotNumber}</DialogTitle>
                        <DialogDescription>Complete supply chain information</DialogDescription>
                    </DialogHeader>
                    {renderDetailView(detailsDialogBatch)}
                </DialogContent>
            </Dialog>
        </div>
    )
}