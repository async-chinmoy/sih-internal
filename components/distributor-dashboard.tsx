"use client"

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
} from "lucide-react"
import { sharedDataStore, type BatchData } from "@/store/supply-chain"

export default function DistributorDashboard() {
  const [batches, setBatches] = useState<BatchData[]>([])
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null)
  const [verificationNote, setVerificationNote] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([])
  const [detailViewBatch, setDetailViewBatch] = useState<BatchData | null>(null)

  useEffect(() => {
    const updateBatches = () => {
      try {
        const allBatches = sharedDataStore.getAllBatches()
        const distributorBatches = Array.isArray(allBatches)
          ? allBatches.filter(
              (batch) =>
                batch && batch.status && ["Pending Verification", "In Transit", "Delivered"].includes(batch.status),
            )
          : []
        setBatches(distributorBatches)
        setFilteredBatches(distributorBatches)
      } catch (error) {
        console.error("Error updating batches:", error)
        setBatches([])
        setFilteredBatches([])
      }
    }

    updateBatches()
    const unsubscribe = sharedDataStore.subscribe(updateBatches)

    return () => {
      unsubscribe()
    }
  }, [])

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

            return (
              lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
              farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
              farmLocation.toLowerCase().includes(searchQuery.toLowerCase())
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
      setSearchQuery(randomLot)
    }
  }

  const handleVerifyBatch = async (batchId: string) => {
    setIsUpdating(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    sharedDataStore.updateBatch(
      batchId,
      { status: "In Transit" },
      "Green Valley Distributors",
      verificationNote || "Quality verified and approved for transport",
    )

    setIsUpdating(false)
    setVerificationNote("")
    setSelectedBatch(null)
  }

  const handleMarkDelivered = async (batchId: string) => {
    setIsUpdating(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    sharedDataStore.updateBatch(
      batchId,
      { status: "Delivered" },
      "Green Valley Distributors",
      "Successfully delivered to retail partner",
    )

    setIsUpdating(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Verification":
        return "bg-yellow-500"
      case "In Transit":
        return "bg-blue-500"
      case "Delivered":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getActionButton = (batch: BatchData) => {
    switch (batch.status) {
      case "Pending Verification":
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setSelectedBatch(batch)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify Quality
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verify Batch Quality</DialogTitle>
                <DialogDescription>Confirm the quality and approve for transport - {batch.lotNumber}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Crop:</span> {batch.crop}
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span> {batch.weight}
                  </div>
                  <div>
                    <span className="font-medium">Quality:</span> {batch.quality}
                  </div>
                  <div>
                    <span className="font-medium">Farmer:</span> {batch.farmer}
                  </div>
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

                <Button onClick={() => handleVerifyBatch(batch.id)} disabled={isUpdating} className="w-full">
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
        )
      case "In Transit":
        return (
          <Button size="sm" onClick={() => handleMarkDelivered(batch.id)} disabled={isUpdating}>
            {isUpdating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      {/* Header */}
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
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg bg-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Verification</CardTitle>
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(batches || []).filter((b) => b.status === "Pending Verification").length}
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
              <CardTitle className="text-sm font-medium text-gray-500">Delivered Today</CardTitle>
              <Package className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(batches || []).filter((b) => b.status === "Delivered").length}</div>
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
                        const weight = batch.weight.replace(/[^\d.]/g, "") // Remove non-numeric characters
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

        {/* Batches List */}
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
              <Button variant="outline" size="sm" className="bg-white">
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
                /* Added filter to ensure only valid batches are rendered */
                filteredBatches
                  .filter((batch) => batch && batch.id)
                  .map((batch, index) => (
                    <div
                      key={batch.id}
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

                      {batch.status === "In Transit" && batch.iotData && (
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
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        {getActionButton(batch)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-300"
                              onClick={() => setDetailViewBatch(batch)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Batch Details - {batch.lotNumber}</DialogTitle>
                              <DialogDescription>Complete supply chain information</DialogDescription>
                            </DialogHeader>
                            {detailViewBatch && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-blue-700">Product Information</h4>
                                    <div className="text-sm space-y-1">
                                      <p>
                                        <span className="font-medium">Crop:</span> {detailViewBatch.crop}
                                      </p>
                                      <p>
                                        <span className="font-medium">Weight:</span> {detailViewBatch.weight}
                                      </p>
                                      <p>
                                        <span className="font-medium">Quality:</span> {detailViewBatch.quality}
                                      </p>
                                      <p>
                                        <span className="font-medium">Price:</span> {detailViewBatch.price}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-blue-700">Farm Information</h4>
                                    <div className="text-sm space-y-1">
                                      <p>
                                        <span className="font-medium">Farmer:</span> {detailViewBatch.farmer}
                                      </p>
                                      <p>
                                        <span className="font-medium">Location:</span> {detailViewBatch.farmLocation}
                                      </p>
                                      <p>
                                        <span className="font-medium">Harvest Date:</span>{" "}
                                        {new Date(detailViewBatch.harvestDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-blue-700">Supply Chain History</h4>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {detailViewBatch.trackingHistory.map((entry, idx) => (
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

                                {detailViewBatch.iotData && (
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-blue-700">IoT Sensor Data</h4>
                                    <div className="grid grid-cols-2 gap-4 p-3 bg-cyan-50 rounded-lg text-sm">
                                      <p>
                                        <span className="font-medium">Temperature:</span>{" "}
                                        {detailViewBatch.iotData.temperature}°C
                                      </p>
                                      <p>
                                        <span className="font-medium">Humidity:</span>{" "}
                                        {detailViewBatch.iotData.humidity}%
                                      </p>
                                      <p>
                                        <span className="font-medium">GPS:</span>{" "}
                                        {detailViewBatch.iotData.gpsCoordinates}
                                      </p>
                                      <p>
                                        <span className="font-medium">Last Update:</span>{" "}
                                        {new Date(detailViewBatch.iotData.lastUpdate).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
