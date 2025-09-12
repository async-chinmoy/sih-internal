"use client"

import { useState } from "react"
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
} from "lucide-react"
import { sharedDataStore, type BatchData } from "@/store/supply-chain"

export default function ConsumerInterface() {
  const [searchQuery, setSearchQuery] = useState("")
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [detailViewBatch, setDetailViewBatch] = useState<BatchData | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError("")

    // Simulate scanning/search delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Try to find batch by lot number or ID
    let foundBatch = sharedDataStore.getBatchByLotNumber(searchQuery)
    if (!foundBatch) {
      foundBatch = sharedDataStore.getBatch(searchQuery)
    }

    if (foundBatch) {
      setBatch(foundBatch)
    } else {
      setError("Product not found. Please check the QR code or lot number.")
      setBatch(null)
    }

    setLoading(false)
  }

  const handleQRScan = () => {
    const availableBatches = sharedDataStore
      .getAllBatches()
      .filter((b) => ["Ready for Sale", "Sold"].includes(b.status))
    if (availableBatches.length > 0) {
      const randomBatch = availableBatches[Math.floor(Math.random() * availableBatches.length)]
      setSearchQuery(randomBatch.lotNumber)
      setBatch(randomBatch)
    }
  }

  const getProgressValue = (status: string) => {
    switch (status) {
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "Ready for Sale":
        return "Available in store now!"
      case "Sold":
        return "This product has been sold"
      case "In Transit":
        return "Currently being delivered to store"
      case "Delivered":
        return "Arrived at store, being prepared for sale"
      default:
        return "Being processed"
    }
  }

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
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-white hover:bg-green-50 border-green-200"
                            onClick={() => setDetailViewBatch(batch)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Complete Product Information - {batch.lotNumber}</DialogTitle>
                            <DialogDescription>Full supply chain transparency and verification</DialogDescription>
                          </DialogHeader>
                          {detailViewBatch && (
                            <div className="space-y-6 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                    <Leaf className="w-4 h-4" />
                                    Product Information
                                  </h4>
                                  <div className="text-sm space-y-2">
                                    <p>
                                      <span className="font-medium">Crop:</span> {detailViewBatch.crop}
                                    </p>
                                    <p>
                                      <span className="font-medium">Weight:</span> {detailViewBatch.weight}
                                    </p>
                                    <p>
                                      <span className="font-medium">Quality Grade:</span> {detailViewBatch.quality}
                                    </p>
                                    <p>
                                      <span className="font-medium">Price:</span> {detailViewBatch.price}
                                    </p>
                                    <p>
                                      <span className="font-medium">Lot Number:</span> {detailViewBatch.lotNumber}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Farm Information
                                  </h4>
                                  <div className="text-sm space-y-2">
                                    <p>
                                      <span className="font-medium">Farmer:</span> {detailViewBatch.farmer}
                                    </p>
                                    <p>
                                      <span className="font-medium">Farm Location:</span> {detailViewBatch.farmLocation}
                                    </p>
                                    <p>
                                      <span className="font-medium">Harvest Date:</span>{" "}
                                      {new Date(detailViewBatch.harvestDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Complete Journey Timeline
                                </h4>
                                <div className="space-y-3 max-h-40 overflow-y-auto">
                                  {detailViewBatch.trackingHistory.map((entry, idx) => (
                                    <div key={idx} className="p-3 bg-green-50 rounded-lg text-sm">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-green-700">{entry.updatedBy}</p>
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
                                      <p>
                                        <span className="font-medium">Temperature:</span>{" "}
                                        {detailViewBatch.iotData.temperature}°C
                                      </p>
                                      <p>
                                        <span className="font-medium">Humidity:</span>{" "}
                                        {detailViewBatch.iotData.humidity}%
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p>
                                        <span className="font-medium">Soil Moisture:</span>{" "}
                                        {detailViewBatch.iotData.soilMoisture}%
                                      </p>
                                      <p>
                                        <span className="font-medium">GPS Location:</span>{" "}
                                        {detailViewBatch.iotData.gpsCoordinates}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <p>
                                        <span className="font-medium">Last Update:</span>{" "}
                                        {new Date(detailViewBatch.iotData.lastUpdate).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-3">
                                <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  Blockchain Verification
                                </h4>
                                <div className="p-4 bg-green-50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-medium text-green-700">Verified Authentic Product</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    This product has been verified through blockchain technology and meets all quality
                                    and safety standards.
                                  </p>
                                  <p className="text-xs text-gray-500">Blockchain Hash: {detailViewBatch.blockchain}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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
                </CardContent>
              </Card>

              {/* Growing Conditions */}
              {batch.iotData && (
                <Card className="shadow-xl bg-gradient-to-br from-white to-cyan-50/50 border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-cyan-600" />
                      Growing Conditions
                    </CardTitle>
                    <CardDescription>Real-time data from the farm during growth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Soil Moisture</p>
                        <p className="text-2xl font-bold text-blue-600">{batch.iotData.soilMoisture}%</p>
                        <p className="text-xs text-gray-500">Optimal</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-xl">
                        <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Temperature</p>
                        <p className="text-2xl font-bold text-red-600">{batch.iotData.temperature}°C</p>
                        <p className="text-xs text-gray-500">Perfect</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-xl">
                        <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Humidity</p>
                        <p className="text-2xl font-bold text-yellow-600">{batch.iotData.humidity}%</p>
                        <p className="text-xs text-gray-500">Ideal</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <Leaf className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Quality</p>
                        <p className="text-lg font-bold text-green-600">{batch.quality}</p>
                        <p className="text-xs text-gray-500">Certified</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Journey Timeline */}
              <Card className="shadow-xl bg-gradient-to-br from-white to-gray-50/50 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    Complete Journey
                  </CardTitle>
                  <CardDescription>Every step from farm to your table</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batch.trackingHistory.map((event, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <div className="w-4 h-4 bg-orange-500 rounded-full mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-800">{event.status}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{event.note}</p>
                          <p className="text-xs text-gray-500">By: {event.updatedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              <Card className="shadow-xl bg-white border-0">
                <CardHeader>
                  <CardTitle className="text-center">Product QR Code</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-gray-50 p-6 rounded-xl mb-4">
                    <img
                      src={batch.qrCode || "/placeholder.svg?height=200&width=200&query=QR code"}
                      alt={`QR Code for ${batch.lotNumber}`}
                      className="mx-auto border-2 border-gray-200 rounded-lg"
                      width={200}
                      height={200}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Lot Number: {batch.lotNumber}</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Share Product Info
                  </Button>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card className="shadow-xl bg-white border-0">
                <CardHeader>
                  <CardTitle>Trust & Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Blockchain Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Farm Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Quality Tested</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Transport Monitored</span>
                  </div>
                </CardContent>
              </Card>

              {/* Price Transparency */}
              <Card className="shadow-xl bg-white border-0">
                <CardHeader>
                  <CardTitle>Price Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Farm Price:</span>
                    <span className="text-sm font-medium">{batch.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Transport:</span>
                    <span className="text-sm font-medium">Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Retail Markup:</span>
                    <span className="text-sm font-medium">Fair Trade</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{batch.price}</span>
                  </div>
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
                {sharedDataStore
                  .getAllBatches()
                  .filter((b) => ["Ready for Sale", "Sold"].includes(b.status))
                  .map((sampleBatch) => (
                    <div
                      key={sampleBatch.id}
                      className="p-6 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300"
                      onClick={() => {
                        setSearchQuery(sampleBatch.lotNumber)
                        setBatch(sampleBatch)
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
    </div>
  )
}
