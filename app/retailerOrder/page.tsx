"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Button,
} from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  ClipboardList,
  RefreshCw,
  Loader2,
  Cpu,
  Info,
  Copy,
} from "lucide-react";
import Pusher from 'pusher-js';

// Hoist the pricing data to the top level
const pricing = {
  "Tomatoes": { "A+": 10, "A": 8, "B": 6, "C": 4 },
  "Carrots": { "A+": 7, "A": 5, "B": 3.5, "C": 2.5 },
  "Wheat": { "A+": 25, "A": 22, "B": 19, "C": 15 },
  "Rice": { "A+": 45, "A": 40, "B": 35, "C": 30 },
  "Maize": { "A+": 18, "A": 15, "B": 12, "C": 9 },
  "Potatoes": { "A+": 12, "A": 10, "B": 8, "C": 6 },
  "Lettuce": { "A+": 9, "A": 7, "B": 5, "C": 3 },
  "Onions": { "A+": 11, "A": 9, "B": 7, "C": 5 },
};
const cropPresets = Object.keys(pricing);

export default function RetailerOrderPageFull() {
  const router = useRouter();

  const [selectedCropPreset, setSelectedCropPreset] = useState("");
  const [customCrop, setCustomCrop] = useState("");
  const [quantityKg, setQuantityKg] = useState<number | "">("");
  const [selectedGrade, setSelectedGrade] = useState<"A" | "B" | "C" | "A+">("A");
  const [contactPerson, setContactPerson] = useState("John Doe");
  const [contactPhone, setContactPhone] = useState("9876543210");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingHash, setIsConfirmingHash] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [recentlyPlacedOrder, setRecentlyPlacedOrder] = useState<any | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [confirmedOrderNotification, setConfirmedOrderNotification] = useState<any | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('retailer-channel');
    channel.bind('batch-updated', (data: { batch: any }) => {
      if (data.batch?.status === "Pending Verification") {
        setConfirmedOrderNotification(data.batch);
        setNotificationDialogOpen(true);
      }
    });

    return () => {
      channel.unbind();
      pusher.unsubscribe('retailer-channel');
    };
  }, []);

  const cropName = selectedCropPreset || customCrop || "";
  const expectedPricePerKg = useMemo(() => {
    const cleanCropName = cropName.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '').trim();
    return pricing[cleanCropName as keyof typeof pricing]?.[selectedGrade] || 0;
  }, [cropName, selectedGrade]);

  const totalExpectedPrice = useMemo(() => {
    if (!quantityKg || !expectedPricePerKg) return "₹0.00";
    const v = Number(quantityKg) * Number(expectedPricePerKg);
    return `₹${Number.isFinite(v) ? v.toFixed(2) : "0.00"}`;
  }, [quantityKg, expectedPricePerKg]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!cropName.trim()) errors.crop = "Please select or enter a crop name.";
    if (!quantityKg || Number(quantityKg) <= 0) errors.quantity = "Enter a valid quantity (kg).";
    if (!selectedGrade) errors.grade = "Select a quality grade.";
    if (!contactPerson.trim()) errors.contactPerson = "Please provide contact person name.";
    if (!contactPhone.trim()) errors.contactPhone = "Please provide contact phone.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInitiateOrder = async () => {
    if (isSubmitting) return;
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post("/api/order-request", {
        cropName,
        quantityKg,
        selectedGrade,
        contactPerson,
        contactPhone,
        preferredDate,
        notes,
        price: totalExpectedPrice,
      });

      if (response.status !== 201) {
        throw new Error("Failed to place order request.");
      }

      const result = response.data;
      setRecentlyPlacedOrder(result.batch);
      setSuccessDialogOpen(true);

      setSelectedCropPreset("");
      setCustomCrop("");
      setQuantityKg("");
      setSelectedGrade("A");
      setPreferredDate("");
      setNotes("");
    } catch (err: any) {
      console.error("Failed to place order:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to place order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmHash = async () => {
    if (!recentlyPlacedOrder?._id || !recentlyPlacedOrder?.hash) {
      setError("Missing order ID or hash. Cannot confirm.");
      return;
    }

    setIsConfirmingHash(true);
    setError("");

    try {
      const response = await axios.post("/api/confirm-retailer-order", {
        batchId: recentlyPlacedOrder._id,
        hash: recentlyPlacedOrder.hash,
      });

      if (response.status === 200) {
        setSuccessDialogOpen(false);
        router.push("/retailer");
      } else {
        setError("Failed to confirm order. Please try again.");
      }
    } catch (err: any) {
      console.error("Error confirming hash:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to confirm order. Please try again.");
      }
    } finally {
      setIsConfirmingHash(false);
    }
  };

  const goToDashboard = () => {
    setSuccessDialogOpen(false);
    router.push("/retailer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex flex-col">
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            className="text-lg hover:bg-purple-50 transition-colors duration-300 group"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Place New Retailer Order
            </h1>
            <p className="text-purple-600 text-sm md:text-base">Retail Orders · Fresh Market Co.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-4 py-2 text-lg bg-purple-100 text-purple-700">
              Store #FM-001
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl bg-white/95 border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl md:text-2xl text-purple-700 flex items-center gap-3">
                    <ClipboardList className="w-5 h-5" />
                    Order Details
                  </CardTitle>
                  <CardDescription>Enter the details for the crop order</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedCropPreset("");
                  setCustomCrop("");
                  setQuantityKg("");
                  setSelectedGrade("A");
                  setContactPerson("John Doe");
                  setContactPhone("9876543210");
                  setPreferredDate("");
                  setNotes("");
                  setError("");
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <Label>Crop (select preset or enter custom)</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {cropPresets.map((crop) => (
                      <button
                        type="button"
                        key={crop}
                        onClick={() => {
                          setSelectedCropPreset(crop);
                          setCustomCrop("");
                        }}
                        className={`px-3 py-1 rounded-full text-sm border transition-all duration-200 ${
                          selectedCropPreset === crop ? "bg-purple-600 text-white border-purple-600" : "bg-white"
                        }`}
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Input
                      placeholder="Or type a custom crop (e.g. Organic Red Apples)"
                      value={customCrop}
                      onChange={(e) => {
                        setCustomCrop(e.target.value);
                        if (e.target.value) setSelectedCropPreset("");
                      }}
                    />
                    {formErrors.crop && <p className="text-xs text-red-500 mt-1">{formErrors.crop}</p>}
                  </div>
                </div>
                <div>
                  <Label>Quality Grade</Label>
                  <Select value={selectedGrade} onValueChange={(v) => setSelectedGrade(v as any)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Grade A — Premium</SelectItem>
                      <SelectItem value="A+">Grade A+ — Extra Premium</SelectItem>
                      <SelectItem value="B">Grade B — Standard</SelectItem>
                      <SelectItem value="C">Grade C — Economy</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.grade && <p className="text-xs text-red-500 mt-1">{formErrors.grade}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Quantity (kg)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    value={quantityKg === "" ? "" : String(quantityKg)}
                    onChange={(e) => setQuantityKg(e.target.value === "" ? "" : Number(e.target.value))}
                    className="mt-2"
                  />
                  {formErrors.quantity && <p className="text-xs text-red-500 mt-1">{formErrors.quantity}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                  {formErrors.contactPerson && <p className="text-xs text-red-500 mt-1">{formErrors.contactPerson}</p>}
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  {formErrors.contactPhone && <p className="text-xs text-red-500 mt-1">{formErrors.contactPhone}</p>}
                </div>
                <div>
                  <Label>Preferred Delivery Date</Label>
                  <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Notes / Special Instructions</Label>
                <Textarea placeholder="Any special handling instructions, packaging, or scheduling notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="bg-gradient-to-br from-white to-purple-50/50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{cropName || "—"}</h3>
                    <p className="text-sm text-gray-600">{selectedGrade ? `Quality: Grade ${selectedGrade}` : ""}</p>
                    <p className="text-sm text-gray-600 mt-1">Price per Kg: ₹{expectedPricePerKg.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Preferred Date: {preferredDate || "Flexible"}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-700">{quantityKg || "0"} kg</Badge>
                      <Badge className="bg-green-50 text-green-700">{totalExpectedPrice}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">{contactPerson || "—"}</p>
                    <p className="text-sm text-gray-500">{contactPhone || "—"}</p>
                    <div className="mt-4 flex flex-col gap-2">
                      <Button
                        onClick={handleInitiateOrder}
                        disabled={isSubmitting || !cropName.trim() || !quantityKg || Number(quantityKg) <= 0 || !selectedGrade || !contactPerson.trim() || !contactPhone.trim()}
                        className="w-48 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4 mr-2" />
                            Place Order
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedCropPreset("");
                        setCustomCrop("");
                      }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear Crop
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="shadow-lg bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Order Guidelines
              </CardTitle>
              <CardDescription className="text-sm">Helpful tips to place orders</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>You place an order request which the farmer must confirm.</li>
                <li>The price is **fixed** based on crop and quality grade.</li>
                <li>Fill in all contact details for quick confirmation from the farmer.</li>
                <li>The preferred date is advisory and will be confirmed by the supplier.</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg bg-white/95">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Order Confirmation Status
              </CardTitle>
              <CardDescription className="text-xs text-gray-400">Real-time status updates</CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitting ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for confirmation from blockchain...
                </div>
              ) : recentlyPlacedOrder ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Order request submitted successfully!
                  </div>
                  <p className="text-sm text-gray-600">Your order has been recorded and the farmer has been notified.</p>
                  <p className="text-xs text-gray-500 break-all">Lot Number: {recentlyPlacedOrder.lotNumber}</p>
                  <p className="text-xs text-gray-500 break-all">Transaction Hash: {recentlyPlacedOrder.hash}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent order to display.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
      
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-600 w-5 h-5" />
              Order Request Placed
            </DialogTitle>
            <DialogDescription>
              Your order has been recorded with a transaction hash and sent to the farmer for confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {recentlyPlacedOrder && (
              <>
                <div className="p-3 bg-green-50 rounded">
                  <p className="font-medium">**Request Details:**</p>
                  <p className="text-sm text-gray-600 mt-1">**Lot Number:** {recentlyPlacedOrder.lotNumber}</p>
                  <p className="text-sm text-gray-600">**Crop:** {recentlyPlacedOrder.crop}</p>
                  <p className="text-sm text-gray-600">**Quantity:** {recentlyPlacedOrder.weight}</p>
                  <p className="text-sm text-gray-600">**Quality:** {recentlyPlacedOrder.quality}</p>
                  <p className="text-sm text-gray-600">**Price:** {recentlyPlacedOrder.price}</p>
                  <p className="text-xs text-gray-500 mt-1">Transaction Hash: {recentlyPlacedOrder.hash}</p>
                </div>
                <Button onClick={goToDashboard} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  Go to Retailer Dashboard
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-600 w-5 h-5" />
              Order Confirmed by Farmer!
            </DialogTitle>
            <DialogDescription>
              A farmer has confirmed your order. You can now view the full batch details.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {confirmedOrderNotification && (
              <>
                <div className="p-3 bg-green-50 rounded">
                  <p className="font-medium">**Order Details:**</p>
                  <p className="text-sm text-gray-600 mt-1">**Lot Number:** {confirmedOrderNotification.lotNumber}</p>
                  <p className="text-sm text-gray-600">**Farmer:** {confirmedOrderNotification.farmer}</p>
                  <p className="text-sm text-gray-600">**Crop:** {confirmedOrderNotification.crop}</p>
                  <p className="text-sm text-gray-600">**Quantity:** {confirmedOrderNotification.weight}</p>
                  <p className="text-sm text-gray-600">**Price:** {confirmedOrderNotification.price}</p>
                  <p className="text-xs text-gray-500 mt-1">Transaction Hash: {confirmedOrderNotification.hash}</p>
                </div>
                <Button onClick={() => setNotificationDialogOpen(false)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  View in Dashboard
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}