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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
    Upload,
    Camera,
    QrCode,
    DollarSign,
    Thermometer,
    Droplets,
    MapPin,
    Leaf,
    ArrowLeft,
    CheckCircle,
    TrendingUp,
    Sun,
    Download,
    Copy,
    Truck,
    Package,
    Bell,
    BarChart3,
    Calendar,
    Eye,
    Loader2,
    Trash2,
} from "lucide-react"
import axios from "axios";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ClientSideTime } from "@/components/ClientSideTime";
import Pusher from 'pusher-js';

// Corrected BatchData interface to include optional retailer properties
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
    // Added optional properties for orders
    retailer?: string;
    retailerPhone?: string;
}

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

// Interface for the Pusher event data
interface NewOrderRequestData {
    batch: BatchData;
}

export default function FarmerDashboard() {
    const { t } = useTranslation();
    const [cropData, setCropData] = useState({
        type: "",
        weight: "",
        harvestDate: "",
        quality: "Grade A",
    })

    const [showSuccess, setShowSuccess] = useState(false)
    const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null)
    const [recentBatches, setRecentBatches] = useState<BatchData[]>([])
    const [notifications, setNotifications] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)
    
    // Fixed: Individual loading states for each order
    const [confirmingOrders, setConfirmingOrders] = useState<Set<string>>(new Set());
    const [rejectingOrders, setRejectingOrders] = useState<Set<string>>(new Set());

    const [pendingOrders, setPendingOrders] = useState<BatchData[]>([]);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

    // State to track the quantity being input by the user for each order individually
    const [orderQuantities, setOrderQuantities] = useState<Record<string, number | null>>({});

    const fetchBatches = async () => {
        try {
            const response = await axios.get('/api/batches');
            const allBatches = response.data;
            
            // Sort batches by creation date to show the latest at the top
            const sortedBatches = allBatches.sort((a: BatchData, b: BatchData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            // Fixed: Only show confirmed orders (with lotNumber and not rejected/pending confirmation)
            setRecentBatches(sortedBatches.filter((b: any) => 
                b.lotNumber !== null && 
                b.status !== 'Rejected' && 
                b.status !== 'Awaiting Farmer Confirmation'
            ));
            
            setPendingOrders(sortedBatches.filter((b: any) => b.status === "Awaiting Farmer Confirmation"));
        } catch (error) {
            console.error("Failed to fetch batches:", error);
        }
    };

    useEffect(() => {
        fetchBatches();

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const farmerChannel = pusher.subscribe('farmer-channel');
        farmerChannel.bind('new-order-request', (data: any) => {
            if (data && data.batch && data.batch.crop) {
                setPendingOrders(prev => [data.batch, ...prev]);
                // Ensure new order notification is added to the front
                setNotifications(prev => [`New order for ${data.batch.crop} received!`, ...prev.slice(0, 4)]);
                setShowConfirmationDialog(true);
            } else {
                console.error("Received incomplete or malformed data from Pusher:", data);
            }
        });

        const systemChannel = pusher.subscribe('system-channel');
        systemChannel.bind('batch-uploaded', (data: { batch: any }) => {
            // Only add to recent batches if it's confirmed (has lotNumber and proper status)
            if (data.batch && data.batch.lotNumber && data.batch.status !== 'Awaiting Farmer Confirmation') {
                setRecentBatches(prev => [data.batch, ...prev]);
                if (data.batch.crop) {
                    setNotifications(prev => [`New batch of ${data.batch.crop} created!`, ...prev.slice(0, 4)]);
                }
            }
        });

        return () => {
            farmerChannel.unbind();
            pusher.unsubscribe('farmer-channel');
            systemChannel.unbind();
            pusher.unsubscribe('system-channel');
        };
    }, []);
    
    // Reset order quantities when the dialog closes
    useEffect(() => {
        if (!showConfirmationDialog) {
            setOrderQuantities({});
        }
    }, [showConfirmationDialog]);

    const handleConfirmOrder = async (order: BatchData) => {
        // Set loading state for this specific order
        setConfirmingOrders(prev => new Set(prev).add(order._id));
        
        // Use the quantity from the orderQuantities state if it exists, otherwise use the original requested weight
        const requestedWeightKg = parseFloat(order.weight.replace(' kg', ''));
        const finalQuantity = orderQuantities[order._id] !== null && orderQuantities[order._id] !== undefined
            ? orderQuantities[order._id]! 
            : requestedWeightKg;

        try {
            const response = await axios.post('/api/confirm-order', {
                batchId: order._id,
                farmerName: 'Manish',
                quantityToSell: finalQuantity, 
            });

            if (response.status !== 200) {
                throw new Error('Failed to confirm order.');
            }

            const updatedBatch = response.data.batch;

            // Remove from pending orders
            setPendingOrders(prev => prev.filter(o => o._id !== updatedBatch._id));
            
            // Add to recent batches (now it's confirmed)
            setRecentBatches(prev => {
                const filtered = prev.filter(b => b._id !== updatedBatch._id);
                return [updatedBatch, ...filtered];
            });
            
            // Remove quantity tracking for this order
            setOrderQuantities(prev => {
                const updated = { ...prev };
                delete updated[order._id];
                return updated;
            });

            setNotifications(prev => [`Order ${updatedBatch.lotNumber} confirmed successfully!`, ...prev.slice(0, 4)]);

            // Close dialog if no more pending orders
            if (pendingOrders.length <= 1) {
                setShowConfirmationDialog(false);
            }

        } catch (error) {
            console.error("Error confirming order:", error);
            setNotifications(prev => [`Failed to confirm order for ${order.crop}`, ...prev.slice(0, 4)]);
        } finally {
            // Remove loading state for this specific order
            setConfirmingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(order._id);
                return newSet;
            });
        }
    };

    const handleRejectOrder = async (order: BatchData) => {
        // Set loading state for this specific order
        setRejectingOrders(prev => new Set(prev).add(order._id));
        
        try {
            const response = await axios.post('/api/reject-order', {
                batchId: order._id,
            });

            if (response.status !== 200) {
                throw new Error('Failed to reject order.');
            }

            // Remove from pending orders
            setPendingOrders(prev => prev.filter(o => o._id !== order._id));
            
            // Remove quantity tracking for this order
            setOrderQuantities(prev => {
                const updated = { ...prev };
                delete updated[order._id];
                return updated;
            });

            setNotifications(prev => [`Order for ${order.crop} rejected.`, ...prev.slice(0, 4)]);

            // Close dialog if no more pending orders
            if (pendingOrders.length <= 1) {
                setShowConfirmationDialog(false);
            }

        } catch (error) {
            console.error("Error rejecting order:", error);
            setNotifications(prev => [`Failed to reject order for ${order.crop}`, ...prev.slice(0, 4)]);
        } finally {
            // Remove loading state for this specific order
            setRejectingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(order._id);
                return newSet;
            });
        }
    };

    const handleQuantityChange = (orderId: string, value: string) => {
        const numValue = parseFloat(value);
        setOrderQuantities(prev => ({
            ...prev,
            [orderId]: isNaN(numValue) ? null : numValue
        }));
    };

    const handleQuickSubmit = async () => {
        if (cropData.type && cropData.weight && cropData.harvestDate && cropData.quality) {
            setIsUploading(true);
            try {
                const response = await axios.post('/api/upload-batch', {
                    cropType: `${getCropEmoji(cropData.type)} ${cropData.type.charAt(0).toUpperCase() + cropData.type.slice(1)}`,
                    cropWeight: cropData.weight,
                    harvestDate: cropData.harvestDate,
                    farmerName: 'John Smith',
                    quality: cropData.quality,
                });

                if (response.status !== 201) {
                    throw new Error("Failed to upload crop batch.");
                }

                const newBatch = response.data.batch;
                setRecentBatches(prev => [newBatch, ...prev]);

                setIsUploading(false);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 4000);
                setCropData({ type: "", weight: "", harvestDate: "", quality: "Grade A" });
                setNotifications(prev => [`New batch of ${newBatch.crop} uploaded successfully!`, ...prev.slice(0, 4)]);

            } catch (error) {
                console.error("Error uploading batch:", error);
                setNotifications(prev => [`Failed to upload crop batch`, ...prev.slice(0, 4)]);
            } finally {
                setIsUploading(false);
            }
        }
    }

    const getCropEmoji = (crop: string) => {
        const emojis: { [key: string]: string } = {
            tomatoes: "🍅", carrots: "🥕", lettuce: "🥬", potatoes: "🥔", onions: "🧅",
        }
        return emojis[crop.toLowerCase()] || "🌱";
    }

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    const downloadQR = (batch: any) => {
        const link = document.createElement("a")
        link.download = `${batch.lotNumber}-qr-code.svg`
        link.href = batch.qrCode || ""
        link.click()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Processing":
            case "Awaiting Farmer Confirmation":
                return "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
            case "Pending Verification":
                return "bg-gradient-to-r from-blue-400 to-indigo-400 text-white shadow-lg"
            case "In Transit":
                return "bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg"
            case "Delivered":
                return "bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg"
            case "Ready for Sale":
                return "bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg"
            case "Sold":
                return "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg"
            case "Rejected":
                return "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg"
            default:
                return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg"
        }
    }

    const getProgressValue = (status: string) => {
        switch (status) {
            case "Awaiting Farmer Confirmation":
                return 5
            case "Processing":
                return 15
            case "Pending Verification":
                return 25
            case "In Transit":
                return 50
            case "Delivered":
                return 75
            case "Ready for Sale":
                return 90
            case "Sold":
                return 100
            default:
                return 15
        }
    }
    
    // Renders the content of the View QR and Details dialog
    const renderQRDialogContent = () => {
        if (!selectedBatch) return null;
        return (
            <div className="space-y-6">
                <div className="text-center bg-gray-50 p-6 rounded-xl">
                    <img
                        src={selectedBatch.qrCode || "/placeholder.svg"}
                        alt={`QR Code for ${selectedBatch.lotNumber}`}
                        className="mx-auto border-2 border-gray-200 rounded-xl shadow-lg"
                        width={200}
                        height={200}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <p className="font-bold mb-3 text-green-700 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Batch Information
                        </p>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Crop:</span> {selectedBatch.crop}</p>
                            <p><span className="font-medium">Weight:</span> {selectedBatch.weight}</p>
                            <p><span className="font-medium">Quality:</span> {selectedBatch.quality}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <p className="font-bold mb-3 text-blue-700 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Blockchain Tracking
                        </p>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Lot Number:</span> {selectedBatch.lotNumber}</p>
                            <p><span className="font-medium">Blockchain Tx:</span>{" "}{selectedBatch.hash?.slice(0, 20)}...</p>
                            <p><span className="font-medium">Created:</span>{" "}{selectedBatch.createdAt && <ClientSideTime dateString={selectedBatch.createdAt} />}</p>
                            <p><span className="font-medium">Last Updated:</span>{" "}{selectedBatch.updatedAt && <ClientSideTime dateString={selectedBatch.updatedAt} />}</p>
                        </div>
                    </div>
                </div>

                {selectedBatch.iotData && (
                    <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                        <p className="font-bold mb-3 text-cyan-700 flex items-center gap-2">
                            <Thermometer className="w-4 h-4" />
                            IoT Sensor Data
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                                <p className="font-medium">Soil Moisture</p>
                                <p className="text-xl font-bold text-blue-600">{selectedBatch.iotData.soilMoisture}%</p>
                            </div>
                            <div className="text-center">
                                <Thermometer className="w-6 h-6 text-red-500 mx-auto mb-1" />
                                <p className="font-medium">Temperature</p>
                                <p className="text-xl font-bold text-red-600">{selectedBatch.iotData.temperature}°C</p>
                            </div>
                            <div className="text-center">
                                <Sun className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                                <p className="font-medium">Humidity</p>
                                <p className="text-xl font-bold text-yellow-600">{selectedBatch.iotData.humidity}%</p>
                            </div>
                            <div className="text-center">
                                <MapPin className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                                <p className="font-medium">GPS</p>
                                <p className="text-sm font-bold text-purple-600 break-all">{selectedBatch.iotData.gpsCoordinates}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button size="sm" onClick={() => selectedBatch && downloadQR(selectedBatch)} className="flex-1">
                        <Download className="w-4 h-4 mr-2" /> Download QR Code
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectedBatch?.hash && copyToClipboard(selectedBatch.hash)}
                        className="flex-1"
                    >
                        <Copy className="w-4 h-4 mr-2" /> Copy Hash
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50">
            <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="text-lg hover:bg-green-50 transition-colors duration-300 group"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                            Home
                        </Button>
                        <div className="text-center">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {t("FarmerDashboard.greeting")}
                            </h1>
                            <p className="text-green-600 text-sm md:text-base">{t('FarmerDashboard.manage_farm')}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Badge
                                variant="secondary"
                                className="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                            >
                                {t("FarmerDashboard.farm_id")}
                            </Badge>
                            <Button variant="ghost" size="sm" className="relative" onClick={() => setShowConfirmationDialog(true)}>
                                <Bell className="w-5 h-5" />
                                {pendingOrders.length > 0 && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </Button>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">

                {showSuccess && (
                    <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-2xl shadow-lg animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-green-800 font-bold text-lg sm:text-xl block">{t("FarmerDashboard.upload_success_message")}</span>
                                <span className="text-green-700 text-sm">
                                    {t("FarmerDashboard.upload_success_subtext")}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {notifications.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {notifications.map((notification, index) => (
                            <div
                                key={index}
                                className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm animate-in slide-in-from-right duration-500"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" />
                                    <span className="text-blue-800 font-medium flex-1 text-sm sm:text-base">{notification}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}
                                        className="h-6 w-6 p-0 hover:bg-blue-100"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-3 space-y-6">
                        <Card className="shadow-xl bg-gradient-to-br from-white to-green-50/50 border-0 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400" />
                            <CardHeader className="pb-6">
                                <CardTitle className="text-xl sm:text-2xl md:text-3xl text-green-700 flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                        <Leaf className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    {t("FarmerDashboard.upload_new_crop")}
                                </CardTitle>
                                <CardDescription className="text-base sm:text-lg text-gray-600">
                                    {t("FarmerDashboard.upload_description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 sm:space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    <div className="space-y-4">
                                        <Label className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                                1
                                            </span>
                                            {t("FarmerDashboard.label_crop")}
                                        </Label>
                                        <Select value={cropData.type} onValueChange={(value) => setCropData({ ...cropData, type: value })}>
                                            <SelectTrigger className="h-12 sm:h-16 text-base sm:text-lg border-2 hover:border-green-300 transition-colors duration-300 bg-white">
                                                <SelectValue placeholder={t("FarmerDashboard.placeholder_crop")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tomatoes" className="text-base sm:text-lg py-3">
                                                    {t("FarmerDashboard.step_1_crop_tomatoes")}
                                                </SelectItem>
                                                <SelectItem value="carrots" className="text-base sm:text-lg py-3">
                                                    {t("FarmerDashboard.step_1_crop_carrots")}
                                                </SelectItem>
                                                <SelectItem value="lettuce" className="text-base sm:text-lg py-3">
                                                    {t("FarmerDashboard.step_1_crop_lettuce")}
                                                </SelectItem>
                                                <SelectItem value="potatoes" className="text-base sm:text-lg py-3">
                                                    {t("FarmerDashboard.step_1_crop_potatoes")}
                                                </SelectItem>
                                                <SelectItem value="onions" className="text-base sm:text-lg py-3">
                                                    {t("FarmerDashboard.step_1_crop_onions")}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                                2
                                            </span>
                                            {t("FarmerDashboard.label_weight")}
                                        </Label>
                                        <Input
                                            type="number"
                                            placeholder={t("FarmerDashboard.placeholder_weight")}
                                            className="h-12 sm:h-16 text-base sm:text-lg text-center border-2 hover:border-green-300 transition-colors duration-300 bg-white"
                                            value={cropData.weight}
                                            onChange={(e) => setCropData({ ...cropData, weight: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                                3
                                            </span>
                                            {t("FarmerDashboard.label_date")}
                                        </Label>
                                        <Input
                                            type="date"
                                            className="h-12 sm:h-16 text-base sm:text-lg border-2 hover:border-green-300 transition-colors duration-300 bg-white"
                                            value={cropData.harvestDate}
                                            onChange={(e) => setCropData({ ...cropData, harvestDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                                4
                                            </span>
                                            Quality Grade
                                        </Label>
                                        <Select value={cropData.quality} onValueChange={(value) => setCropData({ ...cropData, quality: value })}>
                                            <SelectTrigger className="h-12 sm:h-16 text-base sm:text-lg border-2 hover:border-green-300 transition-colors duration-300 bg-white">
                                                <SelectValue placeholder="Select quality" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Grade A">Grade A — Premium</SelectItem>
                                                <SelectItem value="Grade B">Grade B — Standard</SelectItem>
                                                <SelectItem value="Grade C">Grade C — Economy</SelectItem>
                                                <SelectItem value="Grade A+">Grade A+ — Extra Premium</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        onClick={handleQuickSubmit}
                                        size="lg"
                                        className="flex-1 h-14 sm:h-18 text-lg sm:text-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                                        disabled={!cropData.type || !cropData.weight || !cropData.harvestDate || !cropData.quality || isUploading}
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-3 animate-spin" />
                                                {t("FarmerDashboard.uploading_message")}
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                                                {t("FarmerDashboard.button_upload_submit")}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="h-14 sm:h-18 px-6 sm:px-8 bg-white border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
                                    >
                                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                                        {t("FarmerDashboard.button_upload_photo")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-0">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg sm:text-xl md:text-2xl text-green-700 flex items-center gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                            </div>
                                            {t("FarmerDashboard.recent_harvests_title")}
                                        </CardTitle>
                                        <CardDescription className="text-sm sm:text-base">{t("FarmerDashboard.recent_harvests_subtitle")}</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" className="bg-white">
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        {t("FarmerDashboard.analytics_button")}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 sm:space-y-6">
                                    {recentBatches.length === 0 ? (
                                        <div className="text-center py-8 sm:py-12">
                                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Package className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">{t("FarmerDashboard.no_harvests_title")}</h3>
                                            <p className="text-gray-500 text-sm sm:text-base">{t("FarmerDashboard.no_harvests_subtitle")}</p>
                                        </div>
                                    ) : (
                                        recentBatches.map((batch, index) => (
                                            <div
                                                key={batch._id}
                                                className="p-4 sm:p-6 bg-gradient-to-br from-white via-green-50/50 to-cyan-50/50 rounded-2xl border-2 border-green-100 hover:border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-6">
                                                    <div className="flex items-center gap-3 sm:gap-4 mb-4 lg:mb-0">
                                                        <div className="text-3xl sm:text-5xl bg-white rounded-2xl p-2 sm:p-3 shadow-md">
                                                            {getCropEmoji(batch.crop.split(" ")[1]?.toLowerCase() || batch.crop.toLowerCase())}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                                                                {batch.crop}
                                                            </h4>
                                                            <p className="text-green-600 font-bold text-base sm:text-lg">{batch.weight}</p>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                                                                <p className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                    Lot: {batch.lotNumber}
                                                                </p>
                                                                <p className="text-xs sm:text-sm text-gray-500">• ID: {batch._id?.slice(0, 8)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-left lg:text-right">
                                                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700 mb-2">{batch.price}</p>
                                                        <Badge className={`text-xs sm:text-sm px-2 sm:px-3 py-1 ${getStatusColor(batch.status)}`}>
                                                            {batch.status === "In Transit" && <Truck className="w-3 h-3 mr-1" />}
                                                            {batch.status === "Ready for Sale" && <Package className="w-3 h-3 mr-1" />}
                                                            {batch.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="mb-4 sm:mb-6">
                                                    <div className="flex justify-between text-xs text-gray-600 mb-3 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                            Farm
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                            Distributor
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                                            Retailer
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                                            Consumer
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <Progress value={getProgressValue(batch.status)} className="h-3 bg-gray-200" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 transition-all duration-300"
                                                        onClick={() => setSelectedBatch(batch)}
                                                    >
                                                        <QrCode className="w-4 h-4 mr-2" />
                                                        {t("FarmerDashboard.view_qr_button")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 transition-all duration-300"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        {t("FarmerDashboard.analytics_button")}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="xl:col-span-1 space-y-6">
                        <Card className="shadow-xl bg-white border-0">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Crops Uploaded</CardTitle>
                                <Leaf className="w-4 h-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold">{recentBatches.length} Batches</div>
                                <p className="text-xs text-gray-500">+20% from last month</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-xl bg-white border-0">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Weight</CardTitle>
                                <Package className="w-4 h-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold">
                                    {Array.isArray(recentBatches)
                                        ? recentBatches.reduce((sum, batch) => sum + Number(batch.weight?.replace("kg", "") || 0), 0)
                                        : 0}
                                    kg
                                </div>
                                <p className="text-xs text-gray-500">Ready for distributors</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-xl bg-white border-0">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Est. Earnings</CardTitle>
                                <DollarSign className="w-4 h-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold">
                                    ₹{Array.isArray(recentBatches)
                                        ? recentBatches.reduce((sum, batch) => sum + Number(batch.price?.replace(/[$,₹]/g, "") || 0), 0)
                                        : 0}
                                </div>
                                <p className="text-xs text-gray-500">Based on estimated retail price</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Confirm Retailer Orders</DialogTitle>
                        <DialogDescription>
                            Review the details of each order request and confirm if you can fulfill it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {pendingOrders.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">No new orders at this time.</div>
                        ) : (
                            pendingOrders.map(order => {
                                const isConfirming = confirmingOrders.has(order._id);
                                const isRejecting = rejectingOrders.has(order._id);
                                const currentQuantity = orderQuantities[order._id];
                                const requestedWeight = parseFloat(order.weight.replace(' kg', ''));
                                    
                                return (
                                    <div key={order._id} className="p-4 bg-gray-100 rounded-xl border border-gray-200">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 bg-white rounded">
                                                <p className="text-xs text-gray-500">Crop</p>
                                                <p className="font-bold text-sm">{order.crop}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded">
                                                <p className="text-xs text-gray-500">Requested Quantity</p>
                                                <p className="font-bold text-sm">{order.weight}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded">
                                                <p className="text-xs text-gray-500">Quality</p>
                                                <p className="font-bold text-sm">{order.quality}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded">
                                                <p className="text-xs text-gray-500">Retailer</p>
                                                <p className="font-bold text-sm">{order.retailer || "N/A"}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded">
                                                <p className="text-xs text-gray-500">Contact</p>
                                                <p className="font-bold text-sm">{order.retailerPhone || "N/A"}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded">
                                                <p className="text-xs text-gray-500">Price</p>
                                                <p className="font-bold text-sm text-green-600">{order.price}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor={`quantity-${order._id}`} className="text-sm">
                                                    Quantity to Sell (kg)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    id={`quantity-${order._id}`}
                                                    placeholder={`Enter amount (max ${requestedWeight})`}
                                                    max={requestedWeight}
                                                    value={currentQuantity !== null && currentQuantity !== undefined ? currentQuantity : ''}
                                                    onChange={(e) => handleQuantityChange(order._id, e.target.value)}
                                                    className="mt-1"
                                                    disabled={isConfirming || isRejecting}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                onClick={() => handleConfirmOrder(order)}
                                                className="flex-1 bg-green-500 hover:bg-green-600"
                                                disabled={isConfirming || isRejecting}
                                            >
                                                {isConfirming ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                )}
                                                Confirm
                                            </Button>
                                            <Button
                                                onClick={() => handleRejectOrder(order)}
                                                variant="destructive"
                                                className="flex-1 bg-red-500 hover:bg-red-600"
                                                disabled={isConfirming || isRejecting}
                                            >
                                                {isRejecting ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : <Trash2 className="w-4 h-4 mr-2" />}
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* CORRECTED: Centralized Dialog component */}
            <Dialog open={selectedBatch !== null} onOpenChange={(isOpen) => !isOpen && setSelectedBatch(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Batch Details - {selectedBatch?.lotNumber}</DialogTitle>
                        <DialogDescription>Complete traceability information</DialogDescription>
                    </DialogHeader>
                    {renderQRDialogContent()}
                </DialogContent>
            </Dialog>
        </div>
    );
}